import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { AtlasSnapshot } from "@/types/domain";

const DB_NAME = "atlas-ai-coach";
const DB_VERSION = 1;
const SNAPSHOT_KEY = "profile";
const SETTINGS_PREFIX = "atlas.settings.";

interface AtlasDb extends DBSchema {
  snapshots: {
    key: string;
    value: AtlasSnapshot;
  };
}

let dbPromise: Promise<IDBPDatabase<AtlasDb>> | null = null;

function getDatabase(): Promise<IDBPDatabase<AtlasDb>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser."));
  }

  dbPromise ??= openDB<AtlasDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("snapshots")) {
        db.createObjectStore("snapshots");
      }
    },
  });

  return dbPromise;
}

export async function loadSnapshot(): Promise<AtlasSnapshot | null> {
  const db = await getDatabase();
  return (await db.get("snapshots", SNAPSHOT_KEY)) ?? null;
}

export async function saveSnapshot(snapshot: AtlasSnapshot): Promise<void> {
  const db = await getDatabase();
  await db.put(
    "snapshots",
    {
      ...snapshot,
      updatedAt: new Date().toISOString(),
    },
    SNAPSHOT_KEY,
  );
}

export async function clearSnapshot(): Promise<void> {
  const db = await getDatabase();
  await db.delete("snapshots", SNAPSHOT_KEY);
}

export function readLocalSetting<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  const raw = localStorage.getItem(`${SETTINGS_PREFIX}${key}`);
  if (!raw) return fallback;

  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeLocalSetting<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SETTINGS_PREFIX}${key}`, JSON.stringify(value));
}
