import { NextResponse } from "next/server";

// Simple server-side in-memory cache to prevent rate-limiting 503 blocks
const cache = new Map<string, { data: any; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes cache TTL

function getCachedItem(key: string) {
  const cached = cache.get(key);
  if (cached && cached.expiry > Date.now()) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key); // Cleanup expired
  }
  return null;
}

function setCachedItem(key: string, data: any) {
  cache.set(key, { data, expiry: Date.now() + CACHE_TTL });
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search");
    const barcode = searchParams.get("barcode");
    const country = searchParams.get("country");

    // ─── Case 1: Barcode Lookup Proxy ───
    if (barcode) {
      const cacheKey = `barcode_${barcode.trim()}`;
      const cached = getCachedItem(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      const url = `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode.trim())}.json`;
      let res = await fetch(url, {
        headers: {
          "User-Agent": "AtlasAICoach - Web - Version 1.1 - contact@atlasaicoach.com"
        }
      });
      
      // Fallback to staging domain if primary is rate limited or unavailable
      if (!res.ok && (res.status === 503 || res.status === 429)) {
        console.warn(`Primary OFF barcode lookup failed with status ${res.status}. Falling back to staging...`);
        const fallbackUrl = `https://world.openfoodfacts.net/api/v2/product/${encodeURIComponent(barcode.trim())}.json`;
        res = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": "AtlasAICoach - Web - Version 1.1 - contact@atlasaicoach.com"
          }
        });
      }

      if (!res.ok) {
        return NextResponse.json(
          { error: `Barcode API responded with status ${res.status}` },
          { status: res.status }
        );
      }
      const data = await res.json();
      setCachedItem(cacheKey, data);
      return NextResponse.json(data);
    }

    // ─── Case 2: Branded search Proxy ───
    if (search) {
      const cleanSearch = search.trim().toLowerCase();
      const cacheKey = `search_${cleanSearch}_${country || "world"}`;
      const cached = getCachedItem(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      const countryParam = country && country !== "world" ? `&cc=${country}&lc=${country === "uk" ? "en" : country}` : "";
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=20${countryParam}`;
      
      let res = await fetch(url, {
        headers: {
          "User-Agent": "AtlasAICoach - Web - Version 1.1 - contact@atlasaicoach.com"
        }
      });

      // Fallback to staging domain if primary is rate limited or unavailable
      if (!res.ok && (res.status === 503 || res.status === 429)) {
        console.warn(`Primary OFF search failed with status ${res.status}. Falling back to staging...`);
        const fallbackUrl = `https://world.openfoodfacts.net/cgi/search.pl?search_terms=${encodeURIComponent(search)}&search_simple=1&action=process&json=1&page_size=20${countryParam}`;
        res = await fetch(fallbackUrl, {
          headers: {
            "User-Agent": "AtlasAICoach - Web - Version 1.1 - contact@atlasaicoach.com"
          }
        });
      }

      if (!res.ok) {
        return NextResponse.json(
          { error: `Search API responded with status ${res.status}` },
          { status: res.status }
        );
      }
      const data = await res.json();
      setCachedItem(cacheKey, data);
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: "Missing required query parameters: either 'search' or 'barcode' must be provided." },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("Error in food proxy API route:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
