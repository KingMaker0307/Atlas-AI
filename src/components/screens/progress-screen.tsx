"use client";

import { motion } from "framer-motion";
import { Activity, Battery, LineChartIcon, Info, Moon, Zap, Thermometer, Dumbbell, Clock3, Weight, TrendingUp, PlusCircle, Edit, Flame, Calendar, ClipboardList, Search, ChevronUp, ChevronDown } from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Select, Input } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import {
  calculateRecoveryScore,
  getBodyweightSeries,
  getStrengthSeries,
  getVolumeSeries,
  getWeeklyVolume,
  topExercisesForAnalytics,
  getCurrentStreak,
  getTrainingConsistency,
} from "@/lib/progression/engine";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Workout, RecoveryLog, BodyMetric } from "@/types/domain";
import { format, getISOWeek, getYear as getDateFnsYear, parseISO } from "date-fns";
import { DailyRecoveryModal } from "@/components/daily-recovery-modal";
import { DailyBodyMetricModal } from "@/components/daily-body-metric-modal";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";


function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type HistoryView = "day" | "week" | "month" | "year";

// Helper to calculate volume for a single workout
function getVolumeForWorkout(workout: Workout): number {
  return workout.exercises.reduce((totalVolume, exercise) => {
    return totalVolume + exercise.sets.reduce((setVolume, set) => {
      return setVolume + (set.completed ? (set.reps || 0) * (set.weight || 0) : 0);
    }, 0);
  }, 0);
}

export function ProgressScreen() {
  const storeExercises = useAtlasStore((state) => state.exercises);
  const getExerciseById = (id: string) => {
    return storeExercises.find((e) => e.id === id) || getStaticExerciseById(id);
  };
  const allWorkouts = useAtlasStore((state) => state.workouts);
  const allRecoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const allBodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const logRecovery = useAtlasStore((state) => state.logRecovery);
  const logBodyMetric = useAtlasStore((state) => state.logBodyMetric);
  const profile = useAtlasStore((state) => state.profile);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  
  const [selectedExercise, setSelectedExercise] = useState(topExercisesForAnalytics()[0]?.id ?? "bench-press");
  const [selectedHistoryView, setSelectedHistoryView] = useState<HistoryView>("day");
  const [modalSelectedDate, setModalSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showBodyMetricModal, setShowBodyMetricModal] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [historySearch, setHistorySearch] = useState("");
  const [chartTab, setChartTab] = useState<"strength" | "cardio" | "recovery" | "mass">("strength");
  const [showCharts, setShowCharts] = useState(false);

  useEffect(() => {
    setShowCharts(!guidedMode);
  }, [guidedMode]);

  // Dynamically populate exercise dropdown list from actually logged exercises combined with default compound lifts
  const exercisesWithHistory = useMemo(() => {
    const performedIds = new Set<string>();
    allWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        if (ex.sets.some((s) => s.completed)) {
          performedIds.add(ex.exerciseId);
        }
      });
    });

    const performedList = Array.from(performedIds).map((id) => {
      const match = getExerciseById(id);
      return {
        id,
        name: match?.name ?? id.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
      };
    });

    const defaults = topExercisesForAnalytics();
    const mergedList = [...performedList];
    defaults.forEach((def) => {
      if (!mergedList.some((ex) => ex.id === def.id)) {
        mergedList.push(def);
      }
    });

    return mergedList.sort((a, b) => a.name.localeCompare(b.name));
  }, [allWorkouts]);

  const activePlan = useMemo(() => {
    return workoutPlans.find((p) => p.id === activeWorkoutPlanId) || null;
  }, [workoutPlans, activeWorkoutPlanId]);

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    allWorkouts.forEach(w => years.add(getDateFnsYear(parseLocalDate(w.startedAt))));
    allRecoveryLogs.forEach(r => years.add(getDateFnsYear(parseLocalDate(r.date))));
    allBodyMetrics.forEach(b => years.add(getDateFnsYear(parseLocalDate(b.date))));
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    if (sortedYears.length === 0) {
      sortedYears.push(getDateFnsYear(new Date()));
    }
    return sortedYears;
  }, [allWorkouts, allRecoveryLogs, allBodyMetrics]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || getDateFnsYear(new Date()));

  const workouts = useMemo(() => {
    return allWorkouts.filter(w => 
      getDateFnsYear(parseLocalDate(w.startedAt)) === selectedYear &&
      w.exercises.some(ex => ex.sets.some(s => s.completed))
    );
  }, [allWorkouts, selectedYear]);

  const recoveryLogs = useMemo(() => {
    return allRecoveryLogs.filter(r => getDateFnsYear(parseLocalDate(r.date)) === selectedYear);
  }, [allRecoveryLogs, selectedYear]);

  const bodyMetrics = useMemo(() => {
    return allBodyMetrics.filter(b => getDateFnsYear(parseLocalDate(b.date)) === selectedYear);
  }, [allBodyMetrics, selectedYear]);

  const recoveryScore = calculateRecoveryScore(allRecoveryLogs.at(-1));
  const volumeSeries = getVolumeSeries(workouts);
  const bodyweightSeries = getBodyweightSeries(bodyMetrics);
  const strengthSeries = getStrengthSeries(workouts, selectedExercise);

  const totalWorkoutsInYear = workouts.length;
  const totalWorkoutDurationInYear = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

  const averageSleepHours = useMemo(() => {
    if (recoveryLogs.length === 0) return 0;
    const totalSleepHours = recoveryLogs.reduce((sum, log) => sum + (log.sleepHours || 0), 0);
    return (totalSleepHours / recoveryLogs.length).toFixed(1);
  }, [recoveryLogs]);

  const latestBodyweight = useMemo(() => {
    const sortedBodyMetrics = [...bodyMetrics].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
    return sortedBodyMetrics.length > 0 ? sortedBodyMetrics[0].bodyweight : 0;
  }, [bodyMetrics]);

  const recoveryTrendSeries = useMemo(() => {
    return [...recoveryLogs]
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
      .map(log => ({
        date: format(parseLocalDate(log.date), "MMM dd"),
        energy: log.energy,
        soreness: log.soreness,
        stress: log.stress,
        readiness: log.readiness,
      }));
  }, [recoveryLogs]);

  const modalDailyRecoveryLog = useMemo(() => {
    return allRecoveryLogs.find(r => r.date === modalSelectedDate);
  }, [allRecoveryLogs, modalSelectedDate]);

  const modalDailyBodyMetric = useMemo(() => {
    return allBodyMetrics.find(b => b.date === modalSelectedDate);
  }, [allBodyMetrics, modalSelectedDate]);

  // Cardio Telemetry Series
  const cardioSeries = useMemo(() => {
    const series: Record<string, { date: string; minutes: number; distance: number; calories: number }> = {};
    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const exerciseData = getExerciseById(ex.exerciseId);
        const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
        if (!isCardio) return;
        
        const dateStr = format(parseLocalDate(w.startedAt), "MMM dd");
        if (!series[dateStr]) {
          series[dateStr] = { date: dateStr, minutes: 0, distance: 0, calories: 0 };
        }
        ex.sets.forEach((s) => {
          if (s.completed) {
            series[dateStr].minutes += (s.durationSeconds || 0) / 60;
            series[dateStr].distance += s.distance || 0;
            series[dateStr].calories += s.calories || 0;
          }
        });
      });
    });
    return Object.values(series).sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime());
  }, [workouts]);

  // Grouped data for Historical Overview
  const groupedData = useMemo(() => {
    const groups: Record<string, { workouts: Workout[], recoveryLogs: RecoveryLog[], bodyMetrics: BodyMetric[] }> = {};

    [...workouts, ...recoveryLogs, ...bodyMetrics].forEach(item => {
      const date = parseLocalDate('startedAt' in item ? item.startedAt : item.date);
      let key: string;
      switch (selectedHistoryView) {
        case "day":
          key = format(date, "yyyy-MM-dd");
          break;
        case "week":
          key = `${getDateFnsYear(date)}-W${getISOWeek(date)}`;
          break;
        case "month":
          key = format(date, "yyyy-MM");
          break;
        default:
          key = "Unknown";
      }

      if (!groups[key]) {
        groups[key] = { workouts: [], recoveryLogs: [], bodyMetrics: [] };
      }

      if ('startedAt' in item) {
        groups[key].workouts.push(item);
      } else if ('sleepHours' in item) {
        groups[key].recoveryLogs.push(item);
      } else if ('bodyweight' in item) {
        groups[key].bodyMetrics.push(item);
      }
    });

    const sortedKeys = Object.keys(groups).sort((a, b) => b.localeCompare(a));
    return sortedKeys.map(key => ({ key, ...groups[key] }));
  }, [workouts, recoveryLogs, bodyMetrics, selectedHistoryView]);

  // Interactive Active Recovery Heatmap (28-day)
  const activeRecoveryHeatmap = useMemo(() => {
    const trained = new Set(workouts.map((workout) => workout.startedAt.slice(0, 10)));
    const recovered = new Set(recoveryLogs.map((log) => log.date.slice(0, 10)));
    return Array.from({ length: 28 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (27 - index));
      const key = date.toISOString().slice(0, 10);
      return {
        date: key,
        label: key.slice(5),
        trained: trained.has(key),
        recovered: recovered.has(key),
      };
    });
  }, [workouts, recoveryLogs]);

  // Filter grouped data reactively based on search input
  const filteredGroupedData = useMemo(() => {
    if (!historySearch) return groupedData;
    const query = historySearch.toLowerCase();
    return groupedData.filter(({ key, workouts: workoutsInGroup }) => {
      const dateStr = selectedHistoryView === "day" ? format(parseISO(key), "PPP") : key;
      if (dateStr.toLowerCase().includes(query)) return true;
      return workoutsInGroup.some((w) => {
        if (w.name.toLowerCase().includes(query)) return true;
        return w.exercises.some((ex) => {
          const exerciseName = getExerciseById(ex.exerciseId)?.name ?? "";
          return exerciseName.toLowerCase().includes(query);
        });
      });
    });
  }, [groupedData, historySearch, selectedHistoryView]);

  const recoveryMessage = useMemo(() => {
    if (recoveryScore > 80) return "Physiological state is primed. Optimal window for high-threshold loads or progressive strength adaptation.";
    if (recoveryScore > 60) return "Steady-state capacity is standard. Maintain standard planned training volume.";
    return "Central nervous system fatigue detected. Consider light LISS active recovery, mobility, or extra rest.";
  }, [recoveryScore]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28 flex flex-col"
    >
      {/* Print-Only Clinical Header */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-zinc-950 pb-3 mb-6">
        <div>
          <h1 className="text-xl font-black uppercase tracking-tight text-zinc-950">ATLAS AI CLINICAL REPORT</h1>
          <p className="text-[10px] text-zinc-550 font-bold font-mono">Telemetry Data & Biological Analytics • Generated: {format(new Date(), "PPP")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-zinc-950">{profile?.name || "Client Summary"}</p>
          <p className="text-[9px] text-zinc-550 font-bold font-mono">Goal: {profile?.goal || "General Health"}</p>
        </div>
      </div>

      {/* Dynamic media print overrides styles block */}
      <style>{`
        @media print {
          /* Clean professional clinical styling */
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Hide bottom tab nav bar, sidebars, headers, action buttons, modals, dropdowns */
          nav, footer, header, button, select, 
          .no-print, [role="navigation"], [role="tablist"],
          .bg-header, .fixed, .absolute, .sticky,
          button[aria-label], select, input {
            display: none !important;
          }
          
          /* Restructure layout for page flow */
          .space-y-4 {
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          
          /* Card style overrides */
          .border-zinc-800, .border-card-border, .border-white\\/5, .border-surface-border {
            border: 1px solid #e4e4e7 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          
          .bg-card, .bg-surface, .bg-surface\\/60, .bg-zinc-900, .bg-zinc-950, .bg-zinc-900\\/50, .bg-zinc-900\\/10 {
            background-color: #f4f4f5 !important;
            background: #f4f4f5 !important;
            color: #18181b !important;
          }
          
          /* High contrast colors for print */
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #09090b !important;
          }
          .text-zinc-400, .text-zinc-550, .text-zinc-500, .text-zinc-650 {
            color: #71717a !important;
          }
          .text-emerald-400, .text-emerald-450, .text-emerald-350, .text-emerald-300 {
            color: #047857 !important;
            font-weight: bold !important;
          }
          .text-violet-400, .text-violet-450 {
            color: #6d28d9 !important;
            font-weight: bold !important;
          }
          .text-amber-400, .text-amber-300, .text-amber-600 {
            color: #b45309 !important;
            font-weight: bold !important;
          }
          .text-rose-450, .text-rose-400, .text-rose-500 {
            color: #be123c !important;
            font-weight: bold !important;
          }
          
          /* Ensure charts scale properly */
          .recharts-responsive-container {
            width: 100% !important;
            height: 250px !important;
          }
          
          /* Clinical 2-page print margins */
          .page-break-before {
            page-break-before: always !important;
          }
          
          .aspect-square {
            border: 1px solid #e4e4e7 !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* ─── HEADER PANEL ─── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Training Intelligence</h1>
          <p className="text-[11px] sm:text-xs text-zinc-400 font-medium">Progressive overload charts & recovery analytics</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest font-mono select-year-label">Select Year:</span>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-28 h-10 py-1.5 bg-input border-input-border text-foreground text-xs font-bold rounded-xl focus:border-emerald-500/50"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
          <Button
            size="sm"
            variant="primary"
            className="h-8 bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-black text-xs px-3 rounded-xl shadow"
            onClick={() => window.print()}
          >
            Export PDF Report
          </Button>
        </div>
      </section>

      <Surface className="p-3.5 bg-emerald-950/10 border border-emerald-500/10 text-zinc-300 rounded-xl flex gap-3 items-start select-none no-print">
        <Info size={16} className="text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-xs leading-normal">
          This is where your achievements are tracked. Once you log a workout, your strength progression charts and streak stats will update here automatically.
        </p>
      </Surface>

      {/* ─── BIOLOGICAL READINESS & ANNUAL SUMMARY CONSOLE ─── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Readiness Dial Card */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-violet-950/15 via-zinc-900 to-zinc-950 border border-violet-500/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[220px]">
          <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />
          
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/25">
                Biological readiness
              </span>
              <h3 className="text-lg font-bold text-white mt-2 leading-none">System Recovery</h3>
            </div>
            
            {/* Visual SVG Score Ring */}
            <div className="relative h-16 w-16 flex items-center justify-center shrink-0">
              <svg className="absolute transform -rotate-90 w-16 h-16">
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="rgba(255,255,255,0.03)"
                  strokeWidth="3.5"
                  fill="transparent"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke={recoveryScore > 75 ? "#10b981" : recoveryScore > 58 ? "#f59e0b" : "#ef4444"}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray="163.3"
                  strokeDashoffset={163.3 - (163.3 * recoveryScore) / 100}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="text-center">
                <span className="text-base font-black text-white leading-none font-mono">{recoveryScore}</span>
                <span className="block text-[8px] font-semibold text-zinc-500 leading-none">Score</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
            <p className="text-[11px] leading-relaxed text-zinc-300 font-medium">{recoveryMessage}</p>
          </div>
        </Card>

        {/* Active Plan Dials Card */}
        <Card className="p-4 sm:p-5 bg-gradient-to-br from-emerald-950/15 via-zinc-900 to-zinc-950 border border-emerald-500/10 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[180px] sm:min-h-[220px] md:col-span-2">
          <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-emerald-600/5 blur-3xl pointer-events-none" />
          
          {activePlan ? (
            <div className="flex flex-col justify-between h-full space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/25">
                    Active Program
                  </span>
                  <h3 className="text-xl font-bold text-white mt-1.5 leading-none">{activePlan.name}</h3>
                  <p className="text-zinc-400 text-[11px] font-medium truncate mt-1 max-w-[280px]">{activePlan.goal}</p>
                </div>
                {activePlan.targetDate && (
                  <div className="shrink-0 bg-white/[0.02] px-2.5 py-1 rounded-xl border border-white/5 text-left sm:text-right">
                    <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono">Target Date</p>
                    <p className="text-xs font-extrabold text-zinc-300 mt-0.5">{activePlan.targetDate}</p>
                  </div>
                )}
              </div>

              {/* Stats & Progress */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Active Streak</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-white font-mono">{getCurrentStreak(allWorkouts, activeWorkoutPlanId)}</span>
                    <span className="text-[9px] font-bold text-amber-400">days</span>
                  </div>
                </div>

                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">Consistency</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-xl font-black text-white font-mono">{getTrainingConsistency(allWorkouts, profile?.daysPerWeek ?? 3, activeWorkoutPlanId)}</span>
                    <span className="text-[9px] font-bold text-emerald-400">%</span>
                  </div>
                </div>

                <div className="bg-zinc-950/40 p-2.5 rounded-xl border border-white/5 flex flex-col justify-between col-span-2 sm:col-span-1">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">CNS Status</span>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-lg font-black text-white">Optimal</span>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {(() => {
                const startOfWeek = (() => {
                  const now = new Date();
                  const day = now.getDay();
                  const diff = now.getDate() - day + (day === 0 ? -6 : 1);
                  const monday = new Date(now.setDate(diff));
                  monday.setHours(0, 0, 0, 0);
                  return monday;
                })();

                const planWorkouts = allWorkouts.filter((w) => {
                  const hasCompletedSets = w.exercises.some((ex) => ex.sets.some((s) => s.completed));
                  return (
                    w.planId === activePlan.id &&
                    w.completedAt &&
                    new Date(w.completedAt).getTime() >= startOfWeek.getTime() &&
                    hasCompletedSets
                  );
                });
                const completedRoutineNames = new Set(planWorkouts.map((w) => w.name));
                const routinesCount = activePlan.routines.length;
                const completedCount = activePlan.routines.filter((r) => completedRoutineNames.has(r.name)).length;
                const progressPercent = routinesCount > 0 ? Math.round((completedCount / routinesCount) * 100) : 0;

                return (
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-bold">Weekly Progress ({completedCount}/{routinesCount} routines)</span>
                      <span className="font-extrabold text-emerald-400">{progressPercent}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-zinc-900 border border-white/5 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="py-8 text-center flex flex-col items-center justify-center h-full space-y-3">
              <Info className="text-zinc-500" size={28} />
              <div>
                <h4 className="text-sm font-bold text-white">No Program Designated</h4>
                <p className="text-[11px] text-zinc-500 mt-0.5 max-w-[280px]">Designate a training routine on the plan builder screen to track Streaks and CNS stats.</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* ─── UNIFIED PORTAL STATS BAR ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
        <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Dumbbell size={16} />
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Completed Sessions</p>
            <p className="text-lg font-black text-white leading-none mt-1">{totalWorkoutsInYear}</p>
          </div>
        </div>
        <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock3 size={16} />
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Duration Logged</p>
            <p className="text-lg font-black text-white leading-none mt-1">{totalWorkoutDurationInYear} <span className="text-xs font-semibold text-zinc-400">min</span></p>
          </div>
        </div>
        <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Moon size={16} />
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Avg Sleep Efficiency</p>
            <p className="text-lg font-black text-white leading-none mt-1">{averageSleepHours} <span className="text-xs font-semibold text-zinc-400">hours</span></p>
          </div>
        </div>
        <div className="p-3 bg-zinc-900/50 border border-white/5 rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Weight size={16} />
          </div>
          <div>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">Latest Bodyweight</p>
            <p className="text-lg font-black text-white leading-none mt-1">{latestBodyweight} <span className="text-xs font-semibold text-zinc-400">lbs</span></p>
          </div>
        </div>
      </section>

      {/* ─── UNIFIED CHARTS DECK CONSOLE ─── */}
      <Card className="p-4 mt-4 shadow-xl border border-zinc-800 relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950/40 page-break-before">
        <button
          type="button"
          onClick={() => setShowCharts(!showCharts)}
          className="w-full flex items-center justify-between border-b border-white/5 pb-3 select-none text-left no-print"
        >
          <div className="flex items-center gap-2">
            <LineChartIcon className="text-violet-400 animate-pulse" size={18} />
            <h3 className="text-base font-bold text-white">Training Analytics &amp; Charts</h3>
          </div>
          <span className="text-xs text-zinc-500 font-bold">{showCharts ? "Hide Charts" : "Show Charts"}</span>
        </button>

        <div className={`print:block ${showCharts ? "block" : "hidden"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 py-3 no-print">
            <p className="text-xs text-zinc-400 font-medium">Select a category to view training progression trendlines:</p>
            
            {/* Segmented Controller */}
            <div className="flex bg-zinc-950 border border-zinc-800 p-0.5 rounded-xl overflow-x-auto w-full sm:w-auto shrink-0 select-none">
              {[
                { id: "strength", label: "Strength" },
                { id: "cardio", label: "Cardio" },
                { id: "recovery", label: "Recovery" },
                { id: "mass", label: "Mass & Vol" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id as any)}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
                    chartTab === tab.id
                      ? "bg-white text-zinc-950 font-bold shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

        <div className="mt-4 min-h-[260px] flex flex-col justify-center">
          {/* strength tab */}
          {chartTab === "strength" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-xs text-zinc-400 font-medium">Estimated 1-Repetition Maximum (1RM) progression in weight loads.</p>
                <Select 
                  value={selectedExercise} 
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="w-full sm:w-64 h-10 py-1.5 bg-input border-input-border text-foreground text-xs font-bold font-sans rounded-xl focus:border-emerald-500/50"
                >
                  {exercisesWithHistory.map((exercise) => (
                    <option key={exercise.id} value={exercise.id}>
                      {exercise.name}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="h-56">
                {strengthSeries.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                    <LineChart data={strengthSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} fontStyle="bold" />
                      <YAxis stroke="#71717a" fontSize={10} fontStyle="bold" />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }} />
                      <Line dataKey="estimated1rm" stroke="#6ee7b7" strokeWidth={3} dot={{ r: 4, stroke: "#10b981", strokeWidth: 1.5, fill: "#fff" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs select-none gap-2 p-6 text-center max-w-sm mx-auto">
                    <Info size={20} className="text-emerald-450 dark:text-emerald-400 shrink-0" />
                    <span>Insufficient load point records available. Log completed strength training sets containing weight load, reps, and RIR inside your active workouts to map your estimated 1-Repetition Maximum (1RM) progressive overload curves.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* cardio tab */}
          {chartTab === "cardio" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-medium">Aerobic active recovery duration, incline pacing, and calorie expenditure rates.</p>
              <div className="h-56">
                {cardioSeries.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                    <BarChart data={cardioSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }} />
                      <Bar dataKey="minutes" name="Cardio Mins" fill="#818cf8" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="calories" name="Calories (kcal)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs select-none gap-2 p-6 text-center max-w-sm mx-auto">
                    <Activity size={22} className="text-violet-450 dark:text-violet-400 shrink-0" />
                    <span>No cardiovascular conditioning data recorded. Record duration, distance, and calorie expenditure for treadmill runs, stationary cycle sessions, or import Garmin/Apple Watch telemetry files to view conditioning trends.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* recovery tab */}
          {chartTab === "recovery" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-medium">Fluctuations in daily readiness, soreness thresholds, energy levels, and stress indices.</p>
              <div className="h-56">
                {recoveryTrendSeries.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                    <LineChart data={recoveryTrendSeries}>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} domain={[0, 10]} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }} />
                      <Line type="monotone" dataKey="energy" stroke="#facc15" strokeWidth={2} name="Energy" dot={false} />
                      <Line type="monotone" dataKey="soreness" stroke="#ef4444" strokeWidth={2} name="Soreness" dot={false} />
                      <Line type="monotone" dataKey="stress" stroke="#c084fc" strokeWidth={2} name="Stress" dot={false} />
                      <Line type="monotone" dataKey="readiness" stroke="#34d399" strokeWidth={2} name="Readiness" dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs select-none gap-2 p-6 text-center max-w-sm mx-auto">
                    <Info size={20} className="text-amber-450 dark:text-amber-400 shrink-0" />
                    <span>No biological telemetry recorded yet. Log daily recovery indicators—sleep duration, muscle soreness index, stress levels, and subjective fatigue—to compute your active Central Nervous System (CNS) readiness waves and performance potential.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* mass tab */}
          {chartTab === "mass" && (
            <div className="space-y-4">
              <p className="text-xs text-zinc-400 font-medium">Comparison overlay between weekly strength training volume load and bodyweight mass.</p>
              <div className="h-56">
                {bodyweightSeries.length > 1 && volumeSeries.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                    <AreaChart data={bodyweightSeries}>
                      <defs>
                        <linearGradient id="bodyweightGrad" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="5%" stopColor="#c084fc" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#c084fc" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                      <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                      <YAxis stroke="#71717a" fontSize={10} domain={["dataMin - 3", "dataMax + 3"]} />
                      <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(255,255,255,0.08)" }} />
                      <Area dataKey="weight" stroke="#c084fc" fill="url(#bodyweightGrad)" strokeWidth={2} name="Weight (lbs)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs select-none gap-1">
                    <Info size={18} />
                    <span>Record bodyweight entries in the logs shelf below to view mass-volume tracking.</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        </div>
      </Card>

      {/* ─── INTERACTIVE ACTIVE RECOVERY HEATMAP ─── */}
      <Card className="p-4 mt-4 shadow-xl border border-zinc-800 relative overflow-hidden">
        <div className="mb-2 flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="text-emerald-400" size={16} />
            <h3 className="text-sm font-bold text-white">Active Recovery Heatmap</h3>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-extrabold uppercase font-mono tracking-wider text-zinc-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Trained</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-violet-600/60" /> Recovery</span>
          </div>
        </div>
        
        <p className="text-[11px] text-zinc-400 mt-1 mb-3">28-day training heatmap. Click any cell to log daily recovery or body weight metrics directly.</p>

        <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
          {activeRecoveryHeatmap.map((day) => {
            const isTrained = day.trained;
            const isRecovered = day.recovered;
            
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => {
                  setModalSelectedDate(day.date);
                  setShowRecoveryModal(true);
                }}
                className={`aspect-square rounded-lg border flex flex-col justify-between p-1 transition-all duration-300 ${
                  isTrained
                    ? "bg-emerald-500/80 border-emerald-400/35 text-zinc-950 shadow"
                    : isRecovered
                    ? "bg-violet-600/60 border-violet-500/35 text-white shadow"
                    : "bg-white/[0.04] border-white/5 text-zinc-500 hover:bg-white/10"
                }`}
              >
                <span className="text-[8px] font-mono leading-none tracking-tight font-black">{day.label.slice(3)}</span>
                {isTrained && <Dumbbell size={9} className="self-end" />}
                {!isTrained && isRecovered && <Moon size={9} className="self-end" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ─── HISTORICAL SEARCH & GROUPED LOGS DRAWER ─── */}
      <Card className="p-4 mt-4 shadow-xl border border-zinc-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-zinc-400" size={16} />
            <h3 className="text-sm font-bold text-white">Historical Training Logs</h3>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 select-none">
            {["day", "week", "month"].map((view) => (
              <Button
                key={view}
                size="sm"
                variant={selectedHistoryView === view ? "primary" : "secondary"}
                onClick={() => setSelectedHistoryView(view as HistoryView)}
                className="h-7 text-[10px] uppercase font-bold"
              >
                {view}
              </Button>
            ))}
          </div>
        </div>

        {/* Search header bar */}
        <div className="mt-3 relative">
          <span className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-zinc-500">
            <Search size={14} />
          </span>
          <Input
            type="text"
            placeholder="Search by routine name, date (e.g. Jan 10) or exercise name..."
            className="pl-9 text-xs h-8 bg-zinc-900 border-zinc-800 text-foreground w-full rounded-xl focus:border-violet-500/50"
            value={historySearch}
            onChange={(e) => setHistorySearch(e.target.value)}
          />
        </div>

        <div className="mt-4 space-y-3">
          {filteredGroupedData.length === 0 && (
            <p className="text-zinc-500 text-xs italic p-4 text-center">No logs matching query found for this period.</p>
          )}

          {filteredGroupedData.map(({ key, workouts: workoutsInGroup, recoveryLogs: recoveryLogsInGroup, bodyMetrics: bodyMetricsInGroup }) => {
            const displayDate = selectedHistoryView === "day" ? format(parseISO(key), "PPPP") : key;
            const currentDayRecoveryLog = recoveryLogsInGroup && recoveryLogsInGroup[0];
            const currentDayBodyMetric = bodyMetricsInGroup && bodyMetricsInGroup[0];
            const hasRecoveryData = recoveryLogsInGroup && recoveryLogsInGroup.length > 0;
            const hasWorkoutData = workoutsInGroup && workoutsInGroup.length > 0;
            
            // Stats inside the folder
            const totalWorkouts = workoutsInGroup?.length || 0;
            const totalVolume = workoutsInGroup?.reduce((sum, w) => sum + getVolumeForWorkout(w), 0) || 0;
            
            const isFolderExpanded = !!expandedFolders[key];

            return (
              <div 
                key={key} 
                className="border border-white/5 rounded-2xl bg-zinc-900/10 overflow-hidden"
              >
                {/* Folder Header */}
                <button
                  type="button"
                  onClick={() => setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-white/[0.01] transition-all select-none"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-white truncate capitalize leading-snug">{displayDate}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[9px] font-bold font-mono text-zinc-500">
                      {totalWorkouts > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                          {totalWorkouts} {totalWorkouts === 1 ? "workout" : "workouts"}
                        </span>
                      )}
                      {totalVolume > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/5 border border-sky-500/10 text-sky-400">
                          Vol: {totalVolume.toLocaleString()} lbs
                        </span>
                      )}
                      {hasRecoveryData && (
                        <span className="px-1.5 py-0.5 rounded bg-violet-500/5 border border-violet-500/10 text-violet-400">
                          Bio-Logged
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5">
                    {isFolderExpanded ? <ChevronUp size={16} className="text-zinc-400" /> : <ChevronDown size={16} className="text-zinc-400" />}
                  </div>
                </button>

                {/* Collapsible content */}
                {isFolderExpanded && (
                  <div className="p-4 border-t border-white/5 bg-zinc-900/20 space-y-4 transition-all">
                    
                    {/* Recovery summary inside the folder */}
                    <div className="p-3 bg-zinc-950/40 border border-white/5 rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">CNS & Body Metrics</span>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[9px] font-semibold text-zinc-400 hover:text-white bg-white/5 rounded-lg"
                            onClick={() => {
                              setModalSelectedDate(key);
                              setShowRecoveryModal(true);
                            }}
                          >
                            {currentDayRecoveryLog ? "Edit Bio-Data" : "Add Bio-Data"}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-[9px] font-semibold text-zinc-400 hover:text-white bg-white/5 rounded-lg"
                            onClick={() => {
                              setModalSelectedDate(key);
                              setShowBodyMetricModal(true);
                            }}
                          >
                            {currentDayBodyMetric ? "Edit Weight" : "Add Weight"}
                          </Button>
                        </div>
                      </div>

                      {hasRecoveryData || currentDayBodyMetric ? (
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2 pt-2 border-t border-white/5 text-[10px] text-zinc-400">
                          {currentDayRecoveryLog?.sleepHours && (
                            <div>
                              <span className="block text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Sleep</span>
                              <span className="font-extrabold text-blue-400 font-mono">{currentDayRecoveryLog.sleepHours}h</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.energy && (
                            <div>
                              <span className="block text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Energy</span>
                              <span className="font-extrabold text-yellow-400 font-mono">{currentDayRecoveryLog.energy}/10</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.soreness && (
                            <div>
                              <span className="block text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Soreness</span>
                              <span className="font-extrabold text-red-400 font-mono">{currentDayRecoveryLog.soreness}/10</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.readiness && (
                            <div>
                              <span className="block text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Readiness</span>
                              <span className="font-extrabold text-emerald-400 font-mono">{currentDayRecoveryLog.readiness}/10</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.stress && (
                            <div>
                              <span className="block text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Stress</span>
                              <span className="font-extrabold text-purple-400 font-mono">{currentDayRecoveryLog.stress}/10</span>
                            </div>
                          )}
                          {currentDayBodyMetric?.bodyweight && (
                            <div>
                              <span className="block text-[8px] text-zinc-600 font-bold uppercase tracking-wider">Mass</span>
                              <span className="font-extrabold text-sky-400 font-mono">{currentDayBodyMetric.bodyweight} lbs</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-[10px] text-zinc-500 italic mt-1.5 pl-0.5">No biological recovery metrics logged for this date.</p>
                      )}
                    </div>

                    {/* Logged Routines inside the folder */}
                    {hasWorkoutData ? (
                      <div className="space-y-3">
                        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Logged Routines</span>
                        <div className="space-y-3">
                          {workoutsInGroup.map((workout) => {
                            const wDuration = workout.durationMinutes || 0;
                            const wVolume = getVolumeForWorkout(workout);
                            const wSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);

                            return (
                              <div key={workout.id} className="p-3.5 bg-zinc-950/20 border border-white/5 rounded-xl">
                                <div className="flex justify-between items-start gap-4 pb-2.5 border-b border-white/5">
                                  <div>
                                    <h5 className="text-white text-xs font-bold leading-none">{workout.name}</h5>
                                    <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1 font-semibold">
                                      <span>{format(parseISO(workout.startedAt), "HH:mm")}</span>
                                      <span>•</span>
                                      <span>{wDuration} min</span>
                                      {wVolume > 0 && (
                                        <>
                                          <span>•</span>
                                          <span>{wVolume.toLocaleString()} lbs</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span>{wSets} completed sets</span>
                                    </p>
                                  </div>
                                  {workout.fatigueRating && (
                                    <span className="text-[9px] font-bold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-full border border-white/5">
                                      Fatigue: {workout.fatigueRating}/10
                                    </span>
                                  )}
                                </div>

                                <div className="mt-2.5 space-y-2">
                                  {workout.exercises.map((we) => {
                                    const exerciseData = getExerciseById(we.exerciseId);
                                    const exerciseName = exerciseData?.name ?? "Exercise";
                                    const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
                                    const completedSets = we.sets.filter(s => s.completed);

                                    return (
                                      <div key={we.id} className="p-2 bg-white/[0.01] border border-white/5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-[11px]">
                                        <span className="font-bold text-zinc-300">{exerciseName}</span>
                                        <div className="flex items-center gap-2">
                                          {completedSets.length > 0 && (
                                            <span className="text-[10px] text-zinc-400 font-mono">
                                              {isCardio ? (
                                                completedSets.map((s) => {
                                                  const min = s.durationSeconds ? (s.durationSeconds / 60).toFixed(1) : "0";
                                                  const dist = s.distance ? `${s.distance}mi` : "";
                                                  const extra = s.incline ? `@${s.incline}%` : (s.resistance ? `Lvl${s.resistance}` : "");
                                                  return `${min}m${dist ? `(${dist})` : ""}${extra ? ` ${extra}` : ""}`;
                                                }).join(", ")
                                              ) : (
                                                completedSets.map((s) => `${s.weight}x${s.reps}`).join(", ")
                                              )}
                                            </span>
                                          )}
                                          <span className="text-[9px] font-mono font-bold bg-zinc-900/60 border border-white/5 px-1.5 py-0.5 rounded leading-none text-zinc-500 shrink-0">
                                            {completedSets.length}/{we.sets.length} sets
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-[10px] text-zinc-500 italic mt-1 pl-0.5">No logged strength or recovery workouts in this period.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Modals */}
      <DailyRecoveryModal
        isOpen={showRecoveryModal}
        onClose={() => setShowRecoveryModal(false)}
        selectedDate={modalSelectedDate}
        dailyRecoveryLog={modalDailyRecoveryLog}
        logRecovery={logRecovery}
      />
      <DailyBodyMetricModal
        isOpen={showBodyMetricModal}
        onClose={() => setShowBodyMetricModal(false)}
        selectedDate={modalSelectedDate}
        dailyBodyMetric={modalDailyBodyMetric}
        logBodyMetric={logBodyMetric}
        latestBodyweight={latestBodyweight}
      />
    </motion.div>
  );
}

function buildConsistencySeries(workouts: Workout[]) {
  const trained = new Set(workouts.map((workout) => workout.startedAt.slice(0, 10)));
  return Array.from({ length: 28 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      label: key.slice(5),
      trained: trained.has(key),
    };
  });
}