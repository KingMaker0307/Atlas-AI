"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bot, ClipboardList, Home, Settings, ShieldAlert, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { WorkoutScreen } from "@/components/screens/workout-screen";
import { CoachScreen } from "@/components/screens/coach-screen";
import { ProgressScreen } from "@/components/screens/progress-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { WelcomeScreen } from "@/components/screens/welcome-screen";
import { RoutineBuilderScreen } from "@/components/screens/routine-builder-screen";
import { WorkoutPlanBuilderScreen } from "@/components/screens/workout-plan-builder";
import { WorkoutPlanDetailScreen } from "@/components/screens/workout-plan-detail";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Onboarding } from "@/components/onboarding";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { ErrorBoundary } from "@/components/error-boundary";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useAtlasStore, type AtlasTab } from "@/store/useAtlasStore";

const navItems: Array<{
  id: AtlasTab;
  label: string;
  icon: typeof Home;
}> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "workout", label: "Plans", icon: ClipboardList },
  { id: "coach", label: "Coach", icon: Bot },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AtlasApp() {
  const hydrated = useAtlasStore((state) => state.hydrated);
  const hydrate = useAtlasStore((state) => state.hydrate);
  const activeTab = useAtlasStore((state) => state.activeTab);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const activeSubScreen = useAtlasStore((state) => state.activeSubScreen);
  const hasOnboarded = useAtlasStore((state) => state.hasOnboarded);
  const theme = useAtlasStore((state) => state.theme);
  const setTheme = useAtlasStore((state) => state.setTheme);
  const startupChoice = useAtlasStore((state) => state.startupChoice);
  const blocked = useAtlasStore((state) => state.blocked);
  const profile = useAtlasStore((state) => state.profile);
  const checkAndAutoStopActiveWorkout = useAtlasStore((state) => state.checkAndAutoStopActiveWorkout);

  const [online, setOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const sync = () => setOnline(navigator.onLine);
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !profile?.id || !online) return;

    const checkBlocked = async () => {
      try {
        const res = await fetch(`/api/profile/?userId=${profile.id}`);
        if (res.ok) {
          const data = await res.json();
          if (data.blocked) {
            useAtlasStore.setState({ blocked: true });
          }
        }
      } catch (e) {
        console.error("Failed to check blocked status:", e);
      }
    };

    void checkBlocked();
    const interval = setInterval(checkBlocked, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [hydrated, profile?.id, online]);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const interval = setInterval(() => {
      void checkAndAutoStopActiveWorkout();
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [hydrated, checkAndAutoStopActiveWorkout]);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const updateTheme = () => {
      const prefersDark = mediaQuery.matches;
      const shouldDark = theme === "dark" || (theme === "system" && prefersDark);
      root.classList.toggle("dark", shouldDark);
      root.classList.toggle("light", !shouldDark);
      root.style.colorScheme = shouldDark ? "dark" : "light";

      // Dynamically update the theme-color meta tag so iOS/Android status bar matches
      const metaThemeColor = document.querySelector('meta[name="theme-color"]');
      if (metaThemeColor) {
        metaThemeColor.setAttribute("content", shouldDark ? "#07080a" : "#f6f7f9");
      }
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  if (blocked) return <BlockedBlockerScreen />;
  if (!hydrated) return <LoadingApp />;
  if (!startupChoice) return <WelcomeScreen />;
  if (!hasOnboarded) return <Onboarding />;

  const renderSubScreen = () => {
    switch (activeSubScreen) {
      case "routine-builder":
        return <ErrorBoundary screen="Routine Builder"><RoutineBuilderScreen /></ErrorBoundary>;
      case "workout-plan-builder":
        return <ErrorBoundary screen="Plan Builder"><WorkoutPlanBuilderScreen /></ErrorBoundary>;
      case "workout-plan-detail":
        return <ErrorBoundary screen="Plan Detail"><WorkoutPlanDetailScreen /></ErrorBoundary>;
      case "active-workout":
        return <ErrorBoundary screen="Active Workout"><WorkoutScreen /></ErrorBoundary>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-emerald-300 selection:text-zinc-950 md:pl-64">
      <PwaRegistrar />
      
      {/* ─── DESKTOP SIDEBAR NAVIGATION PANEL (Hidden on mobile) ─── */}
      <aside
        aria-label="Main navigation"
        className="hidden md:flex flex-col w-64 fixed inset-y-0 left-0 bg-header border-r border-card-border p-5 z-40 select-none"
      >
        {/* Brand Header Logo block */}
        <div className="flex items-center gap-3 mb-8 shrink-0">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300 font-extrabold text-zinc-950">
            A
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold leading-none text-foreground">Atlas AI Coach</p>
            <p className="mt-1.5 text-[10px] font-medium text-zinc-500 leading-none">Private fitness intelligence</p>
          </div>
        </div>

        {/* Sidebar Nav Buttons list */}
        <div className="flex-1 flex flex-col gap-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setActiveTab(item.id);
                }}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition w-full justify-start leading-none min-h-[44px]",
                  active ? "text-emerald-500 dark:text-emerald-250 font-black" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active-desktop"
                    className="absolute inset-0 rounded-2xl bg-emerald-300/12"
                  />
                ) : null}
                <Icon className="relative shrink-0" size={17} />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sidebar Telemetry Footer block */}
        <div className="pt-4 border-t border-card-border flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <OfflineIndicator />
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-mono">System Standby</span>
            </div>
            <button
              type="button"
              onClick={() => void setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-border bg-surface text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
              aria-label="Toggle display theme"
            >
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </div>
          <InstallPrompt />
        </div>
      </aside>

      {/* ─── MOBILE BRAND TOP HEADER (Hidden on desktop) ─── */}
      {!(activeTab === "workout" && activeSubScreen === "active-workout") && (
        <div className="fixed inset-x-0 top-0 z-30 border-b border-card-border bg-header pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:backdrop-blur-xl md:hidden">
          <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-emerald-300 font-extrabold text-zinc-955">
                A
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-none text-foreground truncate">Atlas AI Coach</p>
                <p className="mt-1 text-[10px] text-zinc-500 font-medium leading-none truncate hidden min-[360px]:block">
                  Private fitness intelligence
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-end flex-nowrap pl-2">
              <button
                type="button"
                onClick={() => void setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-border bg-surface text-zinc-555 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle display theme"
              >
                {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
              </button>
              <OfflineIndicator compact />
              <InstallPrompt compact />
            </div>
          </header>
        </div>
      )}

      {/* ─── MAIN PAGES INTERACTIVE CONTENT ─── */}
      <main className={cn(
        "mx-auto w-full max-w-6xl md:pb-8",
        activeTab === "workout" && activeSubScreen === "active-workout"
          ? "px-0 md:px-4 pt-[calc(3.75rem+env(safe-area-inset-top))] md:pt-16"
          : "px-4 md:px-8 pt-[calc(5rem+env(safe-area-inset-top))] md:pt-[calc(2rem+env(safe-area-inset-top))]"
      )}>
        <AnimatePresence mode="wait">
          {activeTab === "workout" && activeSubScreen ? (
            renderSubScreen()
          ) : (
            <motion.div key={activeTab}>
              {activeTab === "dashboard" ? <ErrorBoundary screen="Dashboard"><DashboardScreen /></ErrorBoundary> : null}
              {activeTab === "workout" ? <ErrorBoundary screen="Workout"><WorkoutScreen /></ErrorBoundary> : null}
              {activeTab === "coach" ? <ErrorBoundary screen="Coach"><CoachScreen /></ErrorBoundary> : null}
              {activeTab === "progress" ? <ErrorBoundary screen="Progress"><ProgressScreen /></ErrorBoundary> : null}
              {activeTab === "settings" ? <ErrorBoundary screen="Settings"><SettingsScreen /></ErrorBoundary> : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── MOBILE BOTTOM BAR NAVIGATION (Hidden on desktop) ─── */}
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-nav pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:backdrop-blur-xl md:hidden">
        <div className="mx-auto grid h-14 sm:h-16 max-w-md grid-cols-5 px-1 sm:px-2 md:max-w-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-2xl text-[10px] sm:text-[11px] font-medium transition min-h-[44px]",
                  active ? "text-emerald-500 dark:text-emerald-200" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
                key={item.id}
                aria-current={active ? "page" : undefined}
                aria-label={item.label}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setActiveTab(item.id);
                }}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 sm:inset-x-3 top-1 sm:top-2 h-10 sm:h-12 rounded-2xl bg-emerald-300/12"
                  />
                ) : null}
                <Icon className="relative" size={19} />
                <span className="relative">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function LoadingApp() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4 text-foreground">
      <Card className="w-full max-w-sm p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-foreground/10" />
        <div className="mt-5 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-foreground/10" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-xl bg-foreground/10" />
            <div className="h-20 animate-pulse rounded-xl bg-foreground/10" />
          </div>
        </div>
      </Card>
    </main>
  );
}

function OfflineBlockerScreen() {
  // This screen is no longer used — the app works offline for all local-data features.
  // Kept as a reference but never rendered. The OfflineIndicator in the nav handles
  // displaying the offline state inline without blocking the whole UI.
  return null;
}

function BlockedBlockerScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-4 text-center text-foreground">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Your profile has been suspended or blocked by the administrator. Please contact support if you believe this is an error.
          </p>
        </div>
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-input px-3.5 py-1.5 text-xs text-rose-500 font-medium">
            Account Suspended
          </div>
        </div>
      </Card>
    </main>
  );
}