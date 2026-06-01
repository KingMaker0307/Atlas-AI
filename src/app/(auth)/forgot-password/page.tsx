"use client";
// Prevents static prerender at build time — Supabase requires runtime env vars
export const dynamic = "force-dynamic";


import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      },
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--centered">
          <div className="auth-check-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <circle cx="20" cy="20" r="20" fill="rgba(52,211,153,0.15)" />
              <path d="M12 20l6 6 10-12" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="auth-title">Check your email</h1>
          <p className="auth-subtitle">
            We sent a password reset link to <strong>{email}</strong>.
          </p>
          <Link href="/sign-in" className="auth-link-block">Back to Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#authGradFP)" />
            <path d="M18 8l3.5 8h8.5l-7 5 2.5 8.5L18 25l-7.5 4.5L13 21l-7-5h8.5z" fill="white" fillOpacity="0.95" />
            <defs>
              <linearGradient id="authGradFP" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10b981" />
                <stop offset="1" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          <span className="auth-logo-name">Atlas AI</span>
        </div>

        <h1 className="auth-title">Reset password</h1>
        <p className="auth-subtitle">
          Enter your email and we&apos;ll send you a reset link.
        </p>

        <form id="forgot-password-form" onSubmit={handleReset} className="auth-form">
          <div className="auth-field">
            <label htmlFor="forgot-email" className="auth-label">Email</label>
            <input
              id="forgot-email"
              type="email"
              autoComplete="email"
              required
              placeholder="you@example.com"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
            />
          </div>

          {error && (
            <div className="auth-error" role="alert">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="7" stroke="#ef4444" strokeWidth="1.5" />
                <path d="M8 4.5v4M8 10.5v1" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {error}
            </div>
          )}

          <button
            id="forgot-password-submit-btn"
            type="submit"
            className="auth-primary-btn"
            disabled={loading}
          >
            {loading ? <span className="auth-spinner" /> : "Send Reset Link"}
          </button>
        </form>

        <p className="auth-footer-text">
          Remember your password?{" "}
          <Link href="/sign-in" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
