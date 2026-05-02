import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

/**
 * Checks that the current request has a valid admin session.
 *
 * Uses auth() — the canonical NextAuth v5 API — instead of getToken().
 * getToken() fails on HTTPS/Vercel because NextAuth v5 prefixes the
 * cookie name with __Secure- in production, so the hardcoded
 * "authjs.session-token" lookup always misses.
 *
 * Returns null if auth passes (caller may continue).
 * Returns a 401 NextResponse if auth fails (caller must return it).
 */
export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) {
    console.error("[requireAdmin] No session found");
    return NextResponse.json(
      { error: "Unauthorized. Please log in.", debug: { hasToken: false } },
      { status: 401 }
    );
  }

  if (session.user.role !== "admin") {
    console.error("[requireAdmin] Access denied — role:", session.user.role);
    return NextResponse.json(
      { error: "Forbidden. Admin access required.", debug: { role: session.user.role } },
      { status: 403 }
    );
  }

  return null; // Auth passed ✓
}

type RateBucket = { count: number; windowStart: number };
const rateLimitMap = new Map<string, RateBucket>();

export function rateLimit(
  req: Request,
  options: { limit: number; windowMs: number } = { limit: 30, windowMs: 60_000 }
): NextResponse | null {
  const ip =
    (req.headers as Headers).get("x-forwarded-for")?.split(",")[0]?.trim() ??
    (req.headers as Headers).get("x-real-ip") ??
    "unknown";

  const now = Date.now();
  const bucket = rateLimitMap.get(ip);

  if (!bucket || now - bucket.windowStart > options.windowMs) {
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

  return null;
}
