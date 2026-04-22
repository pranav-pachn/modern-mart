"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { syncHistoryOnLogin } from "@/lib/ai-history";
import { useCart } from "@/store/cart";
import { ShoppingCart, Sparkles, LayoutDashboard, LogOut, User, X, Menu, MapPin } from "lucide-react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { cart } = useCart();

  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    if (status === "authenticated") {
      syncHistoryOnLogin();
    }
  }, [status]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("#navbar-user-menu")) setDropdownOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [dropdownOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Do not render the global storefront navbar in the admin dashboard
  if (pathname?.startsWith("/admin")) {
    return null;
  }

  return (
    <header className="navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link href="/" className="navbar-brand">
          <span className="brand-icon">🛒</span>
          <span className="brand-name">Panchavati Mart</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="navbar-links" aria-label="Main navigation">
          <Link href="/shop" className="nav-link">Shop</Link>
          <Link href="/ai" className="nav-link">
            <Sparkles className="h-3.5 w-3.5" />
            AI Grocery
          </Link>
        </nav>

        {/* Right side actions */}
        <div className="navbar-auth">
          {/* Cart icon with badge (always visible) */}
          <Link
            href="/cart"
            aria-label={`Cart, ${cartCount} item${cartCount !== 1 ? "s" : ""}`}
            className="relative inline-flex items-center justify-center h-10 w-10 rounded-xl border border-gray-200 bg-white text-gray-700 transition hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-300"
          >
            <ShoppingCart className="h-4.5 w-4.5" style={{ width: "18px", height: "18px" }} />
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white">
                {cartCount > 99 ? "99+" : cartCount}
              </span>
            )}
          </Link>

          {status === "loading" && (
            <div className="nav-skeleton" aria-hidden="true" />
          )}

          {status === "unauthenticated" && (
            <div className="hidden sm:flex gap-2 items-center">
              <button
                id="navbar-signin-btn"
                onClick={() => signIn("google", { callbackUrl: "/shop" })}
                className="nav-signin-btn"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Sign In
              </button>
              <Link
                href="/register"
                className="nav-signin-btn"
                style={{
                  backgroundColor: "var(--emerald-dark)",
                  color: "white",
                  borderColor: "var(--emerald-dark)",
                }}
              >
                Sign Up
              </Link>
            </div>
          )}

          {status === "authenticated" && session?.user && (
            <div className="nav-user-menu hidden sm:block" id="navbar-user-menu">
              <button
                id="navbar-user-btn"
                className="user-avatar-btn"
                onClick={() => setDropdownOpen((v) => !v)}
                aria-expanded={dropdownOpen}
                aria-haspopup="true"
              >
                {session.user.image ? (
                  // eslint-disable-next-line @next/next-compat/no-img-element
                  <img
                    src={session.user.image}
                    alt={session.user.name ?? "User"}
                    className="user-avatar-img"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="user-avatar-fallback">
                    {(session.user.name ?? "U").charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="user-name">{session.user.name?.split(" ")[0]}</span>
                <svg className={`chevron ${dropdownOpen ? "chevron-open" : ""}`} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="m6 9 6 6 6-6"/>
                </svg>
              </button>

              {dropdownOpen && (
                <div className="user-dropdown" role="menu">
                  <div className="dropdown-user-info">
                    <p className="dropdown-name">{session.user.name}</p>
                    <p className="dropdown-email">{session.user.email}</p>
                  </div>
                  <div className="dropdown-divider" />
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="dropdown-item"
                      role="menuitem"
                      onClick={() => setDropdownOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Admin Dashboard
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <User className="h-4 w-4" />
                    My Profile & Addresses
                  </Link>
                  <Link
                    href="/cart"
                    className="dropdown-item"
                    role="menuitem"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Cart
                    {cartCount > 0 && (
                      <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-black text-white">
                        {cartCount}
                      </span>
                    )}
                  </Link>
                  <div className="dropdown-divider" />
                  <button
                    id="navbar-signout-btn"
                    className="dropdown-item dropdown-signout"
                    role="menuitem"
                    onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: "/" }); }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Mobile hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
          >
            {menuOpen
              ? <X className="h-5 w-5 text-gray-700" />
              : <Menu className="h-5 w-5 text-gray-700" />
            }
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {menuOpen && (
        <nav className="mobile-nav" aria-label="Mobile navigation">
          <Link href="/shop" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            🛍️ Shop
          </Link>
          <Link href="/ai" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            ✨ AI Grocery
          </Link>
          <Link href="/cart" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
            <span className="flex items-center justify-between w-full">
              🛒 Cart
              {cartCount > 0 && (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-black text-white">
                  {cartCount}
                </span>
              )}
            </span>
          </Link>

          {status === "authenticated" && isAdmin && (
            <Link href="/admin" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              🚀 Admin Dashboard
            </Link>
          )}
          {status === "authenticated" && (
            <Link href="/profile" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
              👤 My Profile & Addresses
            </Link>
          )}

          <div className="dropdown-divider my-2" />

          {status === "unauthenticated" && (
            <>
              <button
                className="mobile-nav-link mobile-signin"
                onClick={() => { setMenuOpen(false); signIn("google", { callbackUrl: "/shop" }); }}
              >
                Sign in with Google
              </button>
              <Link
                href="/register"
                className="mobile-nav-link mobile-signin"
                onClick={() => setMenuOpen(false)}
              >
                Sign Up
              </Link>
            </>
          )}
          {status === "authenticated" && (
            <>
              {session?.user && (
                <div className="px-4 py-2">
                  <p className="text-sm font-semibold text-gray-900">{session.user.name}</p>
                  <p className="text-xs text-gray-500">{session.user.email}</p>
                </div>
              )}
              <button
                className="mobile-nav-link mobile-signin"
                onClick={() => { setMenuOpen(false); signOut({ callbackUrl: "/" }); }}
              >
                <LogOut className="h-4 w-4 inline mr-2" />
                Sign Out
              </button>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
