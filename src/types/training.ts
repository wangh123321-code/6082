export enum TrainingType {
  LSD = 'LSD',
  INTERVAL = 'INTERVAL',
  TEMPO = 'TEMPO',
  EASY = 'EASY',
  REST = 'REST',
  CROSS = 'CROSS',
}

export const TRAINING_TYPE_LABELS: Record<TrainingType, string> = {
  [TrainingType.LSD]: 'LSD长距离',
  [TrainingType.INTERVAL]: '间歇跑',
  [TrainingType.TEMPO]: '节奏跑',
  [TrainingType.EASY]: '轻松跑',
  [TrainingType.REST]: '休息',
  [TrainingType.CROSS]: '交叉训练',
};

export const TRAINING_TYPE_COLORS: Record<TrainingType, string> = {
  [TrainingType.LSD]: '#10B981',
  [TrainingType.INTERVAL]: '#EF4444',
  [TrainingType.TEMPO]: '#F59E0B',
  [TrainingType.EASY]: '#3B82F6',
  [TrainingType.REST]: '#9CA3AF',
  [TrainingType.CROSS]: '#8B5CF6',
};

export interface DayTraining {
  id: string;
  date: string;
  weekNumber: number;
  dayOfWeek: number;
  type: TrainingType;
  distance: number;
  paceMin: number;
  paceMax: number;
  description: string;
  notes: string[];
  isModified: boolean;
}

export interface WeekMileage {
  weekNumber: number;
  totalDistance: number;
  increaseRate: number;
  isPeak: boolean;
  isTaper: boolean;
}

export interface TrainingPlan {
  id: string;
  createdAt: string;
  targetTime: number;
  initialWeeklyMileage: number;
  marathonPace: number;
  days: DayTraining[];
  weeklyMileage: WeekMileage[];
}

export interface UserSettings {
  targetTime: number;
  initialWeeklyMileage: number;
  startDate: string;
}

export interface PaceRange {
  min: number;
  max: number;
}

export interface TrainingConfig {
  targetTime: number;
  initialMileage: number;
  startDate: string;
}
