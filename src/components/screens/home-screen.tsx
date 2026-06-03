"use client";

import { motion, AnimatePresence } from "framer-motion";
import { TodayScreen } from "./today-screen";
import { DashboardScreen } from "./dashboard-screen";
import { AdvancedAnalyticsScreen } from "./advanced-analytics-screen";
import { CalendarCheck, BarChart3 } from "lucide-react";
import { useAtlasStore } from "@/store/useAtlasStore";

export function HomeScreen() {
  const subTab = useAtlasStore((state) => state.homeSubTab || "today");
  const setSubTab = useAtlasStore((state) => state.setHomeSubTab);
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const setGuidedMode = useAtlasStore((state) => state.setGuidedMode);

  return (
    <div className="space-y-6">
      {/* Top Segmented Tab Switcher + Mode Toggle */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <div className="relative flex gap-1 rounded-2xl border border-surface-border bg-surface p-1 select-none flex-1 sm:flex-initial sm:w-[280px]">
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

        {subTab === "analytics" && (
          <div className="relative flex gap-1 rounded-2xl border border-surface-border bg-surface p-1 select-none self-end sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => void setGuidedMode(true)}
              className={`relative z-10 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-colors duration-200 cursor-pointer min-h-[36px] flex items-center ${
                guidedMode
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {guidedMode && (
                <motion.span
                  layoutId="active-analytics-mode"
                  className="absolute inset-0 rounded-xl bg-emerald-300"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">Beginner 🌱</span>
            </button>

            <button
              type="button"
              onClick={() => void setGuidedMode(false)}
              className={`relative z-10 px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-xl transition-colors duration-200 cursor-pointer min-h-[36px] flex items-center ${
                !guidedMode
                  ? "text-zinc-950"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {!guidedMode && (
                <motion.span
                  layoutId="active-analytics-mode"
                  className="absolute inset-0 rounded-xl bg-emerald-300"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">Advanced ⚡</span>
            </button>
          </div>
        )}
      </div>

      {/* Page Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={subTab + (subTab === "analytics" ? `-${guidedMode}` : "")}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {subTab === "today" ? (
            <TodayScreen />
          ) : guidedMode ? (
            <DashboardScreen />
          ) : (
            <AdvancedAnalyticsScreen />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
