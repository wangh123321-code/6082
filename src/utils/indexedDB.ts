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

let dbPromise: Promise<IDBPDatabase<DBSchema>> | null = null;

function getDB(): Promise<IDBPDatabase<DBSchema>> {
  if (!dbPromise) {
    dbPromise = openDB<DBSchema>(DB_NAME, DB_VERSION, {
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
  }
  return dbPromise;
}

export async function savePlan(plan: TrainingPlan): Promise<void> {
  const db = await getDB();
  await db.put(STORE_PLANS, plan);
}

export async function getLatestPlan(): Promise<TrainingPlan | null> {
  const db = await getDB();
  const plans = await db.getAllFromIndex(STORE_PLANS, 'by-createdAt');
  return plans.length > 0 ? plans[plans.length - 1] : null;
}

export async function deletePlan(planId: string): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_PLANS, planId);
}

export async function clearAllPlans(): Promise<void> {
  const db = await getDB();
  await db.clear(STORE_PLANS);
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const db = await getDB();
  await db.put(STORE_SETTINGS, { key: 'current', value: settings });
}

export async function getSettings(): Promise<UserSettings | null> {
  const db = await getDB();
  const result = await db.get(STORE_SETTINGS, 'current');
  return result ? result.value : null;
}

export async function clearSettings(): Promise<void> {
  const db = await getDB();
  await db.delete(STORE_SETTINGS, 'current');
}
