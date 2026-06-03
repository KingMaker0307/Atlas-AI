"use client";

import { Card } from "@/components/ui/card";
import { Dumbbell, Flame, Mail } from "lucide-react";
import { useState } from "react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function WelcomeScreen() {
  const theme = useAtlasStore((state) => state.theme);
  const setTheme = useAtlasStore((state) => state.setTheme);
  const router = useRouter();
  const supabase = createClient();
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setGoogleLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error("Google Sign In Error:", error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-4 text-foreground relative select-none">
      <div className="absolute top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => {
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
            void setTheme(resolved === "dark" ? "light" : "dark");
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-card-border bg-card/80 text-zinc-500 hover:text-foreground shadow-sm transition duration-200 cursor-pointer"
        >
          {theme === "dark" ? (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707m12.728 12.728L5.757 5.757M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <Card className="w-full max-w-md p-6 relative overflow-hidden border border-card-border bg-card/50 backdrop-blur-md shadow-2xl rounded-3xl">
        <div className="absolute -right-24 -top-24 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        {/* App Logo & Header */}
        <div className="text-center mb-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_8px_20px_rgba(16,185,129,0.2)] mb-3">
            <Dumbbell size={26} className="text-zinc-950" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">Welcome to Atlas</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-zinc-400">Your secure cloud-connected fitness helper</p>
        </div>

        <div className="space-y-6">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-1.5">
              <Flame size={14} className="text-emerald-400 animate-pulse" />
              Atlas AI Fitness OS
            </p>
            <p className="text-xs text-zinc-500 max-w-xs mx-auto leading-relaxed">
              Please authenticate to access your training profile, routines, and fitness intelligence.
            </p>
          </div>

          <div className="space-y-3">
            {/* Google Sign In */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-emerald-400 hover:bg-emerald-300 text-zinc-950 font-bold transition duration-200 cursor-pointer text-sm shadow-md"
              onClick={handleGoogleSignIn}
              disabled={googleLoading}
            >
              {googleLoading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
              ) : (
                <svg width="16" height="16" viewBox="0 0 18 18" fill="none" className="shrink-0">
                  <path d="M17.64 9.2c0-.637-.057-1.252-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="currentColor" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="currentColor" />
                  <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="currentColor" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="currentColor" />
                </svg>
              )}
              Continue with Google
            </button>

            {/* Email/Password Sign In */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/60 text-foreground transition duration-200 cursor-pointer text-sm font-semibold shadow-sm"
              onClick={() => router.push("/sign-in")}
            >
              <Mail size={16} />
              Continue with Email &amp; Password
            </button>
          </div>
        </div>
      </Card>
    </main>
  );
}