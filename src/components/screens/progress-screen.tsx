"use client";

import { motion } from "framer-motion";
import { Activity, Battery, LineChartIcon, Info, Moon, Zap, Thermometer, Dumbbell, Clock3, Weight, TrendingUp, PlusCircle, Edit, Flame } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/input";
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
import { getExerciseById } from "@/data/exercises";


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
  const allWorkouts = useAtlasStore((state) => state.workouts);
  const allRecoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const allBodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const logRecovery = useAtlasStore((state) => state.logRecovery);
  const logBodyMetric = useAtlasStore((state) => state.logBodyMetric);
  const profile = useAtlasStore((state) => state.profile);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const [selectedExercise, setSelectedExercise] = useState(topExercisesForAnalytics()[0]?.id ?? "bench-press");
  const [selectedHistoryView, setSelectedHistoryView] = useState<HistoryView>("day");
  // modalSelectedDate is used to pass context to modals, not for a standalone date picker
  const [modalSelectedDate, setModalSelectedDate] = useState<string>(format(new Date(), "yyyy-MM-dd"));

  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showBodyMetricModal, setShowBodyMetricModal] = useState(false);
  const [activeWorkoutTabs, setActiveWorkoutTabs] = useState<Record<string, string>>({});

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
  const consistency = useMemo(() => {
    const planWorkouts = workouts.filter(w => w.planId === activeWorkoutPlanId);
    return buildConsistencySeries(planWorkouts);
  }, [workouts, activeWorkoutPlanId]);

  const totalWorkoutsInYear = workouts.length;
  const totalWorkoutDurationInYear = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

  const averageRecoveryScore = useMemo(() => {
    if (recoveryLogs.length === 0) return 0;
    const totalReadiness = recoveryLogs.reduce((sum, log) => sum + (log.readiness || 0), 0);
    return (totalReadiness / recoveryLogs.length).toFixed(1);
  }, [recoveryLogs]);

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

  // Daily data for modals based on modalSelectedDate
  const modalDailyRecoveryLog = useMemo(() => {
    return allRecoveryLogs.find(r => r.date === modalSelectedDate);
  }, [allRecoveryLogs, modalSelectedDate]);

  const modalDailyBodyMetric = useMemo(() => {
    return allBodyMetrics.find(b => b.date === modalSelectedDate);
  }, [allBodyMetrics, modalSelectedDate]);


  // Grouped data for Historical Overview
  const groupedData = useMemo(() => {
    const groups: Record<string, { workouts: Workout[], recoveryLogs: RecoveryLog[], bodyMetrics: BodyMetric[] }> = {};

    [...workouts, ...recoveryLogs, ...bodyMetrics].forEach(item => {
      const date = parseLocalDate('startedAt' in item ? item.startedAt : item.date);
      let key: string;
      switch (selectedHistoryView) {
        case "day":
          key = format(date, "yyyy-MM-dd"); // Use simple date format for key
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


  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
    >
      <section className="col-span-full flex items-center justify-between">
        <p className="text-sm text-zinc-400">Recovery, body metrics, analytics</p>
        <div className="flex items-center gap-2">
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Progress</h1>
          <Select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="w-24"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </Select>
        </div>
      </section>

      {/* Active Plan Progress Summary */}
      <Card className="p-5 col-span-full bg-gradient-to-br from-emerald-500/10 via-zinc-900 to-zinc-950 border border-emerald-500/20 shadow-2xl relative overflow-hidden">
        {/* Decorative subtle gradient glow behind */}
        <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        {activePlan ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Active Plan
                </span>
                <h2 className="text-2xl font-bold text-white mt-1.5">{activePlan.name}</h2>
                <p className="text-zinc-400 text-sm mt-1 max-w-xl">{activePlan.goal}</p>
              </div>
              {activePlan.targetDate && (
                <div className="text-left sm:text-right shrink-0 bg-white/[0.03] p-2.5 rounded-xl border border-white/5">
                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Target Date</p>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5">{activePlan.targetDate}</p>
                </div>
              )}
            </div>

            {/* Streak & Consistency side-by-side using HSL-tailored colors */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-amber-500/10 to-yellow-500/5 border border-amber-500/20 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
                  <Flame className="text-amber-400" size={20} />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">
                    {getCurrentStreak(allWorkouts, activeWorkoutPlanId)}
                  </span>
                  <span className="text-xs font-medium text-amber-200 ml-1">days</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">Rest-day aware, max 3-day gap</p>
              </div>

              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 p-4 rounded-2xl flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Monthly Consistency</span>
                  <Activity className="text-emerald-400" size={20} />
                </div>
                <div className="mt-4">
                  <span className="text-3xl font-extrabold text-white">
                    {getTrainingConsistency(allWorkouts, profile?.daysPerWeek ?? 3, activeWorkoutPlanId)}
                  </span>
                  <span className="text-xs font-medium text-emerald-200 ml-1">%</span>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">Compared to target workouts</p>
              </div>
            </div>

            {/* Routines completed progress bar */}
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
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400 font-medium">Plan Progress ({completedCount}/{routinesCount} routines completed)</span>
                    <span className="font-bold text-emerald-300">{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-zinc-900 overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-500" 
                      style={{ width: `${progressPercent}%` }} 
                    />
                  </div>
                </div>
              );
            })()}
          </div>
        ) : (
          <div className="py-4 text-center space-y-3">
            <Info className="mx-auto text-zinc-500" size={32} />
            <h3 className="text-lg font-semibold text-white">No Active Plan Selected</h3>
            <p className="text-sm text-zinc-400 max-w-sm mx-auto">
              Select an active plan on the Plans screen to view streaks, monthly consistency, and routine completion progress here.
            </p>
            <Button
              size="sm"
              variant="primary"
              onClick={() => useAtlasStore.getState().setActiveTab("workout")}
            >
              Go to Plans
            </Button>
          </div>
        )}
      </Card>

      {/* Yearly Overview Card */}
      <Card className="p-4 col-span-full lg:col-span-1">
        <h2 className="text-lg font-semibold text-white mb-3">Yearly Overview ({selectedYear})</h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2">
            <Dumbbell size={20} className="text-emerald-400" />
            <div>
              <p className="text-sm text-zinc-400">Total Workouts</p>
              <p className="text-xl font-bold text-white">{totalWorkoutsInYear}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock3 size={20} className="text-purple-400" />
            <div>
              <p className="text-sm text-zinc-400">Total Duration</p>
              <p className="text-xl font-bold text-white">{totalWorkoutDurationInYear} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Battery size={20} className="text-amber-400" />
            <div>
              <p className="text-sm text-zinc-400">Avg. Recovery Score</p>
              <p className="text-xl font-bold text-white">{averageRecoveryScore}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Moon size={20} className="text-blue-400" />
            <div>
              <p className="text-sm text-zinc-400">Avg. Sleep Hours</p>
              <p className="text-xl font-bold text-white">{averageSleepHours}h</p>
            </div>
          </div>
          <div className="flex items-center gap-2 col-span-2">
            <Weight size={20} className="text-sky-400" />
            <div>
              <p className="text-sm text-zinc-400">Latest Bodyweight</p>
              <p className="text-xl font-bold text-white">{latestBodyweight} lbs</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Existing Metric Cards - adjusted to fit grid */}
      <MetricCard
        label="Recovery"
        value={`${recoveryScore}`}
        detail="readiness score"
        icon={<Battery size={18} />}
        tone={recoveryScore > 75 ? "emerald" : recoveryScore > 58 ? "amber" : "rose"}
      />
      <MetricCard
        label="Volume"
        value={Math.round(getWeeklyVolume(workouts)).toLocaleString()}
        detail="last 7 days"
        icon={<Activity size={18} />}
        tone="sky"
      />

      {/* Historical Overview Section (Grouped by Day, Week, Month) - Moved to top */}
      <Card className="p-4 col-span-full">
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-lg font-semibold text-white">Historical Overview</h2>
          <Info size={16} className="text-zinc-500" aria-label="Historical Overview Info" />
        </div>

        <div className="mt-3 flex gap-2">
          {["day", "week", "month"].map((view) => (
            <Button
              key={view}
              size="sm"
              variant={selectedHistoryView === view ? "primary" : "secondary"}
              onClick={() => setSelectedHistoryView(view as HistoryView)}
            >
              {view.charAt(0).toUpperCase() + view.slice(1)}
            </Button>
          ))}
        </div>
        <div className="mt-4 space-y-4">
          {groupedData.length === 0 && (
            <p className="text-zinc-500 text-sm">No data yet for this period.</p>
          )}
          {groupedData.map(({ key, workouts: workoutsInGroup, recoveryLogs: recoveryLogsInGroup, bodyMetrics: bodyMetricsInGroup }) => {
            const hasRecoveryData = recoveryLogsInGroup && recoveryLogsInGroup.length > 0;
            const hasWorkoutData = workoutsInGroup && workoutsInGroup.length > 0;
            const hasBodyMetricData = bodyMetricsInGroup && bodyMetricsInGroup.length > 0;

            const displayDate = selectedHistoryView === "day" ? format(parseISO(key), "PPP") : key;
            const currentDayRecoveryLog = recoveryLogsInGroup && recoveryLogsInGroup[0];
            const currentDayBodyMetric = bodyMetricsInGroup && bodyMetricsInGroup[0];

            if (!hasRecoveryData && !hasWorkoutData && !hasBodyMetricData) {
              return null;
            }

            // Calculate averages/values for recovery logs and body metrics in the group
            const avgSleep = recoveryLogsInGroup.length > 0 
              ? (recoveryLogsInGroup.reduce((sum, log) => sum + (log.sleepHours || 0), 0) / recoveryLogsInGroup.length).toFixed(1)
              : null;
            const avgEnergy = recoveryLogsInGroup.length > 0
              ? (recoveryLogsInGroup.reduce((sum, log) => sum + (log.energy || 0), 0) / recoveryLogsInGroup.length).toFixed(1)
              : null;
            const avgSoreness = recoveryLogsInGroup.length > 0
              ? (recoveryLogsInGroup.reduce((sum, log) => sum + (log.soreness || 0), 0) / recoveryLogsInGroup.length).toFixed(1)
              : null;
            const avgReadiness = recoveryLogsInGroup.length > 0
              ? (recoveryLogsInGroup.reduce((sum, log) => sum + (log.readiness || 0), 0) / recoveryLogsInGroup.length).toFixed(1)
              : null;
            const avgStress = recoveryLogsInGroup.length > 0
              ? (recoveryLogsInGroup.reduce((sum, log) => sum + (log.stress || 0), 0) / recoveryLogsInGroup.length).toFixed(1)
              : null;

            const validBodyweightLogs = bodyMetricsInGroup.filter(b => b.bodyweight && b.bodyweight > 0);
            const avgBodyweight = validBodyweightLogs.length > 0
              ? (validBodyweightLogs.reduce((sum, metric) => sum + (metric.bodyweight || 0), 0) / validBodyweightLogs.length).toFixed(1)
              : null;

            // Calculate totals/averages for workouts in the day/period
            const totalWorkoutsInPeriod = workoutsInGroup?.length || 0;
            const totalDurationInPeriod = workoutsInGroup?.reduce((sum, w) => sum + (w.durationMinutes || 0), 0) || 0;
            const totalVolumeInPeriod = workoutsInGroup?.reduce((sum, w) => sum + getVolumeForWorkout(w), 0) || 0;
            const totalSetsInPeriod = workoutsInGroup?.reduce((sum, w) => sum + w.exercises.reduce((sSum, ex) => sSum + ex.sets.length, 0), 0) || 0;
            
            const workoutsWithFatigue = workoutsInGroup?.filter(w => w.fatigueRating !== undefined && w.fatigueRating !== null) || [];
            const avgFatigueInPeriod = workoutsWithFatigue.length > 0
              ? (workoutsWithFatigue.reduce((sum, w) => sum + (w.fatigueRating || 0), 0) / workoutsWithFatigue.length).toFixed(1)
              : null;

            return (
              <Card key={key} className="p-4 space-y-4">
                {/* Date heading */}
                <h3 className="text-xl font-semibold text-white">{displayDate}</h3>
                
                {/* SUMMARIES CONTAINER: Split Layout for Day View */}
                {selectedHistoryView === "day" && (
                  <div className={`grid grid-cols-1 ${hasWorkoutData ? "md:grid-cols-2" : ""} gap-4 pb-4 border-b border-white/10`}>
                    
                    {/* SECTION 1: DAILY RECOVERY/BODY METRICS SUMMARY */}
                    <div className="space-y-3">
                      <div className="flex justify-between items-center flex-wrap gap-2">
                        <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Daily Metrics Summary</p>
                        
                        {/* Action Buttons grouped directly with the metrics */}
                        <div className="flex gap-2">
                          {!currentDayRecoveryLog && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<PlusCircle size={14} />}
                              onClick={() => {
                                setModalSelectedDate(key);
                                setShowRecoveryModal(true);
                              }}
                            >
                              Add Recovery
                            </Button>
                          )}
                          {currentDayRecoveryLog && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Edit size={14} />}
                              onClick={() => {
                                setModalSelectedDate(key);
                                setShowRecoveryModal(true);
                              }}
                            >
                              Edit Recovery
                            </Button>
                          )}
                          {!currentDayBodyMetric && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<PlusCircle size={14} />}
                              onClick={() => {
                                setModalSelectedDate(key);
                                setShowBodyMetricModal(true);
                              }}
                            >
                              Add Metrics
                            </Button>
                          )}
                          {currentDayBodyMetric && (
                            <Button
                              size="sm"
                              variant="secondary"
                              icon={<Edit size={14} />}
                              onClick={() => {
                                setModalSelectedDate(key);
                                setShowBodyMetricModal(true);
                              }}
                            >
                              Edit Metrics
                            </Button>
                          )}
                        </div>
                      </div>

                      {(hasRecoveryData || validBodyweightLogs.length > 0) ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs p-3 bg-zinc-900/40 rounded-xl border border-white/5 h-[calc(100%-2rem)] min-h-[80px]">
                          {avgSleep && (
                            <div className="flex items-center gap-1.5 text-blue-400">
                              <Moon size={14} /> 
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Sleep</p>
                                <p className="font-bold">{avgSleep}h</p>
                              </div>
                            </div>
                          )}
                          {avgEnergy && (
                            <div className="flex items-center gap-1.5 text-yellow-400">
                              <Zap size={14} />
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Energy</p>
                                <p className="font-bold">{avgEnergy}/10</p>
                              </div>
                            </div>
                          )}
                          {avgSoreness && (
                            <div className="flex items-center gap-1.5 text-red-400">
                              <Thermometer size={14} />
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Soreness</p>
                                <p className="font-bold">{avgSoreness}/10</p>
                              </div>
                            </div>
                          )}
                          {avgReadiness && (
                            <div className="flex items-center gap-1.5 text-emerald-400">
                              <Battery size={14} />
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Readiness</p>
                                <p className="font-bold">{avgReadiness}/10</p>
                              </div>
                            </div>
                          )}
                          {avgStress && (
                            <div className="flex items-center gap-1.5 text-purple-400">
                              <Activity size={14} />
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Stress</p>
                                <p className="font-bold">{avgStress}/10</p>
                              </div>
                            </div>
                          )}
                          {avgBodyweight && (
                            <div className="flex items-center gap-1.5 text-sky-400">
                              <Weight size={14} />
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Weight</p>
                                <p className="font-bold">{avgBodyweight} lbs</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic pl-1 pt-1">No daily metrics recorded for this day.</p>
                      )}
                    </div>

                    {/* SECTION 1.5: WORKOUT/ROUTINE OVERALL SUMMARY */}
                    {hasWorkoutData && (
                      <div className="space-y-3">
                        <div className="flex justify-between items-center h-[38px]">
                          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Workout Summary (Day Totals)</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs p-3 bg-zinc-900/40 rounded-xl border border-white/5 h-[calc(100%-2rem)] min-h-[80px]">
                          <div className="flex items-center gap-1.5 text-sky-400">
                            <TrendingUp size={14} />
                            <div>
                              <p className="text-[10px] text-zinc-500 font-medium">Total Volume</p>
                              <p className="font-bold">{totalVolumeInPeriod.toLocaleString()} lbs</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-400">
                            <Dumbbell size={14} />
                            <div>
                              <p className="text-[10px] text-zinc-500 font-medium">Total Sets</p>
                              <p className="font-bold">{totalSetsInPeriod} completed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 text-purple-400">
                            <Clock3 size={14} />
                            <div>
                              <p className="text-[10px] text-zinc-500 font-medium">Total Duration</p>
                              <p className="font-bold">{totalDurationInPeriod} min</p>
                            </div>
                          </div>
                          {avgFatigueInPeriod && (
                            <div className="flex items-center gap-1.5 text-amber-400">
                              <Activity size={14} />
                              <div>
                                <p className="text-[10px] text-zinc-500 font-medium">Avg Fatigue</p>
                                <p className="font-bold">{avgFatigueInPeriod}/10</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* SECTION 2: ROUTINE TABS (Day view) */}
                {selectedHistoryView === "day" && hasWorkoutData && (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Routines</p>
                    
                    {/* Routine Tab Buttons */}
                    <div className="flex gap-1.5 p-1 bg-zinc-900/60 rounded-xl border border-white/5">
                      {workoutsInGroup.map((workout) => {
                        const isActive = (activeWorkoutTabs[key] || workoutsInGroup[0]?.id) === workout.id;
                        const timeStr = format(parseLocalDate(workout.startedAt), "HH:mm");
                        return (
                          <button
                            key={workout.id}
                            type="button"
                            onClick={() => setActiveWorkoutTabs(prev => ({ ...prev, [key]: workout.id }))}
                            className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg transition-all duration-200 border ${
                              isActive 
                                ? "bg-white text-zinc-950 border-white shadow-[0_4px_12px_rgba(255,255,255,0.08)]" 
                                : "bg-transparent border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                            }`}
                          >
                            <span className="block truncate text-left sm:text-center">{workout.name}</span>
                            <span className={`block text-[10px] text-left sm:text-center ${isActive ? "text-zinc-500" : "text-zinc-600"}`}>{timeStr}</span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Active Workout Details and Metrics */}
                    {(() => {
                      const activeWorkoutId = activeWorkoutTabs[key] || workoutsInGroup[0]?.id;
                      const activeWorkout = workoutsInGroup.find(w => w.id === activeWorkoutId);
                      if (!activeWorkout) return null;

                      const workoutVolume = getVolumeForWorkout(activeWorkout);
                      const workoutSets = activeWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

                      return (
                        <div className="border border-white/10 rounded-xl overflow-hidden bg-white/[0.01] hover:border-white/20 transition-all duration-200">
                          {/* Workout Details */}
                          <div className="p-4 border-b border-white/[0.05] space-y-2">
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <h4 className="text-white font-bold text-base">{activeWorkout.name}</h4>
                                <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1.5">
                                  <Clock3 size={12} className="text-zinc-500" />
                                  <span>Started at {format(parseISO(activeWorkout.startedAt), "HH:mm")}</span>
                                  <span>•</span>
                                  <span>{activeWorkout.durationMinutes} min</span>
                                </p>
                              </div>
                              {activeWorkout.fatigueRating && (
                                <div className="text-right">
                                  <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">Fatigue</p>
                                  <span className="text-xs font-bold text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded-full border border-white/5">
                                    {activeWorkout.fatigueRating}/10
                                  </span>
                                </div>
                              )}
                            </div>
                            {activeWorkout.notes && (
                              <p className="text-xs text-zinc-400 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/5 mt-2">
                                Notes: "{activeWorkout.notes}"
                              </p>
                            )}
                          </div>

                          {/* Exercises List inside the routine tab */}
                          <div className="p-4 bg-zinc-950/20 space-y-2">
                            {activeWorkout.exercises.length > 0 ? (
                              <div className="space-y-2">
                                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Exercises List</p>
                                <div className="grid gap-2">
                                  {activeWorkout.exercises.map((we) => {
                                    const exerciseName = getExerciseById(we.exerciseId)?.name ?? "Exercise";
                                    const completedSets = we.sets.filter(s => s.completed);
                                    return (
                                      <div key={we.id} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                                        <span className="text-xs font-semibold text-zinc-200">{exerciseName}</span>
                                        <div className="flex items-center gap-2">
                                          {completedSets.length > 0 && (
                                            <span className="text-[10px] text-zinc-400 font-mono">
                                              {completedSets.map((s) => `${s.weight}x${s.reps}`).join(", ")}
                                            </span>
                                          )}
                                          <span className="text-[10px] text-zinc-500 font-mono bg-zinc-900/60 px-1.5 py-0.5 rounded border border-white/5">
                                            {completedSets.length}/{we.sets.length} sets
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-zinc-500">No exercises logged in this workout.</p>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* SECTION 3: Workout Summary (Week/Month views) */}
                {(selectedHistoryView === "week" || selectedHistoryView === "month") && hasWorkoutData && (
                  <div className="space-y-3 pb-3 border-b border-white/10">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center gap-2 text-emerald-400">
                        <Dumbbell size={16} /> {totalWorkoutsInPeriod} Workouts
                      </div>
                      <div className="flex items-center gap-2 text-purple-400">
                        <Clock3 size={16} /> {totalDurationInPeriod} min
                      </div>
                    </div>
                  </div>
                )}



                {/* SECTION 5: Volume Chart (Week/Month views) */}
                {(selectedHistoryView === "week" || selectedHistoryView === "month") && hasWorkoutData && (
                  <div className="mt-2 h-32">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={100}>
                      <BarChart data={[{ name: key, volume: totalVolumeInPeriod }]}>
                        <XAxis dataKey="name" hide />
                        <YAxis hide />
                        <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                        <Bar dataKey="volume" radius={[6, 6, 0, 0]} fill="#38bdf8" />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className="text-center text-sm text-zinc-500 mt-2">Total Volume: {totalVolumeInPeriod.toLocaleString()}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </Card>

      {/* Charts section - will span multiple columns */}
      <Card className="p-4 col-span-full">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Strength progression</h2>
            <Info size={16} className="text-zinc-500" aria-label="Strength Progression Info" />
          </div>
          <LineChartIcon className="text-zinc-500" size={18} />
        </div>
        <Select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
          {topExercisesForAnalytics().map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </Select>
        <div className="mt-4 h-56">
          {strengthSeries.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
              <LineChart data={strengthSeries}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                <Line dataKey="estimated1rm" stroke="#6ee7b7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-sm text-zinc-500">
               Not enough data
             </div>
          )}
        </div>
      </Card>

      {/* New Recovery Trends Chart */}
      <Card className="p-4 col-span-full">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Recovery Trends</h2>
            <Info size={16} className="text-zinc-500" aria-label="Recovery Trends Info" />
          </div>
          <TrendingUp className="text-zinc-500" size={18} />
        </div>
        <div className="mt-4 h-56">
          {recoveryTrendSeries.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
              <LineChart data={recoveryTrendSeries}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} domain={[0, 10]} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                <Line type="monotone" dataKey="energy" stroke="#facc15" name="Energy" dot={false} />
                <Line type="monotone" dataKey="soreness" stroke="#ef4444" name="Soreness" dot={false} />
                <Line type="monotone" dataKey="stress" stroke="#a855f7" name="Stress" dot={false} />
                <Line type="monotone" dataKey="readiness" stroke="#22c55e" name="Readiness" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-zinc-500">
              Not enough recovery data for trends.
            </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2 col-span-full">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-white">Weekly volume</h2>
            <Info size={16} className="text-zinc-500" aria-label="Weekly Volume Info" />
          </div>
          <div className="mt-4 h-52">
            {volumeSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                <BarChart data={volumeSeries}>
                  <XAxis dataKey="week" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                 Not enough data
               </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <h2 className="text-lg font-semibold text-white">Bodyweight</h2>
            <Info size={16} className="text-zinc-500" aria-label="Bodyweight Info" />
          </div>
          <div className="mt-4 h-52">
            {bodyweightSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                <AreaChart data={bodyweightSeries}>
                  <defs>
                    <linearGradient id="progressBodyweight" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Area dataKey="weight" stroke="#a78bfa" fill="url(#progressBodyweight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                 Not enough data
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4 col-span-full">
        <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-semibold text-white">Training Consistency (Last 28 Days)</h2>
            <Info size={16} className="text-zinc-500" aria-label="Consistency Info" />
        </div>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {consistency.map((day) => (
            <div key={day.date} className="space-y-1">
              <div
                className={`aspect-square rounded-lg border ${
                  day.trained
                    ? "border-emerald-300/30 bg-emerald-300/80"
                    : "border-white/10 bg-white/[0.055]"
                }`}
              />
              <p className="truncate text-center text-[10px] text-zinc-600">{day.label}</p>
            </div>
          ))}
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