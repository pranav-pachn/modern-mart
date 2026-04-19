"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session.user as any)?.role === "admin") {
        router.replace("/admin");
      } else {
        router.replace("/shop");
      }
    }
  }, [status, session, router]);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setErrorMsg("Invalid email or password.");
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

      <div className="login-wide-card">
        {/* Left: Google Sign In (Customers) */}
        <div className="login-panel">
          <div className="login-logo">🛒</div>
          <h1 className="login-title">Welcome back</h1>
          <p className="login-sub">
            Shop fresh groceries and get them delivered to your door in Bodhan.
          </p>

          <button
            id="google-signin-btn"
            onClick={() => signIn("google", { callbackUrl: "/shop" })}
            className="google-btn"
          >
            <svg width="20" height="20" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          <p className="login-disclaimer">
            By signing in, you agree to our{" "}
            <span className="login-link">Terms of Service</span> and{" "}
            <span className="login-link">Privacy Policy</span>.
          </p>
        </div>

        {/* Divider */}
        <div className="login-divider">
          <div className="login-divider-line" />
          <span className="login-divider-text">or</span>
          <div className="login-divider-line" />
        </div>

        {/* Right: Email/Password Login */}
        <div className="login-panel">
          <div className="login-admin-badge" style={{ background: "#f3f4f6", color: "#374151" }}>📧 Email Login</div>
          <h2 className="login-title" style={{ fontSize: "22px", marginTop: "12px" }}>
            Sign In with Email
          </h2>
          <p className="login-sub">
            Sign in with your email to manage orders or access the dashboard.
          </p>

          <form className="admin-login-form" onSubmit={handleAdminLogin}>
            <div className="login-field">
              <label className="login-label">Email address</label>
              <input
                type="email"
                placeholder="admin@panchavatimart.com"
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
                autoComplete="current-password"
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
            >
              {loading ? "Signing in…" : "Sign In"}
            </button>
            <p className="login-sub" style={{ marginTop: "1rem", textAlign: "center" }}>
              Don't have an account?{" "}
              <a href="/register" className="login-link">
                Register here
              </a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
