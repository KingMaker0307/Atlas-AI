"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, ClipboardList, Home, Settings, ShieldAlert, Sun, Moon, Flame } from "lucide-react";
import { useEffect, useState, useRef } from "react";
import { HomeScreen } from "@/components/screens/home-screen";
import { WorkoutScreen } from "@/components/screens/workout-screen";
import { CoachScreen } from "@/components/screens/coach-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
import { WelcomeScreen } from "@/components/screens/welcome-screen";
import { RoutineBuilderScreen } from "@/components/screens/routine-builder-screen";
import { WorkoutPlanBuilderScreen } from "@/components/screens/workout-plan-builder";
import { WorkoutPlanDetailScreen } from "@/components/screens/workout-plan-detail";
import { ExerciseDatabaseScreen } from "@/components/screens/exercise-database-screen";
import { NutritionAnalyticsScreen } from "@/components/screens/nutrition-analytics-screen";
import { AppLoader } from "@/components/ui/app-loader";
import { HealthDisclaimer } from "@/components/ui/health-disclaimer";
import { InstallPrompt } from "@/components/install-prompt";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Onboarding } from "@/components/onboarding";
import { PwaRegistrar } from "@/components/pwa-registrar";
import { ErrorBoundary } from "@/components/error-boundary";
import { NutritionTracker } from "@/components/nutrition-tracker";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";
import { useAtlasStore, type AtlasTab } from "@/store/useAtlasStore";
import { drainSyncQueue } from "@/lib/repositories/registry";
import { AiSetupPopup } from "@/components/ai-setup-popup";

// Unified navigation items list
const navItems: Array<{ id: AtlasTab; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Home",       icon: Home },
  { id: "workout",   label: "Workout",    icon: ClipboardList },
  { id: "nutrition", label: "Nutrition",  icon: Flame },
  { id: "coach",     label: "Coach",      icon: Bot },
  { id: "settings",  label: "Settings",   icon: Settings },
];

export function AtlasApp() {
  const hydrated = useAtlasStore((state) => state.hydrated);
  const hydrate = useAtlasStore((state) => state.hydrate);
  const activeTab = useAtlasStore((state) => state.activeTab);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const activeSubScreen = useAtlasStore((state) => state.activeSubScreen);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const hasOnboarded = useAtlasStore((state) => state.hasOnboarded);
  const user = useAtlasStore((state) => state.user);
  const profile = useAtlasStore((state) => state.profile);
  const theme = useAtlasStore((state) => state.theme);
  const setTheme = useAtlasStore((state) => state.setTheme);
  const startupChoice = useAtlasStore((state) => state.startupChoice);
  const blocked = useAtlasStore((state) => state.blocked);
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const checkAndAutoStopActiveWorkout = useAtlasStore((state) => state.checkAndAutoStopActiveWorkout);
  const pullCloudUpdate = useAtlasStore((state) => state.pullCloudUpdate);
  const setGlobalAddFoodOpen = useAtlasStore((state) => state.setGlobalAddFoodOpen);
  // For backwards compatibility and routing: 'today' redirects to unified 'dashboard' Home screen
  const resolvedTab = activeTab === "today" ? "dashboard" : activeTab;

  const activeSettingsTab = useAtlasStore((state) => state.activeSettingsTab);

  // Scroll to top when primary tabs, active sub-screens, or settings tabs change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as any });
  }, [activeTab, activeSubScreen, activeSettingsTab]);


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
      try {
        await drainSyncQueue();
        await pullCloudUpdate();
      } catch (err) {
        console.warn("[Sync] Pull error (non-fatal):", err);
      }
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

  // Edge swipe back gesture handler for mobile one-handed navigation
  useEffect(() => {
    if (!hydrated) return;

    let startX = 0;
    let startY = 0;
    const thresholdX = 60; // Min horizontal distance for swipe
    const maxDistanceY = 50; // Max vertical deviation to ensure horizontal swipe
    const edgeOffset = 30; // Touch must start within 30px of left edge

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - startX;
      const deltaY = Math.abs(touch.clientY - startY);

      // Edge swipe right: startX must be close to left screen edge
      if (startX <= edgeOffset && deltaX >= thresholdX && deltaY <= maxDistanceY) {
        // Go back if there is an active subscreen, EXCEPT active-workout (workscreen)
        if (activeSubScreen && activeSubScreen !== "active-workout") {
          if (navigator.vibrate) navigator.vibrate(8); // Subtle haptics
          if (activeSubScreen === "routine-builder") {
            setActiveSubScreen("workout-plan-detail");
          } else {
            setActiveSubScreen(null);
          }
        }
      }
    };

    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, [hydrated, activeSubScreen, setActiveSubScreen]);

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
  if (!user) return <WelcomeScreen />;
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
      case "exercise-database":
        return <ErrorBoundary screen="Exercise Database"><ExerciseDatabaseScreen /></ErrorBoundary>;
      case "nutrition-analytics":
        return <ErrorBoundary screen="Nutrition Analytics"><NutritionAnalyticsScreen /></ErrorBoundary>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-emerald-300 selection:text-zinc-955 md:pl-64">
      <PwaRegistrar />
      <HealthDisclaimer />
      {!profile?.aiSetupDismissed && <AiSetupPopup />}
      
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
            const isWorkoutResume = item.id === "workout" && activeWorkout;
            const label = item.label;
            const isNavDisabled = activeTab === "workout" && activeSubScreen === "active-workout" && !active;
            return (
              <button
                key={item.id}
                disabled={isNavDisabled}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setActiveTab(item.id);
                  if (isWorkoutResume) {
                    setActiveSubScreen("active-workout");
                  }
                }}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-2xl text-[11px] font-bold uppercase tracking-wider transition w-full justify-start leading-none min-h-[44px]",
                  active 
                    ? (isWorkoutResume ? "text-emerald-500 dark:text-emerald-250 font-black" : "text-emerald-500 dark:text-emerald-250 font-bold") 
                    : (isWorkoutResume ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 animate-pulse font-bold" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"),
                  isNavDisabled && "opacity-25 cursor-not-allowed hover:text-zinc-500 hover:bg-transparent"
                )}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active-desktop"
                    className="absolute inset-0 rounded-2xl bg-emerald-300/12"
                  />
                ) : null}
                <Icon className="relative shrink-0" size={17} />
                <span className="relative">{label}</span>
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
        <div className="fixed inset-x-0 top-0 z-30 border-b border-card-border bg-header pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:backdrop-blur-xl md:hidden overflow-hidden">
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
            <div className="flex items-center gap-1 shrink-0 justify-end flex-nowrap pl-2">
              {activeWorkout && (
                <button
                  type="button"
                  onClick={() => {
                    if (navigator.vibrate) navigator.vibrate(8);
                    setActiveTab("workout");
                    setActiveSubScreen("active-workout");
                  }}
                  className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-650 dark:text-emerald-400 text-xs font-bold transition active:scale-95 cursor-pointer shrink-0 animate-pulse shadow-sm mr-1"
                  aria-label="Resume workout session"
                >
                  <ClipboardList size={14} className="stroke-[2.5px] text-emerald-500 dark:text-emerald-400" />
                  <span>Resume</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  const resolved = theme === "system" ? (prefersDark ? "dark" : "light") : theme;
                  void setTheme(resolved === "dark" ? "light" : "dark");
                }}
                className="flex items-center justify-center h-10 w-10 rounded-xl border border-surface-border bg-surface text-zinc-555 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-zinc-200 transition active:scale-95 cursor-pointer shrink-0 overflow-hidden"
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
                      <Sun size={18} className="text-amber-500" />
                    ) : (
                      <Moon size={18} className="text-indigo-500 dark:text-indigo-400" />
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

      {/* ─── MAIN PAGES INTERACTIVE CONTENT ─── */}
      <main className={cn(
        "mx-auto w-full max-w-6xl pb-[calc(3.5rem+env(safe-area-inset-bottom))] md:pb-8",
        resolvedTab === "workout" && activeSubScreen === "active-workout"
          ? "px-0 md:px-4 pt-[calc(3.75rem+env(safe-area-inset-top))] md:pt-16 pb-0"
          : "px-4 md:px-8 pt-[calc(4.0rem+env(safe-area-inset-top))] md:pt-8"
      )}>
        <AnimatePresence mode="wait">
          {activeSubScreen ? (
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
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = resolvedTab === item.id;
            const isWorkoutResume = item.id === "workout" && activeWorkout;
            const label = item.label;
            const isNavDisabled = activeTab === "workout" && activeSubScreen === "active-workout" && !active;
            return (
              <button
                disabled={isNavDisabled}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-0.5 sm:gap-1 rounded-2xl text-[9px] min-[360px]:text-[10px] sm:text-[11px] font-medium transition min-h-[44px] overflow-hidden",
                  active 
                    ? (isWorkoutResume ? "text-emerald-500 dark:text-emerald-250 font-black" : "text-emerald-500 dark:text-emerald-200") 
                    : (isWorkoutResume ? "text-emerald-500/80 dark:text-emerald-400/80 animate-pulse font-bold" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"),
                  isNavDisabled && "opacity-25 cursor-not-allowed"
                )}
                key={item.id}
                aria-current={active ? "page" : undefined}
                aria-label={label}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setActiveTab(item.id);
                  if (isWorkoutResume) {
                    setActiveSubScreen("active-workout");
                  }
                }}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 sm:inset-x-3 top-1 sm:top-2 h-10 sm:h-12 rounded-2xl bg-emerald-300/12"
                  />
                ) : null}
                <Icon className="relative shrink-0" size={20} />
                <span className="relative leading-none whitespace-nowrap text-center hidden min-[360px]:block">{label}</span>
              </button>
            );
          })}
        </div>
      </nav>

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