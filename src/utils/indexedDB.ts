import { openDB, IDBPDatabase } from 'idb';
import { TrainingPlan, UserSettings, PlanSnapshot } from '@/types/training';

const DB_NAME = 'marathon-training-db';
const DB_VERSION = 2;
const STORE_PLANS = 'trainingPlans';
const STORE_SETTINGS = 'userSettings';
const STORE_SNAPSHOTS = 'planSnapshots';

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
  planSnapshots: {
    key: string;
    value: PlanSnapshot;
    indexes: { 'by-planId': string; 'by-createdAt': string };
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
        if (!db.objectStoreNames.contains(STORE_SNAPSHOTS)) {
          const snapshotStore = db.createObjectStore(STORE_SNAPSHOTS, { keyPath: 'id' });
          snapshotStore.createIndex('by-planId', 'planId');
          snapshotStore.createIndex('by-createdAt', 'createdAt');
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

export async function saveSnapshot(snapshot: PlanSnapshot): Promise<void> {
  const db = await getDB();
  await db.put(STORE_SNAPSHOTS, snapshot);
}

export async function getLatestSnapshot(planId: string): Promise<PlanSnapshot | null> {
  const db = await getDB();
  const snapshots = await db.getAllFromIndex(STORE_SNAPSHOTS, 'by-planId', planId);
  if (snapshots.length === 0) return null;
  snapshots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return snapshots[0];
}

export async function clearSnapshots(planId: string): Promise<void> {
  const db = await getDB();
  const snapshots = await db.getAllFromIndex(STORE_SNAPSHOTS, 'by-planId', planId);
  const tx = db.transaction(STORE_SNAPSHOTS, 'readwrite');
  for (const s of snapshots) {
    await tx.store.delete(s.id);
  }
  await tx.done;
}
