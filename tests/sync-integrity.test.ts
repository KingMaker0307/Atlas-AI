import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registry, drainSyncQueue } from "@/lib/repositories/registry";
import { CompositeWorkoutRepository } from "@/adapters/composite/index";
import type { Workout } from "@/types/domain";
import type { WorkoutRepository } from "@/ports/repositories";

// ─── Network Mocking ──────────────────────────────────────────────────────────
let onlineStatus = true;
Object.defineProperty(global, "navigator", {
  value: {
    get onLine() {
      return onlineStatus;
    },
  },
  configurable: true,
  writable: true,
});

Object.defineProperty(global, "window", {
  value: {},
  configurable: true,
  writable: true,
});

// ─── Sync Queue Mocking ────────────────────────────────────────────────────────
let syncQueue: any[] = [];

vi.mock("@/lib/storage/db", () => {
  return {
    enqueueSync: async (item: any) => {
      syncQueue.push({
        ...item,
        id: syncQueue.length + 1,
        retries: 0,
        createdAt: new Date().toISOString(),
      });
    },
    dequeueAll: async () => {
      return [...syncQueue];
    },
    removeFromQueue: async (id: number) => {
      syncQueue = syncQueue.filter((item) => item.id !== id);
    },
    incrementQueueRetry: async (id: number) => {
      const item = syncQueue.find((item) => item.id === id);
      if (item) {
        item.retries += 1;
      }
    },
    getDb: vi.fn(),
    getAll: vi.fn(),
  };
});

describe("QE Integration: Hexagonal Sync and Cache Write-Through Cache Strategy", () => {
  const userId = "test-qe-user";
  
  let localDb: Record<string, Workout> = {};
  let remoteDb: Record<string, Workout> = {};
  let remoteFails = false;

  // Mock repositories
  const mockLocalWorkoutRepo: WorkoutRepository = {
    getWorkouts: async (uid: string) => Object.values(localDb),
    saveWorkout: async (uid: string, workout: Workout) => {
      localDb[workout.id] = workout;
    },
    deleteWorkout: async (uid: string, workoutId: string) => {
      delete localDb[workoutId];
    },
  };

  const mockRemoteWorkoutRepo: WorkoutRepository = {
    getWorkouts: async (uid: string) => {
      if (remoteFails) throw new Error("Supabase Connection Refused");
      return Object.values(remoteDb);
    },
    saveWorkout: async (uid: string, workout: Workout) => {
      if (remoteFails) throw new Error("Supabase Connection Refused");
      remoteDb[workout.id] = workout;
    },
    deleteWorkout: async (uid: string, workoutId: string) => {
      if (remoteFails) throw new Error("Supabase Connection Refused");
      delete remoteDb[workoutId];
    },
  };

  let compositeRepo: CompositeWorkoutRepository;

  beforeEach(() => {
    localDb = {};
    remoteDb = {};
    syncQueue = [];
    onlineStatus = true;
    remoteFails = false;

    compositeRepo = new CompositeWorkoutRepository(
      mockLocalWorkoutRepo,
      mockRemoteWorkoutRepo,
      userId
    );

    // Setup active container inside registry
    registry.set(userId, {
      user: {} as any,
      workout: compositeRepo,
      plan: {} as any,
      nutrition: {} as any,
      water: {} as any,
      body: {} as any,
      recovery: {} as any,
      aiProvider: {} as any,
      subscription: {} as any,
    });
  });

  afterEach(() => {
    registry.clear();
  });

  const dummyWorkout: Workout = {
    id: "workout-1",
    name: "QE Leg Day",
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    notes: "High volume squat session",
    exercises: [],
  };

  it("should write immediately to local and remote when online", async () => {
    onlineStatus = true;
    remoteFails = false;

    await compositeRepo.saveWorkout(userId, dummyWorkout);

    // Verify local cache is hydrated
    expect(localDb["workout-1"]).toEqual(dummyWorkout);
    // Verify remote database is hydrated
    expect(remoteDb["workout-1"]).toEqual(dummyWorkout);
    // Sync queue must be empty
    expect(syncQueue).toHaveLength(0);
  });

  it("should write to local cache but enqueue to sync_queue if offline", async () => {
    onlineStatus = false;

    await compositeRepo.saveWorkout(userId, dummyWorkout);

    // Local cache is populated immediately
    expect(localDb["workout-1"]).toEqual(dummyWorkout);
    // Remote is not updated because we are offline
    expect(remoteDb["workout-1"]).toBeUndefined();
    // Verify sync queue record
    expect(syncQueue).toHaveLength(1);
    expect(syncQueue[0].store).toBe("workouts");
    expect(syncQueue[0].operation).toBe("upsert");
    expect(syncQueue[0].recordId).toBe("workout-1");
    expect(syncQueue[0].payload).toEqual(dummyWorkout);
  });

  it("should write to local cache but enqueue to sync_queue if online but remote database throws error", async () => {
    onlineStatus = true;
    remoteFails = true; // Simulating network/gateway errors

    await compositeRepo.saveWorkout(userId, dummyWorkout);

    // Local cache is populated immediately (non-blocking UI)
    expect(localDb["workout-1"]).toEqual(dummyWorkout);
    // Remote is not updated
    expect(remoteDb["workout-1"]).toBeUndefined();
    // Operation is queued in background
    expect(syncQueue).toHaveLength(1);
  });

  it("should replay queued operations to remote and clear the queue when drainSyncQueue is called online", async () => {
    // 1. Save while offline
    onlineStatus = false;
    await compositeRepo.saveWorkout(userId, dummyWorkout);
    expect(syncQueue).toHaveLength(1);

    // 2. Go online and run sync queue drain
    onlineStatus = true;
    remoteFails = false;

    await drainSyncQueue();

    // Verify remote got updated
    expect(remoteDb["workout-1"]).toEqual(dummyWorkout);
    // Verify sync queue was cleared
    expect(syncQueue).toHaveLength(0);
  });

  it("should increment retry count and retain operations in sync queue if drainSyncQueue fails due to persistent remote error", async () => {
    // 1. Save while offline
    onlineStatus = false;
    await compositeRepo.saveWorkout(userId, dummyWorkout);

    // 2. Run sync queue drain, but remote fails
    onlineStatus = true;
    remoteFails = true;

    await drainSyncQueue();

    // Remote still undefined
    expect(remoteDb["workout-1"]).toBeUndefined();
    // Sync queue still contains the item
    expect(syncQueue).toHaveLength(1);
    // Retry count must be incremented
    expect(syncQueue[0].retries).toBe(1);
  });

  it("should drop sync queue item after 5 failed retry attempts", async () => {
    // 1. Save while offline
    onlineStatus = false;
    await compositeRepo.saveWorkout(userId, dummyWorkout);
    expect(syncQueue).toHaveLength(1);

    // 2. Set retries to 5 (threshold limit)
    syncQueue[0].retries = 5;

    // 3. Attempt drain
    onlineStatus = true;
    remoteFails = true;
    await drainSyncQueue();

    // Queue item should be discarded to avoid stuck queue poison pill
    expect(syncQueue).toHaveLength(0);
  });
});
