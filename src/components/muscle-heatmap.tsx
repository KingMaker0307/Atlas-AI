"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, Sparkles, Activity } from "lucide-react";
import type { Workout, MuscleGroup } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

interface MuscleHeatmapProps {
  workouts: Workout[];
  getExerciseById: (id: string) => any;
}

interface MuscleStatus {
  sets: number;
  label: "Under-trained / Sore" | "Active & Recovered" | "High-Volume Overload";
  colorClass: string;
  fillHex: string;
  gradientId: string;
}

export function MuscleHeatmap({ workouts, getExerciseById }: MuscleHeatmapProps) {
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // Calculate weekly sets per muscle group (last 7 days)
  const muscleVolumes = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const volumes: Record<string, number> = {
      chest: 0,
      back: 0,
      shoulders: 0,
      biceps: 0,
      triceps: 0,
      quads: 0,
      hamstrings: 0,
      glutes: 0,
      calves: 0,
      core: 0,
    };

    workouts
      .filter((w) => new Date(w.startedAt).getTime() >= weekAgo)
      .forEach((w) => {
        w.exercises.forEach((ex) => {
          const exDetail = getExerciseById(ex.exerciseId);
          const muscles = exDetail?.muscles || [];
          const completedSets = ex.sets.filter((s) => s.completed).length;
          if (completedSets === 0) return;

          muscles.forEach((m: string) => {
            const normalized = m.toLowerCase().trim();
            if (normalized in volumes) {
              // Direct primary muscle gets full count, indirect/secondary gets same credit
              volumes[normalized] += completedSets;
            }
          });
        });
      });

    return volumes;
  }, [workouts, getExerciseById]);

  // Determine status and color scheme for each muscle
  const getMuscleStatus = (muscleKey: string): MuscleStatus => {
    const sets = muscleVolumes[muscleKey] || 0;
    if (sets === 0) {
      return {
        sets,
        label: "Under-trained / Sore",
        colorClass: "from-rose-500/10 to-rose-500/20 text-rose-500 dark:text-rose-400 border-rose-550/20",
        fillHex: "#f43f5e",
        gradientId: "grad-rose",
      };
    } else if (sets < 6) {
      return {
        sets,
        label: "Under-trained / Sore",
        colorClass: "from-rose-500/20 to-rose-600/30 text-rose-500 dark:text-rose-400 border-rose-550/20",
        fillHex: "#fb7185",
        gradientId: "grad-rose",
      };
    } else if (sets <= 12) {
      return {
        sets,
        label: "Active & Recovered",
        colorClass: "from-emerald-500/20 to-emerald-600/30 text-emerald-600 dark:text-emerald-400 border-emerald-550/20",
        fillHex: "#10b981",
        gradientId: "grad-emerald",
      };
    } else {
      return {
        sets,
        label: "High-Volume Overload",
        colorClass: "from-amber-500/20 to-amber-600/30 text-amber-600 dark:text-amber-400 border-amber-550/20",
        fillHex: "#f59e0b",
        gradientId: "grad-amber",
      };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setTooltipPos({
      x: e.clientX - rect.left + 15,
      y: e.clientY - rect.top - 20,
    });
  };

  // SVGs definitions with precise geometric outlines representing human muscles
  // Viewbox: 0 0 200 400
  return (
    <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4 relative overflow-hidden select-none">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="text-violet-500 animate-pulse" size={17} />
          <h3 className="text-sm font-bold text-foreground">Dynamic Muscle Heatmap</h3>
        </div>
        <span className="text-[10px] text-zinc-400 font-semibold flex items-center gap-1">
          <Sparkles size={11} className="text-amber-500" />
          Live weekly volume (last 7d)
        </span>
      </div>

      <div
        className="relative grid grid-cols-2 gap-4 justify-items-center max-w-sm mx-auto bg-zinc-50/40 dark:bg-zinc-900/40 p-4 rounded-2xl border border-card-border"
        onMouseMove={handleMouseMove}
      >
        {/* Anterior View */}
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Anterior</span>
          <svg width="120" height="240" viewBox="0 0 100 200" className="overflow-visible">
            <defs>
              <linearGradient id="grad-rose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fda4af" />
                <stop offset="100%" stopColor="#f43f5e" />
              </linearGradient>
              <linearGradient id="grad-emerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a7f3d0" />
                <stop offset="100%" stopColor="#10b981" />
              </linearGradient>
              <linearGradient id="grad-amber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fde68a" />
                <stop offset="100%" stopColor="#f59e0b" />
              </linearGradient>
            </defs>

            {/* Base Body Silhouette */}
            <path
              d="M 50 15 C 53 15 56 18 56 22 C 56 26 53 29 50 29 C 47 29 44 26 44 22 C 44 18 47 15 50 15 M 42 29 L 58 29 L 60 35 L 68 40 L 74 65 L 70 85 L 66 110 L 68 135 L 66 160 L 64 185 L 59 195 L 51 195 L 50 135 L 49 195 L 41 195 L 36 185 L 34 160 L 32 135 L 34 110 L 30 85 L 26 65 L 32 40 L 40 35 Z"
              fill="none"
              stroke="var(--color-card-border)"
              strokeWidth="1.5"
            />

            {/* Head (neutral) */}
            <circle cx="50" cy="22" r="7" className="fill-zinc-200 dark:fill-zinc-800" stroke="var(--color-card-border)" strokeWidth="1" />

            {/* shoulders (left/right delts) */}
            <path
              d="M 32 40 C 30 45 28 55 29 62 C 31 62 34 52 38 43 Z"
              fill={`url(#${getMuscleStatus("shoulders").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("shoulders")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 68 40 C 70 45 72 55 71 62 C 69 62 66 52 62 43 Z"
              fill={`url(#${getMuscleStatus("shoulders").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("shoulders")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Chest */}
            <path
              d="M 39 42 C 44 42 47 43 49 48 C 49 57 44 60 38 58 C 37 50 38 45 39 42 Z"
              fill={`url(#${getMuscleStatus("chest").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("chest")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 61 42 C 56 42 53 43 51 48 C 51 57 56 60 62 58 C 63 50 62 45 61 42 Z"
              fill={`url(#${getMuscleStatus("chest").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("chest")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* biceps */}
            <path
              d="M 28 62 C 27 68 26 76 27 82 C 28 82 30 76 31 68 Z"
              fill={`url(#${getMuscleStatus("biceps").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("biceps")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 72 62 C 73 68 74 76 73 82 C 72 82 70 76 69 68 Z"
              fill={`url(#${getMuscleStatus("biceps").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("biceps")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Core (Abs) */}
            <path
              d="M 40 61 L 60 61 L 58 92 L 50 98 L 42 92 Z"
              fill={`url(#${getMuscleStatus("core").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("core")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Quads */}
            <path
              d="M 33 103 C 35 115 37 135 39 146 C 44 146 47 135 48 115 C 47 108 42 101 33 103 Z"
              fill={`url(#${getMuscleStatus("quads").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("quads")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 67 103 C 65 115 63 135 61 146 C 56 146 53 135 52 115 C 53 108 58 101 67 103 Z"
              fill={`url(#${getMuscleStatus("quads").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("quads")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Calves (front view) */}
            <path
              d="M 35 156 C 35 166 36 178 38 188 L 43 188 C 42 178 40 166 39 156 Z"
              fill={`url(#${getMuscleStatus("calves").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("calves")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 65 156 C 65 166 64 178 62 188 L 57 188 C 58 178 60 166 61 156 Z"
              fill={`url(#${getMuscleStatus("calves").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("calves")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
          </svg>
        </div>

        {/* Posterior View */}
        <div className="flex flex-col items-center space-y-1">
          <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Posterior</span>
          <svg width="120" height="240" viewBox="0 0 100 200" className="overflow-visible">
            {/* Base Body Silhouette */}
            <path
              d="M 50 15 C 53 15 56 18 56 22 C 56 26 53 29 50 29 C 47 29 44 26 44 22 C 44 18 47 15 50 15 M 42 29 L 58 29 L 60 35 L 68 40 L 74 65 L 70 85 L 66 110 L 68 135 L 66 160 L 64 185 L 59 195 L 51 195 L 50 135 L 49 195 L 41 195 L 36 185 L 34 160 L 32 135 L 34 110 L 30 85 L 26 65 L 32 40 L 40 35 Z"
              fill="none"
              stroke="var(--color-card-border)"
              strokeWidth="1.5"
            />

            {/* Head (neutral) */}
            <circle cx="50" cy="22" r="7" className="fill-zinc-200 dark:fill-zinc-800" stroke="var(--color-card-border)" strokeWidth="1" />

            {/* Shoulders (rear delts) */}
            <path
              d="M 33 40 C 31 45 29 53 31 59 C 33 59 36 51 38 43 Z"
              fill={`url(#${getMuscleStatus("shoulders").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("shoulders")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 67 40 C 69 45 71 53 69 59 C 67 59 64 51 62 43 Z"
              fill={`url(#${getMuscleStatus("shoulders").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("shoulders")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Back (Upper back, traps, lats) */}
            <path
              d="M 39 42 C 45 42 49 46 50 50 C 51 46 55 42 61 42 C 60 52 57 74 50 82 C 43 74 40 52 39 42 Z"
              fill={`url(#${getMuscleStatus("back").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("back")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Triceps */}
            <path
              d="M 27 59 C 26 67 25 75 26 80 C 27 80 29 74 30 66 Z"
              fill={`url(#${getMuscleStatus("triceps").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("triceps")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 73 59 C 74 67 75 75 74 80 C 73 80 71 74 70 66 Z"
              fill={`url(#${getMuscleStatus("triceps").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("triceps")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Glutes */}
            <path
              d="M 35 98 C 42 98 47 101 49 109 C 47 114 41 118 34 114 C 33 108 34 102 35 98 Z"
              fill={`url(#${getMuscleStatus("glutes").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("glutes")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 65 98 C 58 98 53 101 51 109 C 53 114 59 118 66 114 C 67 108 66 102 65 98 Z"
              fill={`url(#${getMuscleStatus("glutes").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("glutes")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Hamstrings */}
            <path
              d="M 34 115 C 38 116 41 120 42 128 C 42 138 39 148 38 152 C 36 142 34 125 34 115 Z"
              fill={`url(#${getMuscleStatus("hamstrings").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("hamstrings")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 66 115 C 62 116 59 120 58 128 C 58 138 61 148 62 152 C 64 142 66 125 66 115 Z"
              fill={`url(#${getMuscleStatus("hamstrings").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("hamstrings")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />

            {/* Calves (rear view) */}
            <path
              d="M 37 154 C 39 164 41 176 43 186 H 39 C 38 176 36 164 36 154 Z"
              fill={`url(#${getMuscleStatus("calves").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("calves")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
            <path
              d="M 63 154 C 61 164 59 176 57 186 H 61 C 62 176 64 164 64 154 Z"
              fill={`url(#${getMuscleStatus("calves").gradientId})`}
              stroke="var(--color-card-border)"
              strokeWidth="0.8"
              className="cursor-pointer hover:opacity-80 transition"
              onMouseEnter={() => setHoveredMuscle("calves")}
              onMouseLeave={() => setHoveredMuscle(null)}
            />
          </svg>
        </div>

        {/* Hover Tooltip Overlay */}
        <AnimatePresence>
          {hoveredMuscle && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="absolute z-50 pointer-events-none p-3.5 rounded-xl border border-card-border bg-card/95 backdrop-blur shadow-lg text-left w-44"
              style={{ left: tooltipPos.x, top: tooltipPos.y }}
            >
              <p className="text-[10px] font-black uppercase tracking-wider text-zinc-400">Muscle Target</p>
              <h4 className="text-xs font-bold text-foreground capitalize mt-0.5">{hoveredMuscle}</h4>
              <div className="flex justify-between items-center mt-2 pt-1.5 border-t border-card-border/60">
                <span className="text-[10px] text-zinc-500 font-semibold">Weekly sets:</span>
                <span className="text-xs font-black text-emerald-500 tabular-nums">
                  {muscleVolumes[hoveredMuscle] || 0}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <div
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ backgroundColor: getMuscleStatus(hoveredMuscle).fillHex }}
                />
                <span className="text-[9px] font-bold text-zinc-650 dark:text-zinc-350 truncate">
                  {getMuscleStatus(hoveredMuscle).label}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Heatmap Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] pt-1 select-none">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-rose-400 to-rose-500 inline-block shrink-0" />
          <span className="text-zinc-650 dark:text-zinc-350 font-bold">Under-trained / Sore (&lt;6)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-emerald-400 to-emerald-500 inline-block shrink-0" />
          <span className="text-zinc-650 dark:text-zinc-350 font-bold">Active / Primed (6-12)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-gradient-to-br from-amber-400 to-amber-500 inline-block shrink-0" />
          <span className="text-zinc-650 dark:text-zinc-350 font-bold">High Overload (&gt;12 sets)</span>
        </div>
      </div>
      <div className="p-3 rounded-2xl bg-violet-500/5 border border-violet-550/10 flex items-start gap-2">
        <Info size={13} className="text-violet-500 shrink-0 mt-0.5" />
        <p className="text-[10px] text-zinc-555 font-semibold leading-relaxed">
          Tapping muscles filters routines. Green indicates optimal hypertrophy maintenance (6-12 weekly sets). High-volume overload (&gt;12 sets) requires extra sleep to prevent joint strains.
        </p>
      </div>
    </Card>
  );
}
