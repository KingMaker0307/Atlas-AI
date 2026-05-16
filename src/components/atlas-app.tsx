"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Bot, Dumbbell, Home, Settings } from "lucide-react";
import { useEffect } from "react";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { WorkoutScreen } from "@/components/screens/workout-screen";
import { CoachScreen } from "@/components/screens/coach-screen";
import { ProgressScreen } from "@/components/screens/progress-screen";
import { SettingsScreen } from "@/components/screens/settings-screen";
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
  { id: "workout", label: "Workout", icon: Dumbbell },
  { id: "coach", label: "Coach", icon: Bot },
  { id: "progress", label: "Progress", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function AtlasApp() {
  const hydrated = useAtlasStore((state) => state.hydrated);
  const hydrate = useAtlasStore((state) => state.hydrate);
  const activeTab = useAtlasStore((state) => state.activeTab);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const hasOnboarded = useAtlasStore((state) => state.hasOnboarded);
  const theme = useAtlasStore((state) => state.theme);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const shouldDark = theme === "dark" || (theme === "system" && prefersDark);
    root.classList.toggle("dark", shouldDark);
    root.style.colorScheme = shouldDark ? "dark" : "light";
  }, [theme]);

  if (!hydrated) return <LoadingApp />;
  if (!hasOnboarded) return <Onboarding />;

  return (
    <div className="min-h-dvh bg-[#07080a] text-white selection:bg-emerald-300 selection:text-zinc-950">
      <PwaRegistrar />
      <div className="fixed inset-x-0 top-0 z-30 border-b border-white/10 bg-[#07080a]/82 pt-[env(safe-area-inset-top)] supports-[backdrop-filter]:backdrop-blur-xl">
        <header className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-emerald-300 font-bold text-zinc-950">
              A
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-white">Atlas AI Coach</p>
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
          <motion.div key={activeTab}>
            {activeTab === "dashboard" ? <DashboardScreen /> : null}
            {activeTab === "workout" ? <WorkoutScreen /> : null}
            {activeTab === "coach" ? <CoachScreen /> : null}
            {activeTab === "progress" ? <ProgressScreen /> : null}
            {activeTab === "settings" ? <SettingsScreen /> : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-[#08090b]/88 pb-[env(safe-area-inset-bottom)] supports-[backdrop-filter]:backdrop-blur-xl">
        <div className="mx-auto grid h-20 max-w-md grid-cols-5 px-2 md:max-w-xl">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = activeTab === item.id;
            return (
              <button
                className={cn(
                  "relative flex flex-col items-center justify-center gap-1 rounded-2xl text-[11px] font-medium transition",
                  active ? "text-emerald-200" : "text-zinc-500 hover:text-zinc-200",
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
    <main className="flex min-h-dvh items-center justify-center bg-[#07080a] p-4 text-white">
      <Card className="w-full max-w-sm p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-white/10" />
        <div className="mt-5 space-y-3">
          <div className="h-24 animate-pulse rounded-xl bg-white/10" />
          <div className="grid grid-cols-2 gap-3">
            <div className="h-20 animate-pulse rounded-xl bg-white/10" />
            <div className="h-20 animate-pulse rounded-xl bg-white/10" />
          </div>
        </div>
      </Card>
    </main>
  );
}
