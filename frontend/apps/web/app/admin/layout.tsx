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
} from "lucide-react";

const navLinks = [
  { name: "Dashboard",   href: "/admin",             icon: LayoutDashboard },
  { name: "Products",    href: "/admin/products",     icon: Package },
  { name: "Orders",      href: "/admin/orders",       icon: ShoppingCart },
  { name: "Add Product", href: "/admin/add-product",  icon: PlusCircle },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-gray-200 bg-white shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-5 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
            <Store className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 leading-tight text-sm">Panchavati Mart</p>
            <p className="text-[11px] text-gray-400 font-medium">Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-600" : "text-gray-400"}`} />
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-100">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────────── */}
      <main className="ml-60 flex-1 min-w-0">
        <div className="mx-auto max-w-6xl px-8 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
