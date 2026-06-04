"use client";
// Prevents static prerender at build time — Supabase requires runtime env vars
export const dynamic = "force-dynamic";


import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="auth-page"><div className="auth-card"><p className="auth-subtitle">Loading...</p></div></div>}>
      <SignInContent />
    </Suspense>
  );
}

function SignInContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  useEffect(() => {
    const callbackError = searchParams.get("error");
    if (callbackError) {
      const messages: Record<string, string> = {
        auth_callback_failed: "Authentication failed. Please try signing in again.",
        access_denied: "Access was denied. Please try again.",
      };
      setError(messages[callbackError] || `Authentication error: ${callbackError}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const handleReset = () => {
      setGoogleLoading(false);
    };

    window.addEventListener("focus", handleReset);
    window.addEventListener("pageshow", handleReset);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        handleReset();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleReset);
      window.removeEventListener("pageshow", handleReset);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);


  async function handleEmailSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    // Registry wires up on hydrate() — data loads fresh from Supabase automatically

    router.refresh();
    router.push("/");
  }

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: "select_account",
          },
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch (err: any) {
      setError("Unable to open Google sign-in. Please check your popup blocker settings.");
      setGoogleLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Logo */}
        <div className="auth-logo">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
            <rect width="36" height="36" rx="10" fill="url(#authGradSI)" />
            <path d="M18 8l3.5 8h8.5l-7 5 2.5 8.5L18 25l-7.5 4.5L13 21l-7-5h8.5z" fill="white" fillOpacity="0.95" />
            <defs>
              <linearGradient id="authGradSI" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
                <stop stopColor="#10b981" />
                <stop offset="1" stopColor="#0ea5e9" />
              </linearGradient>
            </defs>
          </svg>
          <span className="auth-logo-name">Atlas AI</span>
        </div>

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your fitness journey.</p>

        {/* Google OAuth */}
        <button
          id="google-signin-btn"
          type="button"
          className="auth-oauth-btn"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
        >
          {googleLoading ? (
            <span className="auth-spinner" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853" />
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
            </svg>
          )}
          Continue with Google
        </button>

        <div className="auth-divider">
          <span>or sign in with email</span>
        </div>

        {/* Email/Password form */}
        <form id="signin-form" onSubmit={handleEmailSignIn} className="auth-form">
          <div className="auth-field">
            <label htmlFor="signin-email" className="auth-label">
              Email <span style={{ color: "#ef4444" }}>*</span>
            </label>
            <input
              id="signin-email"
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

          <div className="auth-field">
            <div className="auth-label-row">
              <label htmlFor="signin-password" className="auth-label">
                Password <span style={{ color: "#ef4444" }}>*</span>
              </label>
              <Link href="/forgot-password" className="auth-link auth-link--sm">
                Forgot password?
              </Link>
            </div>
            <input
              id="signin-password"
              type="password"
              autoComplete="current-password"
              required
              placeholder="Your password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
            id="signin-submit-btn"
            type="submit"
            className="auth-primary-btn"
            disabled={loading || googleLoading || !email.trim() || !password.trim()}
          >
            {loading ? <span className="auth-spinner" /> : "Sign In"}
          </button>
        </form>

        <p className="auth-footer-text">
          Don&apos;t have an account?{" "}
          <Link href="/sign-up" className="auth-link">
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
