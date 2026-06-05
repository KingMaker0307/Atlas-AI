/**
 * IndexedDB Adapter — Repositories Implementation
 *
 * Each class implements a Port interface from @/ports/repositories.
 * This separates the data repository logic from the database connection and storage helpers.
 */

import type {
  UserRepository,
  WorkoutRepository,
  WorkoutPlanRepository,
  NutritionRepository,
  WaterRepository,
  BodyMetricRepository,
  RecoveryRepository,
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
  AiMessage,
  CommonFoodItem,
} from "@/types/domain";
import { getDb, getAll } from "@/lib/storage/db";

export class IndexedDbUserRepository implements UserRepository {
  async getProfile(userId: string): Promise<UserProfile | null> {
    const db = await getDb();
    const record = await (db as any).get("profiles", userId) as (UserProfile & { _userId: string }) | undefined;
    if (!record) return null;
    const { _userId: _, ...profile } = record;
    return profile as UserProfile;
  }

  async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    const db = await getDb();
    await (db as any).put("profiles", { ...profile, _userId: userId }, userId);
  }

  async deleteProfile(userId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("profiles", userId);
  }
}

export class IndexedDbWorkoutRepository implements WorkoutRepository {
  async getWorkouts(userId: string): Promise<Workout[]> {
    const records = await getAll<Workout & { _userId: string }>("workouts", userId);
    return records.map(({ _userId: _, ...w }) => w as Workout)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  }

  async saveWorkout(userId: string, workout: Workout): Promise<void> {
    const db = await getDb();
    await (db as any).put("workouts", { ...workout, _userId: userId }, workout.id);
  }

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("workouts", workoutId);
  }
}

export class IndexedDbWorkoutPlanRepository implements WorkoutPlanRepository {
  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    const records = await getAll<WorkoutPlan & { _userId: string }>("workout_plans", userId);
    return records.map(({ _userId: _, ...p }) => p as WorkoutPlan);
  }

  async savePlan(userId: string, plan: WorkoutPlan): Promise<void> {
    const db = await getDb();
    await (db as any).put("workout_plans", { ...plan, _userId: userId }, plan.id);
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("workout_plans", planId);
  }
}

export class IndexedDbNutritionRepository implements NutritionRepository {
  async getEntries(userId: string, date?: string): Promise<NutritionEntry[]> {
    const records = await getAll<NutritionEntry & { _userId: string }>("nutrition_entries", userId);
    let entries = records.map(({ _userId: _, ...e }) => e as NutritionEntry);
    if (date) {
      entries = entries.filter((e) => e.timestamp.startsWith(date));
    }
    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addEntry(userId: string, entry: NutritionEntry): Promise<void> {
    const db = await getDb();
    await (db as any).put("nutrition_entries", { ...entry, _userId: userId }, entry.id);
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("nutrition_entries", entryId);
  }

  async deleteEntriesForDate(userId: string, date: string): Promise<void> {
    const entries = await this.getEntries(userId, date);
    const db = await getDb();
    await Promise.all(entries.map((e) => (db as any).delete("nutrition_entries", e.id)));
  }
}

export class IndexedDbWaterRepository implements WaterRepository {
  async getLogs(userId: string, date?: string): Promise<WaterLogEntry[]> {
    const records = await getAll<WaterLogEntry & { _userId: string }>("water_logs", userId);
    let logs = records.map(({ _userId: _, ...l }) => l as WaterLogEntry);
    if (date) {
      logs = logs.filter((l) => l.timestamp.startsWith(date));
    }
    return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  async addLog(userId: string, log: WaterLogEntry): Promise<void> {
    const db = await getDb();
    await (db as any).put("water_logs", { ...log, _userId: userId }, log.id);
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("water_logs", logId);
  }
}

export class IndexedDbBodyMetricRepository implements BodyMetricRepository {
  async getMetrics(userId: string): Promise<BodyMetric[]> {
    const records = await getAll<BodyMetric & { _userId: string }>("body_metrics", userId);
    return records.map(({ _userId: _, ...m }) => m as BodyMetric)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async addMetric(userId: string, metric: BodyMetric): Promise<void> {
    const db = await getDb();
    await (db as any).put("body_metrics", { ...metric, _userId: userId }, metric.id);
  }

  async deleteMetric(userId: string, metricId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("body_metrics", metricId);
  }
}

export class IndexedDbRecoveryRepository implements RecoveryRepository {
  async getLogs(userId: string): Promise<RecoveryLog[]> {
    const records = await getAll<RecoveryLog & { _userId: string }>("recovery_logs", userId);
    return records.map(({ _userId: _, ...r }) => r as RecoveryLog)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async addLog(userId: string, log: RecoveryLog): Promise<void> {
    const db = await getDb();
    await (db as any).put("recovery_logs", { ...log, _userId: userId }, log.id);
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    const db = await getDb();
    await (db as any).delete("recovery_logs", logId);
  }
}

export class IndexedDbChatRepository implements ChatRepository {
  async getMessages(userId: string, date: string): Promise<AiMessage[]> {
    const db = await getDb();
    const records = await (db as any).getAll("chat_messages") as (AiMessage & { date: string; _userId: string })[];
    return records
      .filter((r) => r._userId === userId && r.date === date)
      .map(({ date: _d, _userId: _u, ...msg }) => msg as AiMessage)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  async saveMessage(userId: string, date: string, message: AiMessage): Promise<void> {
    const db = await getDb();
    await (db as any).put("chat_messages", { ...message, date, _userId: userId }, message.id);
  }

  async deleteMessagesForDate(userId: string, date: string): Promise<void> {
    const db = await getDb();
    const records = await (db as any).getAll("chat_messages") as (AiMessage & { date: string; _userId: string })[];
    const toDelete = records.filter((r) => r._userId === userId && r.date === date);
    await Promise.all(toDelete.map((msg) => (db as any).delete("chat_messages", msg.id)));
  }
}

export class IndexedDbRecentFoodSearchRepository implements RecentFoodSearchRepository {
  async getRecentSearches(userId: string): Promise<CommonFoodItem[]> {
    const records = await getAll<CommonFoodItem & { id: string; _userId: string }>("recent_food_searches", userId);
    return records.map(({ id: _i, _userId: _u, ...item }) => item as CommonFoodItem);
  }

  async addRecentSearch(userId: string, item: CommonFoodItem): Promise<void> {
    const db = await getDb();
    const id = item.name;
    await (db as any).put("recent_food_searches", { ...item, id, _userId: userId }, id);
  }

  async clearRecentSearches(userId: string): Promise<void> {
    const db = await getDb();
    const records = await (db as any).getAll("recent_food_searches") as (CommonFoodItem & { id: string; _userId: string })[];
    const toDelete = records.filter((r) => r._userId === userId);
    await Promise.all(toDelete.map((r) => (db as any).delete("recent_food_searches", r.id)));
  }
}

export class IndexedDbAiCacheRepository implements AiCacheRepository {
  async getCachedResponse(userId: string, category: string, queryKey: string): Promise<unknown | null> {
    const db = await getDb();
    const records = await (db as any).getAll("ai_response_cache") as { id: string; category: string; queryKey: string; responsePayload: unknown; _userId: string }[];
    const match = records.find((r) => r._userId === userId && r.category === category && r.queryKey === queryKey);
    return match ? match.responsePayload : null;
  }

  async saveResponse(userId: string, category: string, queryKey: string, payload: unknown): Promise<void> {
    const db = await getDb();
    const id = `${category}:${queryKey}`;
    await (db as any).put("ai_response_cache", {
      id,
      category,
      queryKey,
      responsePayload: payload,
      _userId: userId,
    }, id);
  }
}
