"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bot, ClipboardList, Home, Settings, WifiOff, ShieldAlert } from "lucide-react";
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
    };

    updateTheme();
    mediaQuery.addEventListener("change", updateTheme);
    return () => mediaQuery.removeEventListener("change", updateTheme);
  }, [theme]);

  if (!online) return <OfflineBlockerScreen />;
  if (blocked) return <BlockedBlockerScreen />;
  if (!hydrated) return <LoadingApp />;
  if (!startupChoice) return <WelcomeScreen />;
  if (!hasOnboarded) return <Onboarding />;

  const renderSubScreen = () => {
    switch (activeSubScreen) {
      case "routine-builder":
        return <RoutineBuilderScreen />;
      case "workout-plan-builder":
        return <WorkoutPlanBuilderScreen />;
      case "workout-plan-detail":
        return <WorkoutPlanDetailScreen />;
      case "active-workout":
        return <WorkoutScreen />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-dvh bg-background text-foreground selection:bg-emerald-300 selection:text-zinc-950">
      <PwaRegistrar />
      <div className="fixed inset-x-0 top-0 z-30 border-b border-card-border bg-header pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:backdrop-blur-xl">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 font-bold text-zinc-950">
              A
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">Atlas AI Coach</p>
              <p className="mt-1 text-xs text-zinc-500">Private fitness intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <OfflineIndicator />
            <InstallPrompt />
          </div>
        </header>
      </div>

      <main className="mx-auto w-full max-w-6xl px-4 pt-[calc(5rem+env(safe-area-inset-top))] md:px-6">
        <AnimatePresence mode="wait">
          {activeSubScreen ? (
            renderSubScreen()
          ) : (
            <motion.div key={activeTab}>
              {activeTab === "dashboard" ? <DashboardScreen /> : null}
              {activeTab === "workout" ? <WorkoutScreen /> : null}
              {activeTab === "coach" ? <CoachScreen /> : null}
              {activeTab === "progress" ? <ProgressScreen /> : null}
              {activeTab === "settings" ? <SettingsScreen /> : null}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-card-border bg-nav pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-md grid-cols-5 px-2 md:max-w-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition",
                  active ? "text-emerald-500 dark:text-emerald-200" : "text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200",
                )}
                key={item.id}
                onClick={() => {
                  if (navigator.vibrate) navigator.vibrate(8);
                  setActiveTab(item.id);
                }}
              >
                {active ? (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-3 top-2 h-12 rounded-2xl bg-emerald-300/12"
                  />
                ) : null}
                <Icon className="relative" size={21} />
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
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-4 text-center text-foreground">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 text-amber-500 animate-pulse">
          <WifiOff size={32} />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Internet Connection Required</h1>
          <p className="text-sm text-zinc-500 leading-relaxed">
            Atlas AI Coach is a secure web-based application and requires an active internet connection to synchronize your training profile and function properly.
          </p>
        </div>
        <div className="pt-2">
          <div className="inline-flex items-center gap-2 rounded-full border border-card-border bg-input px-3.5 py-1.5 text-xs text-zinc-500 font-medium">
            <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
            Waiting for connection...
          </div>
        </div>
      </Card>
    </main>
  );
}

function BlockedBlockerScreen() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background p-4 text-center text-foreground">
      <Card className="w-full max-w-md p-8 space-y-6 shadow-[0_24px_60px_rgba(0,0,0,0.18)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.8)]">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 text-red-500">
          <ShieldAlert size={32} />
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Access Denied</h1>
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