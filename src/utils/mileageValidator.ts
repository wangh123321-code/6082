import { WeekMileage, DayTraining, TrainingType } from '@/types/training';

export const MAX_INCREASE_RATE = 0.1;

export function calculateWeeklyMileage(
  days: DayTraining[],
  weekNumber: number
): number {
  return days
    .filter((d) => d.weekNumber === weekNumber)
    .reduce((sum, d) => sum + d.distance, 0);
}

export function calculateIncreaseRate(
  currentMileage: number,
  previousMileage: number
): number {
  if (previousMileage === 0) return 0;
  return (currentMileage - previousMileage) / previousMileage;
}

export function validateIncreaseRate(increaseRate: number): boolean {
  return increaseRate <= MAX_INCREASE_RATE;
}

export function calculateAllWeeklyMileage(
  days: DayTraining[],
  initialMileage: number
): WeekMileage[] {
  const weeklyData: WeekMileage[] = [];
  let prevMileage = initialMileage;

  for (let week = 1; week <= 16; week++) {
    const totalDistance = calculateWeeklyMileage(days, week);
    const increaseRate = calculateIncreaseRate(totalDistance, prevMileage);
    const isPeak = week >= 10 && week <= 11;
    const isTaper = week >= 15;

    weeklyData.push({
      weekNumber: week,
      totalDistance,
      increaseRate,
      isPeak,
      isTaper,
    });

    prevMileage = totalDistance;
  }

  return weeklyData;
}

function adjustDayDistance(day: DayTraining, factor: number): DayTraining {
  if (day.type === TrainingType.REST) return day;
  const newDist = Math.round(day.distance * factor * 10) / 10;
  return {
    ...day,
    distance: Math.max(newDist, day.type === TrainingType.LSD ? 8 : day.type === TrainingType.INTERVAL ? 3 : day.type === TrainingType.TEMPO ? 4 : 3),
  };
}

export function recalculateMileageWithConstraints(
  days: DayTraining[],
  modifiedDayId: string,
  initialMileage: number
): { days: DayTraining[]; weeklyMileage: WeekMileage[] } {
  const newDays = days.map((d) => ({ ...d }));
  const modifiedIndex = newDays.findIndex((d) => d.id === modifiedDayId);

  if (modifiedIndex === -1) {
    return { days: newDays, weeklyMileage: calculateAllWeeklyMileage(newDays, initialMileage) };
  }

  const modifiedDay = newDays[modifiedIndex];
  const startWeek = modifiedDay.weekNumber;

  for (let week = startWeek; week <= 16; week++) {
    let prevMileage: number;
    if (week === 1) {
      prevMileage = initialMileage;
    } else {
      prevMileage = calculateWeeklyMileage(newDays, week - 1);
    }

    const isCutbackWeek = week === 4 || week === 8 || week === 12;
    const isTaperWeek = week >= 15;

    if (isCutbackWeek || isTaperWeek) continue;

    const currentTotal = calculateWeeklyMileage(newDays, week);
    const maxAllowed = prevMileage * (1 + MAX_INCREASE_RATE);

    if (currentTotal > maxAllowed) {
      const scaleFactor = maxAllowed / currentTotal;
      const weekDayIndices = newDays
        .map((d, i) => ({ d, i }))
        .filter(({ d }) => d.weekNumber === week && d.type !== TrainingType.REST && !d.isModified);

      const nonLsd = weekDayIndices.filter(({ d }) => d.type !== TrainingType.LSD);
      const lsd = weekDayIndices.filter(({ d }) => d.type === TrainingType.LSD);

      for (const { i } of nonLsd) {
        newDays[i] = adjustDayDistance(newDays[i], scaleFactor);
      }

      const newTotalNonLsd = newDays
        .filter((d) => d.weekNumber === week && d.type !== TrainingType.LSD && d.type !== TrainingType.REST)
        .reduce((s, d) => s + d.distance, 0);

      const lsdBudget = maxAllowed - newTotalNonLsd;
      if (lsdBudget > 0 && lsd.length > 0) {
        for (const { i } of lsd) {
          const perLsd = lsdBudget / lsd.length;
          newDays[i] = {
            ...newDays[i],
            distance: Math.round(Math.max(8, perLsd) * 10) / 10,
          };
        }
      }
    }
  }

  const weeklyMileage = calculateAllWeeklyMileage(newDays, initialMileage);
  return { days: newDays, weeklyMileage };
}
