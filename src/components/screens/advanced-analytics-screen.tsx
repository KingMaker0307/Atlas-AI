"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Award,
  Zap,
  TrendingUp,
  BrainCircuit,
  Weight,
  Flame,
  LineChart as LineChartIcon,
  HelpCircle,
  Calendar,
  Layers,
  Sparkles,
  Compass,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from "recharts";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import {
  calculateRecoveryScore,
  getBodyweightSeries,
  getCurrentStreak,
  getFatigueLabel,
  getVolumeSeries,
  getWeeklyVolume,
  getTrainingConsistency,
  getStrengthSeries,
  topExercisesForAnalytics,
  estimateOneRepMax,
  getProgressionRecommendations,
} from "@/lib/progression/engine";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { format } from "date-fns";

export function AdvancedAnalyticsScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const allWorkouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const bodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const nutritionEntries = useAtlasStore((state) => state.nutritionEntries || []);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const storeExercises = useAtlasStore((state) => state.exercises || []);

  const workouts = useMemo(() => {
    return allWorkouts.filter((w) => w.exercises.some((ex) => ex.sets.some((s) => s.completed)));
  }, [allWorkouts]);

  const [selectedExercise, setSelectedExercise] = useState(
    topExercisesForAnalytics()[0]?.id ?? "bench-press"
  );

  const getExerciseById = (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      storeExercises.find((e) => {
        const exerciseNormId = e.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return (
          e.id === id ||
          exerciseNormId === normId ||
          e.name.trim().toLowerCase() === id.trim().toLowerCase()
        );
      }) || getStaticExerciseById(id)
    );
  };

  // 1. CNS Readiness Calculations
  const latestRecoveryLog = recoveryLogs.at(-1);
  const recoveryScore = calculateRecoveryScore(latestRecoveryLog);
  const fatigue = getFatigueLabel(recoveryScore);

  const recoveryDetails = useMemo(() => {
    const score = recoveryScore;
    if (score >= 78) {
      return {
        title: "Peak Neural State (Optimal CNS Readiness)",
        desc: "Your recovery indices show complete homeostasis restoration. Neuromuscular junctions are fully primed for maximum force output and high-intensity neural drive.",
        color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        stroke: "#10b981",
        suggestion:
          profile?.trainingStyle === "strength" || profile?.trainingStyle === "powerbuilding"
            ? "Prioritise high-load compound lifts. Excellent day to attempt progress or test a heavy double/triple."
            : profile?.trainingStyle === "hypertrophy"
            ? "Perfect day to push target muscle groups to absolute failure (0-1 RIR) on key heavy sets."
            : profile?.trainingStyle === "endurance"
            ? "Primary day for peak cardiorespiratory threshold sets or high-intensity interval metrics."
            : "Great day to challenge yourself with full workout volume and high effort.",
      };
    } else if (score >= 55) {
      return {
        title: "Functional Baseline (Moderate Readiness)",
        desc: "Neuromuscular feedback indicates standard capacity. Systemic strain is manageable, though minor residual localized fatigue might be present.",
        color: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        stroke: "#f59e0b",
        suggestion:
          profile?.trainingStyle === "strength" || profile?.trainingStyle === "powerbuilding"
            ? "Execute scheduled target weights. Focus on explosive speed off the chest/floor without adding loads."
            : profile?.trainingStyle === "hypertrophy"
            ? "Target moderate-intensity stimulus. Focus on high tension, solid mind-muscle connection, and clean eccentric controls."
            : profile?.trainingStyle === "endurance"
            ? "Maintain scheduled aerobic volumes. Stay strictly within Zone 2/3 limits."
            : "Proceed with your planned training session. Listen to your body and stick to standard rest durations.",
      };
    } else {
      return {
        title: "Fatigue Accumulation (CNS Depressed)",
        desc: "Significant depletion in autonomic recovery metrics (elevated resting stress or reduced sleep quality). High risk of systemic overreaching and fatigue-induced form breakdown.",
        color: "text-rose-500 bg-rose-500/10 border-rose-500/20",
        stroke: "#f43f5e",
        suggestion:
          "Reduce total workout set volume by 30-50% or capped load intensity by 15%. Keep RIR strictly at 3+. Consider replacing this session with dynamic mobility, stretching, or active recovery flows.",
      };
    }
  }, [recoveryScore, profile?.trainingStyle]);

  // 2. Goal Snapshot Calculations
  const streak = useMemo(() => getCurrentStreak(workouts, activeWorkoutPlanId), [workouts, activeWorkoutPlanId]);
  const weeklyVolume = useMemo(() => getWeeklyVolume(workouts), [workouts]);

  const top1RmEstimate = useMemo(() => {
    let max1Rm = 0;
    let maxExercise = "";
    workouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        ex.sets.forEach((s) => {
          if (s.completed && s.weight > 0) {
            const oneRm = estimateOneRepMax(s.weight, s.reps);
            if (oneRm > max1Rm) {
              max1Rm = oneRm;
              maxExercise = getExerciseById(ex.exerciseId)?.name || ex.exerciseId;
            }
          }
        });
      });
    });
    return { val: max1Rm, exercise: maxExercise };
  }, [workouts]);

  const weeklySetsPerMuscle = useMemo(() => {
    const muscleSets: Record<string, number> = {};
    const weekAgo = Date.now() - 7 * 86400000;
    const recentWorkouts = workouts.filter((w) => new Date(w.startedAt).getTime() >= weekAgo);

    recentWorkouts.forEach((w) => {
      w.exercises.forEach((ex) => {
        const exerciseDetails = getExerciseById(ex.exerciseId);
        const muscles = exerciseDetails?.muscles || [];
        const completedSetsCount = ex.sets.filter((s) => s.completed).length;

        muscles.forEach((muscle) => {
          const key = muscle.charAt(0).toUpperCase() + muscle.slice(1).toLowerCase();
          muscleSets[key] = (muscleSets[key] || 0) + completedSetsCount;
        });
      });
    });
    return Object.entries(muscleSets)
      .map(([muscle, count]) => ({ muscle, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [workouts]);

  const overloadStatus = useMemo(() => {
    const recs = getProgressionRecommendations(workouts, recoveryScore);
    const increased = recs.filter((r) => r.action === "increase_weight").length;
    const total = recs.length;
    return { increased, total };
  }, [workouts, recoveryScore]);

  const cardioMetrics = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    const recentWorkouts = workouts.filter((w) => new Date(w.startedAt).getTime() >= weekAgo);
    let sessionCount = 0;
    let totalMinutes = 0;

    const totalWorkoutsCount = workouts.filter(
      (w) => new Date(w.startedAt).getTime() >= Date.now() - 30 * 86400000
    ).length;
    const totalMinutes30Days = workouts
      .filter((w) => new Date(w.startedAt).getTime() >= Date.now() - 30 * 86400000)
      .reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

    recentWorkouts.forEach((w) => {
      let hasCardio = false;
      w.exercises.forEach((ex) => {
        const details = getExerciseById(ex.exerciseId);
        const isCardio = details?.category === "cardio" || details?.category === "steady-state";
        if (isCardio) {
          hasCardio = true;
          ex.sets.forEach((s) => {
            if (s.completed && s.durationSeconds) {
              totalMinutes += s.durationSeconds / 60;
            }
          });
        }
      });
      if (hasCardio) {
        sessionCount++;
      }
    });

    const avgDuration = totalWorkoutsCount > 0 ? Math.round(totalMinutes30Days / totalWorkoutsCount) : 0;
    return { sessionCount, totalMinutes: Math.round(totalMinutes), avgDuration };
  }, [workouts]);

  const generalMetrics = useMemo(() => {
    const weightDelta =
      bodyMetrics.length >= 2
        ? (bodyMetrics[bodyMetrics.length - 1].bodyweight || 0) - (bodyMetrics[0].bodyweight || 0)
        : 0;

    const weekAgo = Date.now() - 7 * 86400000;
    const uniqueNutritionDays = new Set(
      nutritionEntries
        .filter((e) => new Date(e.timestamp).getTime() >= weekAgo)
        .map((e) => e.timestamp.slice(0, 10))
    ).size;

    return {
      consistencyScore: getTrainingConsistency(workouts, profile?.daysPerWeek || 3, activeWorkoutPlanId),
      nutritionDays: uniqueNutritionDays,
      weightDelta: Number(weightDelta.toFixed(1)),
    };
  }, [workouts, bodyMetrics, nutritionEntries, profile, activeWorkoutPlanId]);

  // 3. Progressive Overload Recommendations
  const progressionRecs = useMemo(() => {
    return getProgressionRecommendations(workouts, recoveryScore);
  }, [workouts, recoveryScore]);

  // 4. Strength Benchmarks (1RM)
  const exercisesWithHistory = useMemo(() => {
    const performedIds = new Set<string>();
    workouts.forEach((w) => {
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
        name: match?.name ?? id.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
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
  }, [workouts]);

  const strengthSeries = useMemo(() => {
    return getStrengthSeries(workouts, selectedExercise);
  }, [workouts, selectedExercise]);

  // 5. Volume Trend Calculations
  const volumeSeries = useMemo(() => {
    return getVolumeSeries(workouts);
  }, [workouts]);

  const targetVolume = useMemo(() => {
    if (volumeSeries.length === 0) return 0;
    const avg = volumeSeries.reduce((sum, item) => sum + item.volume, 0) / volumeSeries.length;
    // Set target slightly higher (progressive overload) if strength/hypertrophy goal
    const multiplier =
      profile?.trainingStyle === "strength" || profile?.trainingStyle === "hypertrophy" ? 1.05 : 1.0;
    return Math.round(avg * multiplier);
  }, [volumeSeries, profile?.trainingStyle]);

  // 6. Recovery ↔ Performance Correlation
  const correlationInsight = useMemo(() => {
    let highRecoveryVolumeSum = 0;
    let highRecoveryCount = 0;
    let lowRecoveryVolumeSum = 0;
    let lowRecoveryCount = 0;

    workouts.forEach((w) => {
      const workoutDate = w.startedAt.slice(0, 10);
      const log = recoveryLogs.find((r) => r.date === workoutDate);
      const score = log ? calculateRecoveryScore(log) : 72;
      const vol = w.exercises.reduce((workoutTotal, exercise) => {
        return (
          workoutTotal +
          exercise.sets.reduce((setTotal, set) => {
            if (!set.completed) return setTotal;
            return setTotal + set.reps * set.weight;
          }, 0)
        );
      }, 0);

      if (score >= 75) {
        highRecoveryVolumeSum += vol;
        highRecoveryCount++;
      } else {
        lowRecoveryVolumeSum += vol;
        lowRecoveryCount++;
      }
    });

    const avgHigh = highRecoveryCount > 0 ? highRecoveryVolumeSum / highRecoveryCount : 0;
    const avgLow = lowRecoveryCount > 0 ? lowRecoveryVolumeSum / lowRecoveryCount : 0;

    if (avgHigh > 0 && avgLow > 0) {
      const diffPercent = Math.round(((avgHigh - avgLow) / avgLow) * 100);
      if (diffPercent > 0) {
        return `You lift ${diffPercent}% more training volume on average on days when your recovery score is above 75. Prioritising sleep and hydration shows real neuromuscular impact!`;
      } else if (diffPercent < 0) {
        return `Your training volume remains high even when fatigued (volume is actually ${Math.abs(
          diffPercent
        )}% higher on lower-recovery days). Be careful of fatigue accumulation and prioritize systemic rest.`;
      }
    }
    return "Log your daily recovery score and complete workouts on corresponding days to unlock neuromuscular recovery-volume correlation metrics.";
  }, [workouts, recoveryLogs]);

  // Combined Recovery-Volume Series for charting correlation
  const recoveryVolumeCombinedSeries = useMemo(() => {
    // Take the last 8 weeks or matching days
    const series: Array<{ name: string; volume: number; recovery: number }> = [];
    const recentWorkouts = workouts.slice(-8);

    recentWorkouts.forEach((w) => {
      const workoutDate = w.startedAt.slice(0, 10);
      const log = recoveryLogs.find((r) => r.date === workoutDate);
      const score = log ? calculateRecoveryScore(log) : 72;
      const vol = w.exercises.reduce((workoutTotal, exercise) => {
        return (
          workoutTotal +
          exercise.sets.reduce((setTotal, set) => {
            if (!set.completed) return setTotal;
            return setTotal + set.reps * set.weight;
          }, 0)
        );
      }, 0);

      series.push({
        name: format(new Date(w.startedAt), "MM/dd"),
        volume: Math.round(vol),
        recovery: score,
      });
    });

    return series;
  }, [workouts, recoveryLogs]);

  // 7. Body Composition Series
  const bodyweightSeries = useMemo(() => {
    return getBodyweightSeries(bodyMetrics);
  }, [bodyMetrics]);

  return (
    <div className="space-y-6">
      {/* 1. Readiness Banner Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="p-6 relative overflow-hidden border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 pointer-events-none" />
          <div className="relative flex flex-col md:flex-row items-center gap-6 z-10">
            {/* SVG Circular Progress Ring */}
            <div className="relative flex items-center justify-center shrink-0">
              <svg className="w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="38"
                  className="stroke-zinc-100 dark:stroke-zinc-800"
                  strokeWidth="8"
                  fill="transparent"
                />
                <motion.circle
                  cx="48"
                  cy="48"
                  r="38"
                  stroke={recoveryDetails.stroke}
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 38}
                  initial={{ strokeDashoffset: 2 * Math.PI * 38 }}
                  animate={{
                    strokeDashoffset:
                      2 * Math.PI * 38 - (Math.max(1, recoveryScore) / 100) * 2 * Math.PI * 38,
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </svg>
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-foreground">{recoveryScore}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Score</span>
              </div>
            </div>

            {/* Banner Text Details */}
            <div className="space-y-2 text-center md:text-left flex-1">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                <span className="text-lg font-bold text-foreground">Training Readiness</span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${recoveryDetails.color}`}
                >
                  {fatigue.label}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground/90">{recoveryDetails.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
                {recoveryDetails.desc}
              </p>
              <div className="pt-2 border-t border-surface-border flex items-start gap-2">
                <Zap size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground font-semibold text-left">
                  <span className="text-amber-500">CNS Recommendation:</span> {recoveryDetails.suggestion}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* 2. Goal Snapshot Panel */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Card className="p-6 border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass className="text-emerald-500" size={18} />
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                Goal Metrics Snapshot
              </h3>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <Award className="text-emerald-500" size={12} />
              <span className="text-[10px] font-extrabold uppercase text-emerald-600 dark:text-emerald-400">
                {profile?.trainingStyle ? `${profile.trainingStyle} Athlete` : "General Fitness"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Displaying goal specific metrics */}
            {(profile?.trainingStyle === "strength" || profile?.trainingStyle === "powerbuilding") && (
              <>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Current Streak</p>
                  <p className="text-xl font-extrabold text-foreground">{streak} sessions</p>
                  <p className="text-[10px] text-zinc-400">Max 3-day workout gap allowed</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">7-Day Lifted Volume</p>
                  <p className="text-xl font-extrabold text-foreground">
                    {weeklyVolume.toLocaleString()} {profile?.weightUnit ?? "kg"}
                  </p>
                  <p className="text-[10px] text-zinc-400">Aggregated sets × reps × load</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Top Estimated 1RM</p>
                  <p className="text-xl font-extrabold text-foreground">
                    {top1RmEstimate.val > 0
                      ? `${top1RmEstimate.val} ${profile?.weightUnit ?? "kg"}`
                      : "—"}
                  </p>
                  <p className="text-[10px] text-zinc-400 truncate">
                    {top1RmEstimate.exercise ? `Via: ${top1RmEstimate.exercise}` : "No lifts recorded"}
                  </p>
                </div>
              </>
            )}

            {profile?.trainingStyle === "hypertrophy" && (
              <>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    Weekly Sets (Top Target)
                  </p>
                  {weeklySetsPerMuscle.length > 0 ? (
                    <div className="space-y-1">
                      {weeklySetsPerMuscle.map((item) => (
                        <div key={item.muscle} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-foreground">{item.muscle}</span>
                          <span className="font-extrabold text-emerald-500">{item.count} sets</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm font-semibold text-zinc-500 py-1">No sets completed this week</p>
                  )}
                  <p className="text-[9px] text-zinc-400 pt-1 border-t border-surface-border/50">
                    Target: 10-20 weekly sets per muscle
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Overload Recommendations</p>
                  <p className="text-xl font-extrabold text-foreground">
                    {overloadStatus.increased} / {overloadStatus.total}
                  </p>
                  <p className="text-[10px] text-zinc-400">Target compound exercises flagged for weight increase</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">CNS Readiness Score</p>
                  <p className="text-xl font-extrabold text-foreground">{recoveryScore}%</p>
                  <p className="text-[10px] text-zinc-400">CNS recovery is primary for hypertrophy stim</p>
                </div>
              </>
            )}

            {profile?.trainingStyle === "endurance" && (
              <>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Cardio Sessions (7 Days)</p>
                  <p className="text-xl font-extrabold text-foreground">{cardioMetrics.sessionCount} sessions</p>
                  <p className="text-[10px] text-zinc-400">Steady-state or cardio categories</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Total Cardio Time (7 Days)</p>
                  <p className="text-xl font-extrabold text-foreground">{cardioMetrics.totalMinutes} mins</p>
                  <p className="text-[10px] text-zinc-400">Aggregated duration from completed sets</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">30-Day Avg Duration</p>
                  <p className="text-xl font-extrabold text-foreground">{cardioMetrics.avgDuration} mins/session</p>
                  <p className="text-[10px] text-zinc-400">Calculated over all completed workouts</p>
                </div>
              </>
            )}

            {(profile?.trainingStyle === "general" || !profile?.trainingStyle) && (
              <>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Training Consistency</p>
                  <p className="text-xl font-extrabold text-foreground">{generalMetrics.consistencyScore}%</p>
                  <p className="text-[10px] text-zinc-400">Last 30 days vs weekly goal ({profile?.daysPerWeek ?? 3}x)</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Nutrition Logs (7 Days)</p>
                  <p className="text-xl font-extrabold text-foreground">{generalMetrics.nutritionDays} / 7 days</p>
                  <p className="text-[10px] text-zinc-400">Consistency in meal/deficit tracking</p>
                </div>
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border space-y-1">
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">Bodyweight Delta</p>
                  <p className="text-xl font-extrabold text-foreground">
                    {generalMetrics.weightDelta > 0 ? "+" : ""}
                    {generalMetrics.weightDelta} {profile?.weightUnit ?? "kg"}
                  </p>
                  <p className="text-[10px] text-zinc-400">From onboarding baseline measurements</p>
                </div>
              </>
            )}
          </div>
        </Card>
      </motion.div>

      {/* 3. Progressive Overload Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card className="p-6 border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
              Neuromuscular Progressive Overload Status
            </h3>
          </div>

          <div className="space-y-3">
            {progressionRecs.length > 0 ? (
              progressionRecs.map((rec) => {
                let badgeStyle = "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
                let arrow = "→";
                let label = "Maintain Load";

                if (rec.action === "increase_weight") {
                  badgeStyle = "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
                  arrow = "↑↑";
                  label = `Increase Load (+${rec.suggestedWeightDelta ?? (profile?.weightUnit === "lbs" ? 5 : 2.5)} ${
                    profile?.weightUnit ?? "kg"
                  })`;
                } else if (rec.action === "deload") {
                  badgeStyle = "text-rose-500 bg-rose-500/10 border-rose-500/20";
                  arrow = "↓↓";
                  label = "Deload / Recalibrate";
                } else if (rec.action === "reduce_volume") {
                  badgeStyle = "text-amber-500 bg-amber-500/10 border-amber-500/20";
                  arrow = "↓";
                  label = "Decrease Sets/Volume";
                }

                return (
                  <div
                    key={rec.exerciseId}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border border-surface-border gap-3 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="space-y-1 max-w-md">
                      <span className="text-sm font-extrabold text-foreground">{rec.exerciseName}</span>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">{rec.reason}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${badgeStyle}`}>
                        <span className="font-black text-sm">{arrow}</span>
                        <span>{label}</span>
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-6 border border-dashed border-surface-border rounded-2xl">
                <HelpCircle className="mx-auto text-zinc-400 mb-2" size={24} />
                <p className="text-sm font-semibold text-zinc-500">
                  No exercise history recorded yet. Complete exercises in workouts to generate progressive overload targets.
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Grid for charts (1RM strength benchmarks + Volume Trend) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 4. Strength Benchmarks (1RM) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <Card className="p-6 border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LineChartIcon className="text-emerald-500" size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Estimated 1RM Benchmarks
                  </h3>
                </div>

                <select
                  value={selectedExercise}
                  onChange={(e) => setSelectedExercise(e.target.value)}
                  className="px-3 py-1 text-xs font-bold rounded-lg border border-surface-border bg-surface text-foreground focus:outline-none focus:ring-1 focus:ring-emerald-500 max-w-[200px]"
                >
                  {exercisesWithHistory.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.name}
                    </option>
                  ))}
                </select>
              </div>

              {strengthSeries.length >= 2 ? (
                <div className="h-48 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={strengthSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="10%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-card-border)",
                          borderRadius: 16,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                        formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Est. 1RM"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="estimated1rm"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#strengthGrad)"
                        dot={{ r: 3, stroke: "#10b981", strokeWidth: 1.5, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-surface-border rounded-2xl text-center p-4">
                  <HelpCircle className="text-zinc-400 mb-2" size={24} />
                  <p className="text-xs font-semibold text-zinc-500 max-w-[280px]">
                    No historical progression recorded for this exercise yet. Add completed sets to track 1RM peaks.
                  </p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mt-2">
              Note: 1RM calculations leverage the Epley formula: `1RM = w * (36 / (37 - r))`, accurate up to 10-12 reps close to failure.
            </p>
          </Card>
        </motion.div>

        {/* 5. Volume Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.25 }}
        >
          <Card className="p-6 border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="text-emerald-500" size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Weekly Volume Trend
                  </h3>
                </div>
                {targetVolume > 0 && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-surface-border rounded-lg text-zinc-600 dark:text-zinc-300">
                    Overload Target: {targetVolume.toLocaleString()} {profile?.weightUnit ?? "kg"}
                  </span>
                )}
              </div>

              {volumeSeries.length >= 2 ? (
                <div className="h-48 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-card-border)",
                          borderRadius: 16,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                        formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Weekly Volume"]}
                      />
                      <Bar dataKey="volume" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={30} />
                      {targetVolume > 0 && (
                        <ReferenceLine
                          y={targetVolume}
                          stroke="#ef4444"
                          strokeDasharray="4 4"
                          strokeWidth={1.5}
                          label={{
                            value: "Overload Line",
                            position: "top",
                            fill: "#ef4444",
                            fontSize: 9,
                            fontWeight: "bold",
                          }}
                        />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-surface-border rounded-2xl text-center p-4">
                  <HelpCircle className="text-zinc-400 mb-2" size={24} />
                  <p className="text-xs font-semibold text-zinc-500 max-w-[280px]">
                    No weekly training history detected. Complete workouts over multiple weeks to view progressive volume steps.
                  </p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mt-2">
              Note: Progressive overload target is set at 105% of weekly average volume to stimulate hypertrophy and strength adaptations safely.
            </p>
          </Card>
        </motion.div>
      </div>

      {/* Grid for Recovery/Performance correlation + Body Composition */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 6. Recovery ↔ Performance Correlation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
        >
          <Card className="p-6 border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <BrainCircuit className="text-emerald-500" size={18} />
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                  CNS Recovery ↔ Volume Correlation
                </h3>
              </div>

              {recoveryVolumeCombinedSeries.length >= 2 ? (
                <div className="h-48 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={recoveryVolumeCombinedSeries}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="recoveryVolGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="10%" stopColor="#f59e0b" stopOpacity={0.15} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                      <YAxis
                        yAxisId="left"
                        orientation="left"
                        tick={{ fontSize: 9, fill: "#71717a" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        yAxisId="right"
                        orientation="right"
                        domain={[0, 100]}
                        tick={{ fontSize: 9, fill: "#f59e0b" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-card-border)",
                          borderRadius: 16,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                      />
                      <Area
                        yAxisId="left"
                        type="monotone"
                        dataKey="volume"
                        name="Volume"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="transparent"
                      />
                      <Area
                        yAxisId="right"
                        type="monotone"
                        dataKey="recovery"
                        name="Recovery"
                        stroke="#f59e0b"
                        strokeWidth={2}
                        fill="url(#recoveryVolGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-surface-border rounded-2xl text-center p-4">
                  <HelpCircle className="text-zinc-400 mb-2" size={24} />
                  <p className="text-xs font-semibold text-zinc-500 max-w-[280px]">
                    Log recovery score and complete workouts on similar days to plot neuromuscular feedback correlation curves.
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5 mt-2">
              <Sparkles size={16} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400">Neuromuscular Insight</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold">
                  {correlationInsight}
                </p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 7. Body Composition (if data exists) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.35 }}
        >
          <Card className="p-6 border border-surface-border bg-surface/50 backdrop-blur-md shadow-lg rounded-3xl space-y-4 h-full flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Weight className="text-emerald-500" size={18} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">
                    Body Composition Trend
                  </h3>
                </div>
                {bodyweightSeries.length >= 2 && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 border border-surface-border rounded-lg text-zinc-600 dark:text-zinc-300">
                    Baseline Delta: {generalMetrics.weightDelta > 0 ? "+" : ""}
                    {generalMetrics.weightDelta} {profile?.weightUnit ?? "kg"}
                  </span>
                )}
              </div>

              {bodyweightSeries.length >= 2 ? (
                <div className="h-48 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={bodyweightSeries} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="bodyweightGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="10%" stopColor="#10b981" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                      <YAxis
                        domain={["dataMin - 2", "dataMax + 2"]}
                        tick={{ fontSize: 9, fill: "#71717a" }}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          background: "var(--color-card)",
                          border: "1px solid var(--color-card-border)",
                          borderRadius: 16,
                          fontSize: 11,
                          fontWeight: "bold",
                        }}
                        formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Weight"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="weight"
                        stroke="#10b981"
                        strokeWidth={2.5}
                        fill="url(#bodyweightGrad)"
                        dot={{ r: 3, stroke: "#10b981", strokeWidth: 1.5, fill: "#fff" }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-48 border border-dashed border-surface-border rounded-2xl text-center p-4">
                  <HelpCircle className="text-zinc-400 mb-2" size={24} />
                  <p className="text-xs font-semibold text-zinc-500 max-w-[280px]">
                    No weight records logged over time. Log weight inside the home dashboard check-ins or Settings to enable composition analytics.
                  </p>
                </div>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed mt-2">
              Note: Consistently recording weight in the morning before meals maintains accuracy by minimizing fluid shift fluctuations.
            </p>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
