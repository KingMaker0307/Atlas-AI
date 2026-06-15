"use client";

import React, { useMemo } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { Sparkles, BrainCircuit, Activity, Clock, BatteryCharging } from "lucide-react";
import type { RecoveryLog, Workout } from "@/types/domain";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { cn } from "@/lib/cn";

// Safe responsive container to suppress initial Recharts layout frame size warnings
import { useEffect, useState, useRef } from "react";

function SafeResponsiveContainer({ children, height = "100%" }: { children: React.ReactNode; height?: string | number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return;
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) {
        setDimensions({ width, height });
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const heightStyle = typeof height === "number" ? `${height}px` : height;

  return (
    <div ref={containerRef} style={{ width: "100%", height: heightStyle, minWidth: 0, minHeight: 0, overflow: "hidden" }}>
      {dimensions && dimensions.width > 0 && dimensions.height > 0 ? (
        React.cloneElement(React.Children.only(children) as React.ReactElement<any>, {
          width: dimensions.width,
          height: dimensions.height,
        })
      ) : null}
    </div>
  );
}

interface CnsCircadianPlannerProps {
  recoveryLogs: RecoveryLog[];
  workouts: Workout[];
}

export function CnsCircadianPlanner({ recoveryLogs, workouts }: CnsCircadianPlannerProps) {
  // 1. Calculate Rolling CNS Readiness Score
  const cnsMetrics = useMemo(() => {
    const latestLog = recoveryLogs.at(-1);
    
    // Average workout fatigue of last 3 workouts (workouts fatigueRating is 1-10)
    const completedWorkouts = workouts.filter((w) => w.exercises.some((ex) => ex.sets.some((s) => s.completed)));
    const last3Workouts = completedWorkouts.slice(-3);
    const avgFatigue = last3Workouts.length
      ? last3Workouts.reduce((sum, w) => sum + (w.fatigueRating ?? 5), 0) / last3Workouts.length
      : 5;

    // Sleep factor: 8 hours target
    const sleepHours = latestLog?.sleepHours ?? 7.5;
    const sleepFactor = Math.min((sleepHours / 8) * 100, 100);

    // Recovery logs: energy, stress, soreness (scale 1-10)
    const soreness = latestLog?.soreness ?? 4;
    const stress = latestLog?.stress ?? 3;
    const energy = latestLog?.energy ?? 7;

    const recoveryFactor = ((10 - soreness) + (10 - stress) + energy) / 3 * 10;
    const fatigueFactor = 100 - (avgFatigue * 10);

    // Combine factors
    const rollingCnsScore = Math.round(sleepFactor * 0.35 + recoveryFactor * 0.35 + fatigueFactor * 0.3);
    const finalScore = Math.min(Math.max(rollingCnsScore, 10), 100);

    return {
      score: finalScore,
      sleepHours,
      avgFatigue: avgFatigue.toFixed(1),
      soreness,
      stress,
      energy,
    };
  }, [recoveryLogs, workouts]);

  // 2. Generate daily double-peak predicted energy curve (circadian model)
  // Modeled dynamically over a 24-hour cycle (sampling from 7:00 AM to 10:00 PM)
  const circadianChartData = useMemo(() => {
    const data = [];
    const cnsMultiplier = cnsMetrics.score / 100;

    for (let hour = 7; hour <= 22; hour++) {
      // Gaussian distribution peaks:
      // Peak 1: 10:30 AM (hour 10.5) - local morning peak
      // Dip: 2:00 PM (hour 14.0) - afternoon recovery dip
      // Peak 2: 5:30 PM (hour 17.5) - absolute performance peak
      const morningPeak = 0.45 * Math.exp(-Math.pow(hour - 10.5, 2) / 3);
      const afternoonDip = -0.15 * Math.exp(-Math.pow(hour - 14.0, 2) / 1.2);
      const eveningPeak = 0.65 * Math.exp(-Math.pow(hour - 17.5, 2) / 5);

      // Base energy level = 35%
      const baseEnergy = 35;
      const rawEnergy = baseEnergy + (morningPeak + afternoonDip + eveningPeak) * 60;
      const finalEnergyValue = Math.min(Math.max(Math.round(rawEnergy * cnsMultiplier), 5), 100);

      // Convert hour to readable AM/PM string
      const ampm = hour >= 12 ? (hour === 12 ? "12 PM" : `${hour - 12} PM`) : `${hour} AM`;

      data.push({
        time: ampm,
        hour,
        energy: finalEnergyValue,
      });
    }
    return data;
  }, [cnsMetrics.score]);

  // Find Peak Window (Peak 2 energy interval)
  const peakWindow = useMemo(() => {
    const sorted = [...circadianChartData].sort((a, b) => b.energy - a.energy);
    const topHour = sorted[0]?.hour ?? 17;
    const startHour = topHour - 1;
    const endHour = topHour + 1;

    const formatHour = (h: number) => {
      const displayHour = h > 12 ? h - 12 : h;
      const suffix = h >= 12 ? "PM" : "AM";
      return `${displayHour}:00 ${suffix}`;
    };

    return `${formatHour(startHour)} - ${formatHour(endHour)}`;
  }, [circadianChartData]);

  // Get visual theme based on CNS Readiness
  const statusConfig = useMemo(() => {
    const score = cnsMetrics.score;
    if (score >= 75) {
      return {
        badge: "Optimal CNS",
        desc: "Neural firing is at peak efficiency. Primed for strength training & heavy compounds.",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        stroke: "#10b981",
        fill: "url(#cnsGradEmerald)",
      };
    } else if (score >= 50) {
      return {
        badge: "Recovered Baseline",
        desc: "Normal capability. Execute standard workload. Standard rest intervals recommended.",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        stroke: "#f59e0b",
        fill: "url(#cnsGradAmber)",
      };
    } else {
      return {
        badge: "CNS Depressed / Sore",
        desc: "High central fatigue. Scale down weights by 30% or reschedule intense routines.",
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        stroke: "#f43f5e",
        fill: "url(#cnsGradRose)",
      };
    }
  }, [cnsMetrics.score]);

  return (
    <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4 relative overflow-hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-violet-500" size={17} />
          <h3 className="text-sm font-bold text-foreground text-left">CNS Circadian Energy Planner</h3>
        </div>
        <span className={cn("text-[9px] font-black uppercase px-2.5 py-1 rounded-lg border", statusConfig.color)}>
          {statusConfig.badge} ({cnsMetrics.score}%)
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-card-border/60 text-center">
          <span className="text-[9px] font-extrabold uppercase text-zinc-500 block">CNS Readiness</span>
          <span className="text-xl font-black text-foreground block mt-0.5">{cnsMetrics.score}%</span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-card-border/60 text-center">
          <span className="text-[9px] font-extrabold uppercase text-zinc-500 block">Sleep Hours</span>
          <span className="text-xl font-black text-foreground block mt-0.5">{cnsMetrics.sleepHours}h</span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-card-border/60 text-center">
          <span className="text-[9px] font-extrabold uppercase text-zinc-500 block">Workout Fatigue</span>
          <span className="text-xl font-black text-foreground block mt-0.5">{cnsMetrics.avgFatigue}/10</span>
        </div>
        <div className="bg-zinc-50 dark:bg-zinc-900/50 p-3 rounded-2xl border border-card-border/60 text-center">
          <span className="text-[9px] font-extrabold uppercase text-zinc-500 block">Energy Level</span>
          <span className="text-xl font-black text-foreground block mt-0.5">{cnsMetrics.energy}/10</span>
        </div>
      </div>

      <div className="h-44 w-full select-none">
        <SafeResponsiveContainer height="100%">
          <AreaChart data={circadianChartData} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="cnsGradEmerald" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cnsGradAmber" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="cnsGradRose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "var(--color-card)",
                border: "1px solid var(--color-card-border)",
                borderRadius: 16,
                fontSize: 10,
                fontWeight: "bold",
              }}
              formatter={(v) => [`${v}%`, "Predicted Energy"]}
            />
            <Area
              type="monotone"
              dataKey="energy"
              name="CNS Energy"
              stroke={statusConfig.stroke}
              strokeWidth={2.5}
              fill={statusConfig.fill}
            />
          </AreaChart>
        </SafeResponsiveContainer>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-card-border">
        <div className="flex items-center gap-2">
          <Clock className="text-violet-500 shrink-0" size={16} />
          <div className="text-left">
            <h4 className="text-[10px] font-black uppercase text-zinc-400">Peak Training Window</h4>
            <p className="text-xs font-bold text-foreground mt-0.5">{peakWindow}</p>
          </div>
        </div>
        <p className="text-[10px] text-zinc-555 font-semibold text-left max-w-xs leading-relaxed">
          {statusConfig.desc} Schedule compound lifts during this high-CNS activation window.
        </p>
      </div>
    </Card>
  );
}
