import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

async function getAuthToken(req: NextRequest) {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  return getToken({ req, secret });
}

export async function requireAdminToken(req: NextRequest): Promise<NextResponse | null> {
  const token = await getAuthToken(req);
  console.log("[requireAdminToken] Token:", JSON.stringify(token, null, 2));
  if ((token as { role?: string } | null)?.role === "admin") {
    return null;
  }

  console.error("[requireAdminToken] Auth failed - token exists:", !!token, "role:", (token as any)?.role);
  return NextResponse.json(
    { error: "Unauthorized. Admin access required.", debug: { hasToken: !!token, role: (token as any)?.role } },
    { status: 401 }
  );
}

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
