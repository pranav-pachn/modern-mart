import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = await getToken({ req, secret: process.env.AUTH_SECRET });
  return (token as any)?.role === "admin";
}

// ─────────────────────────────────────────────────────────────────────────────
// Middleware
// ─────────────────────────────────────────────────────────────────────────────
export async function middleware(req: NextRequest) {
  const { pathname, href } = req.nextUrl;
  const method = req.method.toUpperCase();

  // ── 1. API Security Rules ────────────────────────────────────────────────
  //
  //  /api/products    GET  → Everyone  (customers browse products)
  //  /api/products    POST → Admin only (add product)
  //  /api/products/*  PUT  → Admin only (edit product)
  //  /api/products/*  DELETE → Admin only (delete product)
  //  /api/orders      POST → Everyone  (customers place orders)
  //  /api/orders/update → Admin only  (accept / dispatch / deliver)

  const isProductsRoute = pathname === "/api/products" || pathname.startsWith("/api/products/");
  const isOrdersUpdateRoute = pathname.startsWith("/api/orders/update");

  // Block non-GET product mutations
  if (isProductsRoute && method !== "GET" && method !== "OPTIONS") {
    if (!(await isAdmin(req))) {
      return NextResponse.json(
        { error: "Unauthorized. Admin access required." },
        { status: 401 }
      );
    }
  }

  // Block order-status changes for non-admins
  if (isOrdersUpdateRoute && method !== "OPTIONS") {
    if (!(await isAdmin(req))) {
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
  const PROTECTED_PREFIXES = ["/shop", "/cart", "/checkout", "/ai"];
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
