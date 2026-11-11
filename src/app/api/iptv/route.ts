import { NextRequest, NextResponse } from "next/server";

// Cache in memory for serverless function reuse
interface CacheEntry {
  data: any;
  timestamp: number;
}
const cache = new Map<string, CacheEntry>();

const DEFAULT_SERVER = process.env.NEXT_PUBLIC_IPTV_SERVER || "https://fullagora.fun";
const DEFAULT_USER = process.env.NEXT_PUBLIC_IPTV_USERNAME || "kettericasa";
const DEFAULT_PASS = process.env.NEXT_PUBLIC_IPTV_PASSWORD || "510272859";

// Cache durations (in milliseconds)
const TTL_CATEGORIES = 15 * 60 * 1000; // 15 minutes
const TTL_STREAMS = 5 * 60 * 1000;     // 5 minutes
const TTL_SERIES_INFO = 10 * 60 * 1000; // 10 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");
  const categoryId = searchParams.get("category_id");
  const seriesId = searchParams.get("series_id");

  const server = (searchParams.get("server") || DEFAULT_SERVER).replace(/\/+$/, "");
  const username = searchParams.get("username") || DEFAULT_USER;
  const password = searchParams.get("password") || DEFAULT_PASS;

  // Build target Xtream Codes URL
  let targetUrl = `${server}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

  if (action) {
    targetUrl += `&action=${encodeURIComponent(action)}`;
  }
  if (categoryId) {
    targetUrl += `&category_id=${encodeURIComponent(categoryId)}`;
  }
  if (seriesId) {
    targetUrl += `&series_id=${encodeURIComponent(seriesId)}`;
  }

  // Check in-memory cache
  const cacheKey = `${username}:${action || "auth"}:${categoryId || ""}:${seriesId || ""}`;
  const cached = cache.get(cacheKey);
  const now = Date.now();

  let ttl = TTL_STREAMS;
  if (action && action.includes("categories")) ttl = TTL_CATEGORIES;
  if (action === "get_series_info") ttl = TTL_SERIES_INFO;

  if (cached && now - cached.timestamp < ttl) {
    return NextResponse.json(cached.data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "HIT",
      },
    });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      headers: {
        "User-Agent": "IPTVSmarters/1.0.0 (Windows NT 10.0; Win64; x64)",
        Accept: "application/json, text/plain, */*",
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream error: HTTP ${res.status}` },
        { status: res.status }
      );
    }

    const data = await res.json();

    // Cache the result
    cache.set(cacheKey, { data, timestamp: now });

    // Clean old cache entries if map gets too large
    if (cache.size > 200) {
      for (const [k, v] of cache.entries()) {
        if (now - v.timestamp > TTL_CATEGORIES) {
          cache.delete(k);
        }
      }
    }

    return NextResponse.json(data, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        "X-Cache": "MISS",
      },
    });
  } catch (err: any) {
    console.error("IPTV fetch error:", err.message);

    // If fetch failed but we have a stale cache, return it
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "X-Cache": "STALE",
        },
      });
    }

    return NextResponse.json(
      { error: "Failed to connect to IPTV server: " + (err.message || "Unknown error") },
      { status: 502 }
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });
}
