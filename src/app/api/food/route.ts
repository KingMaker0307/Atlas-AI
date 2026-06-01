/**
 * Food API Route — Authenticated + Rate-Limited Proxy
 *
 * GET /api/food?search=chicken  → OpenFoodFacts search proxy
 * GET /api/food?barcode=123456  → OpenFoodFacts barcode lookup
 *
 * Auth: Supabase JWT verified server-side (requireAuth)
 * Rate limit: 200 requests/hour per authenticated user
 * Cache: 10-minute in-memory cache per query (reduces upstream calls)
 *
 * Without auth, returns 401. Without rate limit headroom, returns 429.
 */

import { NextRequest, NextResponse } from "next/server";
import { requireAuth, AuthError } from "@/lib/supabase/require-auth";
import { checkAndRecordRateLimit, rateLimitResponse, RATE_LIMITS } from "@/lib/supabase/rate-limit";

// ─── Server-side response cache (prevents upstream rate-limit 503s) ────────────
const cache = new Map<string, { data: unknown; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && entry.expiry > Date.now()) return entry.data;
  if (entry) cache.delete(key);
  return null;
}
function setCache(key: string, data: unknown): void {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

// ─── Upstream fetch with staging fallback ─────────────────────────────────────
async function fetchWithFallback(primary: string, fallback: string): Promise<Response> {
  const headers = { "User-Agent": "AtlasAICoach - Web - Version 1.1 - contact@atlasaicoach.com" };
  let res = await fetch(primary, { headers });
  if (!res.ok && (res.status === 503 || res.status === 429)) {
    console.warn(`[food] Primary failed (${res.status}), falling back to staging`);
    res = await fetch(fallback, { headers });
  }
  return res;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // ── 1. Auth guard ────────────────────────────────────────────────────────────
  let user: Awaited<ReturnType<typeof requireAuth>>["user"];
  let supabase: Awaited<ReturnType<typeof requireAuth>>["supabase"];
  try {
    ({ user, supabase } = await requireAuth(request));
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: "Unauthorized. Please sign in." }, { status: 401 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  // ── 2. Rate limit ─────────────────────────────────────────────────────────────
  const rl = await checkAndRecordRateLimit(supabase, user.id, RATE_LIMITS.FOOD_SEARCH);
  if (!rl.allowed) {
    return rateLimitResponse(rl, RATE_LIMITS.FOOD_SEARCH.label);
  }

  // ── 3. Business logic ─────────────────────────────────────────────────────────
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const barcode = searchParams.get("barcode");
    const country = searchParams.get("country");

    // Case 1: Barcode lookup
    if (barcode) {
      const key = `barcode_${barcode.trim()}`;
      const cached = getCached(key);
      if (cached) return NextResponse.json(cached);

      const barcodeEnc = encodeURIComponent(barcode.trim());
      const res = await fetchWithFallback(
        `https://world.openfoodfacts.org/api/v2/product/${barcodeEnc}.json`,
        `https://world.openfoodfacts.net/api/v2/product/${barcodeEnc}.json`,
      );
      if (!res.ok) {
        return NextResponse.json({ error: `Barcode API responded with ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      setCache(key, data);
      return NextResponse.json(data);
    }

    // Case 2: Search
    if (search) {
      const clean = search.trim().toLowerCase();
      const key = `search_${clean}_${country ?? "world"}`;
      const cached = getCached(key);
      if (cached) return NextResponse.json(cached);

      const countryParam = country && country !== "world"
        ? `&cc=${country}&lc=${country === "uk" ? "en" : country}`
        : "";
      const query = `search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=20${countryParam}`;
      const res = await fetchWithFallback(
        `https://world.openfoodfacts.org/cgi/search.pl?${query}`,
        `https://world.openfoodfacts.net/cgi/search.pl?${query}`,
      );
      if (!res.ok) {
        return NextResponse.json({ error: `Search API responded with ${res.status}` }, { status: res.status });
      }
      const data = await res.json();
      setCache(key, data);
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Missing required query parameters: 'search' or 'barcode'" },
      { status: 400 },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error";
    console.error("[food] Error:", error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
