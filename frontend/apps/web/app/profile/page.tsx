"use client";

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  User,
  MapPin,
  Plus,
  Trash2,
  Star,
  Home,
  Briefcase,
  Building2,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  LogOut,
  Edit3,
} from "lucide-react";
import toast from "react-hot-toast";

type UserAddress = {
  id: string;
  label: string;
  addressLine: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
};

const LABEL_ICONS: Record<string, React.ReactNode> = {
  Home: <Home className="h-4 w-4" />,
  Work: <Briefcase className="h-4 w-4" />,
  Other: <Building2 className="h-4 w-4" />,
};

const LABEL_COLORS: Record<string, string> = {
  Home: "bg-blue-50 text-blue-700 border-blue-200",
  Work: "bg-violet-50 text-violet-700 border-violet-200",
  Other: "bg-orange-50 text-orange-700 border-orange-200",
};

const PRESET_LABELS = ["Home", "Work", "Other"];

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [addresses, setAddresses] = useState<UserAddress[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [settingDefaultId, setSettingDefaultId] = useState<string | null>(null);

  const [form, setForm] = useState({
    label: "Home",
    customLabel: "",
    addressLine: "",
    city: "Bodhan",
    pincode: "503185",
    isDefault: false,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Redirect if not logged in
  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchAddresses();
  }, [status]);

  const fetchAddresses = async () => {
    setIsLoadingAddresses(true);
    try {
      const res = await fetch("/api/user/address");
      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch {
      toast.error("Failed to load addresses");
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const label = form.label === "Other" && form.customLabel.trim()
      ? form.customLabel.trim()
      : form.label;

    if (!form.addressLine.trim()) {
      setFormError("Address line is required");
      return;
    }
    if (!form.city.trim()) {
      setFormError("City is required");
      return;
    }
    if (!/^\d{6}$/.test(form.pincode.trim())) {
      setFormError("Enter a valid 6-digit pincode");
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch("/api/user/address", {
        method: "POST",
        body: JSON.stringify({
          label,
          addressLine: form.addressLine.trim(),
          city: form.city.trim(),
          pincode: form.pincode.trim(),
          isDefault: form.isDefault,
        }),
      });

      if (!res.ok) throw new Error("Failed to save");

      const saved = await res.json();
      setAddresses((prev) => {
        const updated = form.isDefault
          ? prev.map((a) => ({ ...a, isDefault: false }))
          : [...prev];
        return [...updated, saved];
      });
      toast.success(`"${label}" address saved!`);
      setShowAddForm(false);
      setForm({ label: "Home", customLabel: "", addressLine: "", city: "Bodhan", pincode: "503185", isDefault: false });
    } catch {
      toast.error("Could not save address. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/user/address?id=${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setAddresses((prev) => prev.filter((a) => a.id !== id));
      toast(`"${label}" address removed`, { icon: "🗑️" });
    } catch {
      toast.error("Could not delete address");
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    setSettingDefaultId(id);
    try {
      const res = await fetch(`/api/user/address?id=${id}`, { method: "PATCH" });
      if (!res.ok) throw new Error();
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id }))
      );
      toast.success("Default address updated!");
    } catch {
      toast.error("Could not update default");
    } finally {
      setSettingDefaultId(null);
    }
  };

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-zinc-50">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </main>
    );
  }

  if (!session) return null;

  const user = session.user;

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8">

        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* ── Profile Card ── */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-5">
              {user?.image ? (
                // eslint-disable-next-line @next/next-compat/no-img-element
                <img
                  src={user.image}
                  alt={user.name ?? "Profile"}
                  referrerPolicy="no-referrer"
                  className="h-20 w-20 rounded-full object-cover ring-4 ring-emerald-100 shadow-md"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-3xl font-black text-white shadow-md">
                  {(user?.name ?? "U").charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <h1 className="text-2xl font-black text-zinc-900">{user?.name}</h1>
                <p className="text-zinc-500 text-sm mt-0.5">{user?.email}</p>
                {(user as any)?.role === "admin" && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-bold text-violet-700">
                    ⚡ Admin
                  </span>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/cart"
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                <ShoppingCart className="h-4 w-4" />
                View Cart
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-100"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </section>

        {/* ── Saved Addresses ── */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Saved Addresses</h2>
                <p className="text-sm text-zinc-500">Used for delivery at checkout</p>
              </div>
            </div>
            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 active:scale-95"
              >
                <Plus className="h-4 w-4" />
                Add Address
              </button>
            )}
          </div>

          {/* Address list */}
          {isLoadingAddresses ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
              ))}
            </div>
          ) : addresses.length === 0 && !showAddForm ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 py-12 text-center">
              <MapPin className="mb-3 h-10 w-10 text-zinc-300" />
              <p className="font-semibold text-zinc-700">No saved addresses yet</p>
              <p className="mt-1 text-sm text-zinc-500">Add a home or work address for faster checkout</p>
              <button
                onClick={() => setShowAddForm(true)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4" /> Add Your First Address
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {addresses.map((addr) => {
                const colorClass = LABEL_COLORS[addr.label] ?? "bg-zinc-50 text-zinc-700 border-zinc-200";
                const icon = LABEL_ICONS[addr.label] ?? <MapPin className="h-4 w-4" />;
                return (
                  <div
                    key={addr.id}
                    className={`relative rounded-2xl border-2 p-5 transition-all ${
                      addr.isDefault
                        ? "border-emerald-400 bg-emerald-50/40"
                        : "border-zinc-100 bg-white hover:border-zinc-200"
                    }`}
                  >
                    {addr.isDefault && (
                      <span className="absolute right-4 top-4 inline-flex items-center gap-1 rounded-full bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold text-white">
                        <CheckCircle2 className="h-3 w-3" /> Default
                      </span>
                    )}

                    <div className="flex items-start gap-4">
                      <span className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-xs font-bold ${colorClass}`}>
                        {icon} {addr.label}
                      </span>
                    </div>

                    <p className="mt-3 font-semibold text-zinc-900 leading-snug">{addr.addressLine}</p>
                    <p className="mt-0.5 text-sm text-zinc-500">
                      {addr.city} — {addr.pincode}
                    </p>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {!addr.isDefault && (
                        <button
                          onClick={() => handleSetDefault(addr.id)}
                          disabled={settingDefaultId === addr.id}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600 transition hover:border-emerald-400 hover:text-emerald-700 disabled:opacity-60"
                        >
                          {settingDefaultId === addr.id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <Star className="h-3 w-3" />
                          )}
                          Set as Default
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(addr.id, addr.label)}
                        disabled={deletingId === addr.id}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-60"
                      >
                        {deletingId === addr.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Add Address Form ── */}
          {showAddForm && (
            <form
              onSubmit={handleSaveAddress}
              className="mt-6 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/30 p-6"
            >
              <h3 className="mb-5 flex items-center gap-2 text-base font-bold text-zinc-900">
                <Edit3 className="h-4 w-4 text-emerald-600" />
                New Address
              </h3>

              {formError && (
                <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-600">
                  {formError}
                </p>
              )}

              {/* Label picker */}
              <div className="mb-4">
                <label className="mb-2 block text-sm font-semibold text-zinc-700">
                  Label
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_LABELS.map((lbl) => (
                    <button
                      key={lbl}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, label: lbl }))}
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-all ${
                        form.label === lbl
                          ? "border-emerald-500 bg-emerald-600 text-white shadow-sm"
                          : "border-zinc-200 bg-white text-zinc-600 hover:border-emerald-300 hover:text-emerald-700"
                      }`}
                    >
                      {LABEL_ICONS[lbl]} {lbl}
                    </button>
                  ))}
                </div>
                {form.label === "Other" && (
                  <input
                    type="text"
                    placeholder="Custom label (e.g. Parents' house)"
                    value={form.customLabel}
                    onChange={(e) => setForm((f) => ({ ...f, customLabel: e.target.value }))}
                    className="mt-3 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  />
                )}
              </div>

              {/* Address line */}
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-semibold text-zinc-700">
                  Street / House No.
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. 12-3-456, Srinagar Colony, Near Bodhan Bus Stand"
                  value={form.addressLine}
                  onChange={(e) => setForm((f) => ({ ...f, addressLine: e.target.value }))}
                  className="w-full rounded-xl border border-zinc-300 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  required
                />
              </div>

              {/* City + Pincode */}
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-zinc-700">City</label>
                  <input
                    type="text"
                    placeholder="Bodhan"
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                    className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-zinc-700">Pincode</label>
                  <input
                    type="text"
                    placeholder="503185"
                    maxLength={6}
                    value={form.pincode}
                    onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "") }))}
                    className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                    required
                  />
                </div>
              </div>

              {/* Set as default */}
              <label className="mb-5 flex cursor-pointer items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="h-4 w-4 accent-emerald-600"
                />
                <span className="text-sm font-medium text-zinc-700">
                  Set as my default delivery address
                </span>
              </label>

              {/* Form actions */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Address"}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowAddForm(false); setFormError(""); }}
                  className="rounded-xl border border-zinc-200 bg-white px-5 py-2.5 text-sm font-semibold text-zinc-600 transition hover:bg-zinc-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>

        {/* ── Quick Links ── */}
        <section className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-zinc-900">Quick Links</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { href: "/shop", label: "Browse Shop", emoji: "🛍️" },
              { href: "/cart", label: "View Cart", emoji: "🛒" },
              { href: "/orders", label: "My Orders", emoji: "📦" },
              { href: "/ai", label: "AI Grocery", emoji: "✨" },
              { href: "/ai-history", label: "AI History", emoji: "📋" },
              { href: "/checkout", label: "Checkout", emoji: "📦" },
            ].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-center gap-3 rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700"
              >
                <span className="text-lg">{link.emoji}</span>
                {link.label}
              </Link>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
