/**
 * Repository Port Interfaces — Hexagonal Architecture
 *
 * These interfaces define WHAT the application needs from its data layer.
 * They are technology-agnostic — the app never imports Supabase directly;
 * it imports these ports. Adapters (e.g. SupabaseNutritionRepository)
 * implement these ports and can be swapped without touching business logic.
 */

import type {
  UserProfile,
  Workout,
  WorkoutPlan,
  NutritionEntry,
  WaterLogEntry,
  BodyMetric,
  RecoveryLog,
  AiProviderSettings,
} from "@/types/domain";

// ─── User / Profile ────────────────────────────────────────────────────────
export interface UserRepository {
  getProfile(userId: string): Promise<UserProfile | null>;
  saveProfile(userId: string, profile: UserProfile): Promise<void>;
  deleteProfile(userId: string): Promise<void>;
}

// ─── Workouts ───────────────────────────────────────────────────────────────
export interface WorkoutRepository {
  getWorkouts(userId: string, limit?: number): Promise<Workout[]>;
  saveWorkout(userId: string, workout: Workout): Promise<void>;
  deleteWorkout(userId: string, workoutId: string): Promise<void>;
}

// ─── Workout Plans ──────────────────────────────────────────────────────────
export interface WorkoutPlanRepository {
  getPlans(userId: string): Promise<WorkoutPlan[]>;
  savePlan(userId: string, plan: WorkoutPlan): Promise<void>;
  deletePlan(userId: string, planId: string): Promise<void>;
}

// ─── Nutrition ──────────────────────────────────────────────────────────────
export interface NutritionRepository {
  getEntries(userId: string, date?: string): Promise<NutritionEntry[]>;
  addEntry(userId: string, entry: NutritionEntry): Promise<void>;
  deleteEntry(userId: string, entryId: string): Promise<void>;
  deleteEntriesForDate(userId: string, date: string): Promise<void>;
}

// ─── Water ──────────────────────────────────────────────────────────────────
export interface WaterRepository {
  getLogs(userId: string, date?: string): Promise<WaterLogEntry[]>;
  addLog(userId: string, log: WaterLogEntry): Promise<void>;
  deleteLog(userId: string, logId: string): Promise<void>;
}

// ─── Body Metrics ───────────────────────────────────────────────────────────
export interface BodyMetricRepository {
  getMetrics(userId: string): Promise<BodyMetric[]>;
  addMetric(userId: string, metric: BodyMetric): Promise<void>;
  deleteMetric(userId: string, metricId: string): Promise<void>;
}

// ─── Recovery Logs ──────────────────────────────────────────────────────────
export interface RecoveryRepository {
  getLogs(userId: string): Promise<RecoveryLog[]>;
  addLog(userId: string, log: RecoveryLog): Promise<void>;
  deleteLog(userId: string, logId: string): Promise<void>;
}

// ─── AI Provider Settings ───────────────────────────────────────────────────
export interface AiProviderRepository {
  getProviders(userId: string): Promise<AiProviderSettings[]>;
  saveProvider(userId: string, provider: AiProviderSettings): Promise<void>;
  deleteProvider(userId: string, providerId: string): Promise<void>;
  setActiveProvider(userId: string, providerId: string): Promise<void>;
}

// ─── Subscription ──────────────────────────────────────────────────────────
export interface SubscriptionRepository {
  getPlan(userId: string): Promise<"free" | "byok" | "pro">;
  checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number }>;
  incrementUsage(userId: string): Promise<void>;
}
