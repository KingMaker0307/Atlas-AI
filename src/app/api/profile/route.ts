/**
 * Profile API Route — Supabase-backed
 *
 * Replaces the old Google Drive sync route.
 * GET  /api/profile?userId=xxx  → Returns blocked status from Supabase
 * POST /api/profile              → Upserts profile + blocked check
 *
 * Auth: verified via Supabase session (proxy.ts enforces sign-in for all routes)
 * RLS on the DB ensures users can only access their own profiles.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ blocked: false, mode: "supabase" });
    }

    const supabase = await createClient();

    const { data } = await supabase
      .from("profiles")
      .select("has_onboarded")
      .eq("id", userId)
      .single();

    return NextResponse.json({
      blocked: false,
      mode: "supabase",
      hasOnboarded: data?.has_onboarded ?? false,
    });
  } catch (error: any) {
    console.error("GET /api/profile error:", error);
    return NextResponse.json({ blocked: false, mode: "supabase" });
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
