import { create } from 'zustand';
import {
  TrainingPlan,
  DayTraining,
  UserSettings,
  TrainingConfig,
} from '@/types/training';
import { generateTrainingPlan } from '@/utils/trainingGenerator';
import { recalculateMileageWithConstraints } from '@/utils/mileageValidator';
import { getToday } from '@/utils/dateUtils';
import * as db from '@/utils/indexedDB';

interface TrainingState {
  plan: TrainingPlan | null;
  settings: UserSettings | null;
  selectedDate: string | null;
  isLoading: boolean;
  isGenerating: boolean;
  isEditing: boolean;

  generatePlan: (targetTime: number, mileage: number) => Promise<void>;
  updateDayTraining: (dayId: string, updates: Partial<DayTraining>) => Promise<void>;
  selectDate: (date: string | null) => void;
  setIsEditing: (editing: boolean) => void;
  loadFromDB: () => Promise<void>;
  saveToDB: () => Promise<void>;
  clearPlan: () => Promise<void>;
}

export const useTrainingStore = create<TrainingState>((set, get) => ({
  plan: null,
  settings: null,
  selectedDate: null,
  isLoading: false,
  isGenerating: false,
  isEditing: false,

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
      set({ plan, settings, selectedDate: null, isGenerating: false });
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
      set({ plan: null, settings: null, selectedDate: null });
    } catch (error) {
      console.error('Failed to clear IndexedDB:', error);
    }
  },
}));
