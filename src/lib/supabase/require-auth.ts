/**
 * require-auth.ts — Reusable server-side auth guard
 *
 * Usage in any API route:
 *   const { user, supabase } = await requireAuth(request);
 *
 * Throws a typed AuthError (caught by the route handler) if the
 * caller is not authenticated. Never passes unauthenticated requests
 * through to business logic.
 *
 * Security note: we use `supabase.auth.getUser()` (not `getSession()`)
 * which always verifies the JWT against Supabase's auth server —
 * it cannot be spoofed with a tampered cookie.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient, User } from "@supabase/supabase-js";

export class AuthError extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "AuthError";
  }
}

export interface AuthContext {
  user: User;
  supabase: SupabaseClient;
}

/**
 * Verifies the request is authenticated via Supabase JWT.
 * Returns the verified User and an authenticated Supabase client.
 * Throws AuthError if not authenticated.
 */
export async function requireAuth(_request?: NextRequest): Promise<AuthContext> {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new AuthError();
  }

  return { user, supabase };
}

/**
 * Wraps a route handler with auth verification.
 * Returns a 401 JSON response automatically on auth failure.
 *
 * Usage:
 *   export const GET = withAuth(async (req, { user, supabase }) => {
 *     return NextResponse.json({ userId: user.id });
 *   });
 */
export function withAuth<T extends unknown[]>(
  handler: (request: NextRequest, ctx: AuthContext, ...args: T) => Promise<NextResponse>,
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      const ctx = await requireAuth(request);
      return await handler(request, ctx, ...args);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json(
          { error: "Unauthorized. Please sign in." },
          { status: 401 },
        );
      }
      console.error("[withAuth] Unexpected error:", err);
      return NextResponse.json(
        { error: "Internal server error" },
        { status: 500 },
      );
    }
  };
}
