import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  return (token as any)?.role === "admin";
}

// adminFetch() on the client sends x-admin-secret; check that too so proxied
// API calls don't get blocked before they reach the backend.
function hasAdminSecret(req: NextRequest): boolean {
  const secret =
    process.env.NEXT_PUBLIC_ADMIN_SECRET || process.env.ADMIN_SECRET || "";
  const provided = req.headers.get("x-admin-secret") ?? "";
  return secret.length > 0 && provided === secret;
}

// Rate-limit login attempts — 10 per minute per IP
const loginRateLimit = new Map<string, { count: number; expires: number }>();

function checkLoginRateLimit(req: NextRequest): NextResponse | null {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const now = Date.now();
  const windowMs = 60_000;
  const max = 10;

  const record = loginRateLimit.get(ip);
  if (!record || record.expires < now) {
    loginRateLimit.set(ip, { count: 1, expires: now + windowMs });
    return null;
  }
  if (record.count >= max) {
    return NextResponse.json(
      { error: "Too many login attempts. Please try again later." },
      { status: 429 }
    );
  }
  record.count += 1;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const method = req.method.toUpperCase();

  // ── 0. Rate-limit login attempts ──────────────────────────────────────────
  if (pathname.startsWith("/api/auth") && method === "POST") {
    const limited = checkLoginRateLimit(req);
    if (limited) return limited;
  }

  // ── 1. API Security Rules ────────────────────────────────────────────────
  //
  //  /api/products    GET    → Everyone  (customers browse products)
  //  /api/products    POST   → Admin only (add product)
  //  /api/products/*  PUT    → Admin only (edit product)
  //  /api/products/*  DELETE → Admin only (delete product)
  //  /api/orders      POST   → Everyone  (customers place orders)
  //  /api/orders/update     → Admin only (accept / dispatch / deliver)

  const isProductsRoute =
    pathname === "/api/products" || pathname.startsWith("/api/products/");
  const isReviewsRoute = pathname.match(/^\/api\/products\/[^/]+\/reviews/);
  const isOrdersUpdateRoute = pathname.startsWith("/api/orders/update");

  // Block non-GET product mutations unless the caller is admin, exempting reviews
  if (isProductsRoute && method !== "GET" && method !== "OPTIONS" && !isReviewsRoute) {
    if (!hasAdminSecret(req) && !(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
  }

  // Block order-status changes for non-admins
  if (isOrdersUpdateRoute && method !== "OPTIONS") {
    if (!hasAdminSecret(req) && !(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
  }

  // ── 2. Admin Page Protection ─────────────────────────────────────────────
  if (pathname.startsWith("/admin")) {
    if (!(await isAdmin(req))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // ── 3. Auth-required Pages ───────────────────────────────────────────────
  const PROTECTED_PREFIXES = ["/shop", "/cart", "/checkout", "/ai", "/order"];
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));

  if (isProtected) {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // ── 4. Redirect logged-in users from landing page ───────────────────────
  if (pathname === "/") {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (token) {
      if (token.role === "admin") {
        return NextResponse.redirect(new URL("/admin", req.url));
      } else {
        return NextResponse.redirect(new URL("/shop", req.url));
      }
    }
  }

  return NextResponse.next();
}

// ─────────────────────────────────────────────────────────────────────────────
// Matcher – run middleware on all routes except Next.js internals & auth
// ─────────────────────────────────────────────────────────────────────────────
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
