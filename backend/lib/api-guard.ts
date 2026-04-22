/**
 * API Guard — shared security utilities for backend API routes.
 *
 * Provides:
 *  - requireAdminToken()  — validates the internal admin secret header
 *  - rateLimitMap         — simple in-process IP rate limiter (no Redis needed for MVP)
 *  - rateLimit()          — call at the top of any route handler to enforce limits
 */

import { NextRequest, NextResponse } from "next/server";

// ── 1. Admin auth guard ────────────────────────────────────────────────────────
//
// Admin-mutating routes (POST/PUT/DELETE on products, full order list) must
// include the header:  x-admin-secret: <ADMIN_SECRET env var>
//
export function requireAdminToken(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;

  // If no secret is configured we skip the check in development only
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[api-guard] ADMIN_SECRET env var is not set — rejecting request.");
      return NextResponse.json(
        { error: "Server is not configured for admin access." },
        { status: 503 }
      );
    }
    // dev: allow without a secret so devs don't get blocked during local work
    return null;
  }

  const provided = req.headers.get("x-admin-secret") ?? "";
  if (provided !== secret) {
    return NextResponse.json(
      { error: "Unauthorized. Admin access required." },
      { status: 401 }
    );
  }

  return null; // null = authorized, continue
}

// ── 2. In-memory rate limiter ──────────────────────────────────────────────────
//
// Keeps a Map of { ip → { count, windowStart } }.
// Resets the counter after `windowMs` milliseconds.
//
// NOTE: This is per-instance memory — fine for a single-server MVP.
//       For multi-instance deployments, swap this for an Upstash Redis limiter.
//
type RateBucket = { count: number; windowStart: number };
const rateLimitMap = new Map<string, RateBucket>();

export function rateLimit(
  req: NextRequest,
  options: { limit: number; windowMs: number } = { limit: 30, windowMs: 60_000 }
): NextResponse | null {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (!bucket || now - bucket.windowStart > options.windowMs) {
    // New window
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return null;
  }

  bucket.count += 1;

  if (bucket.count > options.limit) {
    const retryAfterSec = Math.ceil((options.windowMs - (now - bucket.windowStart)) / 1000);
    return NextResponse.json(
      { error: "Too many requests. Please slow down." },
      {
        status: 429,
        headers: {
          "Retry-After": String(retryAfterSec),
          "X-RateLimit-Limit": String(options.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  return null; // null = within limit, continue
}
