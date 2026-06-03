"use client";

import { useState, useMemo, useEffect, type FC } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Info,
  ChevronDown,
  ChevronUp,
  Beef,
  Wheat,
  Droplets,
  Leaf,
  BarChart3,
  Shield,
  Activity,
} from "lucide-react";

import { Card, Surface } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAtlasStore } from "@/store/useAtlasStore";
import { calculateNutritionTargets } from "@/lib/calculators";

// Helper to format Date as YYYY-MM-DD
const getLocalDateString = (dateOrStr: Date | string) => {
  const d = typeof dateOrStr === "string" ? new Date(dateOrStr) : dateOrStr;
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

// ─── Radial Progress Ring ────────────────────────────────────────
const RingProgress: FC<{ value: number; max: number; className?: string; size?: number; strokeWidth?: number }> = ({
  value, max, className, size = 56, strokeWidth = 5,
}) => {
  const pct = Math.min(value / max, 1);
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * pct;

  return (
    <svg width={size} height={size} className="rotate-[-90deg] shrink-0" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={r} className="fill-none stroke-zinc-200 dark:stroke-zinc-800/80" strokeWidth={strokeWidth} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        className={cn("stroke-emerald-600 dark:stroke-emerald-400", className)}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - dash }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
    </svg>
  );
};

// ─── Macro Bar ───────────────────────────────────────────────────
const MacroBar: FC<{ label: string; value: number; max: number; unit: string; color: string; icon: FC<any>; iconColor: string; tooltip?: string }> = ({
  label, value, max, unit, color, icon: Icon, iconColor, tooltip,
}) => {
  const guidedMode = useAtlasStore((s) => s.guidedMode);
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <Icon size={13} className={iconColor} aria-hidden="true" />
          <span className="font-semibold text-zinc-900 dark:text-white">{label}</span>
          {guidedMode && tooltip && (
            <span className="text-[10px] text-zinc-500 font-medium font-sans select-none" title={tooltip}>
              ({tooltip})
            </span>
          )}
        </div>
        <span className={cn("font-sans tabular-nums font-semibold", isOver ? "text-rose-700 dark:text-rose-500" : "text-zinc-700 dark:text-zinc-300")}>
          {value.toFixed(1)}<span className="font-normal text-zinc-600 dark:text-zinc-400">/{max}{unit}</span>
        </span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800/80 overflow-hidden" aria-hidden="true">
        <motion.div
          className={cn("h-full rounded-full", isOver ? "bg-rose-500" : color)}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </div>
    </div>
  );
};

// ─── Micro Badge ─────────────────────────────────────────────────
const MicroBadge: FC<{ label: string; value: number; max: number; unit: string; className: string }> = ({
  label, value, max, unit, className,
}) => {
  const pct = Math.min((value / max) * 100, 100);
  const isOver = value > max;

  return (
    <Surface className="flex flex-col items-center gap-1.5 p-3 text-center bg-zinc-50/20 dark:bg-zinc-900/40">
      <div className="relative">
        <RingProgress value={value} max={max} className={isOver ? "stroke-rose-600 dark:stroke-rose-500" : className} size={50} strokeWidth={4.5} />
        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-foreground">
          {Math.round(pct)}%
        </span>
      </div>
      <div>
        <p className="text-[11px] font-bold text-zinc-900 dark:text-white leading-tight">{label}</p>
        <p className="text-[10px] font-sans tabular-nums font-semibold text-zinc-750 dark:text-zinc-300 mt-0.5">{value.toFixed(0)}/{max}{unit}</p>
      </div>
    </Surface>
  );
};

export function NutritionAnalyticsScreen() {
  const profile = useAtlasStore((s) => s.profile);
  const workouts = useAtlasStore((s) => s.workouts);
  const weightUnit = useAtlasStore((s) => s.weightUnit);
  const guidedMode = useAtlasStore((s) => s.guidedMode);
  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries || []);
  const waterLogs = useAtlasStore((s) => s.waterLogs || []);
  const setActiveSubScreen = useAtlasStore((s) => s.setActiveSubScreen);

  // local tab selector for the subscreen metrics
  const [subTab, setSubTab] = useState<"trends" | "micros">("trends");

  // Date selection state for day-specific target calculations (macro splits and micros)
  const [selectedDate, setSelectedDate] = useState<Date>(() => new Date());

  const targetDateString = useMemo(() => {
    return getLocalDateString(selectedDate);
  }, [selectedDate]);

  // Account creation date calculation (same logic as tracker)
  const accountCreatedDateString = useMemo(() => {
    let earliestDate = new Date();
    earliestDate.setDate(earliestDate.getDate() - 30);

    if (profile?.createdAt) {
      try {
        const d = new Date(profile.createdAt);
        if (!isNaN(d.getTime())) {
          earliestDate = d;
        }
      } catch (e) {}
    }

    if (nutritionEntries && nutritionEntries.length > 0) {
      nutritionEntries.forEach((e) => {
        try {
          const d = new Date(e.timestamp);
          if (!isNaN(d.getTime()) && d < earliestDate) {
            earliestDate = d;
          }
        } catch (err) {}
      });
    }

    if (waterLogs && waterLogs.length > 0) {
      waterLogs.forEach((w) => {
        try {
          const d = new Date(w.timestamp);
          if (!isNaN(d.getTime()) && d < earliestDate) {
            earliestDate = d;
          }
        } catch (err) {}
      });
    }

    return getLocalDateString(earliestDate);
  }, [profile?.createdAt, nutritionEntries, waterLogs]);

  const canNavigateBack = useMemo(() => {
    return targetDateString > accountCreatedDateString;
  }, [targetDateString, accountCreatedDateString]);

  const dateLabel = useMemo(() => {
    const todayStr = getLocalDateString(new Date());
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    const selectedStr = getLocalDateString(selectedDate);

    if (selectedStr === todayStr) return "Today";
    if (selectedStr === yesterdayStr) return "Yesterday";
    
    return selectedDate.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }, [selectedDate]);

  const isTodaySelected = useMemo(() => {
    return getLocalDateString(selectedDate) === getLocalDateString(new Date());
  }, [selectedDate]);

  const navigateDayOffset = (offset: number) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + offset);
      const nextStr = getLocalDateString(next);
      if (nextStr < accountCreatedDateString) return prev;
      if (nextStr > getLocalDateString(new Date())) return prev;
      return next;
    });
  };

  const targets = useMemo(() => calculateNutritionTargets(profile), [profile]);

  const activeEntries = useMemo(() => {
    return nutritionEntries.filter((e) => getLocalDateString(e.timestamp) === targetDateString);
  }, [nutritionEntries, targetDateString]);

  const activeWaterLogs = useMemo(() => {
    return waterLogs.filter((w) => getLocalDateString(w.timestamp) === targetDateString);
  }, [waterLogs, targetDateString]);

  const activeWorkouts = useMemo(() => {
    return workouts.filter((w) => {
      if (!w.completedAt) return false;
      return getLocalDateString(w.completedAt) === targetDateString;
    });
  }, [workouts, targetDateString]);

  const totals = useMemo(() => {
    return activeEntries.reduce(
      (acc, e) => ({
        calories: acc.calories + e.calories,
        protein: acc.protein + e.protein,
        carbs: acc.carbs + e.carbs,
        fat: acc.fat + e.fat,
        fiber: acc.fiber + e.fiber,
        sugar: acc.sugar + e.sugar,
        sodium: acc.sodium + e.sodium,
        potassium: acc.potassium + e.potassium,
        vitaminC: acc.vitaminC + e.vitaminC,
        calcium: acc.calcium + e.calcium,
        iron: acc.iron + e.iron,
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0, sodium: 0, potassium: 0, vitaminC: 0, calcium: 0, iron: 0 }
    );
  }, [activeEntries]);

  const burnedCalories = useMemo(() => {
    return activeWorkouts.reduce((sum, w) => {
      const duration = w.durationMinutes || 0;
      return sum + Math.round(duration * 6);
    }, 0);
  }, [activeWorkouts]);

  const remainingCals = useMemo(() => {
    return Math.max(targets.calories - totals.calories + burnedCalories, 0);
  }, [targets.calories, totals.calories, burnedCalories]);

  const [showCaloricEngineGuide, setShowCaloricEngineGuide] = useState(false);
  const [activeGuideGoal, setActiveGuideGoal] = useState<"lose" | "gain" | "maintain">("lose");

  useEffect(() => {
    if (targets.goalType) {
      setActiveGuideGoal(targets.goalType);
    }
  }, [targets.goalType]);

  const trendsData = useMemo(() => {
    const getStatsForDays = (daysCount: number) => {
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - daysCount);
      const limitStr = getLocalDateString(limitDate);

      const filteredFoods = nutritionEntries.filter((e) => getLocalDateString(e.timestamp) >= limitStr);
      const filteredWater = waterLogs.filter((w) => getLocalDateString(w.timestamp) >= limitStr);

      const uniqueDays = new Set([
        ...filteredFoods.map((e) => getLocalDateString(e.timestamp)),
        ...filteredWater.map((w) => getLocalDateString(w.timestamp)),
      ]);
      const daysLogged = Math.max(uniqueDays.size, 1);

      const foodTotals = filteredFoods.reduce(
        (acc, e) => ({
          calories: acc.calories + e.calories,
          protein: acc.protein + e.protein,
          carbs: acc.carbs + e.carbs,
          fat: acc.fat + e.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );

      const waterTotal = filteredWater.reduce((sum, w) => sum + w.amount, 0);

      return {
        avgCalories: Math.round(foodTotals.calories / daysLogged),
        avgProtein: Math.round(foodTotals.protein / daysLogged),
        avgCarbs: Math.round(foodTotals.carbs / daysLogged),
        avgFat: Math.round(foodTotals.fat / daysLogged),
        avgWater: Math.round(waterTotal / daysLogged),
        daysLogged: uniqueDays.size,
      };
    };

    return {
      last7Days: getStatsForDays(7),
      last30Days: getStatsForDays(30),
      last12Months: getStatsForDays(365),
    };
  }, [nutritionEntries, waterLogs]);

  const getTopMicroSources = (micro: "sodium" | "potassium" | "vitaminC" | "calcium" | "iron") => {
    return [...activeEntries]
      .filter((e) => e[micro] > 0)
      .sort((a, b) => b[micro] - a[micro])
      .slice(0, 3);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-6 pb-28"
    >
      {/* ─── Header & Back Navigation ─── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 p-0 rounded-xl"
            onClick={() => setActiveSubScreen(null)}
            aria-label="Back to nutrition tracker"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <p className="text-sm text-zinc-555">
              Nutrition metrics, targets &amp; history
            </p>
            <h1 className="mt-0.5 text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              Nutrition Analytics
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-bold text-zinc-600 dark:text-zinc-400">
          <BarChart3 className="text-emerald-500" size={14} />
          <span>{nutritionEntries.length} Food Logs Indexed</span>
        </div>
      </section>

      {/* ─── Standardized Date Picker Control (Infinite Date Navigation) ─── */}
      <div className="flex items-center justify-between p-1 bg-input border border-input-border rounded-2xl select-none">
        <button
          onClick={() => navigateDayOffset(-1)}
          disabled={!canNavigateBack}
          aria-label="Previous day"
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-xl transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            !canNavigateBack
              ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
              : "hover:bg-white dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white"
          )}
        >
          <ChevronLeft size={16} />
        </button>

        {/* Clickable center to trigger Date Input Calendar picker */}
        <div className="relative">
          <input
            type="date"
            min={accountCreatedDateString}
            max={getLocalDateString(new Date())}
            value={getLocalDateString(selectedDate)}
            onChange={(e) => {
              if (e.target.value) {
                const valStr = e.target.value;
                if (valStr >= accountCreatedDateString && valStr <= getLocalDateString(new Date())) {
                  setSelectedDate(new Date(valStr + "T12:00:00"));
                }
              }
            }}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
            aria-label="Select custom date"
          />
          <button
            type="button"
            className="h-9 px-3 gap-1.5 flex items-center justify-center rounded-xl bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-455 shadow-sm border border-input-border text-xs font-bold uppercase tracking-wider focus-visible:outline-none"
          >
            <Calendar size={13} aria-hidden="true" />
            <span>{dateLabel}</span>
          </button>
        </div>

        <button
          onClick={() => navigateDayOffset(1)}
          disabled={isTodaySelected}
          aria-label="Next day"
          className={cn(
            "h-9 w-9 flex items-center justify-center rounded-xl transition active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
            isTodaySelected
              ? "text-zinc-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
              : "hover:bg-white dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-300 hover:text-zinc-955 dark:hover:text-white"
          )}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Sub-tab switcher inside subscreen */}
      <div className="flex gap-1 p-1 bg-input border border-input-border rounded-2xl select-none" role="tablist" aria-label="Nutrition analytics navigation">
        {[
          { id: "trends" as const, label: "Trends & Targets", icon: BarChart3 },
          ...(!guidedMode ? [{ id: "micros" as const, label: "Micronutrients", icon: Shield }] : []),
        ].map((tab) => {
          const Icon = tab.icon;
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              onClick={() => setSubTab(tab.id)}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-background active:scale-[0.98]",
                active
                  ? "bg-card text-emerald-455 shadow-sm"
                  : "text-zinc-750 hover:text-zinc-955"
              )}
            >
              <Icon size={14} className="shrink-0" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={subTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="space-y-4"
        >
          {subTab === "trends" && (
            <div className="space-y-4">
              {/* Caloric objectives demystified */}
              <Card className="overflow-hidden">
                <button
                  aria-expanded={showCaloricEngineGuide}
                  onClick={() => setShowCaloricEngineGuide(!showCaloricEngineGuide)}
                  className="w-full flex items-center justify-between p-4 hover:bg-surface/50 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-lg bg-emerald-450/10 flex items-center justify-center text-emerald-450 shrink-0">
                      <Info size={14} aria-hidden="true" />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold text-zinc-955">🧬 Caloric Objectives Demystified</p>
                      <p className="text-[10px] text-zinc-750">Tap to expand deficit, surplus &amp; maintenance breakdowns</p>
                    </div>
                  </div>
                  {showCaloricEngineGuide ? <ChevronUp size={16} className="text-zinc-750" /> : <ChevronDown size={16} className="text-zinc-750" />}
                </button>

                <AnimatePresence>
                  {showCaloricEngineGuide && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden border-t border-card-border"
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex gap-1 p-1 bg-surface border border-surface-border rounded-xl select-none">
                          {[
                            { id: "lose" as const, label: "Weight Loss" },
                            { id: "gain" as const, label: "Muscle Gain" },
                            { id: "maintain" as const, label: "Maintenance" },
                          ].map((tab) => {
                            const active = activeGuideGoal === tab.id;
                            const matchesUserGoal = targets.goalType === tab.id;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveGuideGoal(tab.id)}
                                className={cn(
                                  "flex-1 py-1.5 rounded-lg text-[10px] font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                                  active
                                    ? "bg-card text-emerald-450 shadow-sm font-bold"
                                    : "text-zinc-750 hover:text-zinc-955"
                                )}
                              >
                                {tab.label} {matchesUserGoal && "⭐"}
                              </button>
                            );
                          })}
                        </div>
                        <p className="text-[9px] text-zinc-750 italic text-center select-none">
                          ⭐ denotes your active target, dynamically matched from your profile goal: <strong className="text-zinc-955 capitalize">{profile?.goal || "Not Set"}</strong>.
                        </p>

                        <Surface className="p-3.5 space-y-3 bg-surface/50">
                          {activeGuideGoal === "lose" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-955">
                                <span>Caloric Deficit</span>
                                <span className="font-mono text-rose-455">TDEE − 500 kcal</span>
                              </div>
                              <p className="text-[11px] text-zinc-750 leading-relaxed">
                                <strong>What is it?</strong> To reduce weight, you must feed your body less energy than it expends. This forces tissues to draw from stored body fat to cover the daily energy gap.
                              </p>
                              <div className="border-t border-card-border/60 pt-2 space-y-1 text-[11px] text-zinc-750 leading-relaxed">
                                <p>💪 <strong>Action Plan:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                  <li>Stay near your deficit target of <strong>{(targets.tdee - 500).toLocaleString()} kcal</strong> daily.</li>
                                  <li>Prioritize Protein (<strong>{targets.protein}g</strong>) to prevent the body from breaking down muscle tissues.</li>
                                  <li>Losing 0.5 to 1.5 lbs per week is the safe, sustainable benchmark.</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {activeGuideGoal === "gain" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-955">
                                <span>Caloric Surplus</span>
                                <span className="font-mono text-emerald-455">TDEE + 300 kcal</span>
                              </div>
                              <p className="text-[11px] text-zinc-750 leading-relaxed">
                                <strong>What is it?</strong> Creating new muscle fibers requires extra raw energy. A moderate caloric surplus provides the necessary building materials for tissue synthesis and training energy.
                              </p>
                              <div className="border-t border-card-border/60 pt-2 space-y-1 text-[11px] text-zinc-750 leading-relaxed">
                                <p>🏋️ <strong>Action Plan:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                  <li>Stay near your surplus target of <strong>{(targets.tdee + 300).toLocaleString()} kcal</strong> daily.</li>
                                  <li>Maintain a steady, progressive resistance training routine to signal muscle growth.</li>
                                  <li>Gaining 0.5 to 1.0 lb per week avoids excessive fat accumulation.</li>
                                </ul>
                              </div>
                            </div>
                          )}

                          {activeGuideGoal === "maintain" && (
                            <div className="space-y-2">
                              <div className="flex justify-between items-center text-xs font-bold text-zinc-955">
                                <span>Caloric Maintenance</span>
                                <span className="font-mono text-sky-500 dark:text-sky-400">TDEE kcal</span>
                              </div>
                              <p className="text-[11px] text-zinc-750 leading-relaxed">
                                <strong>What is it?</strong> Feeding your body exactly what it burns maintains body mass and composition. Perfect for metabolic recovery or physique recomp (building muscle while shedding fat).
                              </p>
                              <div className="border-t border-card-border/60 pt-2 space-y-1 text-[11px] text-zinc-750 leading-relaxed">
                                <p>⚖️ <strong>Action Plan:</strong></p>
                                <ul className="list-disc pl-4 space-y-1 mt-1">
                                  <li>Aim for your maintenance target of <strong>{targets.tdee.toLocaleString()} kcal</strong> daily.</li>
                                  <li>Supports sustained athletic progression and recovery without bodyweight alterations.</li>
                                </ul>
                              </div>
                            </div>
                          )}
                        </Surface>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>

              {/* Energy Formula & Budget calculations */}
              <Card className="p-4 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-750">Energy Balance Formula</h4>
                
                <div className="grid grid-cols-7 items-center justify-between text-center bg-surface/50 border border-surface-border p-3.5 rounded-xl text-zinc-955 select-none">
                  <div>
                    <p className="text-[10px] font-bold text-zinc-750">Budget</p>
                    <p className="text-sm font-bold mt-1 font-sans tabular-nums">{targets.calories}</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400" aria-hidden="true">−</span>
                  <div>
                    <p className="text-[10px] font-bold text-rose-455">Food</p>
                    <p className="text-sm font-bold text-rose-455 mt-1 font-sans tabular-nums">{totals.calories}</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400" aria-hidden="true">+</span>
                  <div>
                    <p className="text-[10px] font-bold text-amber-455">Burned</p>
                    <p className="text-sm font-bold text-amber-455 mt-1 font-sans tabular-nums">{burnedCalories}</p>
                  </div>
                  <span className="text-xs font-bold text-zinc-400" aria-hidden="true">=</span>
                  <div>
                    <p className="text-[10px] font-bold text-emerald-455">Left</p>
                    <p className="text-sm font-bold text-emerald-455 mt-1 font-sans tabular-nums">{remainingCals}</p>
                  </div>
                </div>

                <div className="divide-y divide-card-border text-[11px] pt-1">
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-zinc-750">Basal Metabolic Rate (BMR)</span>
                    <span className="font-mono text-zinc-750">{targets.bmr} kcal/day</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-semibold text-zinc-750">Physical Activity Multiplier (1.55x)</span>
                    <span className="font-mono text-zinc-750">+{targets.tdee - targets.bmr} kcal/day</span>
                  </div>
                  <div className="flex justify-between py-2 items-center">
                    <span className="font-bold text-zinc-955">Baseline Expenditure (TDEE)</span>
                    <span className="font-sans tabular-nums font-bold text-emerald-455">{targets.tdee} kcal/day</span>
                  </div>
                </div>
              </Card>

              {/* Dynamic Target Macro splits */}
              <Card className="p-4 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-750">Macronutrient Target Split</h4>
                <div className="space-y-4">
                  <MacroBar label="Protein" value={totals.protein} max={targets.protein} unit="g" color="bg-blue-455" icon={Beef} iconColor="text-blue-455" tooltip="helps build muscle 💪" />
                  <MacroBar label="Carbohydrates" value={totals.carbs} max={targets.carbs} unit="g" color="bg-amber-450" icon={Wheat} iconColor="text-amber-450" tooltip="gives you energy ⚡" />
                  <MacroBar label="Fat" value={totals.fat} max={targets.fat} unit="g" color="bg-rose-455" icon={Droplets} iconColor="text-rose-455" tooltip="keeps you healthy 🫀" />
                  {!guidedMode && (
                    <MacroBar label="Fiber" value={totals.fiber} max={targets.fiber} unit="g" color="bg-emerald-455" icon={Leaf} iconColor="text-emerald-455" />
                  )}
                </div>
              </Card>

              {/* Historical Averages Card */}
              <Card className="p-4 space-y-4">
                <div className="flex items-center gap-2 border-b border-card-border pb-3">
                  <BarChart3 size={15} className="text-emerald-450" />
                  <h4 className="text-xs font-bold text-zinc-955">Historical Trends &amp; Averages</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
                  <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-750 uppercase tracking-wider">Last 7 Days</p>
                      <p className="text-xl font-bold text-zinc-955 mt-1.5 font-sans tabular-nums">{trendsData.last7Days.avgCalories} <span className="text-[10px] font-normal text-zinc-750 font-sans">kcal/d</span></p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-750 space-y-1">
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>P:</span><span>{trendsData.last7Days.avgProtein}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>C:</span><span>{trendsData.last7Days.avgCarbs}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>F:</span><span>{trendsData.last7Days.avgFat}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold border-t border-card-border/30 pt-1 mt-1 text-sky-400">
                        <span>Water:</span><span>{trendsData.last7Days.avgWater}ml</span>
                      </div>
                    </div>
                  </Surface>

                  <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-750 uppercase tracking-wider">Last 30 Days</p>
                      <p className="text-xl font-bold text-zinc-955 mt-1.5 font-sans tabular-nums">{trendsData.last30Days.avgCalories} <span className="text-[10px] font-normal text-zinc-750 font-sans">kcal/d</span></p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-750 space-y-1">
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>P:</span><span>{trendsData.last30Days.avgProtein}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>C:</span><span>{trendsData.last30Days.avgCarbs}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>F:</span><span>{trendsData.last30Days.avgFat}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold border-t border-card-border/30 pt-1 mt-1 text-sky-400">
                        <span>Water:</span><span>{trendsData.last30Days.avgWater}ml</span>
                      </div>
                    </div>
                  </Surface>

                  <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-zinc-750 uppercase tracking-wider">Last 12 Months</p>
                      <p className="text-xl font-bold text-zinc-955 mt-1.5 font-sans tabular-nums">{trendsData.last12Months.avgCalories} <span className="text-[10px] font-normal text-zinc-750 font-sans">kcal/d</span></p>
                    </div>
                    <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-750 space-y-1">
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>P:</span><span>{trendsData.last12Months.avgProtein}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>C:</span><span>{trendsData.last12Months.avgCarbs}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold"><span>F:</span><span>{trendsData.last12Months.avgFat}g</span></div>
                      <div className="flex justify-between font-sans tabular-nums font-semibold border-t border-card-border/30 pt-1 mt-1 text-sky-400">
                        <span>Water:</span><span>{trendsData.last12Months.avgWater}ml</span>
                      </div>
                    </div>
                  </Surface>
                </div>
                <p className="text-[9px] text-zinc-750 italic text-center">
                  * Analytics compile your real daily averages based on logs across the active tracking windows.
                </p>
              </Card>
            </div>
          )}

          {subTab === "micros" && (
            <div className="space-y-4">
              {/* Comprehensive RDA Grid */}
              <Card className="p-4 space-y-3.5">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-750">Vitamins &amp; Minerals Progress (RDA)</h4>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
                  <MicroBadge label="Sodium" value={totals.sodium} max={targets.sodium} unit="mg" className="stroke-amber-450" />
                  <MicroBadge label="Potassium" value={totals.potassium} max={targets.potassium} unit="mg" className="stroke-violet-455" />
                  <MicroBadge label="Vitamin C" value={totals.vitaminC} max={targets.vitaminC} unit="mg" className="stroke-amber-450" />
                  <MicroBadge label="Calcium" value={totals.calcium} max={targets.calcium} unit="mg" className="stroke-blue-455" />
                  <MicroBadge label="Iron" value={totals.iron} max={targets.iron} unit="mg" className="stroke-rose-455" />
                </div>
              </Card>

              {/* RDA reference table */}
              <Card className="p-4 space-y-3">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-750">Guideline Thresholds</h4>
                <div className="divide-y divide-card-border text-xs">
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:items-center gap-1">
                    <span className="font-semibold text-foreground text-left">Sodium</span>
                    <span className="text-zinc-750 text-left sm:text-right">Keep below 2,300 mg (prevents fluid retention)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:items-center gap-1">
                    <span className="font-semibold text-foreground text-left">Potassium</span>
                    <span className="text-zinc-750 text-left sm:text-right">Aim for 4,700 mg (supports heart/muscle function)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:items-center gap-1">
                    <span className="font-semibold text-foreground text-left">Vitamin C</span>
                    <span className="text-zinc-750 text-left sm:text-right">Aim for 90 mg (promotes immune health)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:items-center gap-1">
                    <span className="font-semibold text-foreground text-left">Calcium</span>
                    <span className="text-zinc-750 text-left sm:text-right">Aim for 1,000 mg (essential for bone structure)</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between py-2 sm:items-center gap-1">
                    <span className="font-semibold text-foreground text-left">Iron</span>
                    <span className="text-zinc-750 text-left sm:text-right">Aim for {targets.iron} mg (supports blood oxygenation)</span>
                  </div>
                </div>
              </Card>

              {/* Micro Sources logs */}
              <Card className="p-4 space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-zinc-750">Top Micronutrient Source Foods</h4>
                {activeEntries.length === 0 ? (
                  <p className="text-xs text-zinc-750 text-center py-4 italic">No logged foods to display micro sources</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-violet-455 flex items-center gap-1"><Shield size={12} aria-hidden="true" /> Top Potassium Sources</p>
                      <div className="space-y-1.5">
                        {getTopMicroSources("potassium").length === 0 ? (
                          <p className="text-[10px] text-zinc-750 italic">None logged</p>
                        ) : (
                          getTopMicroSources("potassium").map((food) => (
                            <Surface key={food.id} className="text-xs p-2.5 flex justify-between items-center bg-surface/50">
                              <span className="truncate pr-1 text-foreground font-semibold">{food.name}</span>
                              <span className="font-mono font-bold text-violet-455 shrink-0">{food.potassium}mg</span>
                            </Surface>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-bold text-amber-450 flex items-center gap-1"><Shield size={12} aria-hidden="true" /> Top Vitamin C Sources</p>
                      <div className="space-y-1.5">
                        {getTopMicroSources("vitaminC").length === 0 ? (
                          <p className="text-[10px] text-zinc-750 italic">None logged</p>
                        ) : (
                          getTopMicroSources("vitaminC").map((food) => (
                            <Surface key={food.id} className="text-xs p-2.5 flex justify-between items-center bg-surface/50">
                              <span className="truncate pr-1 text-foreground font-semibold">{food.name}</span>
                              <span className="font-mono font-bold text-amber-450 shrink-0">{food.vitaminC}mg</span>
                            </Surface>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
