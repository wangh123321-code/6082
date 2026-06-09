import {
  DayTraining,
  TrainingType,
  SkipReason,
  WeekMileage,
  RescheduleResult,
} from '@/types/training';
import { calculateAllWeeklyMileage, MAX_INCREASE_RATE } from './mileageValidator';

const KEY_TRAINING_TYPES = new Set<TrainingType>([
  TrainingType.LSD,
  TrainingType.INTERVAL,
  TrainingType.TEMPO,
]);

function isKeyTraining(type: TrainingType): boolean {
  return KEY_TRAINING_TYPES.has(type);
}

function countConsecutiveLsdSkips(days: DayTraining[], skippedIndex: number): boolean {
  const skippedDay = days[skippedIndex];
  const skippedWeek = skippedDay.weekNumber;
  let lsdSkipCount = 0;

  for (const day of days) {
    if (day.weekNumber > skippedWeek) break;
    if (day.weekNumber < skippedWeek) continue;
    if (day.type === TrainingType.LSD && day.isSkipped) {
      lsdSkipCount++;
    }
  }

  if (skippedDay.type === TrainingType.LSD) {
    lsdSkipCount++;
  }

  const prevWeekDays = days.filter((d) => d.weekNumber === skippedWeek - 1);
  for (const day of prevWeekDays) {
    if (day.type === TrainingType.LSD && day.isSkipped) {
      lsdSkipCount++;
    }
  }

  return lsdSkipCount >= 2;
}

function findNextAvailableSlot(
  days: DayTraining[],
  fromIndex: number,
  trainingToShift: DayTraining
): number {
  for (let i = fromIndex; i < days.length; i++) {
    const day = days[i];
    if (day.isSkipped) continue;
    if (day.type === TrainingType.REST && !day.isSkipped) {
      return i;
    }
  }

  for (let i = fromIndex; i < days.length; i++) {
    const day = days[i];
    if (day.isSkipped) continue;
    if (day.type === TrainingType.EASY && !isKeyTraining(trainingToShift.type)) {
      return i;
    }
  }

  return -1;
}

function recalculateWeeklyMileageWithCap(
  days: DayTraining[],
  initialMileage: number
): WeekMileage[] {
  const newDays = days.map((d) => ({ ...d }));
  const CUTBACK_WEEKS = new Set([4, 8, 12]);
  const TAPER_START = 15;

  for (let week = 1; week <= 16; week++) {
    let prevMileage: number;
    if (week === 1) {
      prevMileage = initialMileage;
    } else {
      const prevWeekDays = newDays.filter((d) => d.weekNumber === week - 1);
      prevMileage = prevWeekDays.reduce((sum, d) => sum + d.distance, 0);
    }

    if (CUTBACK_WEEKS.has(week) || week >= TAPER_START) continue;

    const weekDays = newDays.filter((d) => d.weekNumber === week);
    const currentTotal = weekDays.reduce((sum, d) => sum + d.distance, 0);
    const maxAllowed = prevMileage * (1 + MAX_INCREASE_RATE);

    if (currentTotal > maxAllowed && prevMileage > 0) {
      const scaleFactor = maxAllowed / currentTotal;
      const adjustableDays = weekDays.filter(
        (d) => d.type !== TrainingType.REST && !d.isSkipped
      );

      const nonLsd = adjustableDays.filter((d) => d.type !== TrainingType.LSD);
      const lsd = adjustableDays.filter((d) => d.type === TrainingType.LSD);

      for (const day of nonLsd) {
        const idx = newDays.findIndex((d) => d.id === day.id);
        if (idx !== -1) {
          const minDist =
            day.type === TrainingType.INTERVAL ? 3 : day.type === TrainingType.TEMPO ? 4 : 3;
          newDays[idx] = {
            ...newDays[idx],
            distance: Math.round(Math.max(day.distance * scaleFactor, minDist) * 10) / 10,
          };
        }
      }

      const nonLsdTotal = newDays
        .filter(
          (d) =>
            d.weekNumber === week &&
            d.type !== TrainingType.LSD &&
            d.type !== TrainingType.REST
        )
        .reduce((s, d) => s + d.distance, 0);

      const lsdBudget = maxAllowed - nonLsdTotal;
      if (lsdBudget > 0 && lsd.length > 0) {
        const perLsd = lsdBudget / lsd.length;
        for (const day of lsd) {
          const idx = newDays.findIndex((d) => d.id === day.id);
          if (idx !== -1) {
            newDays[idx] = {
              ...newDays[idx],
              distance: Math.round(Math.max(8, perLsd) * 10) / 10,
            };
          }
        }
      }
    }
  }

  return calculateAllWeeklyMileage(newDays, initialMileage);
}

export function rescheduleAfterSkip(
  days: DayTraining[],
  skippedDayId: string,
  skipReason: SkipReason,
  initialMileage: number
): RescheduleResult {
  const newDays = days.map((d) => ({ ...d }));
  const skippedIndex = newDays.findIndex((d) => d.id === skippedDayId);

  if (skippedIndex === -1) {
    return {
      days: newDays,
      weeklyMileage: calculateAllWeeklyMileage(newDays, initialMileage),
      affectedDays: 0,
      consecutiveLsdSkipped: false,
    };
  }

  const skippedDay = newDays[skippedIndex];
  const wasKeyTraining = isKeyTraining(skippedDay.type);
  const consecutiveLsdSkipped = countConsecutiveLsdSkips(newDays, skippedIndex);

  const savedTraining = {
    type: skippedDay.type,
    distance: skippedDay.distance,
    paceMin: skippedDay.paceMin,
    paceMax: skippedDay.paceMax,
    description: skippedDay.description,
    notes: skippedDay.notes,
  };

  newDays[skippedIndex] = {
    ...newDays[skippedIndex],
    isSkipped: true,
    skipReason,
    type: TrainingType.REST,
    distance: 0,
    paceMin: 0,
    paceMax: 0,
    description:
      skipReason === 'leave'
        ? '请假休息，后续训练将自动顺延调整。'
        : '跳过本次训练，后续训练将自动顺延调整。',
    notes: [skipReason === 'leave' ? '已标记为请假' : '已标记为跳训'],
    isModified: true,
  };

  let affectedDays = 1;

  if (wasKeyTraining) {
    let searchFrom = skippedIndex + 1;
    let shiftsRemaining = 3;

    while (searchFrom < newDays.length && shiftsRemaining > 0) {
      const slotIndex = findNextAvailableSlot(newDays, searchFrom, skippedDay);

      if (slotIndex === -1) break;

      const slotDay = newDays[slotIndex];
      const slotOriginalType = slotDay.type;
      const slotOriginalDistance = slotDay.distance;

      if (slotOriginalType === TrainingType.REST) {
        newDays[slotIndex] = {
          ...newDays[slotIndex],
          type: savedTraining.type,
          distance: savedTraining.distance,
          paceMin: savedTraining.paceMin,
          paceMax: savedTraining.paceMax,
          description: savedTraining.description,
          notes: savedTraining.notes,
          isModified: true,
        };
        affectedDays++;
      } else if (slotOriginalType === TrainingType.EASY) {
        newDays[slotIndex] = {
          ...newDays[slotIndex],
          type: savedTraining.type,
          distance: savedTraining.distance,
          paceMin: savedTraining.paceMin,
          paceMax: savedTraining.paceMax,
          description: savedTraining.description,
          notes: savedTraining.notes,
          isModified: true,
        };
        savedTraining.type = slotOriginalType;
        savedTraining.distance = slotOriginalDistance;
        affectedDays++;
      }

      shiftsRemaining--;
      searchFrom = slotIndex + 1;
    }
  } else {
    for (let i = skippedIndex + 1; i < newDays.length && affectedDays < 3; i++) {
      if (!newDays[i].isSkipped && newDays[i].type !== TrainingType.REST) {
        newDays[i] = {
          ...newDays[i],
          isModified: true,
        };
        affectedDays++;
      }
    }
  }

  const weeklyMileage = recalculateWeeklyMileageWithCap(newDays, initialMileage);

  return {
    days: newDays,
    weeklyMileage,
    affectedDays,
    consecutiveLsdSkipped,
  };
}
