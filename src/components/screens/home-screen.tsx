"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TodayScreen } from "./today-screen";
import { DashboardScreen } from "./dashboard-screen";
import { CalendarCheck, BarChart3 } from "lucide-react";
import { useAtlasStore } from "@/store/useAtlasStore";

export function HomeScreen() {
  const subTab = useAtlasStore((state) => state.homeSubTab || "today");
  const setSubTab = useAtlasStore((state) => state.setHomeSubTab);

  return (
    <div className="space-y-6">
      {/* Top Segmented Tab Switcher */}
      <div className="flex justify-start">
        <div className="relative flex gap-1 rounded-2xl border border-surface-border bg-surface p-1 select-none w-full">
          <button
            type="button"
            onClick={() => setSubTab("today")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-200 min-h-[40px] cursor-pointer ${
              subTab === "today"
                ? "text-zinc-950"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {subTab === "today" && (
              <motion.span
                layoutId="active-home-tab"
                className="absolute inset-0 rounded-xl bg-emerald-300"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <CalendarCheck className="relative z-20 shrink-0" size={14} />
            <span className="relative z-20">Today</span>
          </button>

          <button
            type="button"
            onClick={() => setSubTab("analytics")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors duration-200 min-h-[40px] cursor-pointer ${
              subTab === "analytics"
                ? "text-zinc-950"
                : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {subTab === "analytics" && (
              <motion.span
                layoutId="active-home-tab"
                className="absolute inset-0 rounded-xl bg-emerald-300"
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
              />
            )}
            <BarChart3 className="relative z-20 shrink-0" size={14} />
            <span className="relative z-20">Analytics</span>
          </button>
        </div>
      </div>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === "today" ? <TodayScreen /> : <DashboardScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
