"use client";

import React, { useEffect, useMemo } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { cn } from "@/lib/cn";

export function AiCopilotInsightBanner() {
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs || []);
  const workouts = useAtlasStore((state) => state.workouts || []);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const aiCopilotInsight = useAtlasStore((state) => state.aiCopilotInsight);
  const aiCopilotInsightLoading = useAtlasStore((state) => state.aiCopilotInsightLoading);
  const aiCopilotInsightError = useAtlasStore((state) => state.aiCopilotInsightError);
  const generateAiCopilotInsight = useAtlasStore((state) => state.generateAiCopilotInsight);

  // Calculate biometrics on client reactive to store changes
  const biometrics = useMemo(() => {
    const latestLog = recoveryLogs.at(-1);
    const completedWorkouts = workouts.filter((w) =>
      w.exercises.some((ex) => ex.sets.some((s) => s.completed))
    );
    const last3Workouts = completedWorkouts.slice(-3);
    const avgFatigue = last3Workouts.length
      ? last3Workouts.reduce((sum, w) => sum + (w.fatigueRating ?? 5), 0) / last3Workouts.length
      : 5;

    const sleepHours = latestLog?.sleepHours ?? 7.5;
    const sleepFactor = Math.min((sleepHours / 8) * 100, 100);

    const soreness = latestLog?.soreness ?? 4;
    const stress = latestLog?.stress ?? 3;
    const energy = latestLog?.energy ?? 7;

    const recoveryFactor = ((10 - soreness) + (10 - stress) + energy) / 3 * 10;
    const fatigueFactor = 100 - (avgFatigue * 10);
    const rollingCnsScore = Math.round(sleepFactor * 0.35 + recoveryFactor * 0.35 + fatigueFactor * 0.3);
    const finalScore = Math.min(Math.max(rollingCnsScore, 10), 100);

    // Count workouts this week
    const now = new Date();
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)));
    startOfWeek.setHours(0, 0, 0, 0);
    const workoutsThisWeek = completedWorkouts.filter((w) => {
      const wDate = new Date(w.completedAt || w.startedAt);
      return wDate >= startOfWeek;
    }).length;

    // Determine sore muscles
    const soreMuscles: string[] = [];
    if (soreness > 5) soreMuscles.push("lower body", "core");
    if (stress > 6) soreMuscles.push("upper body");

    return {
      cnsScore: finalScore,
      sleepHours,
      recoveryScore: Math.round(recoveryFactor),
      soreMuscles,
      activeWorkoutsCount: workoutsThisWeek,
    };
  }, [recoveryLogs, workouts]);

  const handleRefresh = () => {
    if (activeProviderId) {
      void generateAiCopilotInsight(biometrics);
    }
  };

  useEffect(() => {
    // Generate initially if empty and provider is set
    if (!aiCopilotInsight && !aiCopilotInsightLoading && activeProviderId) {
      void generateAiCopilotInsight(biometrics);
    }
  }, [aiCopilotInsight, activeProviderId, biometrics, generateAiCopilotInsight, aiCopilotInsightLoading]);

  if (!activeProviderId) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-card p-4 text-xs font-semibold text-zinc-550 dark:text-zinc-400 flex items-center gap-3">
        <Sparkles className="text-zinc-400 shrink-0" size={16} />
        <span>Set up an AI provider in Settings to generate Copilot Coach Insights.</span>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-fuchsia-500/[0.02] to-transparent p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="p-2 bg-violet-500/15 text-violet-500 rounded-xl shrink-0">
            <Sparkles size={16} className={aiCopilotInsightLoading ? "animate-pulse" : ""} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black tracking-wider uppercase text-violet-600 dark:text-violet-400">
                Coach Insight
              </span>
              {aiCopilotInsightLoading && (
                <span className="text-[9px] bg-violet-500/10 text-violet-500 font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                  Analyzing...
                </span>
              )}
            </div>

            {aiCopilotInsightLoading ? (
              <div className="mt-1.5 space-y-2">
                <div className="h-3.5 w-[280px] bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
                <div className="h-3.5 w-[200px] bg-zinc-200 dark:bg-zinc-800 rounded animate-pulse" />
              </div>
            ) : aiCopilotInsightError ? (
              <div className="mt-1.5 p-2 rounded-xl bg-red-500/10 border border-red-500/15 text-xs font-bold text-red-550 dark:text-red-400">
                {aiCopilotInsightError}
              </div>
            ) : (
              <p className="mt-1.5 text-xs sm:text-sm font-semibold text-zinc-800 dark:text-zinc-200 leading-relaxed">
                {aiCopilotInsight || "Ready to evaluate today's biometrics. Tap refresh to request coach feedback."}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleRefresh}
          disabled={aiCopilotInsightLoading}
          className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-500 hover:text-foreground hover:bg-zinc-50 dark:hover:bg-white/5 active:scale-95 transition-all cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
          title="Refresh Insight"
        >
          <RefreshCw
            size={14}
            className={cn("transition-transform duration-700", aiCopilotInsightLoading && "animate-spin")}
          />
        </button>
      </div>
    </div>
  );
}
