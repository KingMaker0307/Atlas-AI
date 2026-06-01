/**
 * rate-limit.ts — Supabase-backed sliding window rate limiter
 *
 * Uses the existing `ai_usage_logs` table which has:
 *   - user_id UUID
 *   - created_at TIMESTAMPTZ
 *   - Index: (user_id, created_at DESC)
 *
 * Strategy: count rows in the last [windowSeconds] seconds.
 * If count >= limit → reject. Otherwise → insert + allow.
 *
 * This is a "leaky bucket" style counter — no Redis required.
 * The table auto-cleans via the scheduled DELETE cron in schema.sql.
 *
 * Security: always call this AFTER requireAuth() — userId must be
 * the verified auth.uid(), never a client-supplied value.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export interface RateLimitConfig {
  /** Max requests allowed in the window */
  limit: number;
  /** Window size in seconds (default: 3600 = 1 hour) */
  windowSeconds?: number;
  /** Human-readable label for error messages */
  label?: string;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
}

/**
 * Check and record a rate-limited request.
 * Returns { allowed: false } if the user has exceeded their quota.
 * Inserts a usage log row if allowed.
 */
export async function checkAndRecordRateLimit(
  supabase: SupabaseClient,
  userId: string,
  config: RateLimitConfig,
): Promise<RateLimitResult> {
  const windowSeconds = config.windowSeconds ?? 3600;
  const windowStart = new Date(Date.now() - windowSeconds * 1000).toISOString();

  // Count requests in the current window
  const { count, error: countError } = await supabase
    .from("ai_usage_logs")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  if (countError) {
    // On DB error, fail open (don't block the user) — log for observability
    console.error("[RateLimit] Count query failed:", countError);
    return { allowed: true, remaining: config.limit, resetAt: new Date() };
  }

  const used = count ?? 0;
  const remaining = Math.max(0, config.limit - used);
  const resetAt = new Date(Date.now() + windowSeconds * 1000);

  if (used >= config.limit) {
    return { allowed: false, remaining: 0, resetAt };
  }

  // Record this request
  const { error: insertError } = await supabase
    .from("ai_usage_logs")
    .insert({ user_id: userId });

  if (insertError) {
    console.error("[RateLimit] Insert failed:", insertError);
    // Still allow — don't block on write failure
  }

  return { allowed: true, remaining: remaining - 1, resetAt };
}

/**
 * Returns a 429 NextResponse with Retry-After header.
 * Call this when checkAndRecordRateLimit returns { allowed: false }.
 */
export function rateLimitResponse(
  result: RateLimitResult,
  label = "requests",
): NextResponse {
  const retryAfterSecs = Math.ceil((result.resetAt.getTime() - Date.now()) / 1000);
  return NextResponse.json(
    {
      error: `Rate limit exceeded. Too many ${label} — please try again later.`,
      retryAfter: retryAfterSecs,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(retryAfterSecs),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": result.resetAt.toISOString(),
      },
    },
  );
}

// ─── Pre-configured limits ────────────────────────────────────────────────────

export const RATE_LIMITS = {
  /** Food search / barcode lookups — 200/hour */
  FOOD_SEARCH: { limit: 200, windowSeconds: 3600, label: "food lookups" } satisfies RateLimitConfig,
  /** AI coaching messages — 60/hour */
  AI_CHAT: { limit: 60, windowSeconds: 3600, label: "AI requests" } satisfies RateLimitConfig,
  /** Account operations — 10/hour (delete, export) */
  ACCOUNT_OPS: { limit: 10, windowSeconds: 3600, label: "account operations" } satisfies RateLimitConfig,
} as const;
