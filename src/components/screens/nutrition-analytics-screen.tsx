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
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";

import { Card, Surface } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { useAtlasStore } from "@/store/useAtlasStore";
import { calculateNutritionTargets } from "@/lib/calculators";
import { getSmartNutritionTips } from "@/lib/coach/smart-nutrition-tips";
import { AiNutritionTip } from "@/components/ai-nutrition-tip";

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

// ─── Smart Nutrition Tip Card ─────────────────────────────────────────
const SmartNutritionTipCard: FC<{ targetDateString: string }> = ({ targetDateString }) => {
  const profile = useAtlasStore((s) => s.profile);
  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries || []);
  const waterLogs = useAtlasStore((s) => s.waterLogs || []);

  const tips = useMemo(
    () => getSmartNutritionTips(profile, nutritionEntries, waterLogs, targetDateString),
    [profile, nutritionEntries, waterLogs, targetDateString]
  );

  if (tips.length === 0) return null;

  return (
    <Card className="p-4 space-y-3 shadow-sm border-card-border">
      <div className="flex items-center gap-2 border-b border-card-border pb-2.5">
        <Sparkles size={15} className="text-emerald-500" />
        <h4 className="text-xs font-bold text-zinc-955">Nutrition Insights &amp; Tips</h4>
      </div>
      <div className="space-y-3">
        {tips.map((tip, idx) => {
          const Icon = {
            info: Info,
            warning: AlertTriangle,
            success: CheckCircle2,
            tip: Sparkles,
          }[tip.type] || Sparkles;

          const colors = {
            info: "bg-blue-500/5 border-blue-500/15 text-blue-500",
            warning: "bg-amber-500/5 border-amber-500/15 text-amber-505 dark:text-amber-400",
            success: "bg-emerald-500/5 border-emerald-500/15 text-emerald-500",
            tip: "bg-blue-500/5 border-blue-500/15 text-blue-500",
          }[tip.type] || "bg-blue-500/5 border-blue-500/15 text-blue-500";

          return (
            <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 ${colors}`}>
              <Icon size={16} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-foreground">{tip.title}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed font-semibold">
                  {tip.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
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
  const setGuidedMode = useAtlasStore((s) => s.setGuidedMode);



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

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">


          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-surface-border bg-surface text-xs font-bold text-zinc-600 dark:text-zinc-400">
            <BarChart3 className="text-emerald-500" size={14} />
            <span>{nutritionEntries.length} Food Logs Indexed</span>
          </div>
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

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="space-y-4"
      >
        {/* 1. Daily Calorie Target & Baselines (Consolidated Card at the top) */}
        <Card className="p-4 space-y-3 shadow-sm border-card-border">
          <div className="flex items-center gap-2 border-b border-card-border pb-2.5">
            <Activity size={15} className="text-emerald-450" />
            <h4 className="text-xs font-bold text-zinc-955">Caloric Budget &amp; Baselines</h4>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center bg-emerald-500/5 dark:bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/15">
              <div>
                <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-455 uppercase tracking-wider">Active Daily Target</p>
                <p className="text-sm font-extrabold text-zinc-955 mt-0.5 capitalize">{profile?.goal || "Maintain fitness"}</p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-455 font-mono">{targets.calories.toLocaleString()}</span>
                <span className="text-[10px] font-extrabold text-zinc-755 uppercase block mt-0.5">kcal / day</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Surface className="p-2.5 bg-surface/50">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-550 block mb-0.5">Basal Metabolic Rate (BMR)</span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{targets.bmr.toLocaleString()} <span className="text-[10px] font-normal text-zinc-755">kcal</span></span>
              </Surface>
              <Surface className="p-2.5 bg-surface/50">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-550 block mb-0.5">Total Daily Expenditure (TDEE)</span>
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200 tabular-nums">{targets.tdee.toLocaleString()} <span className="text-[10px] font-normal text-zinc-755">kcal</span></span>
              </Surface>
            </div>

            <p className="text-[11px] text-zinc-755 leading-relaxed">
              <strong>BMR (Basal Metabolic Rate)</strong> represents the baseline number of calories your body burns at rest just to maintain vital life functions (such as breathing, circulation, and temperature regulation). <strong>TDEE (Total Daily Energy Expenditure)</strong> is your BMR multiplied by your activity level (1.55x) to account for daily movement.
            </p>
          </div>
        </Card>

        {/* 2. Today's Macronutrient & Micronutrient Progress (Macros + Micros RDA inside it) */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-card-border pb-2.5 gap-2">
            <h4 className="text-xs font-bold text-zinc-955">Today's Macronutrient Progress</h4>

            {/* Experience Mode Toggle */}
            <button
              type="button"
              onClick={() => setGuidedMode(!guidedMode)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-surface-border bg-card hover:bg-surface/50 text-xs font-bold text-zinc-700 dark:text-zinc-300 transition active:scale-95 shadow-sm"
            >
              <Activity size={13} className={guidedMode ? "text-emerald-500" : "text-amber-500 animate-pulse"} />
              <span>{guidedMode ? "Beginner Mode" : "Advanced Mode"}</span>
            </button>
          </div>
          <div className="space-y-4">
            <MacroBar label="Protein" value={totals.protein} max={targets.protein} unit="g" color="bg-blue-455" icon={Beef} iconColor="text-blue-455" tooltip="helps build muscle 💪" />
            <MacroBar label="Carbohydrates" value={totals.carbs} max={targets.carbs} unit="g" color="bg-amber-450" icon={Wheat} iconColor="text-amber-450" tooltip="gives you energy ⚡" />
            <MacroBar label="Fat" value={totals.fat} max={targets.fat} unit="g" color="bg-rose-455" icon={Droplets} iconColor="text-rose-455" tooltip="keeps you healthy 🫀" />
            {!guidedMode && (
              <MacroBar label="Fiber" value={totals.fiber} max={targets.fiber} unit="g" color="bg-emerald-455" icon={Leaf} iconColor="text-emerald-455" />
            )}
          </div>

          {/* Vitamins & Minerals RDA (Advanced mode only) */}
          {!guidedMode && (
            <div className="pt-4 border-t border-card-border space-y-4">
              <div>
                <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-755">Vitamins &amp; Minerals Progress (RDA)</h5>
                <p className="text-[10px] text-zinc-755 mt-0.5">Track daily micronutrients and guideline thresholds</p>
              </div>

              <div className="divide-y divide-card-border">
                {[
                  { label: "Sodium", value: totals.sodium, max: targets.sodium, unit: "mg", color: "stroke-amber-450", desc: "Keep below 2,300 mg (prevents fluid retention)" },
                  { label: "Potassium", value: totals.potassium, max: targets.potassium, unit: "mg", color: "stroke-violet-455", desc: "Aim for 4,700 mg (supports heart/muscle function)" },
                  { label: "Vitamin C", value: totals.vitaminC, max: targets.vitaminC, unit: "mg", color: "stroke-amber-450", desc: "Aim for 90 mg (promotes immune health)" },
                  { label: "Calcium", value: totals.calcium, max: targets.calcium, unit: "mg", color: "stroke-blue-455", desc: "Aim for 1,000 mg (essential for bone structure)" },
                  { label: "Iron", value: totals.iron, max: targets.iron, unit: "mg", color: "stroke-rose-455", desc: `Aim for ${targets.iron} mg (supports blood oxygenation)` },
                ].map((micro) => {
                  const pct = Math.min((micro.value / micro.max) * 100, 100);
                  const isOver = micro.value > micro.max;
                  return (
                    <div key={micro.label} className="flex items-center gap-3.5 py-3 first:pt-0 last:pb-0">
                      <div className="relative shrink-0 select-none">
                        <RingProgress
                          value={micro.value}
                          max={micro.max}
                          className={isOver ? "stroke-rose-600 dark:stroke-rose-500" : micro.color}
                          size={42}
                          strokeWidth={4.5}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-zinc-955 leading-none">
                          {Math.round(pct)}%
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-zinc-955 leading-none">{micro.label}</p>
                        <p className="text-[10px] text-zinc-755 mt-1 truncate">{micro.desc}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={cn("text-xs font-bold font-sans tabular-nums block", isOver ? "text-rose-500" : "text-zinc-955")}>
                          {micro.value.toFixed(0)} <span className="text-[10px] font-normal text-zinc-755">/ {micro.max} {micro.unit}</span>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>

        {/* Smart & AI Nutrition Coaching Tips */}
        <SmartNutritionTipCard targetDateString={targetDateString} />
        <AiNutritionTip />

        {/* 3. Historical Trends & Averages Card (Averages + Top Micronutrient Food Sources) */}
        <Card className="p-4 space-y-4">
          <div className="flex items-center gap-2 border-b border-card-border pb-3">
            <BarChart3 size={15} className="text-emerald-450" />
            <h4 className="text-xs font-bold text-zinc-955">Historical Trends &amp; Averages</h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4.5">
            <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-755 uppercase tracking-wider">Last 7 Days</p>
                <p className="text-xl font-bold text-zinc-955 mt-1.5 font-sans tabular-nums">{trendsData.last7Days.avgCalories} <span className="text-[10px] font-normal text-zinc-755 font-sans">kcal/d</span></p>
              </div>
              <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-755 space-y-1">
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>P:</span><span>{trendsData.last7Days.avgProtein}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>C:</span><span>{trendsData.last7Days.avgCarbs}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>F:</span><span>{trendsData.last7Days.avgFat}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold border-t border-card-border/30 pt-1 mt-1 text-sky-500">
                  <span>Water:</span><span>{trendsData.last7Days.avgWater}ml</span>
                </div>
              </div>
            </Surface>

            <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-755 uppercase tracking-wider">Last 30 Days</p>
                <p className="text-xl font-bold text-zinc-955 mt-1.5 font-sans tabular-nums">{trendsData.last30Days.avgCalories} <span className="text-[10px] font-normal text-zinc-755 font-sans">kcal/d</span></p>
              </div>
              <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-755 space-y-1">
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>P:</span><span>{trendsData.last30Days.avgProtein}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>C:</span><span>{trendsData.last30Days.avgCarbs}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>F:</span><span>{trendsData.last30Days.avgFat}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold border-t border-card-border/30 pt-1 mt-1 text-sky-500">
                  <span>Water:</span><span>{trendsData.last30Days.avgWater}ml</span>
                </div>
              </div>
            </Surface>

            <Surface className="p-3 bg-surface/50 flex flex-col justify-between">
              <div>
                <p className="text-[10px] font-bold text-zinc-755 uppercase tracking-wider">Last 12 Months</p>
                <p className="text-xl font-bold text-zinc-955 mt-1.5 font-sans tabular-nums">{trendsData.last12Months.avgCalories} <span className="text-[10px] font-normal text-zinc-755 font-sans">kcal/d</span></p>
              </div>
              <div className="mt-4 pt-2 border-t border-card-border/50 text-[10px] text-zinc-755 space-y-1">
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>P:</span><span>{trendsData.last12Months.avgProtein}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>C:</span><span>{trendsData.last12Months.avgCarbs}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold"><span>F:</span><span>{trendsData.last12Months.avgFat}g</span></div>
                <div className="flex justify-between font-sans tabular-nums font-semibold border-t border-card-border/30 pt-1 mt-1 text-sky-500">
                  <span>Water:</span><span>{trendsData.last12Months.avgWater}ml</span>
                </div>
              </div>
            </Surface>
          </div>
          <p className="text-[9px] text-zinc-755 italic text-center">
            * Analytics compile your real daily averages based on logs across the active tracking windows.
          </p>

          {/* Top Micronutrient Source Foods (Advanced mode only) */}
          {!guidedMode && (
            <div className="pt-4 border-t border-card-border space-y-3">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-zinc-755">Top Micronutrient Source Foods</h5>
              {activeEntries.length === 0 ? (
                <p className="text-xs text-zinc-755 text-center py-2 italic">No logged foods to display micro sources</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-violet-455 flex items-center gap-1"><Shield size={12} aria-hidden="true" /> Top Potassium Sources</p>
                    <div className="space-y-1.5">
                      {getTopMicroSources("potassium").length === 0 ? (
                        <p className="text-[10px] text-zinc-755 italic">None logged</p>
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
                        <p className="text-[10px] text-zinc-755 italic">None logged</p>
                      ) : (
                        getTopMicroSources("vitaminC").map((food) => (
                          <Surface key={food.id} className="text-xs p-2.5 flex justify-between items-center bg-surface/50">
                            <span className="truncate pr-1 text-foreground font-semibold">{food.name}</span>
                            <span className="font-mono font-bold text-amber-455 shrink-0">{food.vitaminC}mg</span>
                          </Surface>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </motion.div>    </motion.div>
  );
}
