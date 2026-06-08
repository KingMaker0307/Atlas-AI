/**
 * Supabase Adapter — All Repositories
 *
 * Single file containing all Supabase adapter implementations.
 * Each class implements a Port interface from @/ports/repositories.
 * Swap the database by writing a new adapter file — zero changes to business logic.
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

// ─── Rate limit constants ───────────────────────────────────────────────────
const RATE_LIMIT_REQUESTS_PER_HOUR = 60;

// ─── User / Profile ─────────────────────────────────────────────────────────

export class SupabaseUserRepository implements UserRepository {
  constructor(private supabase: SupabaseClient) {}

  async getProfile(userId: string): Promise<UserProfile | null> {
    const { data, error } = await this.supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (error || !data) return null;
    return {
      id: data.id,
      name: data.name,
      goal: data.goal,
      experience: data.experience,
      trainingStyle: data.training_style,
      daysPerWeek: data.days_per_week,
      weightUnit: data.weight_unit,
      heightUnit: data.height_unit,
      createdAt: data.created_at,
      age: data.age,
      height: data.height,
      weight: data.weight,
      targetPhysique: data.target_physique,
      dietaryPreferences: data.dietary_preferences,
      bodyType: data.body_type,
      equipment: data.equipment,
      customGoal: data.custom_goal,
      injuries: data.injuries,
      workoutDuration: data.workout_duration,
      gender: data.gender,
      activityLevel: data.activity_level,
      hasOnboarded: data.has_onboarded,
      aiSetupDismissed: data.ai_setup_dismissed,
      theme: data.theme,
      guidedMode: data.guided_mode,
      // Encryption password for AI provider API keys — enables cross-device decryption
      deviceSecret: data.device_secret ?? undefined,
    } as UserProfile;
  }

  async saveProfile(userId: string, profile: UserProfile): Promise<void> {
    const payload: any = {
      id: userId,
      name: profile.name ?? "",
      goal: profile.goal,
      experience: profile.experience,
      gender: profile.gender,
      age: profile.age,
      height: profile.height,
      weight: profile.weight,
      weight_unit: profile.weightUnit,
      height_unit: profile.heightUnit,
      activity_level: profile.activityLevel,
      dietary_preferences: profile.dietaryPreferences,
      equipment: profile.equipment,
      training_style: profile.trainingStyle,
      days_per_week: profile.daysPerWeek,
      target_physique: profile.targetPhysique,
      body_type: profile.bodyType,
      custom_goal: profile.customGoal,
      injuries: profile.injuries,
      workout_duration: profile.workoutDuration,
      theme: profile.theme ?? "system",
      guided_mode: profile.guidedMode ?? true,
      has_onboarded: true,
      ai_setup_dismissed: profile.aiSetupDismissed ?? false,
      updated_at: new Date().toISOString(),
      // Persist encryption password so API keys can be decrypted on any device
      ...(profile.deviceSecret ? { device_secret: profile.deviceSecret } : {}),
    };

    const { error } = await this.supabase.from("profiles").upsert(payload, { onConflict: "id" });
    if (error) {
      if (error.code === "PGRST204" || error.message?.includes("ai_setup_dismissed")) {
        console.warn("[SupabaseUserRepository] 'ai_setup_dismissed' column not found in schema cache. Retrying upsert without it.");
        const { ai_setup_dismissed, ...fallbackPayload } = payload;
        const { error: retryError } = await this.supabase.from("profiles").upsert(fallbackPayload, { onConflict: "id" });
        if (retryError) throw retryError;
      } else {
        throw error;
      }
    }
  }

  async deleteProfile(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("profiles")
      .delete()
      .eq("id", userId);
    if (error) throw error;
  }
}

// ─── Workouts ────────────────────────────────────────────────────────────────

export class SupabaseWorkoutRepository implements WorkoutRepository {
  constructor(private supabase: SupabaseClient) {}

  async getWorkouts(userId: string, limit = 50): Promise<Workout[]> {
    const { data, error } = await this.supabase
      .from("workouts")
      .select("*")
      .eq("user_id", userId)
      .order("started_at", { ascending: false })
      .range(0, limit - 1);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      startedAt: row.started_at,
      completedAt: row.completed_at,
      durationMinutes: row.duration_minutes,
      fatigueRating: row.fatigue_rating,
      notes: row.notes,
      planId: row.plan_id,
      exercises: row.exercises ?? [],
    }));
  }

  async saveWorkout(userId: string, workout: Workout): Promise<void> {
    const { error } = await this.supabase.from("workouts").upsert(
      {
        id: workout.id,
        user_id: userId,
        name: workout.name,
        started_at: workout.startedAt,
        completed_at: workout.completedAt,
        duration_minutes: workout.durationMinutes,
        fatigue_rating: workout.fatigueRating,
        notes: workout.notes,
        plan_id: workout.planId,
        exercises: workout.exercises,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deleteWorkout(userId: string, workoutId: string): Promise<void> {
    const { error } = await this.supabase
      .from("workouts")
      .delete()
      .eq("id", workoutId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── Workout Plans ───────────────────────────────────────────────────────────

export class SupabaseWorkoutPlanRepository implements WorkoutPlanRepository {
  constructor(private supabase: SupabaseClient) {}

  async getPlans(userId: string): Promise<WorkoutPlan[]> {
    const { data, error } = await this.supabase
      .from("workout_plans")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      goal: row.goal,
      targetDate: row.target_date,
      routines: row.routines ?? [],
      customExercises: row.custom_exercises ?? [],
      creatorType: row.creator_type ?? "manual",
      startDay: row.start_day ?? "Monday",
      notes: row.notes,
    }));
  }

  async savePlan(userId: string, plan: WorkoutPlan): Promise<void> {
    const { error } = await this.supabase.from("workout_plans").upsert(
      {
        id: plan.id,
        user_id: userId,
        name: plan.name,
        goal: plan.goal,
        target_date: plan.targetDate,
        routines: plan.routines,
        custom_exercises: plan.customExercises ?? [],
        creator_type: plan.creatorType ?? "manual",
        start_day: plan.startDay ?? "Monday",
        notes: plan.notes,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deletePlan(userId: string, planId: string): Promise<void> {
    const { error } = await this.supabase
      .from("workout_plans")
      .delete()
      .eq("id", planId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── Nutrition ───────────────────────────────────────────────────────────────

export class SupabaseNutritionRepository implements NutritionRepository {
  constructor(private supabase: SupabaseClient) {}

  async getEntries(userId: string, date?: string): Promise<NutritionEntry[]> {
    let query = this.supabase
      .from("nutrition_entries")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (date) {
      // Filter entries for a specific date (YYYY-MM-DD)
      query = query
        .gte("timestamp", `${date}T00:00:00.000Z`)
        .lt("timestamp", `${date}T23:59:59.999Z`);
    }

    const { data, error } = await query.range(0, 49);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      name: row.name,
      calories: row.calories ?? 0,
      protein: row.protein ?? 0,
      carbs: row.carbs ?? 0,
      fat: row.fat ?? 0,
      fiber: row.fiber ?? 0,
      sugar: row.sugar ?? 0,
      sodium: row.sodium ?? 0,
      potassium: row.potassium ?? 0,
      vitaminC: row.vitamin_c ?? 0,
      calcium: row.calcium ?? 0,
      iron: row.iron ?? 0,
      meal: row.meal ?? "snack",
      servingSize: row.serving_size ?? 1,
      servingUnit: row.serving_unit ?? "serving",
      timestamp: row.timestamp,
    }));
  }

  async addEntry(userId: string, entry: NutritionEntry): Promise<void> {
    const { error } = await this.supabase.from("nutrition_entries").upsert(
      {
        id: entry.id,
        user_id: userId,
        name: entry.name,
        calories: entry.calories,
        protein: entry.protein,
        carbs: entry.carbs,
        fat: entry.fat,
        fiber: entry.fiber,
        sugar: entry.sugar,
        sodium: entry.sodium,
        potassium: entry.potassium,
        vitamin_c: entry.vitaminC,
        calcium: entry.calcium,
        iron: entry.iron,
        meal: entry.meal,
        serving_size: entry.servingSize,
        serving_unit: entry.servingUnit,
        timestamp: entry.timestamp,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deleteEntry(userId: string, entryId: string): Promise<void> {
    const { error } = await this.supabase
      .from("nutrition_entries")
      .delete()
      .eq("id", entryId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async deleteEntriesForDate(userId: string, date: string): Promise<void> {
    const { error } = await this.supabase
      .from("nutrition_entries")
      .delete()
      .eq("user_id", userId)
      .gte("timestamp", `${date}T00:00:00.000Z`)
      .lt("timestamp", `${date}T23:59:59.999Z`);
    if (error) throw error;
  }
}

// ─── Water ───────────────────────────────────────────────────────────────────

export class SupabaseWaterRepository implements WaterRepository {
  constructor(private supabase: SupabaseClient) {}

  async getLogs(userId: string, date?: string): Promise<WaterLogEntry[]> {
    let query = this.supabase
      .from("water_logs")
      .select("*")
      .eq("user_id", userId)
      .order("timestamp", { ascending: false });

    if (date) {
      query = query
        .gte("timestamp", `${date}T00:00:00.000Z`)
        .lt("timestamp", `${date}T23:59:59.999Z`);
    }

    const { data, error } = await query.limit(200);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      amount: row.amount,
      timestamp: row.timestamp,
    }));
  }

  async addLog(userId: string, log: WaterLogEntry): Promise<void> {
    const { error } = await this.supabase.from("water_logs").upsert(
      {
        id: log.id,
        user_id: userId,
        amount: log.amount,
        timestamp: log.timestamp,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    const { error } = await this.supabase
      .from("water_logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── Body Metrics ─────────────────────────────────────────────────────────────

export class SupabaseBodyMetricRepository implements BodyMetricRepository {
  constructor(private supabase: SupabaseClient) {}

  async getMetrics(userId: string): Promise<BodyMetric[]> {
    const { data, error } = await this.supabase
      .from("body_metrics")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(365);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      bodyweight: row.bodyweight,
      bodyFat: row.body_fat,
      waist: row.waist,
      chest: row.chest,
      hips: row.hips,
      arm: row.arm,
      thigh: row.thigh,
    }));
  }

  async addMetric(userId: string, metric: BodyMetric): Promise<void> {
    const { error } = await this.supabase.from("body_metrics").upsert(
      {
        id: metric.id,
        user_id: userId,
        date: metric.date,
        bodyweight: metric.bodyweight,
        body_fat: metric.bodyFat,
        waist: metric.waist,
        chest: metric.chest,
        hips: metric.hips,
        arm: metric.arm,
        thigh: metric.thigh,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deleteMetric(userId: string, metricId: string): Promise<void> {
    const { error } = await this.supabase
      .from("body_metrics")
      .delete()
      .eq("id", metricId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── Recovery Logs ────────────────────────────────────────────────────────────

export class SupabaseRecoveryRepository implements RecoveryRepository {
  constructor(private supabase: SupabaseClient) {}

  async getLogs(userId: string): Promise<RecoveryLog[]> {
    const { data, error } = await this.supabase
      .from("recovery_logs")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false })
      .limit(365);
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      date: row.date,
      sleepHours: row.sleep_hours,
      soreness: row.soreness,
      stress: row.stress,
      readiness: row.readiness,
      energy: row.energy,
      note: row.note,
    }));
  }

  async addLog(userId: string, log: RecoveryLog): Promise<void> {
    const { error } = await this.supabase.from("recovery_logs").upsert(
      {
        id: log.id,
        user_id: userId,
        date: log.date,
        sleep_hours: log.sleepHours,
        soreness: log.soreness,
        stress: log.stress,
        readiness: log.readiness,
        energy: log.energy,
        note: log.note,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deleteLog(userId: string, logId: string): Promise<void> {
    const { error } = await this.supabase
      .from("recovery_logs")
      .delete()
      .eq("id", logId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── AI Providers ─────────────────────────────────────────────────────────────

export class SupabaseAiProviderRepository implements AiProviderRepository {
  constructor(private supabase: SupabaseClient) {}

  async getProviders(userId: string): Promise<AiProviderSettings[]> {
    const { data, error } = await this.supabase
      .from("ai_providers")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => {
      let apiKeyObj: any = undefined;
      if (row.encrypted_api_key) {
        try {
          const parsed = JSON.parse(row.encrypted_api_key);
          if (parsed && typeof parsed === "object" && "iv" in parsed && "data" in parsed) {
            apiKeyObj = parsed;
          } else {
            apiKeyObj = { iv: "", data: row.encrypted_api_key };
          }
        } catch {
          apiKeyObj = { iv: "", data: row.encrypted_api_key };
        }
      }
      return {
        id: row.id,
        type: row.type,
        label: row.label ?? row.type,
        baseUrl: row.base_url,
        model: row.model ?? "",
        apiKey: apiKeyObj,
        temperature: row.temperature ?? 0.7,
        contextLength: row.context_length ?? 4096,
        streaming: row.streaming ?? true,
        enabled: row.enabled ?? true,
        lastTestedAt: row.last_tested_at,
        lastStatus: row.last_status,
      };
    });
  }

  async saveProvider(userId: string, provider: AiProviderSettings): Promise<void> {
    const { error } = await this.supabase.from("ai_providers").upsert(
      {
        id: provider.id,
        user_id: userId,
        type: provider.type,
        label: provider.label,
        base_url: provider.baseUrl,
        model: provider.model,
        encrypted_api_key: provider.apiKey ? JSON.stringify(provider.apiKey) : null,
        temperature: provider.temperature,
        context_length: provider.contextLength,
        streaming: provider.streaming,
        enabled: provider.enabled,
        last_tested_at: provider.lastTestedAt,
        last_status: provider.lastStatus,
      },
      { onConflict: "id" },
    );
    if (error) throw error;
  }

  async deleteProvider(userId: string, providerId: string): Promise<void> {
    const { error } = await this.supabase
      .from("ai_providers")
      .delete()
      .eq("id", providerId)
      .eq("user_id", userId);
    if (error) throw error;
  }

  async setActiveProvider(userId: string, providerId: string): Promise<void> {
    // Reset all to inactive, then set the active one
    await this.supabase
      .from("ai_providers")
      .update({ is_active: false })
      .eq("user_id", userId);

    const { error } = await this.supabase
      .from("ai_providers")
      .update({ is_active: true })
      .eq("id", providerId)
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── Subscription / Rate Limiting ─────────────────────────────────────────────

export class SupabaseSubscriptionRepository implements SubscriptionRepository {
  constructor(private supabase: SupabaseClient) {}

  async getPlan(userId: string): Promise<"free" | "byok" | "pro"> {
    const { data } = await this.supabase
      .from("subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (!data) return "byok"; // Default during testing phase — everyone gets BYOK
    return (data.plan as "free" | "byok" | "pro") ?? "byok";
  }

  async checkRateLimit(
    userId: string,
  ): Promise<{ allowed: boolean; remaining: number }> {
    const windowStart = new Date();
    windowStart.setHours(windowStart.getHours() - 1);

    const { count } = await this.supabase
      .from("ai_usage_logs")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", windowStart.toISOString());

    const used = count ?? 0;
    const remaining = Math.max(0, RATE_LIMIT_REQUESTS_PER_HOUR - used);
    return { allowed: remaining > 0, remaining };
  }

  async incrementUsage(userId: string): Promise<void> {
    await this.supabase
      .from("ai_usage_logs")
      .insert({ user_id: userId });
  }
}

// ─── Day-Based Chat Messages ────────────────────────────────────────────────

export class SupabaseChatRepository implements ChatRepository {
  constructor(private supabase: SupabaseClient) {}

  async getMessages(userId: string, date: string): Promise<AiMessage[]> {
    const { data, error } = await this.supabase
      .from("chat_messages")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data || []).map((row) => ({
      id: row.id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  }

  async saveMessage(userId: string, date: string, message: AiMessage): Promise<void> {
    const { error } = await this.supabase.from("chat_messages").upsert(
      {
        id: message.id,
        user_id: userId,
        role: message.role,
        content: message.content,
        date: date,
        created_at: message.createdAt,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  async deleteMessagesForDate(userId: string, date: string): Promise<void> {
    const { error } = await this.supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)
      .eq("date", date);
    if (error) throw error;
  }
}

// ─── Recent Food Searches ───────────────────────────────────────────────────

export class SupabaseRecentFoodSearchRepository implements RecentFoodSearchRepository {
  constructor(private supabase: SupabaseClient) {}

  async getRecentSearches(userId: string): Promise<CommonFoodItem[]> {
    const { data, error } = await this.supabase
      .from("recent_food_searches")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data || []).map((row) => ({
      name: row.name,
      brand: row.brand,
      calories: row.calories ?? 0,
      protein: row.protein ?? 0,
      carbs: row.carbs ?? 0,
      fat: row.fat ?? 0,
      fiber: row.fiber ?? 0,
      sugar: row.sugar ?? 0,
      sodium: row.sodium ?? 0,
      potassium: row.potassium ?? 0,
      vitaminC: row.vitamin_c ?? 0,
      calcium: row.calcium ?? 0,
      iron: row.iron ?? 0,
      servingUnit: row.serving_unit ?? "serving",
      servingWeight: row.serving_weight,
    }));
  }

  async addRecentSearch(userId: string, item: CommonFoodItem): Promise<void> {
    const { error } = await this.supabase.from("recent_food_searches").upsert(
      {
        id: `${userId}:${item.name}`,
        user_id: userId,
        name: item.name,
        brand: item.brand,
        calories: item.calories,
        protein: item.protein,
        carbs: item.carbs,
        fat: item.fat,
        fiber: item.fiber,
        sugar: item.sugar,
        sodium: item.sodium,
        potassium: item.potassium,
        vitamin_c: item.vitaminC,
        calcium: item.calcium,
        iron: item.iron,
        serving_unit: item.servingUnit,
        serving_weight: item.servingWeight,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }

  async clearRecentSearches(userId: string): Promise<void> {
    const { error } = await this.supabase
      .from("recent_food_searches")
      .delete()
      .eq("user_id", userId);
    if (error) throw error;
  }
}

// ─── AI Response Cache ───────────────────────────────────────────────────────

export class SupabaseAiCacheRepository implements AiCacheRepository {
  constructor(private supabase: SupabaseClient) {}

  async getCachedResponse(userId: string, category: string, queryKey: string): Promise<unknown | null> {
    const { data, error } = await this.supabase
      .from("ai_response_cache")
      .select("response_payload")
      .eq("user_id", userId)
      .eq("category", category)
      .eq("query_key", queryKey)
      .maybeSingle();
    if (error) throw error;
    return data ? data.response_payload : null;
  }

  async saveResponse(userId: string, category: string, queryKey: string, payload: unknown): Promise<void> {
    const { error } = await this.supabase.from("ai_response_cache").upsert(
      {
        id: `${userId}:${category}:${queryKey}`,
        user_id: userId,
        category,
        query_key: queryKey,
        response_payload: payload,
      },
      { onConflict: "id" }
    );
    if (error) throw error;
  }
}
