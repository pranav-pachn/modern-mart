/**
 * API Guard — shared security utilities for backend API routes.
 *
 * Provides:
 *  - requireAdminToken()  — validates the internal admin secret header
 *  - rateLimitMap         — simple in-process IP rate limiter (no Redis needed for MVP)
 *  - rateLimit()          — call at the top of any route handler to enforce limits
 */

import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

async function getAuthToken(req: NextRequest) {
  const isSecure = req.url.startsWith("https://");
  const authjsCookieName = isSecure ? "__Secure-authjs.session-token" : "authjs.session-token";
  const nextAuthCookieName = isSecure ? "__Secure-next-auth.session-token" : "next-auth.session-token";

  return (
    await getToken({ req, secret: process.env.AUTH_SECRET, cookieName: authjsCookieName }) ??
    await getToken({ req, secret: process.env.AUTH_SECRET, cookieName: nextAuthCookieName }) ??
    await getToken({ req, secret: process.env.AUTH_SECRET })
  );
}

// ── 1. Admin auth guard ────────────────────────────────────────────────────────
//
// Primary auth: NextAuth JWT role=admin (cookie-backed).
// Dev fallback only: x-admin-secret for local scripting convenience.
//
export async function requireAdminToken(req: NextRequest): Promise<NextResponse | null> {
  const token = await getAuthToken(req);
  if ((token as { role?: string } | null)?.role === "admin") {
    return null;
  }

  const secret = process.env.ADMIN_SECRET;
  if (process.env.NODE_ENV !== "production" && secret) {
    const provided = req.headers.get("x-admin-secret") ?? "";
    if (provided === secret) {
      return null;
    }
  }

  return NextResponse.json(
    { error: "Unauthorized. Admin access required." },
    { status: 401 }
  );
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
