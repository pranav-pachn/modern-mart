"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      router.push("/login?registered=true");
    } catch (error: any) {
      setErrorMsg(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-root">
      <div className="login-blob login-blob-1" />
      <div className="login-blob login-blob-2" />

      <div className="login-wide-card" style={{ maxWidth: "500px", margin: "auto" }}>
        <div className="login-panel" style={{ width: "100%" }}>
          <div className="login-admin-badge" style={{ background: "#ecfdf5", color: "#065f46" }}>
            ✨ New Account
          </div>
          <h2 className="login-title" style={{ fontSize: "22px", marginTop: "12px" }}>
            Register
          </h2>
          <p className="login-sub">
            Create an account to shop fresh groceries.
          </p>

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
                placeholder="••••••••"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={6}
              />
            </div>

            {errorMsg && (
              <div className="login-error">
                ⚠️ {errorMsg}
              </div>
            )}

            <button
              type="submit"
              className="login-submit-btn"
              disabled={loading}
              style={{ background: "#059669" }}
            >
              {loading ? "Registering…" : "Register Now"}
            </button>
            <p className="login-sub" style={{ marginTop: "1rem", textAlign: "center" }}>
              Already have an account?{" "}
              <a href="/login" className="login-link">
                Sign in here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
