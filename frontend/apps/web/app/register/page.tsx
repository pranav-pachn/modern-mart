"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

export default function RegisterPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace((session?.user as any)?.role === "admin" ? "/admin" : "/shop");
    }
  }, [status, session, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      router.push("/login?registered=true");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || status === "authenticated") {
    return (
      <div className="login-loading">
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="login-root">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-card">
        <div className="login-logo">🛒</div>
        <div className="login-admin-badge" style={{ background: "#ecfdf5", color: "#065f46", marginBottom: "12px" }}>
          ✨ New Account
        </div>
        <h1 className="login-title">Create Account</h1>
        <p className="login-sub">Create an account to shop fresh groceries in Bodhan.</p>

        <form className="admin-login-form" onSubmit={handleRegister}>
          <div className="login-field">
            <label className="login-label">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              className="login-input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>
          <div className="login-field">
            <label className="login-label">Email address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              placeholder="At least 6 characters"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={6}
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? "Creating account..." : "Create Account"}
          </button>

          <p className="login-sub" style={{ marginTop: "10px", marginBottom: 0, textAlign: "center" }}>
            Already have an account? <Link href="/login" className="login-link">Sign in here</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
