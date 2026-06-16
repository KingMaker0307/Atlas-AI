"use client";

import React, { useMemo } from "react";
import { Shield, Trophy, Dumbbell, Award, Lock, Sparkles, Moon, Zap } from "lucide-react";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Card } from "@/components/ui/card";

export function TrophiesCard() {
  const workouts = useAtlasStore((state) => state.workouts || []);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs || []);

  const stats = useMemo(() => {
    // 1. Calculate Cumulative Weight Volume
    let totalVolume = 0;
    let totalCompletedSets = 0;
    let totalRir = 0;
    let setsWithRirCount = 0;
    const trainedMuscles = new Set<string>();

    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((set) => {
          if (set.completed) {
            totalVolume += (set.reps || 0) * (set.weight || 0);
            totalCompletedSets++;
            if (set.rir !== undefined) {
              totalRir += set.rir;
              setsWithRirCount++;
            }
          }
        });

        // Track trained muscles (we can extract category or approximate based on standard lookup)
        const name = ex.exerciseId.toLowerCase();
        if (name.includes("chest") || name.includes("press") || name.includes("bench")) trainedMuscles.add("chest");
        if (name.includes("squat") || name.includes("leg") || name.includes("quad") || name.includes("lunge")) trainedMuscles.add("quads");
        if (name.includes("deadlift") || name.includes("hamstring") || name.includes("curl")) trainedMuscles.add("hamstrings");
        if (name.includes("pull") || name.includes("row") || name.includes("lat")) trainedMuscles.add("back");
        if (name.includes("curl") || name.includes("bicep")) trainedMuscles.add("biceps");
        if (name.includes("pushdown") || name.includes("tricep")) trainedMuscles.add("triceps");
        if (name.includes("lateral") || name.includes("shoulder") || name.includes("overhead")) trainedMuscles.add("shoulders");
        if (name.includes("crunch") || name.includes("plank") || name.includes("abs")) trainedMuscles.add("core");
      });
    });

    // 2. Average Sleep
    const avgSleep = recoveryLogs.length
      ? recoveryLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / recoveryLogs.length
      : 7.0;

    const avgRir = setsWithRirCount > 0 ? totalRir / setsWithRirCount : 2.5;
    const completedWorkoutsCount = workouts.filter(w => w.exercises.some(ex => ex.sets.some(s => s.completed))).length;

    // 3. CNS Archetype Calculation
    let archetype = {
      title: "Steady Burner",
      animal: "Wolf 🐺",
      color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
      description: `Consistent load management, steady progression (avg RIR: ${avgRir.toFixed(1)}). The perfect blueprint for long-term growth.`,
      icon: <Zap size={20} className="text-emerald-500" />,
    };

    if (avgSleep >= 7.8) {
      archetype = {
        title: "Rest Restorer",
        animal: "Bear 🐻",
        color: "text-sky-500 bg-sky-500/10 border-sky-500/20",
        description: `Prioritizes recovery and sleep hygiene (avg sleep: ${avgSleep.toFixed(1)}h). Your body is primed for optimal muscle hypertrophy.`,
        icon: <Moon size={20} className="text-sky-500" />,
      };
    } else if (setsWithRirCount > 0 && avgRir <= 1.5) {
      archetype = {
        title: "Over-Reacher",
        animal: "Panther 🐆",
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        description: `Consistently pushes sets close to total failure (avg RIR: ${avgRir.toFixed(1)}). Watch your fatigue triggers and scale volume.`,
        icon: <Trophy size={20} className="text-rose-500" />,
      };
    }

    // 4. Badges/Trophies Unlocks
    const badges = [
      {
        id: "titan_lifter",
        name: "Titan Lifter",
        emoji: "🏋️‍♂️",
        description: "Move 10,000 total kilograms/pounds",
        progress: totalVolume,
        target: 10000,
        unit: "kg",
        unlocked: totalVolume >= 10000,
      },
      {
        id: "consistency_shield",
        name: "Consistency Shield",
        emoji: "🛡️",
        description: "Log 10 workouts",
        progress: completedWorkoutsCount,
        target: 10,
        unit: "sessions",
        unlocked: completedWorkoutsCount >= 10,
      },
      {
        id: "mind_muscle",
        name: "Mind-Muscle Champion",
        emoji: "🧠",
        description: "Train 5 distinct muscle groups",
        progress: trainedMuscles.size,
        target: 5,
        unit: "groups",
        unlocked: trainedMuscles.size >= 5,
      },
    ];

    return {
      archetype,
      badges,
      totalVolume,
      completedWorkoutsCount,
    };
  }, [workouts, recoveryLogs]);

  const { archetype, badges } = stats;

  return (
    <Card className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-amber-500" />
          <h3 className="text-sm font-bold text-foreground">Archetype & Trophies</h3>
        </div>
        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-wider">Fitbit Profile</span>
      </div>

      {/* Archetype display */}
      <div className={`p-3.5 rounded-2xl border flex items-start gap-3 ${archetype.color}`}>
        <div className="p-2 bg-white/10 rounded-xl shrink-0">
          {archetype.icon}
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase tracking-wide">
              {archetype.title}
            </span>
            <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full">
              {archetype.animal}
            </span>
          </div>
          <p className="text-[11px] leading-relaxed mt-1 opacity-90">
            {archetype.description}
          </p>
        </div>
      </div>

      {/* Badges Grid */}
      <div className="space-y-2.5">
        {badges.map((badge) => {
          const progressPercent = Math.min((badge.progress / badge.target) * 100, 100);

          return (
            <div
              key={badge.id}
              className={`p-3 rounded-xl border flex items-center justify-between gap-4 transition-all duration-300 ${
                badge.unlocked
                  ? "bg-surface border-surface-border"
                  : "bg-zinc-500/[0.02] border-zinc-200/5 opacity-60"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Badge Icon */}
                <div
                  className={`h-10 w-10 rounded-full flex items-center justify-center text-xl shrink-0 shadow-sm relative ${
                    badge.unlocked
                      ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border border-zinc-200 dark:border-zinc-700"
                  }`}
                >
                  <span aria-hidden="true">{badge.emoji}</span>
                  {!badge.unlocked && (
                    <div className="absolute -bottom-1 -right-1 bg-zinc-200 dark:bg-zinc-700 p-0.5 rounded-full border border-zinc-350 dark:border-zinc-800 text-zinc-400">
                      <Lock size={8} />
                    </div>
                  )}
                </div>

                {/* Badge Info */}
                <div className="min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">{badge.name}</p>
                  <p className="text-[10px] text-zinc-500 leading-tight mt-0.5">{badge.description}</p>
                  
                  {/* Progress bar */}
                  {!badge.unlocked && (
                    <div className="mt-2 w-28 sm:w-36">
                      <div className="h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-amber-500 transition-all duration-300"
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-zinc-400 font-semibold mt-1">
                        {badge.progress.toLocaleString()} / {badge.target.toLocaleString()} {badge.unit}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {badge.unlocked && (
                <div className="flex items-center gap-1 text-[9px] font-black text-amber-500 uppercase tracking-wider bg-amber-500/10 px-2 py-1 rounded-lg shrink-0 border border-amber-500/20">
                  <Award size={10} />
                  Unlocked
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
}
