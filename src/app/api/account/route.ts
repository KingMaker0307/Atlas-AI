/**
 * DELETE /api/account — GDPR Account Deletion
 *
 * Hard-deletes the authenticated user's account and ALL their data.
 * This is irreversible. ON DELETE CASCADE in Postgres handles all tables.
 *
 * Flow:
 *   1. Verify auth (JWT)
 *   2. Write audit log entry (preserved even after deletion)
 *   3. Delete all user data via Supabase Admin API
 *   4. Return 200
 *
 * Security:
 *   - Only the authenticated user can delete their own account
 *   - Uses service-role key server-side only (never exposed to client)
 *   - Rate-limited to 10 ops/hour (prevents abuse)
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { requireAuth, AuthError } from "@/lib/supabase/require-auth";
import { checkAndRecordRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/supabase/rate-limit";

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  // ── 1. Auth guard ─────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof requireAuth>>["user"];
  let supabase: Awaited<ReturnType<typeof requireAuth>>["supabase"];
  try {
    ({ user, supabase } = await requireAuth(request));
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // ── 2. Rate limit (anti-abuse) ────────────────────────────────────────────
  const rl = await checkAndRecordRateLimit(supabase, user.id, RATE_LIMITS.ACCOUNT_OPS);
  if (!rl.allowed) return rateLimitResponse(rl, RATE_LIMITS.ACCOUNT_OPS.label);

  try {
    // ── 3. Write audit log BEFORE deleting (preserved after cascade) ─────────
    await supabase.from("audit_logs").insert({
      user_id: user.id,
      action: "account_deleted",
      metadata: {
        email: user.email,
        deleted_at: new Date().toISOString(),
      },
    });

    // ── 4. Hard delete via Admin API (cascades all data) ──────────────────────
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceRoleKey) {
      console.error("[DELETE /api/account] Missing Supabase service role env vars");
      return NextResponse.json(
        { error: "Server configuration error. Please contact support." },
        { status: 500 },
      );
    }

    const admin = createAdminClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("[DELETE /api/account] Admin delete failed:", deleteError);
      return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Account permanently deleted." });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unexpected error";
    console.error("[DELETE /api/account] Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
