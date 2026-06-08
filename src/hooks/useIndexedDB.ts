import { useEffect, useRef, useCallback } from 'react';
import { openDB, IDBPDatabase } from 'idb';
import { TrainingPlan, UserSettings } from '@/types/training';

const DB_NAME = 'marathon-training-db';
const DB_VERSION = 1;
const STORE_PLANS = 'trainingPlans';
const STORE_SETTINGS = 'userSettings';

interface DBSchema {
  trainingPlans: {
    key: string;
    value: TrainingPlan;
    indexes: { 'by-createdAt': string };
  };
  userSettings: {
    key: string;
    value: { key: string; value: UserSettings };
  };
}

let dbInstance: IDBPDatabase<DBSchema> | null = null;

async function initDB(): Promise<IDBPDatabase<DBSchema>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<DBSchema>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_PLANS)) {
        const planStore = db.createObjectStore(STORE_PLANS, { keyPath: 'id' });
        planStore.createIndex('by-createdAt', 'createdAt');
      }
      if (!db.objectStoreNames.contains(STORE_SETTINGS)) {
        db.createObjectStore(STORE_SETTINGS, { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

export function useIndexedDB() {
  const dbRef = useRef<IDBPDatabase<DBSchema> | null>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    const init = async () => {
      if (!isInitialized.current) {
        dbRef.current = await initDB();
        isInitialized.current = true;
      }
    };
    init();

    return () => {
      if (dbRef.current) {
        dbRef.current.close();
        dbRef.current = null;
        dbInstance = null;
        isInitialized.current = false;
      }
    };
  }, []);

  const ensureDB = useCallback(async (): Promise<IDBPDatabase<DBSchema>> => {
    if (!dbRef.current) {
      dbRef.current = await initDB();
    }
    return dbRef.current;
  }, []);

  const savePlan = useCallback(
    async (plan: TrainingPlan): Promise<void> => {
      const db = await ensureDB();
      await db.put(STORE_PLANS, plan);
    },
    [ensureDB]
  );

  const getLatestPlan = useCallback(
    async (): Promise<TrainingPlan | null> => {
      const db = await ensureDB();
      const plans = await db.getAllFromIndex(STORE_PLANS, 'by-createdAt');
      return plans.length > 0 ? plans[plans.length - 1] : null;
    },
    [ensureDB]
  );

  const deletePlan = useCallback(
    async (planId: string): Promise<void> => {
      const db = await ensureDB();
      await db.delete(STORE_PLANS, planId);
    },
    [ensureDB]
  );

  const clearAllPlans = useCallback(async (): Promise<void> => {
    const db = await ensureDB();
    await db.clear(STORE_PLANS);
  }, [ensureDB]);

  const saveSettings = useCallback(
    async (settings: UserSettings): Promise<void> => {
      const db = await ensureDB();
      await db.put(STORE_SETTINGS, { key: 'current', value: settings });
    },
    [ensureDB]
  );

  const getSettings = useCallback(
    async (): Promise<UserSettings | null> => {
      const db = await ensureDB();
      const result = await db.get(STORE_SETTINGS, 'current');
      return result ? result.value : null;
    },
    [ensureDB]
  );

  const clearSettings = useCallback(async (): Promise<void> => {
    const db = await ensureDB();
    await db.delete(STORE_SETTINGS, 'current');
  }, [ensureDB]);

  return {
    savePlan,
    getLatestPlan,
    deletePlan,
    clearAllPlans,
    saveSettings,
    getSettings,
    clearSettings,
  };
}
