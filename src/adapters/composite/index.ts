/**
 * Composite Adapters — Write-Through Cache Pattern
 *
 * Each class implements a port interface and wraps:
 *   - local:  IndexedDB adapter (fast, offline-safe)
 *   - remote: Supabase adapter (source of truth)
 *
 * WRITE strategy:
 *   1. Write to IDB immediately (UI stays fast, works offline)
 *   2. Write to Supabase async (non-blocking)
 *   3. If Supabase fails → enqueue to SyncQueue for retry on reconnect
 *
 * READ strategy:
 *   - Online  → Supabase (source of truth) → hydrate IDB cache → return
 *   - Offline → IDB cache → return
 *
 * The store and registry import ONLY the port interfaces.
 * This file is never imported by the store.
 */

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
import type {
  UserProfile,
  Workout,
  WorkoutPlan,
  NutritionEntry,
  WaterLogEntry,
  BodyMetric,
  RecoveryLog,
  AiProviderSettings,
  AiMessage,
  CommonFoodItem,
} from "@/types/domain";
import { enqueueSync } from "@/lib/storage/db";
import { registry } from "@/lib/repositories/registry";

function isOnline(): boolean {
  return typeof navigator !== "undefined" ? navigator.onLine : true;
}

async function remoteWrite(
  fn: () => Promise<void>,
  queueFallback: () => Promise<void>,
): Promise<void> {
  // If we are replaying the sync queue, do not catch errors or enqueue them again.
  // Instead, let the error bubble up so the queue drainer can log it, increment retries, and keep it in the queue.
  const isDraining = typeof window !== "undefined" && registry.isDraining;
  if (isDraining) {
    await fn();
    return;
  }

  if (!isOnline()) {
    await queueFallback();
    return;
  }
  try {
    await fn();
  } catch (err) {
    console.warn("[Composite] Remote write failed, queuing for retry:", err);
    await queueFallback();
  }
}

// ─── User / Profile ───────────────────────────────────────────────────────────

export class CompositeUserRepository implements UserRepository {
  constructor(
    private local: UserRepository,
    private remote: UserRepository,
    private userId: string,
  ) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isOnline()) {
      try {
        const profile = await this.remote.getProfile(userId);
        if (profile) {
          await this.local.saveProfile(userId, profile); // hydrate cache
          return profile;
        }
      } catch (err) {
        console.warn("[Composite] Remote getProfile failed:", err);
      }
    }
    return this.local.getProfile(userId);
  }

  async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    await this.local.saveProfile(userId, profile);
    await remoteWrite(
      () => this.remote.saveProfile(userId, profile),
      () => enqueueSync({ userId, store: "profiles", operation: "upsert", recordId: userId, payload: profile }),
    );
  }

  async deleteProfile(userId: string): Promise<void> {
    await this.local.deleteProfile(userId);
    await remoteWrite(
      () => this.remote.deleteProfile(userId),
      () => enqueueSync({ userId, store: "profiles", operation: "delete", recordId: userId }),
    );
  }
}

// ─── Workouts ─────────────────────────────────────────────────────────────────

export class CompositeWorkoutRepository implements WorkoutRepository {
  constructor(
    private local: WorkoutRepository,
    private remote: WorkoutRepository,
    private userId: string,
  ) {}

  async getWorkouts(userId: string, limit?: number): Promise<Workout[]> {
    if (isOnline()) {
      try {
        const workouts = await this.remote.getWorkouts(userId, limit);
        await Promise.all(workouts.map((w) => this.local.saveWorkout(userId, w)));
        return workouts;
      } catch {
        return this.local.getWorkouts(userId, limit);
      }
    }
    return this.local.getWorkouts(userId, limit);
  }

  async saveWorkout(userId: string, workout: Workout): Promise<void> {
    await this.local.saveWorkout(userId, workout);
    await remoteWrite(
      () => this.remote.saveWorkout(userId, workout),
      () => enqueueSync({ userId, store: "workouts", operation: "upsert", recordId: workout.id, payload: workout }),
    );
  }

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    await this.local.deleteWorkout(userId, workoutId);
    await remoteWrite(
      () => this.remote.deleteWorkout(userId, workoutId),
      () => enqueueSync({ userId, store: "workouts", operation: "delete", recordId: workoutId }),
    );
  }
}

// ─── Workout Plans ────────────────────────────────────────────────────────────

export class CompositeWorkoutPlanRepository implements WorkoutPlanRepository {
  constructor(
    private local: WorkoutPlanRepository,
    private remote: WorkoutPlanRepository,
    private userId: string,
  ) {}

  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    if (isOnline()) {
      try {
        const plans = await this.remote.getPlans(userId);
        await Promise.all(plans.map((p) => this.local.savePlan(userId, p)));
        return plans;
      } catch {
        return this.local.getPlans(userId);
      }
    }
    return this.local.getPlans(userId);
  }

  async savePlan(userId: string, plan: WorkoutPlan): Promise<void> {
    await this.local.savePlan(userId, plan);
    await remoteWrite(
      () => this.remote.savePlan(userId, plan),
      () => enqueueSync({ userId, store: "workout_plans", operation: "upsert", recordId: plan.id, payload: plan }),
    );
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    await this.local.deletePlan(userId, planId);
    await remoteWrite(
      () => this.remote.deletePlan(userId, planId),
      () => enqueueSync({ userId, store: "workout_plans", operation: "delete", recordId: planId }),
    );
  }
}

// ─── Nutrition ────────────────────────────────────────────────────────────────

export class CompositeNutritionRepository implements NutritionRepository {
  constructor(
    private local: NutritionRepository,
    private remote: NutritionRepository,
    private userId: string,
  ) {}

  async getEntries(userId: string, date?: string): Promise<NutritionEntry[]> {
    if (isOnline()) {
      try {
        const entries = await this.remote.getEntries(userId, date);
        await Promise.all(entries.map((e) => this.local.addEntry(userId, e)));
        return entries;
      } catch {
        return this.local.getEntries(userId, date);
      }
    }
    return this.local.getEntries(userId, date);
  }

  async addEntry(userId: string, entry: NutritionEntry): Promise<void> {
    await this.local.addEntry(userId, entry);
    await remoteWrite(
      () => this.remote.addEntry(userId, entry),
      () => enqueueSync({ userId, store: "nutrition_entries", operation: "upsert", recordId: entry.id, payload: entry }),
    );
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    await this.local.deleteEntry(userId, entryId);
    await remoteWrite(
      () => this.remote.deleteEntry(userId, entryId),
      () => enqueueSync({ userId, store: "nutrition_entries", operation: "delete", recordId: entryId }),
    );
  }

  async deleteEntriesForDate(userId: string, date: string): Promise<void> {
    await this.local.deleteEntriesForDate(userId, date);
    await remoteWrite(
      () => this.remote.deleteEntriesForDate(userId, date),
      () => enqueueSync({ userId, store: "nutrition_entries", operation: "delete", recordId: `date:${date}` }),
    );
  }
}

// ─── Water ────────────────────────────────────────────────────────────────────

export class CompositeWaterRepository implements WaterRepository {
  constructor(
    private local: WaterRepository,
    private remote: WaterRepository,
    private userId: string,
  ) {}

  async getLogs(userId: string, date?: string): Promise<WaterLogEntry[]> {
    if (isOnline()) {
      try {
        const logs = await this.remote.getLogs(userId, date);
        await Promise.all(logs.map((l) => this.local.addLog(userId, l)));
        return logs;
      } catch {
        return this.local.getLogs(userId, date);
      }
    }
    return this.local.getLogs(userId, date);
  }

  async addLog(userId: string, log: WaterLogEntry): Promise<void> {
    await this.local.addLog(userId, log);
    await remoteWrite(
      () => this.remote.addLog(userId, log),
      () => enqueueSync({ userId, store: "water_logs", operation: "upsert", recordId: log.id, payload: log }),
    );
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    await this.local.deleteLog(userId, logId);
    await remoteWrite(
      () => this.remote.deleteLog(userId, logId),
      () => enqueueSync({ userId, store: "water_logs", operation: "delete", recordId: logId }),
    );
  }
}

// ─── Body Metrics ─────────────────────────────────────────────────────────────

export class CompositeBodyMetricRepository implements BodyMetricRepository {
  constructor(
    private local: BodyMetricRepository,
    private remote: BodyMetricRepository,
    private userId: string,
  ) {}

  async getMetrics(userId: string): Promise<BodyMetric[]> {
    if (isOnline()) {
      try {
        const metrics = await this.remote.getMetrics(userId);
        await Promise.all(metrics.map((m) => this.local.addMetric(userId, m)));
        return metrics;
      } catch {
        return this.local.getMetrics(userId);
      }
    }
    return this.local.getMetrics(userId);
  }

  async addMetric(userId: string, metric: BodyMetric): Promise<void> {
    await this.local.addMetric(userId, metric);
    await remoteWrite(
      () => this.remote.addMetric(userId, metric),
      () => enqueueSync({ userId, store: "body_metrics", operation: "upsert", recordId: metric.id, payload: metric }),
    );
  }

  async deleteMetric(userId: string, metricId: string): Promise<void> {
    await this.local.deleteMetric(userId, metricId);
    await remoteWrite(
      () => this.remote.deleteMetric(userId, metricId),
      () => enqueueSync({ userId, store: "body_metrics", operation: "delete", recordId: metricId }),
    );
  }
}

// ─── Recovery ─────────────────────────────────────────────────────────────────

export class CompositeRecoveryRepository implements RecoveryRepository {
  constructor(
    private local: RecoveryRepository,
    private remote: RecoveryRepository,
    private userId: string,
  ) {}

  async getLogs(userId: string): Promise<RecoveryLog[]> {
    if (isOnline()) {
      try {
        const logs = await this.remote.getLogs(userId);
        await Promise.all(logs.map((l) => this.local.addLog(userId, l)));
        return logs;
      } catch {
        return this.local.getLogs(userId);
      }
    }
    return this.local.getLogs(userId);
  }

  async addLog(userId: string, log: RecoveryLog): Promise<void> {
    await this.local.addLog(userId, log);
    await remoteWrite(
      () => this.remote.addLog(userId, log),
      () => enqueueSync({ userId, store: "recovery_logs", operation: "upsert", recordId: log.id, payload: log }),
    );
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    await this.local.deleteLog(userId, logId);
    await remoteWrite(
      () => this.remote.deleteLog(userId, logId),
      () => enqueueSync({ userId, store: "recovery_logs", operation: "delete", recordId: logId }),
    );
  }
}

// ─── AI Providers (Supabase-only — no local cache needed) ────────────────────
// API keys are encrypted; keeping them only in Supabase is safer.

export class PassthroughAiProviderRepository implements AiProviderRepository {
  constructor(private remote: AiProviderRepository) {}
  getProviders(userId: string) { return this.remote.getProviders(userId); }
  saveProvider(userId: string, p: AiProviderSettings) { return this.remote.saveProvider(userId, p); }
  deleteProvider(userId: string, id: string) { return this.remote.deleteProvider(userId, id); }
  setActiveProvider(userId: string, id: string) { return this.remote.setActiveProvider(userId, id); }
}

// ─── Subscription (Supabase-only — billing is always cloud) ───────────────────

export class PassthroughSubscriptionRepository implements SubscriptionRepository {
  constructor(private remote: SubscriptionRepository) {}
  getPlan(userId: string) { return this.remote.getPlan(userId); }
  checkRateLimit(userId: string) { return this.remote.checkRateLimit(userId); }
  incrementUsage(userId: string) { return this.remote.incrementUsage(userId); }
}

// ─── Day-Based Chat Messages ────────────────────────────────────────────────

export class CompositeChatRepository implements ChatRepository {
  constructor(
    private local: ChatRepository,
    private remote: ChatRepository,
    private userId: string,
  ) {}

  async getMessages(userId: string, date: string): Promise<AiMessage[]> {
    if (isOnline()) {
      try {
        const messages = await this.remote.getMessages(userId, date);
        await Promise.all(messages.map((m) => this.local.saveMessage(userId, date, m)));
        return messages;
      } catch (err) {
        console.warn("[Composite] Remote getMessages failed:", err);
      }
    }
    return this.local.getMessages(userId, date);
  }

  async saveMessage(userId: string, date: string, message: AiMessage): Promise<void> {
    await this.local.saveMessage(userId, date, message);
    await remoteWrite(
      () => this.remote.saveMessage(userId, date, message),
      () => enqueueSync({
        userId,
        store: "chat_messages",
        operation: "upsert",
        recordId: message.id,
        payload: { date, message },
      }),
    );
  }

  async deleteMessagesForDate(userId: string, date: string): Promise<void> {
    await this.local.deleteMessagesForDate(userId, date);
    await remoteWrite(
      () => this.remote.deleteMessagesForDate(userId, date),
      () => enqueueSync({
        userId,
        store: "chat_messages",
        operation: "delete",
        recordId: `date:${date}`,
      }),
    );
  }
}

// ─── Recent Food Searches ───────────────────────────────────────────────────

export class CompositeRecentFoodSearchRepository implements RecentFoodSearchRepository {
  constructor(
    private local: RecentFoodSearchRepository,
    private remote: RecentFoodSearchRepository,
    private userId: string,
  ) {}

  async getRecentSearches(userId: string): Promise<CommonFoodItem[]> {
    if (isOnline()) {
      try {
        const searches = await this.remote.getRecentSearches(userId);
        await Promise.all(searches.map((s) => this.local.addRecentSearch(userId, s)));
        return searches;
      } catch (err) {
        console.warn("[Composite] Remote getRecentSearches failed:", err);
      }
    }
    return this.local.getRecentSearches(userId);
  }

  async addRecentSearch(userId: string, item: CommonFoodItem): Promise<void> {
    await this.local.addRecentSearch(userId, item);
    await remoteWrite(
      () => this.remote.addRecentSearch(userId, item),
      () => enqueueSync({
        userId,
        store: "recent_food_searches",
        operation: "upsert",
        recordId: item.name,
        payload: item,
      }),
    );
  }

  async clearRecentSearches(userId: string): Promise<void> {
    await this.local.clearRecentSearches(userId);
    await remoteWrite(
      () => this.remote.clearRecentSearches(userId),
      () => enqueueSync({
        userId,
        store: "recent_food_searches",
        operation: "delete",
        recordId: "all",
      }),
    );
  }
}

// ─── AI Response Cache ───────────────────────────────────────────────────────

export class CompositeAiCacheRepository implements AiCacheRepository {
  constructor(
    private local: AiCacheRepository,
    private remote: AiCacheRepository,
    private userId: string,
  ) {}

  async getCachedResponse(userId: string, category: string, queryKey: string): Promise<unknown | null> {
    try {
      const localCached = await this.local.getCachedResponse(userId, category, queryKey);
      if (localCached) return localCached;
    } catch (err) {
      console.warn("[Composite] Local getCachedResponse failed:", err);
    }

    if (isOnline()) {
      try {
        const remoteCached = await this.remote.getCachedResponse(userId, category, queryKey);
        if (remoteCached) {
          await this.local.saveResponse(userId, category, queryKey, remoteCached);
          return remoteCached;
        }
      } catch (err) {
        console.warn("[Composite] Remote getCachedResponse failed:", err);
      }
    }
    return null;
  }

  async saveResponse(userId: string, category: string, queryKey: string, payload: unknown): Promise<void> {
    await this.local.saveResponse(userId, category, queryKey, payload);
    await remoteWrite(
      () => this.remote.saveResponse(userId, category, queryKey, payload),
      () => enqueueSync({
        userId,
        store: "ai_response_cache",
        operation: "upsert",
        recordId: `${category}:${queryKey}`,
        payload: { category, queryKey, payload },
      }),
    );
  }
}
