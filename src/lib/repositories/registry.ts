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
  ChatRepository,
  RecentFoodSearchRepository,
  AiCacheRepository,
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
  chat: ChatRepository;
  recentSearch: RecentFoodSearchRepository;
  aiCache: AiCacheRepository;
}

// ─── Null container (safe no-ops for unauthenticated state) ───────────────────

const noop = async () => {};
const emptyArr = async () => [];

export const nullContainer: RepositoryContainer = {
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
  chat: { getMessages: emptyArr as any, saveMessage: noop, deleteMessagesForDate: noop },
  recentSearch: { getRecentSearches: emptyArr as any, addRecentSearch: noop, clearRecentSearches: noop },
  aiCache: { getCachedResponse: async () => null, saveResponse: noop },
};

// ─── Registry singleton ────────────────────────────────────────────────────────

let _userId: string | null = null;
let _container: RepositoryContainer = nullContainer;
let _isDraining = false;

export const registry = {
  get userId(): string | null { return _userId; },
  get repos(): RepositoryContainer { return _container; },
  get isAuthenticated(): boolean { return _userId !== null; },
  get isDraining(): boolean { return _isDraining; },
  setDraining(val: boolean): void { _isDraining = val; },

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

  /**
   * Awaitable write that THROWS on failure.
   * Use this for critical writes (e.g., API key saves) where the caller
   * must know if the operation succeeded so it can surface the error to the user.
   * Unlike save() and load(), errors are NOT swallowed.
   */
  async persist<T>(fn: (repos: RepositoryContainer, userId: string) => Promise<T>): Promise<T> {
    if (!_userId) throw new Error("Not authenticated — please sign in and try again.");
    return fn(_container, _userId);
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
      SupabaseRecoveryRepository, SupabaseAiProviderRepository, SupabaseSubscriptionRepository,
      SupabaseChatRepository, SupabaseRecentFoodSearchRepository, SupabaseAiCacheRepository },
    { IndexedDbUserRepository, IndexedDbWorkoutRepository, IndexedDbWorkoutPlanRepository,
      IndexedDbNutritionRepository, IndexedDbWaterRepository, IndexedDbBodyMetricRepository,
      IndexedDbRecoveryRepository, IndexedDbChatRepository, IndexedDbRecentFoodSearchRepository,
      IndexedDbAiCacheRepository },
    { CompositeUserRepository, CompositeWorkoutRepository, CompositeWorkoutPlanRepository,
      CompositeNutritionRepository, CompositeWaterRepository, CompositeBodyMetricRepository,
      CompositeRecoveryRepository, PassthroughAiProviderRepository, PassthroughSubscriptionRepository,
      CompositeChatRepository, CompositeRecentFoodSearchRepository, CompositeAiCacheRepository },
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
    chat: new SupabaseChatRepository(supabase),
    recentSearch: new SupabaseRecentFoodSearchRepository(supabase),
    aiCache: new SupabaseAiCacheRepository(supabase),
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
    chat: new IndexedDbChatRepository(),
    recentSearch: new IndexedDbRecentFoodSearchRepository(),
    aiCache: new IndexedDbAiCacheRepository(),
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
    chat: new CompositeChatRepository(local.chat, supa.chat, userId),
    recentSearch: new CompositeRecentFoodSearchRepository(local.recentSearch, supa.recentSearch, userId),
    aiCache: new CompositeAiCacheRepository(local.aiCache, supa.aiCache, userId),
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

  registry.setDraining(true);
  try {
    for (const item of items) {
      if (item.retries >= 5) {
        // Give up after 5 attempts — log and remove
        console.warn(`[SyncQueue] Dropping item after 5 retries:`, item);
        await removeFromQueue(item.id!);
        continue;
      }

      if (item.userId !== _userId) {
        // Drop items belonging to a different user session to prevent RLS violations
        console.warn(`[SyncQueue] Dropping leftover queue item for user ${item.userId} (logged in as ${_userId}):`, item);
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
          } else if (item.store === "chat_messages") {
            const date = item.recordId.startsWith("date:") ? item.recordId.split("date:")[1] : item.recordId;
            await _container.chat.deleteMessagesForDate(item.userId, date);
          } else if (item.store === "recent_food_searches") {
            await _container.recentSearch.clearRecentSearches(item.userId);
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
          } else if (item.store === "chat_messages") {
            const { date, message } = item.payload as { date: string; message: any };
            await _container.chat.saveMessage(item.userId, date, message);
          } else if (item.store === "recent_food_searches") {
            await _container.recentSearch.addRecentSearch(item.userId, item.payload as any);
          } else if (item.store === "ai_response_cache") {
            const { category, queryKey, payload } = item.payload as { category: string; queryKey: string; payload: unknown };
            await _container.aiCache.saveResponse(item.userId, category, queryKey, payload);
          }
        }
        await removeFromQueue(item.id!);
      } catch (err) {
        console.warn(`[SyncQueue] Retry ${item.retries + 1} failed for item ${item.id}:`, err);
        await incrementQueueRetry(item.id!);
      }
    }
  } finally {
    registry.setDraining(false);
  }
}
