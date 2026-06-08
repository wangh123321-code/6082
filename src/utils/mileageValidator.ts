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

export function recalculateMileageWithConstraints(
  days: DayTraining[],
  modifiedDayId: string,
  initialMileage: number
): { days: DayTraining[]; weeklyMileage: WeekMileage[] } {
  const newDays = [...days];
  const modifiedIndex = newDays.findIndex((d) => d.id === modifiedDayId);
  
  if (modifiedIndex === -1) {
    return { days: newDays, weeklyMileage: calculateAllWeeklyMileage(newDays, initialMileage) };
  }

  const modifiedDay = newDays[modifiedIndex];
  const startWeek = modifiedDay.weekNumber;
  let prevMileage = startWeek === 1 
    ? initialMileage 
    : calculateWeeklyMileage(newDays, startWeek - 1);

  for (let week = startWeek; week <= 16; week++) {
    const weekDays = newDays.filter((d) => d.weekNumber === week);
    let currentTotal = weekDays.reduce((sum, d) => sum + d.distance, 0);
    const maxAllowed = prevMileage * (1 + MAX_INCREASE_RATE);
    const isTaperWeek = week >= 15;
    const isCutbackWeek = week === 4 || week === 8 || week === 12;

    if (week > startWeek && currentTotal > maxAllowed && !isTaperWeek && !isCutbackWeek) {
      const excess = currentTotal - maxAllowed;
      let remainingExcess = excess;
      
      const sortedDays = [...weekDays]
        .filter((d) => !d.isModified && d.type === TrainingType.EASY)
        .sort((a, b) => b.distance - a.distance);

      for (const day of sortedDays) {
        if (remainingExcess <= 0) break;
        const dayIndex = newDays.findIndex((d) => d.id === day.id);
        if (dayIndex !== -1) {
          const reduction = Math.min(remainingExcess, newDays[dayIndex].distance - 1);
          if (reduction > 0) {
            newDays[dayIndex] = {
              ...newDays[dayIndex],
              distance: Math.round((newDays[dayIndex].distance - reduction) * 10) / 10,
            };
            remainingExcess -= reduction;
          }
        }
      }

      if (remainingExcess > 0) {
        const allWeekDays = [...weekDays]
          .filter((d) => !d.isModified && d.type !== TrainingType.LSD)
          .sort((a, b) => b.distance - a.distance);
        
        for (const day of allWeekDays) {
          if (remainingExcess <= 0) break;
          const dayIndex = newDays.findIndex((d) => d.id === day.id);
          if (dayIndex !== -1) {
            const reduction = Math.min(remainingExcess, newDays[dayIndex].distance - 1);
            if (reduction > 0) {
              newDays[dayIndex] = {
                ...newDays[dayIndex],
                distance: Math.round((newDays[dayIndex].distance - reduction) * 10) / 10,
              };
              remainingExcess -= reduction;
            }
          }
        }
      }

      currentTotal = maxAllowed;
    }

    prevMileage = currentTotal;
  }

  const weeklyMileage = calculateAllWeeklyMileage(newDays, initialMileage);
  return { days: newDays, weeklyMileage };
}
