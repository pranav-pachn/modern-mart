"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  PlusCircle,
  LogOut,
  Store,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";

const navLinks = [
  { name: "Dashboard",   href: "/admin",            icon: LayoutDashboard },
  { name: "Products",    href: "/admin/products",    icon: Package },
  { name: "Orders",      href: "/admin/orders",      icon: ShoppingCart },
  { name: "Add Product", href: "/admin/add-product", icon: PlusCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-500/20">
          <Store className="w-4 h-4 text-white" />
        </div>
        <div>
          <p className="font-bold text-slate-100 leading-tight text-sm">Panchavati Mart</p>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide uppercase">Admin Panel</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                  : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-emerald-400" : "text-slate-500"}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-colors"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">

      {/* ── Desktop Sidebar ──────────────────────────────────────────── */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-20 w-64 flex-col border-r border-slate-800 bg-slate-900 shadow-xl">
        <SidebarContent />
      </aside>

      {/* ── Mobile Top Bar ───────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center">
            <Store className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="font-bold text-gray-900 text-sm">Panchavati Mart <span className="text-gray-400 font-normal">· Admin</span></p>
        </div>
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Mobile Drawer ────────────────────────────────────────────── */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="lg:hidden fixed inset-0 z-20 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          {/* Drawer */}
          <aside className="lg:hidden fixed inset-y-0 left-0 z-30 flex w-72 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl">
            <SidebarContent />
          </aside>
        </>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 lg:ml-64 bg-slate-50/50">
        {/* Offset for mobile top bar */}
        <div className="lg:hidden h-14" />
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
