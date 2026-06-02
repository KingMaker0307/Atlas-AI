"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bot, CalendarCheck, ClipboardList, Home, LayoutDashboard, Settings, ShieldAlert, Sun, Moon, Flame, X } from "lucide-react";
import { useEffect, useState } from "react";
import { HomeScreen } from "@/components/screens/home-screen";
import { WorkoutScreen } from "@/components/screens/workout-screen";
import { CoachScreen } from "@/components/screens/coach-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { WelcomeScreen } from "@/components/screens/welcome-screen";
import { RoutineBuilderScreen } from "@/components/screens/routine-builder-screen";
import { WorkoutPlanBuilderScreen } from "@/components/screens/workout-plan-builder";
import { WorkoutPlanDetailScreen } from "@/components/screens/workout-plan-detail";
import { AppLoader } from "@/components/ui/app-loader";
import { HealthDisclaimer } from "@/components/ui/health-disclaimer";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Onboarding } from "@/components/onboarding";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { ErrorBoundary } from "@/components/error-boundary";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { ModeBanner } from "@/components/mode-banner";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useAtlasStore, type AtlasTab } from "@/store/useAtlasStore";
import { drainSyncQueue } from "@/lib/repositories/registry";

// Unified navigation items list
const navItems: Array<{ id: AtlasTab; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Home",       icon: Home },
  { id: "workout",   label: "Workout",    icon: ClipboardList },
  { id: "nutrition", label: "Nutrition",  icon: Flame },
  { id: "coach",     label: "Coach",      icon: Bot },
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
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const checkAndAutoStopActiveWorkout = useAtlasStore((state) => state.checkAndAutoStopActiveWorkout);
  const pullCloudUpdate = useAtlasStore((state) => state.pullCloudUpdate);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // For backwards compatibility and routing: 'today' redirects to unified 'dashboard' Home screen
  const resolvedTab = activeTab === "today" ? "dashboard" : activeTab;


  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Sync pull manager (refocus, visibility, and 60s periodic polling)
  useEffect(() => {
    if (!hydrated) return;

    let lastPullTime = 0;
    const cooldownMs = 10000; // 10-second minimum gap between pulls

    const triggerPull = async () => {
      const now = Date.now();
      if (now - lastPullTime < cooldownMs) return;
      lastPullTime = now;
      await drainSyncQueue();
      await pullCloudUpdate();
    };

    const onFocus = () => {
      void triggerPull();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void triggerPull();
      }
    };

    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisibilityChange);

    const pollInterval = setInterval(() => {
      void triggerPull();
    }, 60000); // Poll remote state every 60 seconds

    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      clearInterval(pollInterval);
    };
  }, [hydrated, pullCloudUpdate]);

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
  if (!hydrated) return <AppLoader visible={true} />;
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
    <div className="min-h-dvh bg-background text-foreground selection:bg-emerald-300 selection:text-zinc-955 md:pl-64">
      <PwaRegistrar />
      <HealthDisclaimer />
      
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
            <p className="mt-1.5 text-[10px] font-medium text-zinc-500 leading-none">
              {guidedMode ? "Your personal fitness helper 🌱" : "Private fitness intelligence"}
            </p>
          </div>
        </div>

        {/* Sidebar Nav Buttons list */}
        <div className="flex-1 flex flex-col gap-1.5 w-full">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = resolvedTab === item.id;
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
                  active ? "text-emerald-500 dark:text-emerald-250 font-bold" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
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
              <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider font-sans">System Standby</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setSettingsOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-surface-border bg-surface text-zinc-555 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0"
                title="Open settings"
                aria-label="Open settings"
              >
                <Settings size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
                  void setTheme(resolved === "dark" ? "light" : "dark");
                }}
                className="relative flex items-center justify-center h-8 w-8 rounded-lg border border-surface-border bg-surface text-zinc-555 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0 overflow-hidden"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle display theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: 12, rotate: 45, opacity: 0 }}
                    animate={{ y: 0, rotate: 0, opacity: 1 }}
                    exit={{ y: -12, rotate: -45, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    {theme === "dark" ? (
                      <Sun size={14} className="text-amber-500" />
                    ) : (
                      <Moon size={14} className="text-indigo-500 dark:text-indigo-400" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
            </div>
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
                  {guidedMode ? "Your personal fitness helper 🌱" : "Private fitness intelligence"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-end flex-nowrap pl-2">
              <button
                type="button"
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setSettingsOpen(true);
                }}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-border bg-surface text-zinc-555 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0"
                title="Open settings"
                aria-label="Open settings"
              >
                <Settings size={14} />
              </button>
              <button
                type="button"
                onClick={() => {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
                  void setTheme(resolved === "dark" ? "light" : "dark");
                }}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-surface-border bg-surface text-zinc-555 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0 overflow-hidden"
                title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
                aria-label="Toggle display theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ y: 12, rotate: 45, opacity: 0 }}
                    animate={{ y: 0, rotate: 0, opacity: 1 }}
                    exit={{ y: -12, rotate: -45, opacity: 0 }}
                    transition={{ duration: 0.18, ease: "easeInOut" }}
                    className="shrink-0"
                  >
                    {theme === "dark" ? (
                      <Sun size={14} className="text-amber-500" />
                    ) : (
                      <Moon size={14} className="text-indigo-500 dark:text-indigo-400" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </button>
              <OfflineIndicator compact />
              <InstallPrompt compact />
            </div>
          </header>
        </div>
      )}

      {/* ─── MODE BANNER (shown for new guided mode users) ─── */}
      <ModeBanner />

      {/* ─── MAIN PAGES INTERACTIVE CONTENT ─── */}
      <main className={cn(
        "mx-auto w-full max-w-6xl pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8",
        resolvedTab === "workout" && activeSubScreen === "active-workout"
          ? "px-0 md:px-4 pt-[calc(3.75rem+env(safe-area-inset-top))] md:pt-16 pb-0"
          : "px-4 md:px-8 pt-[calc(5rem+env(safe-area-inset-top))] md:pt-[calc(2rem+env(safe-area-inset-top))]"
      )}>
        <AnimatePresence mode="wait">
          {resolvedTab === "workout" && activeSubScreen ? (
            renderSubScreen()
          ) : (
            <motion.div key={resolvedTab}>
              {resolvedTab === "dashboard"  ? <ErrorBoundary screen="Home"><HomeScreen /></ErrorBoundary> : null}
              {resolvedTab === "workout"    ? <ErrorBoundary screen="Workout"><WorkoutScreen /></ErrorBoundary> : null}
              {resolvedTab === "nutrition"  ? <ErrorBoundary screen="Nutrition"><NutritionTracker /></ErrorBoundary> : null}
              {resolvedTab === "coach"      ? <ErrorBoundary screen="Coach"><CoachScreen /></ErrorBoundary> : null}
              {resolvedTab === "settings"   ? <ErrorBoundary screen="Settings"><SettingsScreen /></ErrorBoundary> : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ─── MOBILE BOTTOM BAR NAVIGATION (Hidden on desktop) ─── */}
      <nav aria-label="Main navigation" className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-nav pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:backdrop-blur-xl md:hidden">
        <div className="mx-auto grid h-14 sm:h-16 max-w-md grid-cols-5 px-1 sm:px-2 md:max-w-xl">
          {navItems.filter(item => item.id !== "settings").map((item) => {
            const Icon = item.icon;
            const active = resolvedTab === item.id;
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

      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex justify-end bg-zinc-950/40 backdrop-blur-sm"
          >
            {/* Backdrop click to close */}
            <div className="absolute inset-0" onClick={() => setSettingsOpen(false)} />
            
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-dvh bg-background border-l border-card-border shadow-2xl overflow-y-auto p-4 sm:p-6 pb-20 z-10"
            >
              <ErrorBoundary screen="Settings">
                <SettingsScreen onClose={() => setSettingsOpen(false)} />
              </ErrorBoundary>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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