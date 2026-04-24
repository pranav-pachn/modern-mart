import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// Simple in-memory rate limiter for AI route
const aiRateLimit = new Map<string, { count: number; expires: number }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

async function hasAdminAccess(req: NextRequest): Promise<boolean> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  if ((token as { role?: string } | null)?.role === "admin") {
    return true;
  }

  // Keep local scripting fallback in non-production only.
  const secret = process.env.ADMIN_SECRET || "";
  const provided = req.headers.get("x-admin-secret") ?? "";
  return process.env.NODE_ENV !== "production" && secret.length > 0 && provided === secret;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // Handle CORS Preflight for all protected/rate-limited routes
  if (method === "OPTIONS") {
    return NextResponse.next();
  }

  // 1. Rate Limiting for /api/ai
  if (pathname.startsWith("/api/ai")) {
    const ip = req.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 10; // Max 10 requests per minute

    const record = aiRateLimit.get(ip);
    if (!record || record.expires < now) {
      aiRateLimit.set(ip, { count: 1, expires: now + windowMs });
    } else {
      if (record.count >= maxRequests) {
        return NextResponse.json(
          { error: "Too many requests. Please try again later." },
          { status: 429, headers: corsHeaders }
        );
      }
      record.count += 1;
    }
  }

  // 2. Admin API Protection
  // Protected paths:
  // - POST /api/products
  // - PUT/DELETE /api/products/*
  // - POST /api/orders/update
  //
  // Auth is validated using NextAuth JWT role=admin.
  const isProductsRoute = pathname === "/api/products" || pathname.startsWith("/api/products/");
  const isReviewsRoute = pathname.match(/^\/api\/products\/[^/]+\/reviews/);
  const isOrdersUpdateRoute = pathname.startsWith("/api/orders/update");
  const isAdminRoute = pathname.startsWith("/api/admin/");

  let requiresAdmin = false;

  if (isProductsRoute && method !== "GET" && !isReviewsRoute) {
    requiresAdmin = true;
  }
  if (isOrdersUpdateRoute) {
    requiresAdmin = true;
  }
  if (isAdminRoute) {
    requiresAdmin = true;
  }

  if (requiresAdmin) {
    if (!(await hasAdminAccess(req))) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401, headers: corsHeaders }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/api/products",
    "/api/products/:path*",
    "/api/orders/update",
    "/api/admin/:path*",
    "/api/ai/:path*"
  ],
};
