import { create } from 'zustand';
import {
  TrainingPlan,
  DayTraining,
  UserSettings,
  TrainingConfig,
  SkipReason,
  PlanSnapshot,
  RescheduleResult,
} from '@/types/training';
import { generateTrainingPlan } from '@/utils/trainingGenerator';
import { recalculateMileageWithConstraints } from '@/utils/mileageValidator';
import { rescheduleAfterSkip } from '@/utils/rescheduleEngine';
import { getToday, generateId } from '@/utils/dateUtils';
import * as db from '@/utils/indexedDB';

interface TrainingState {
  plan: TrainingPlan | null;
  settings: UserSettings | null;
  selectedDate: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  isEditing: boolean;
  rescheduleWarning: string | null;

  generatePlan: (targetTime: number, mileage: number) => Promise<void>;
  updateDayTraining: (dayId: string, updates: Partial<DayTraining>) => Promise<void>;
  markDaySkip: (dayId: string, reason: SkipReason) => Promise<RescheduleResult>;
  rollbackPlan: () => Promise<boolean>;
  selectDate: (date: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
  clearPlan: () => Promise<void>;
  clearRescheduleWarning: () => void;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  plan: null,
  settings: null,
  selectedDate: null,
  isLoading: false,
  isGenerating: false,
  isEditing: false,
  rescheduleWarning: null,

  generatePlan: async (targetTime: number, mileage: number) => {
    set({ isGenerating: true });
    try {
      const startDate = getToday();
      const config: TrainingConfig = {
        targetTime,
        initialMileage: mileage,
        startDate,
      };
      const plan = generateTrainingPlan(config);
      const settings: UserSettings = {
        targetTime,
        initialWeeklyMileage: mileage,
        startDate,
      };
      set({ plan, settings, selectedDate: null, isGenerating: false, rescheduleWarning: null });
    } catch (error) {
      console.error('Failed to generate training plan:', error);
      set({ isGenerating: false });
    }
  },

  updateDayTraining: async (dayId: string, updates: Partial<DayTraining>) => {
    const { plan } = get();
    if (!plan) return;

    const dayIndex = plan.days.findIndex((d) => d.id === dayId);
    if (dayIndex === -1) return;

    const updatedDay: DayTraining = {
      ...plan.days[dayIndex],
      ...updates,
      isModified: true,
    };

    const newDays = [...plan.days];
    newDays[dayIndex] = updatedDay;

    const { days: recalculatedDays, weeklyMileage } = recalculateMileageWithConstraints(
      newDays,
      dayId,
      plan.initialWeeklyMileage
    );

    const updatedPlan: TrainingPlan = {
      ...plan,
      days: recalculatedDays,
      weeklyMileage,
    };

    set({ plan: updatedPlan });
  },

  markDaySkip: async (dayId: string, reason: SkipReason): Promise<RescheduleResult> => {
    const { plan } = get();
    if (!plan) {
      return {
        days: [],
        weeklyMileage: [],
        affectedDays: 0,
        consecutiveLsdSkipped: false,
      };
    }

    const snapshot: PlanSnapshot = {
      id: generateId(),
      planId: plan.id,
      createdAt: new Date().toISOString(),
      reason: reason === 'leave' ? '请假顺延' : '跳训顺延',
      plan: JSON.parse(JSON.stringify(plan)),
    };
    await db.saveSnapshot(snapshot);

    const result = rescheduleAfterSkip(plan.days, dayId, reason, plan.initialWeeklyMileage);

    const updatedPlan: TrainingPlan = {
      ...plan,
      days: result.days,
      weeklyMileage: result.weeklyMileage,
    };

    let warning: string | null = null;
    if (result.consecutiveLsdSkipped) {
      warning = '警告：您已连续跳过2次关键长距离训练（LSD），这可能导致耐力基础不足。建议避免再跳过长距离训练，必要时请考虑降低配速而非跳过。';
    }

    set({ plan: updatedPlan, rescheduleWarning: warning });
    return result;
  },

  rollbackPlan: async (): Promise<boolean> => {
    const { plan } = get();
    if (!plan) return false;

    try {
      const snapshot = await db.getLatestSnapshot(plan.id);
      if (!snapshot) return false;

      set({ plan: snapshot.plan, selectedDate: null, rescheduleWarning: null });
      return true;
    } catch (error) {
      console.error('Failed to rollback plan:', error);
      return false;
    }
  },

  selectDate: (date: string | null) => {
    set({ selectedDate: date, isEditing: false });
  },

  setIsEditing: (editing: boolean) => {
    set({ isEditing: editing });
  },

  loadFromDB: async () => {
    set({ isLoading: true });
    try {
      const [plan, settings] = await Promise.all([
        db.getLatestPlan(),
        db.getSettings(),
      ]);
      set({ plan, settings, isLoading: false });
    } catch (error) {
      console.error('Failed to load from IndexedDB:', error);
      set({ isLoading: false });
    }
  },

  saveToDB: async () => {
    const { plan, settings } = get();
    try {
      if (plan) await db.savePlan(plan);
      if (settings) await db.saveSettings(settings);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  },

  clearPlan: async () => {
    try {
      await Promise.all([db.clearAllPlans(), db.clearSettings()]);
      set({ plan: null, settings: null, selectedDate: null, rescheduleWarning: null });
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  },

  clearRescheduleWarning: () => {
    set({ rescheduleWarning: null });
  },
}));
