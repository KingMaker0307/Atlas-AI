/**
 * Profile API Route — Supabase-backed
 *
 * GET  /api/profile?userId=xxx  → Returns blocked status from Supabase
 * GET  /api/profile?email=xxx&content=true  → Returns full backup snapshot for email restore (sandbox only)
 * POST /api/profile              → Upserts profile + blocked check
 *
 * Auth: verified via Supabase session (except for localhost/dev email restoration)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { requireAuth, AuthError } from "@/lib/supabase/require-auth";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");
  const userId = searchParams.get("userId");

  const isLocalhost = process.env.NODE_ENV === "development";

  // If not restoring via email in dev/localhost, enforce security check
  if (!email || !isLocalhost) {
    try {
      await requireAuth(request);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
  }

  try {
    const adminSupabase = await createAdminClient();

    // ── Case 1: Email-based snapshot restoration (sandbox fallback) ────────────────
    if (email) {
      const { data: userData } = await adminSupabase.auth.admin.listUsers();
      const targetUser = userData?.users.find(
        (u) => u.email?.toLowerCase() === email.toLowerCase().trim()
      );

      if (!targetUser) {
        return NextResponse.json({ error: "Profile backup not found." }, { status: 404 });
      }

      const targetUserId = targetUser.id;

      // Query all tables in parallel using the admin bypass
      const [
        profileRes,
        workoutsRes,
        plansRes,
        nutritionRes,
        waterRes,
        metricsRes,
        recoveryRes,
        providersRes,
      ] = await Promise.all([
        adminSupabase.from("profiles").select("*").eq("id", targetUserId).single(),
        adminSupabase.from("workouts").select("*").eq("user_id", targetUserId),
        adminSupabase.from("workout_plans").select("*").eq("user_id", targetUserId),
        adminSupabase.from("nutrition_entries").select("*").eq("user_id", targetUserId),
        adminSupabase.from("water_logs").select("*").eq("user_id", targetUserId),
        adminSupabase.from("body_metrics").select("*").eq("user_id", targetUserId),
        adminSupabase.from("recovery_logs").select("*").eq("user_id", targetUserId),
        adminSupabase.from("ai_providers").select("*").eq("user_id", targetUserId),
      ]);

      const profileData = profileRes.data;

      // Reconstruct and map snake_case rows back into domain camelCase snapshots
      const snapshot = {
        profile: profileData
          ? {
              id: profileData.id,
              name: profileData.name,
              goal: profileData.goal,
              experience: profileData.experience,
              trainingStyle: profileData.training_style,
              daysPerWeek: profileData.days_per_week,
              weightUnit: profileData.weight_unit,
              heightUnit: profileData.height_unit,
              createdAt: profileData.created_at,
              age: profileData.age,
              height: profileData.height,
              weight: profileData.weight,
              targetPhysique: profileData.target_physique,
              dietaryPreferences: profileData.dietary_preferences,
              bodyType: profileData.body_type,
              equipment: profileData.equipment,
              customGoal: profileData.custom_goal,
              injuries: profileData.injuries,
              workoutDuration: profileData.workout_duration,
              gender: profileData.gender,
              activityLevel: profileData.activity_level,
              hasOnboarded: profileData.has_onboarded,
            }
          : null,
        workouts: (workoutsRes.data || []).map((row) => ({
          id: row.id,
          name: row.name,
          startedAt: row.started_at,
          completedAt: row.completed_at,
          durationMinutes: row.duration_minutes,
          fatigueRating: row.fatigue_rating,
          notes: row.notes,
          planId: row.plan_id,
          exercises: row.exercises ?? [],
        })),
        workoutPlans: (plansRes.data || []).map((row) => ({
          id: row.id,
          name: row.name,
          goal: row.goal,
          targetDate: row.target_date,
          routines: row.routines ?? [],
          creatorType: row.creator_type ?? "manual",
          startDay: row.start_day ?? "Monday",
          notes: row.notes,
        })),
        nutritionEntries: (nutritionRes.data || []).map((row) => ({
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
        })),
        waterLogs: (waterRes.data || []).map((row) => ({
          id: row.id,
          amount: row.amount,
          timestamp: row.timestamp,
        })),
        bodyMetrics: (metricsRes.data || []).map((row) => ({
          id: row.id,
          date: row.date,
          bodyweight: row.bodyweight,
          bodyFat: row.body_fat,
          waist: row.waist,
          chest: row.chest,
          hips: row.hips,
          arm: row.arm,
          thigh: row.thigh,
        })),
        recoveryLogs: (recoveryRes.data || []).map((row) => ({
          id: row.id,
          date: row.date,
          sleepHours: row.sleep_hours,
          soreness: row.soreness,
          stress: row.stress,
          readiness: row.readiness,
          energy: row.energy,
          note: row.note,
        })),
        aiProviders: (providersRes.data || []).map((row) => ({
          id: row.id,
          type: row.type,
          label: row.label ?? row.type,
          baseUrl: row.base_url,
          model: row.model ?? "",
          apiKey: row.encrypted_api_key ? { iv: "", data: row.encrypted_api_key } : undefined,
          temperature: row.temperature ?? 0.7,
          contextLength: row.context_length ?? 4096,
          streaming: row.streaming ?? true,
          enabled: row.enabled ?? true,
          lastTestedAt: row.last_tested_at,
          lastStatus: row.last_status,
        })),
        theme: profileData?.theme ?? "system",
        weightUnit: profileData?.weight_unit ?? "lbs",
        heightUnit: profileData?.height_unit ?? "in",
        hasOnboarded: profileData?.has_onboarded ?? false,
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json({ success: true, snapshot });
    }

    // ── Case 2: Standard userId block check ──────────────────────────────────────
    if (!userId) {
      return NextResponse.json({ blocked: false, mode: "supabase" });
    }

    const { data } = await adminSupabase
      .from("profiles")
      .select("has_onboarded")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      blocked: false,
      mode: "supabase",
      hasOnboarded: data?.has_onboarded ?? false,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ blocked: false, mode: "supabase", error: msg });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Verify the caller is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { snapshot } = body;

    if (!snapshot?.profile) {
      return NextResponse.json({ success: true, blocked: false, mode: "supabase" });
    }

    const profile = snapshot.profile;

    const { error } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        name: profile.name ?? "",
        goal: profile.goal,
        experience: profile.experience,
        gender: profile.gender,
        age: profile.age,
        height: profile.height,
        weight: profile.weight,
        weight_unit: profile.weightUnit ?? "lbs",
        height_unit: profile.heightUnit ?? "in",
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
        has_onboarded: true,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

    if (error) {
      console.error("Profile upsert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, blocked: false, mode: "supabase" });
  } catch (error: any) {
    console.error("POST /api/profile error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to synchronize profile" },
      { status: 500 },
    );
  }
}
