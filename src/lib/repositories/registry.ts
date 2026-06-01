/**
 * Repository Registry — The Hexagonal Swap Point
 *
 * This module is THE only thing the store imports from the data layer.
 * The store calls:
 *   registry.save((r, uid) => r.workout.saveWorkout(uid, workout))
 *   registry.load((r, uid) => r.workout.getWorkouts(uid))
 *
 * To swap the entire database:
 *   registry.set(userId, createPostgresContainer(pgClient))
 *   ── That's it. Zero changes to business logic. ──
 *
 * Architecture:
 *   Store → registry → RepositoryContainer → Composite adapters
 *                                           ├── IDB adapter (local cache)
 *                                           └── Supabase adapter (source of truth)
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  UserRepository,
  WorkoutRepository,
  WorkoutPlanRepository,
  NutritionRepository,
  WaterRepository,
  BodyMetricRepository,
  RecoveryRepository,
  AiProviderRepository,
  SubscriptionRepository,
} from "@/ports/repositories";

// ─── Container type ───────────────────────────────────────────────────────────

export interface RepositoryContainer {
  user: UserRepository;
  workout: WorkoutRepository;
  plan: WorkoutPlanRepository;
  nutrition: NutritionRepository;
  water: WaterRepository;
  body: BodyMetricRepository;
  recovery: RecoveryRepository;
  aiProvider: AiProviderRepository;
  subscription: SubscriptionRepository;
}

// ─── Null container (safe no-ops for unauthenticated state) ───────────────────

const noop = async () => {};
const emptyArr = async () => [];

const nullContainer: RepositoryContainer = {
  user: { getProfile: async () => null, saveProfile: noop, deleteProfile: noop },
  workout: { getWorkouts: emptyArr as any, saveWorkout: noop, deleteWorkout: noop },
  plan: { getPlans: emptyArr as any, savePlan: noop, deletePlan: noop },
  nutrition: { getEntries: emptyArr as any, addEntry: noop, deleteEntry: noop, deleteEntriesForDate: noop },
  water: { getLogs: emptyArr as any, addLog: noop, deleteLog: noop },
  body: { getMetrics: emptyArr as any, addMetric: noop, deleteMetric: noop },
  recovery: { getLogs: emptyArr as any, addLog: noop, deleteLog: noop },
  aiProvider: { getProviders: emptyArr as any, saveProvider: noop, deleteProvider: noop, setActiveProvider: noop },
  subscription: {
    getPlan: async () => "byok",
    checkRateLimit: async () => ({ allowed: true, remaining: 60 }),
    incrementUsage: noop,
  },
};

// ─── Registry singleton ────────────────────────────────────────────────────────

let _userId: string | null = null;
let _container: RepositoryContainer = nullContainer;

export const registry = {
  get userId(): string | null { return _userId; },
  get repos(): RepositoryContainer { return _container; },
  get isAuthenticated(): boolean { return _userId !== null; },

  /** Wire up a real container on successful auth */
  set(userId: string, container: RepositoryContainer): void {
    _userId = userId;
    _container = container;
  },

  /** Clear on sign-out — silently reverts to null container */
  clear(): void {
    _userId = null;
    _container = nullContainer;
  },

  /**
   * Fire-and-forget write. Silently swallows errors.
   * The composite adapter inside handles IDB write + Supabase async + queue.
   */
  save<T>(fn: (repos: RepositoryContainer, userId: string) => Promise<T>): void {
    if (!_userId) return;
    const uid = _userId;
    fn(_container, uid).catch((err) => {
      console.warn("[registry.save] Non-fatal write error:", err);
    });
  },

  /**
   * Awaitable read. Returns null on error (store falls back to seed data).
   */
  async load<T>(fn: (repos: RepositoryContainer, userId: string) => Promise<T>): Promise<T | null> {
    if (!_userId) return null;
    try {
      return await fn(_container, _userId);
    } catch (err) {
      console.warn("[registry.load] Read error:", err);
      return null;
    }
  },
};

// ─── Container factory ────────────────────────────────────────────────────────

/**
 * Creates the production composite container from a Supabase client.
 * Import this in initApp() — nowhere else.
 */
export async function createProductionContainer(
  supabase: SupabaseClient,
  userId: string,
): Promise<RepositoryContainer> {
  // Lazy-import adapters so they never load on the server
  const [
    { SupabaseUserRepository, SupabaseWorkoutRepository, SupabaseWorkoutPlanRepository,
      SupabaseNutritionRepository, SupabaseWaterRepository, SupabaseBodyMetricRepository,
      SupabaseRecoveryRepository, SupabaseAiProviderRepository, SupabaseSubscriptionRepository },
    { IndexedDbUserRepository, IndexedDbWorkoutRepository, IndexedDbWorkoutPlanRepository,
      IndexedDbNutritionRepository, IndexedDbWaterRepository, IndexedDbBodyMetricRepository,
      IndexedDbRecoveryRepository },
    { CompositeUserRepository, CompositeWorkoutRepository, CompositeWorkoutPlanRepository,
      CompositeNutritionRepository, CompositeWaterRepository, CompositeBodyMetricRepository,
      CompositeRecoveryRepository, PassthroughAiProviderRepository, PassthroughSubscriptionRepository },
  ] = await Promise.all([
    import("@/adapters/supabase/index"),
    import("@/adapters/indexeddb/index"),
    import("@/adapters/composite/index"),
  ]);

  // Instantiate Supabase adapters
  const supa = {
    user: new SupabaseUserRepository(supabase),
    workout: new SupabaseWorkoutRepository(supabase),
    plan: new SupabaseWorkoutPlanRepository(supabase),
    nutrition: new SupabaseNutritionRepository(supabase),
    water: new SupabaseWaterRepository(supabase),
    body: new SupabaseBodyMetricRepository(supabase),
    recovery: new SupabaseRecoveryRepository(supabase),
    aiProvider: new SupabaseAiProviderRepository(supabase),
    subscription: new SupabaseSubscriptionRepository(supabase),
  };

  // Instantiate IDB adapters
  const local = {
    user: new IndexedDbUserRepository(),
    workout: new IndexedDbWorkoutRepository(),
    plan: new IndexedDbWorkoutPlanRepository(),
    nutrition: new IndexedDbNutritionRepository(),
    water: new IndexedDbWaterRepository(),
    body: new IndexedDbBodyMetricRepository(),
    recovery: new IndexedDbRecoveryRepository(),
  };

  // Wrap in composite (write-through cache)
  return {
    user: new CompositeUserRepository(local.user, supa.user, userId),
    workout: new CompositeWorkoutRepository(local.workout, supa.workout, userId),
    plan: new CompositeWorkoutPlanRepository(local.plan, supa.plan, userId),
    nutrition: new CompositeNutritionRepository(local.nutrition, supa.nutrition, userId),
    water: new CompositeWaterRepository(local.water, supa.water, userId),
    body: new CompositeBodyMetricRepository(local.body, supa.body, userId),
    recovery: new CompositeRecoveryRepository(local.recovery, supa.recovery, userId),
    // Cloud-only (no local cache — security & billing)
    aiProvider: new PassthroughAiProviderRepository(supa.aiProvider),
    subscription: new PassthroughSubscriptionRepository(supa.subscription),
  };
}

// ─── Offline Sync Queue drainer ───────────────────────────────────────────────

/**
 * Called once on app start (and on 'online' event).
 * Replays any writes that failed while offline.
 * Only runs when authenticated.
 */
export async function drainSyncQueue(): Promise<void> {
  if (!_userId || typeof window === "undefined") return;

  const { dequeueAll, removeFromQueue, incrementQueueRetry } = await import("@/lib/storage/db");
  const items = await dequeueAll();
  if (items.length === 0) return;

  console.log(`[SyncQueue] Draining ${items.length} queued operation(s)...`);

  for (const item of items) {
    if (item.retries >= 5) {
      // Give up after 5 attempts — log and remove
      console.warn(`[SyncQueue] Dropping item after 5 retries:`, item);
      await removeFromQueue(item.id!);
      continue;
    }

    try {
      if (item.operation === "delete") {
        // Route to correct delete method
        if (item.store === "workouts") {
          await _container.workout.deleteWorkout(item.userId, item.recordId);
        } else if (item.store === "workout_plans") {
          await _container.plan.deletePlan(item.userId, item.recordId);
        } else if (item.store === "nutrition_entries") {
          await _container.nutrition.deleteEntry(item.userId, item.recordId);
        } else if (item.store === "water_logs") {
          await _container.water.deleteLog(item.userId, item.recordId);
        } else if (item.store === "body_metrics") {
          await _container.body.deleteMetric(item.userId, item.recordId);
        } else if (item.store === "recovery_logs") {
          await _container.recovery.deleteLog(item.userId, item.recordId);
        }
      } else if (item.operation === "upsert" && item.payload) {
        if (item.store === "workouts") {
          await _container.workout.saveWorkout(item.userId, item.payload as any);
        } else if (item.store === "workout_plans") {
          await _container.plan.savePlan(item.userId, item.payload as any);
        } else if (item.store === "nutrition_entries") {
          await _container.nutrition.addEntry(item.userId, item.payload as any);
        } else if (item.store === "water_logs") {
          await _container.water.addLog(item.userId, item.payload as any);
        } else if (item.store === "body_metrics") {
          await _container.body.addMetric(item.userId, item.payload as any);
        } else if (item.store === "recovery_logs") {
          await _container.recovery.addLog(item.userId, item.payload as any);
        } else if (item.store === "profiles") {
          await _container.user.saveProfile(item.userId, item.payload as any);
        }
      }
      await removeFromQueue(item.id!);
    } catch (err) {
      console.warn(`[SyncQueue] Retry ${item.retries + 1} failed for item ${item.id}:`, err);
      await incrementQueueRetry(item.id!);
    }
  }
}
