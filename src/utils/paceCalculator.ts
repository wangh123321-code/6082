import { TrainingType, PaceRange } from '@/types/training';

export function calculateMarathonPace(targetTimeMinutes: number): number {
  const marathonDistance = 42.195;
  return targetTimeMinutes / marathonDistance;
}

export function calculatePaceRange(
  marathonPace: number,
  trainingType: TrainingType
): PaceRange {
  switch (trainingType) {
    case TrainingType.LSD:
      return {
        min: marathonPace + 1.0,
        max: marathonPace + 1.5,
      };
    case TrainingType.INTERVAL:
      return {
        min: marathonPace * 0.82,
        max: marathonPace * 0.88,
      };
    case TrainingType.TEMPO:
      return {
        min: marathonPace * 0.9,
        max: marathonPace * 0.95,
      };
    case TrainingType.EASY:
      return {
        min: marathonPace + 1.0,
        max: marathonPace + 2.0,
      };
    case TrainingType.CROSS:
      return {
        min: marathonPace + 2.0,
        max: marathonPace + 3.0,
      };
    case TrainingType.REST:
    default:
      return { min: 0, max: 0 };
  }
}

export function calculate5KPace(marathonPace: number): number {
  return marathonPace * 0.82;
}

export function calculate10KPace(marathonPace: number): number {
  return marathonPace * 0.88;
}

export function calculateHalfPace(marathonPace: number): number {
  return marathonPace * 0.93;
}
