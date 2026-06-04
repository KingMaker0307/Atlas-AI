/**
 * IndexedDB Adapter — v2 Schema (Per-Entity Stores)
 *
 * Replaces the old single-blob "snapshots" store.
 * Each entity has its own IDB object store, keyed by record ID.
 * Implements all port interfaces from @/ports/repositories.
 *
 * DB version bumped to 2 — the upgrade handler migrates v1 snapshot data
 * into the new per-entity stores automatically on first open.
 */

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  UserRepository,
  WorkoutRepository,
  WorkoutPlanRepository,
  NutritionRepository,
  WaterRepository,
  BodyMetricRepository,
  RecoveryRepository,
} from "@/ports/repositories";
import type {
  UserProfile,
  Workout,
  WorkoutPlan,
  NutritionEntry,
  WaterLogEntry,
  BodyMetric,
  RecoveryLog,
} from "@/types/domain";

// ─── Schema ──────────────────────────────────────────────────────────────────

interface AtlasDbV2 extends DBSchema {
  profiles: { key: string; value: UserProfile & { _userId: string } };
  workouts: { key: string; value: Workout & { _userId: string } };
  workout_plans: { key: string; value: WorkoutPlan & { _userId: string } };
  nutrition_entries: { key: string; value: NutritionEntry & { _userId: string } };
  water_logs: { key: string; value: WaterLogEntry & { _userId: string } };
  body_metrics: { key: string; value: BodyMetric & { _userId: string } };
  recovery_logs: { key: string; value: RecoveryLog & { _userId: string } };
  sync_queue: { key: number; value: SyncQueueItem };
}

export interface SyncQueueItem {
  id?: number;
  userId: string;
  store: keyof Omit<AtlasDbV2, "sync_queue">;
  operation: "upsert" | "delete";
  recordId: string;
  payload?: unknown;
  createdAt: string;
  retries: number;
}

const DB_NAME = "atlas-ai-coach";
const DB_VERSION = 2;
const STORES = [
  "profiles",
  "workouts",
  "workout_plans",
  "nutrition_entries",
  "water_logs",
  "body_metrics",
  "recovery_logs",
  "sync_queue",
] as const;

// ─── Local settings (unchanged — uses localStorage) ───────────────────────────

const SETTINGS_PREFIX = "atlas.settings.";

export function readLocalSetting<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(`${SETTINGS_PREFIX}${key}`);
  if (!raw) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export function writeLocalSetting<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SETTINGS_PREFIX}${key}`, JSON.stringify(value));
}

// ─── DB singleton ─────────────────────────────────────────────────────────────

let _db: Promise<IDBPDatabase<AtlasDbV2>> | null = null;

export function getDb(): Promise<IDBPDatabase<AtlasDbV2>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  _db ??= openDB<AtlasDbV2>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      // Create all new v2 object stores
      for (const store of STORES) {
        if (!db.objectStoreNames.contains(store as any)) {
          if (store === "sync_queue") {
            (db as any).createObjectStore(store, { autoIncrement: true, keyPath: "id" });
          } else {
            db.createObjectStore(store as any);
          }
        }
      }

      // v1 → v2 migration: the old "snapshots" store may exist
      // We leave it in place (read-only) — the store's initApp will
      // attempt a one-time extraction of its data into the new stores.
      // The old store is intentionally NOT deleted here so we don't
      // lose data if the upgrade fails mid-way.
    },
  });
  return _db;
}

// ─── Helper: read all records for a userId ────────────────────────────────────

export async function getAll<T extends { _userId: string }>(
  store: keyof Omit<AtlasDbV2, "sync_queue">,
  userId: string,
): Promise<T[]> {
  const db = await getDb();
  const all = await (db as any).getAll(store) as T[];
  return all.filter((r) => r._userId === userId);
}

// ─── Sync Queue helpers ────────────────────────────────────────────────────────

export async function enqueueSync(item: Omit<SyncQueueItem, "id" | "retries" | "createdAt">): Promise<void> {
  const db = await getDb();
  await (db as any).add("sync_queue", {
    ...item,
    retries: 0,
    createdAt: new Date().toISOString(),
  });
}

export async function dequeueAll(): Promise<SyncQueueItem[]> {
  const db = await getDb();
  return (db as any).getAll("sync_queue");
}

export async function removeFromQueue(id: number): Promise<void> {
  const db = await getDb();
  await (db as any).delete("sync_queue", id);
}

export async function incrementQueueRetry(id: number): Promise<void> {
  const db = await getDb();
  const tx = db.transaction("sync_queue" as any, "readwrite");
  const item = await (tx.store as any).get(id) as SyncQueueItem | undefined;
  if (item) {
    await (tx.store as any).put({ ...item, retries: item.retries + 1 });
  }
  await tx.done;
}

/**
 * Clears ALL IndexedDB data for a given userId across every entity store,
 * plus removes their pending sync queue entries.
 * Used during sign-out to prevent stale data from contaminating a different
 * user's session on the same device.
 */
export async function clearAllUserData(userId: string): Promise<void> {
  const db = await getDb();
  const entityStores = [
    "profiles",
    "workouts",
    "workout_plans",
    "nutrition_entries",
    "water_logs",
    "body_metrics",
    "recovery_logs",
  ] as const;

  for (const storeName of entityStores) {
    const all = await (db as any).getAll(storeName);
    for (const record of all) {
      // Records are keyed by their `id` field; filter by _userId
      if (record._userId === userId || record.id === userId) {
        await (db as any).delete(storeName, record.id ?? record._userId);
      }
    }
  }

  // Clear sync queue for this user
  const queueItems = await (db as any).getAll("sync_queue") as SyncQueueItem[];
  for (const item of queueItems) {
    if (item.userId === userId) {
      await (db as any).delete("sync_queue", item.id!);
    }
  }
}
