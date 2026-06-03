"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Layers,
  Sparkles,
  Compass,
  Trophy,
  Calendar,
  CheckCircle2,
  Footprints,
  Dumbbell,
  BarChart2,
  Star,
  ArrowUp,
  ArrowDown,
  Minus,
  Target,
  HeartPulse,
  Clock,
  ChevronRight,
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
  getRecentPrs,
} from "@/lib/progression/engine";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { format } from "date-fns";
import { AlertTriangle, Info } from "lucide-react";
import { getSmartTips } from "@/lib/coach/smart-tips";
import { AiWorkoutTip } from "@/components/ai-workout-tip";

// ─── Shared tooltip style ───────────────────────────────────────────────────
const tooltipStyle = {
  background: "var(--color-card)",
  border: "1px solid var(--color-card-border)",
  borderRadius: 16,
  fontSize: 11,
  fontWeight: "bold",
};

// ─── Animated stat card ─────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  color = "emerald",
  delay = 0,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color?: "emerald" | "amber" | "rose" | "blue" | "violet";
  delay?: number;
}) {
  const colorMap = {
    emerald: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    rose: "text-rose-500 bg-rose-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    violet: "text-violet-500 bg-violet-500/10",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
      className="flex flex-col gap-3 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-card-border"
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${colorMap[color]}`}>
        <Icon size={17} />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-black text-foreground leading-none">{value}</p>
        {sub && <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 leading-snug">{sub}</p>}
      </div>
    </motion.div>
  );
}

// ─── Empty state ────────────────────────────────────────────────────────────
function EmptyChart({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-44 border border-dashed border-surface-border rounded-2xl text-center p-4">
      <HelpCircle className="text-zinc-400 mb-2" size={22} />
      <p className="text-xs font-semibold text-zinc-500 max-w-[260px] leading-relaxed">{message}</p>
    </div>
  );
}

// ─── Smart Tip Card ─────────────────────────────────────────────────────────
function SmartTipCard({ guidedMode }: { guidedMode: boolean }) {
  const profile = useAtlasStore((s) => s.profile);
  const workouts = useAtlasStore((s) => s.workouts);
  const recoveryLogs = useAtlasStore((s) => s.recoveryLogs);
  const storeExercises = useAtlasStore((s) => s.exercises || []);

  const tips = useMemo(
    () => getSmartTips(profile, workouts, recoveryLogs, guidedMode, storeExercises),
    [profile, workouts, recoveryLogs, guidedMode, storeExercises]
  );

  if (tips.length === 0) return null;

  return (
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
          warning: "bg-amber-500/5 border-amber-500/15 text-amber-500",
          success: "bg-emerald-500/5 border-emerald-500/15 text-emerald-500",
          tip: "bg-blue-500/5 border-blue-500/15 text-blue-500",
        }[tip.type] || "bg-blue-500/5 border-blue-500/15 text-blue-500";

        return (
          <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-3 ${colors}`}>
            <Icon size={16} className="shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-foreground">{tip.title}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                {tip.desc}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function Section({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      {children}
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BEGINNER MODE
// ═══════════════════════════════════════════════════════════════════════════
function BeginnerAnalytics() {
  const profile = useAtlasStore((s) => s.profile);
  const allWorkouts = useAtlasStore((s) => s.workouts);
  const recoveryLogs = useAtlasStore((s) => s.recoveryLogs);
  const activeWorkoutPlanId = useAtlasStore((s) => s.activeWorkoutPlanId);
  const storeExercises = useAtlasStore((s) => s.exercises || []);

  const workouts = useMemo(
    () => allWorkouts.filter((w) => w.exercises.some((ex) => ex.sets.some((s) => s.completed))),
    [allWorkouts]
  );

  const getExerciseById = (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      storeExercises.find((e) => {
        const eNorm = e.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return e.id === id || eNorm === normId || e.name.trim().toLowerCase() === id.trim().toLowerCase();
      }) || getStaticExerciseById(id)
    );
  };

  // ── Core metrics ──────────────────────────────────────────────────────
  const streak = useMemo(() => getCurrentStreak(workouts, activeWorkoutPlanId), [workouts, activeWorkoutPlanId]);
  const consistency = useMemo(
    () => getTrainingConsistency(workouts, profile?.daysPerWeek || 3, activeWorkoutPlanId),
    [workouts, profile, activeWorkoutPlanId]
  );
  const latestRecovery = recoveryLogs.at(-1);
  const recoveryScore = calculateRecoveryScore(latestRecovery);
  const fatigue = getFatigueLabel(recoveryScore);

  const totalWorkouts = workouts.length;
  const totalMinutes = workouts.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

  // ── Recent PRs (max 4 beginner-friendly ones) ────────────────────────
  const recentPrs = useMemo(() => getRecentPrs(workouts).slice(0, 4), [workouts]);

  // ── Last 5 workouts ──────────────────────────────────────────────────
  const recentWorkouts = useMemo(() => workouts.slice(-5).reverse(), [workouts]);

  // ── Weekly calendar (last 7 days) ───────────────────────────────────
  const weekCalendar = useMemo(() => {
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return d;
    });
    return days.map((d) => {
      const dateStr = d.toISOString().slice(0, 10);
      const trained = workouts.some((w) => w.startedAt.slice(0, 10) === dateStr);
      return { label: d.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2), trained, isToday: dateStr === new Date().toISOString().slice(0, 10) };
    });
  }, [workouts]);

  // ── Simple volume bar (last 4 weeks) ────────────────────────────────
  const volumeSeries = useMemo(() => getVolumeSeries(workouts).slice(-4), [workouts]);

  // ── Motivational message ─────────────────────────────────────────────
  const motivationalMsg = useMemo(() => {
    if (streak >= 5) return `🔥 You're on a ${streak}-session streak! Keep crushing it.`;
    if (totalWorkouts === 0) return "💪 Log your first workout to start tracking your journey!";
    if (totalWorkouts === 1) return "Great start! Complete 3 workouts to build your first streak.";
    if (consistency >= 80) return `🎯 ${consistency}% consistency — you're absolutely nailing it!`;
    if (consistency >= 50) return "You're building solid habits. Keep showing up!";
    return "Every workout counts. You've got this! 💪";
  }, [streak, totalWorkouts, consistency]);

  return (
    <div className="space-y-5">
      {/* ── Motivational Hero Banner ─── */}
      <Section delay={0}>
        <div className="relative overflow-hidden rounded-3xl p-5 bg-gradient-to-br from-emerald-500 to-teal-600 shadow-xl shadow-emerald-500/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.15),transparent_60%)] pointer-events-none" />
          <div className="absolute -bottom-6 -right-4 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-emerald-100 text-[11px] font-semibold uppercase tracking-widest mb-1.5">Your Progress</p>
              <p className="text-white text-base font-bold leading-snug max-w-[260px]">{motivationalMsg}</p>
            </div>
            <div className="shrink-0 flex flex-col items-center gap-0.5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <span className="text-2xl font-black text-white">{streak}</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">Streak</span>
            </div>
          </div>

          {/* Weekly calendar dots */}
          <div className="relative flex items-center gap-1.5 mt-4">
            {weekCalendar.map((day, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold transition-all ${
                    day.trained
                      ? "bg-white text-emerald-700 shadow-sm"
                      : day.isToday
                      ? "bg-white/30 text-white border border-white/40"
                      : "bg-white/10 text-emerald-200"
                  }`}
                >
                  {day.trained ? <CheckCircle2 size={14} /> : day.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ── Core Stats Grid ─── */}
      <Section delay={0.05}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard
            label="Total Workouts"
            value={totalWorkouts}
            sub="Sessions with ≥1 completed set"
            icon={Dumbbell}
            color="emerald"
            delay={0.05}
          />
          <StatCard
            label="Consistency"
            value={`${consistency}%`}
            sub={`Training days ÷ ${profile?.daysPerWeek ?? 3}×/wk (30 days)`}
            icon={Target}
            color={consistency >= 70 ? "emerald" : consistency >= 40 ? "amber" : "rose"}
            delay={0.08}
          />
          <StatCard
            label="Time Trained"
            value={totalMinutes >= 60 ? `${Math.round(totalMinutes / 60)}h` : `${totalMinutes}m`}
            sub="Sum of workout durations"
            icon={Clock}
            color="blue"
            delay={0.11}
          />
          <StatCard
            label="Recovery"
            value={`${recoveryScore}%`}
            sub={`${fatigue.label} · from daily check-in`}
            icon={HeartPulse}
            color={fatigue.tone === "good" ? "emerald" : fatigue.tone === "warn" ? "amber" : "rose"}
            delay={0.14}
          />
        </div>
        <p className="text-[9px] text-zinc-400 mt-2 leading-relaxed px-0.5">
          Workouts count sessions with at least one completed set. Consistency = unique training days in last 30 days ÷ your weekly goal. Recovery is calculated from your latest daily check-in.
        </p>
      </Section>

      {/* ── Weekly Volume Bar ─── */}
      <Section delay={0.12}>
        <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="text-emerald-500" size={17} />
            <h3 className="text-sm font-bold text-foreground">Weekly Training Volume</h3>
          </div>
          {volumeSeries.length >= 2 ? (
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeSeries} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
                  <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Volume"]}
                  />
                  <Bar dataKey="volume" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Complete at least 2 weeks of workouts to see your volume trend here." />
          )}
          <p className="text-[10px] text-zinc-400 leading-relaxed">
            Volume = sets × reps × weight across all exercises in a week.
          </p>
        </Card>
      </Section>

      {/* ── Personal Records ─── */}
      <Section delay={0.16}>
        <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="text-amber-500" size={17} />
            <h3 className="text-sm font-bold text-foreground">Your Personal Records</h3>
          </div>
          {recentPrs.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {recentPrs.map((pr, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-card-border"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Star size={15} className="text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{pr.exerciseName}</p>
                    <p className="text-[10px] text-emerald-500 font-semibold">{pr.value}</p>
                    <p className="text-[9px] text-zinc-400">{pr.date}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart message="Finish your first workout with weights to unlock personal records here!" />
          )}
        </Card>
      </Section>

      {/* ── Recent Workouts ─── */}
      <Section delay={0.2}>
        <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="text-blue-500" size={17} />
            <h3 className="text-sm font-bold text-foreground">Recent Sessions</h3>
          </div>
          {recentWorkouts.length > 0 ? (
            <div className="space-y-2">
              {recentWorkouts.map((w, i) => {
                const exerciseNames = w.exercises
                  .slice(0, 2)
                  .map((ex) => getExerciseById(ex.exerciseId)?.name ?? ex.exerciseId.replace(/-/g, " "))
                  .join(", ");
                const completedSets = w.exercises.reduce(
                  (sum, ex) => sum + ex.sets.filter((s) => s.completed).length,
                  0
                );
                return (
                  <div
                    key={w.id}
                    className="flex items-center gap-3 p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-card-border hover:bg-zinc-100/50 dark:hover:bg-zinc-800/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <Dumbbell size={15} className="text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">{w.name}</p>
                      <p className="text-[10px] text-zinc-500 truncate">{exerciseNames}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[10px] font-bold text-emerald-500">{completedSets} sets</p>
                      <p className="text-[9px] text-zinc-400">{format(new Date(w.startedAt), "MMM d")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart message="Start your first workout to see your sessions here." />
          )}
        </Card>
      </Section>

      {/* ── Smart & AI Coaching Tips ─── */}
      <Section delay={0.24}>
        <div className="space-y-4">
          <SmartTipCard guidedMode={true} />
          <AiWorkoutTip />
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ADVANCED MODE
// ═══════════════════════════════════════════════════════════════════════════
function AdvancedAnalytics() {
  const profile = useAtlasStore((s) => s.profile);
  const allWorkouts = useAtlasStore((s) => s.workouts);
  const recoveryLogs = useAtlasStore((s) => s.recoveryLogs);
  const bodyMetrics = useAtlasStore((s) => s.bodyMetrics);
  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries || []);
  const activeWorkoutPlanId = useAtlasStore((s) => s.activeWorkoutPlanId);
  const storeExercises = useAtlasStore((s) => s.exercises || []);

  const workouts = useMemo(
    () => allWorkouts.filter((w) => w.exercises.some((ex) => ex.sets.some((s) => s.completed))),
    [allWorkouts]
  );

  const getExerciseById = (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      storeExercises.find((e) => {
        const eNorm = e.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return e.id === id || eNorm === normId || e.name.trim().toLowerCase() === id.trim().toLowerCase();
      }) || getStaticExerciseById(id)
    );
  };

  // ── CNS Readiness ────────────────────────────────────────────────────
  const latestRecovery = recoveryLogs.at(-1);
  const recoveryScore = calculateRecoveryScore(latestRecovery);
  const fatigue = getFatigueLabel(recoveryScore);

  const cnsDetail = useMemo(() => {
    if (recoveryScore >= 78) {
      return {
        title: "Peak Neural State",
        desc: "Neuromuscular junctions are fully primed. Ideal for max-effort compound lifts and PR attempts.",
        color: "emerald",
        stroke: "#10b981",
        badge: "Optimal",
      };
    } else if (recoveryScore >= 55) {
      return {
        title: "Functional Baseline",
        desc: "Moderate capacity. Execute scheduled loads. Avoid exceeding planned volume.",
        color: "amber",
        stroke: "#f59e0b",
        badge: "Moderate",
      };
    } else {
      return {
        title: "CNS Depressed",
        desc: "High fatigue accumulation. Reduce volume by 30–50% or replace with active recovery.",
        color: "rose",
        stroke: "#f43f5e",
        badge: "High Fatigue",
      };
    }
  }, [recoveryScore]);

  // ── Goal metrics ─────────────────────────────────────────────────────
  const streak = useMemo(() => getCurrentStreak(workouts, activeWorkoutPlanId), [workouts, activeWorkoutPlanId]);
  const weeklyVolume = useMemo(() => getWeeklyVolume(workouts), [workouts]);
  const consistency = useMemo(
    () => getTrainingConsistency(workouts, profile?.daysPerWeek || 3, activeWorkoutPlanId),
    [workouts, profile, activeWorkoutPlanId]
  );

  const top1Rm = useMemo(() => {
    let max = 0;
    let exercise = "";
    workouts.forEach((w) =>
      w.exercises.forEach((ex) =>
        ex.sets.forEach((s) => {
          if (s.completed && s.weight > 0) {
            const rm = estimateOneRepMax(s.weight, s.reps);
            if (rm > max) { max = rm; exercise = getExerciseById(ex.exerciseId)?.name || ex.exerciseId; }
          }
        })
      )
    );
    return { val: max, exercise };
  }, [workouts]);

  // ── Muscle volume distribution (with per-exercise source tracking) ────
  const weeklySetsPerMuscle = useMemo(() => {
    const weekAgo = Date.now() - 7 * 86400000;
    // muscle -> { total sets, sources: [{exerciseName, sets, date, isDirect}] }
    const muscleMap: Record<string, { count: number; sources: { name: string; sets: number; date: string; isDirect: boolean }[] }> = {};

    workouts
      .filter((w) => new Date(w.startedAt).getTime() >= weekAgo)
      .forEach((w) => {
        const dateLabel = format(new Date(w.startedAt), "MMM d");
        w.exercises.forEach((ex) => {
          const exDetail = getExerciseById(ex.exerciseId);
          const muscles = exDetail?.muscles || [];
          const completedSets = ex.sets.filter((s) => s.completed).length;
          if (completedSets === 0) return;
          const exName = exDetail?.name ?? ex.exerciseId.replace(/-/g, " ");

          muscles.forEach((m, mIdx) => {
            const key = m.charAt(0).toUpperCase() + m.slice(1);
            // First muscle in array = primary/direct target; rest = indirect/secondary
            const isDirect = mIdx === 0;
            if (!muscleMap[key]) muscleMap[key] = { count: 0, sources: [] };
            muscleMap[key].count += completedSets;
            // Merge same exercise name within the same week (add sets)
            const existing = muscleMap[key].sources.find((s) => s.name === exName && s.date === dateLabel);
            if (existing) {
              existing.sets += completedSets;
            } else {
              muscleMap[key].sources.push({ name: exName, sets: completedSets, date: dateLabel, isDirect });
            }
          });
        });
      });

    return Object.entries(muscleMap)
      .map(([muscle, data]) => ({ muscle, count: data.count, sources: data.sources }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [workouts]);

  const maxSets = Math.max(...weeklySetsPerMuscle.map((m) => m.count), 1);
  const [expandedMuscle, setExpandedMuscle] = useState<string | null>(null);

  // ── Progressive overload ─────────────────────────────────────────────
  const progressionRecs = useMemo(() => getProgressionRecommendations(workouts, recoveryScore), [workouts, recoveryScore]);

  // ── Strength 1RM series ──────────────────────────────────────────────
  const exercisesWithHistory = useMemo(() => {
    const ids = new Set<string>();
    workouts.forEach((w) => w.exercises.forEach((ex) => { if (ex.sets.some((s) => s.completed)) ids.add(ex.exerciseId); }));
    const performed = Array.from(ids).map((id) => ({ id, name: getExerciseById(id)?.name ?? id }));
    const defaults = topExercisesForAnalytics();
    defaults.forEach((d) => { if (!performed.some((p) => p.id === d.id)) performed.push(d); });
    return performed.sort((a, b) => a.name.localeCompare(b.name));
  }, [workouts]);

  const [selectedExercise, setSelectedExercise] = useState(exercisesWithHistory[0]?.id ?? "bench-press");
  const strengthSeries = useMemo(() => getStrengthSeries(workouts, selectedExercise), [workouts, selectedExercise]);

  // ── Volume series ────────────────────────────────────────────────────
  const volumeSeries = useMemo(() => getVolumeSeries(workouts), [workouts]);
  const targetVolume = useMemo(() => {
    if (!volumeSeries.length) return 0;
    const avg = volumeSeries.reduce((s, v) => s + v.volume, 0) / volumeSeries.length;
    const mult = profile?.trainingStyle === "strength" || profile?.trainingStyle === "hypertrophy" ? 1.05 : 1.0;
    return Math.round(avg * mult);
  }, [volumeSeries, profile]);

  // ── Recovery-volume correlation ──────────────────────────────────────
  const recoveryVolumeSeries = useMemo(() => {
    return workouts.slice(-8).map((w) => {
      const log = recoveryLogs.find((r) => r.date === w.startedAt.slice(0, 10));
      const score = log ? calculateRecoveryScore(log) : 72;
      const vol = w.exercises.reduce((t, ex) => t + ex.sets.reduce((s, set) => s + (set.completed ? set.reps * set.weight : 0), 0), 0);
      return { name: format(new Date(w.startedAt), "MM/dd"), volume: Math.round(vol), recovery: score };
    });
  }, [workouts, recoveryLogs]);

  const correlationInsight = useMemo(() => {
    let hiSum = 0, hiCount = 0, loSum = 0, loCount = 0;
    workouts.forEach((w) => {
      const log = recoveryLogs.find((r) => r.date === w.startedAt.slice(0, 10));
      const score = log ? calculateRecoveryScore(log) : 72;
      const vol = w.exercises.reduce((t, ex) => t + ex.sets.reduce((s, set) => s + (set.completed ? set.reps * set.weight : 0), 0), 0);
      if (score >= 75) { hiSum += vol; hiCount++; } else { loSum += vol; loCount++; }
    });
    const avgHi = hiCount > 0 ? hiSum / hiCount : 0;
    const avgLo = loCount > 0 ? loSum / loCount : 0;
    if (avgHi > 0 && avgLo > 0) {
      const diff = Math.round(((avgHi - avgLo) / avgLo) * 100);
      if (diff > 0) return `You lift ${diff}% more volume on high-recovery days. Prioritise sleep and hydration.`;
      return `Volume stays high even on low-recovery days (${Math.abs(diff)}% higher). Monitor for fatigue accumulation.`;
    }
    return "Log daily recovery scores alongside workouts to unlock correlation data.";
  }, [workouts, recoveryLogs]);

  // ── Body composition ─────────────────────────────────────────────────
  const bodyweightSeries = useMemo(() => getBodyweightSeries(bodyMetrics), [bodyMetrics]);
  const weightDelta = bodyMetrics.length >= 2
    ? Number(((bodyMetrics.at(-1)!.bodyweight ?? 0) - (bodyMetrics[0].bodyweight ?? 0)).toFixed(1))
    : 0;

  return (
    <div className="space-y-5">
      {/* ── 1. CNS Readiness Banner ─── */}
      <Section delay={0}>
        <Card className="p-5 relative overflow-hidden border border-card-border bg-card rounded-3xl shadow-sm">
          <div className={`absolute inset-0 bg-gradient-to-br from-${cnsDetail.color}-500/5 to-transparent pointer-events-none rounded-3xl`} />
          <div className="relative flex flex-col sm:flex-row items-center gap-5">
            {/* Ring */}
            <div className="relative shrink-0">
              <svg width="88" height="88" viewBox="0 0 88 88" className="-rotate-90">
                <circle cx="44" cy="44" r="34" stroke="currentColor" strokeWidth="7" fill="none" className="text-zinc-100 dark:text-zinc-800" />
                <motion.circle
                  cx="44" cy="44" r="34"
                  stroke={cnsDetail.stroke}
                  strokeWidth="7"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 34}
                  initial={{ strokeDashoffset: 2 * Math.PI * 34 }}
                  animate={{ strokeDashoffset: 2 * Math.PI * 34 - (recoveryScore / 100) * 2 * Math.PI * 34 }}
                  transition={{ duration: 0.9, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xl font-black text-foreground">{recoveryScore}</span>
                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">CNS</span>
              </div>
            </div>
            {/* Details */}
            <div className="flex-1 space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-base font-bold text-foreground">Training Readiness</span>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-${cnsDetail.color}-500/10 text-${cnsDetail.color}-500 border border-${cnsDetail.color}-500/20`}>
                  {cnsDetail.badge}
                </span>
              </div>
              <p className="text-sm font-semibold text-foreground">{cnsDetail.title}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{cnsDetail.desc}</p>
              <div className="flex items-start gap-1.5 pt-1.5 border-t border-card-border">
                <Zap size={13} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-foreground font-semibold">
                  <span className="text-amber-500">Recommendation: </span>
                  {recoveryScore >= 78
                    ? "Excellent day to push compound lifts hard or test new PRs."
                    : recoveryScore >= 55
                    ? "Stick to your plan. Avoid exceeding scheduled loads."
                    : "Reduce volume or rest. Prioritise sleep tonight."}
                </p>
              </div>
              <p className="text-[9px] text-zinc-400 pt-1.5 border-t border-card-border leading-relaxed">
                <strong>How this score is calculated:</strong> Sleep quality (30%) + Soreness (18%) + Stress (16%) + Readiness (20%) + Energy (16%) from your last recovery check-in.
              </p>
            </div>
          </div>
        </Card>
      </Section>

      {/* ── 2. Performance Snapshot Grid ─── */}
      <Section delay={0.07}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Workout Streak" value={`${streak} sessions`} sub="Consecutive days trained (≤3 day gap allowed)" icon={Flame} color="amber" delay={0.07} />
          <StatCard label="Weekly Volume" value={`${weeklyVolume.toLocaleString()} ${profile?.weightUnit ?? "kg"}`} sub="Sum of sets × reps × weight (last 7 days)" icon={Layers} color="emerald" delay={0.09} />
          <StatCard label="Top Est. 1RM" value={top1Rm.val > 0 ? `${top1Rm.val} ${profile?.weightUnit ?? "kg"}` : "—"} sub={top1Rm.val > 0 ? `${top1Rm.exercise} · Epley formula` : "No lifts yet"} icon={Trophy} color="violet" delay={0.11} />
          <StatCard label="Consistency" value={`${consistency}%`} sub={`Unique training days ÷ ${profile?.daysPerWeek ?? 3}×/wk goal (30 days)`} icon={Target} color={consistency >= 70 ? "emerald" : consistency >= 40 ? "amber" : "rose"} delay={0.13} />
        </div>
        <p className="text-[9px] text-zinc-400 mt-2 leading-relaxed px-0.5">
          <strong>Sources:</strong> Streak counts unique calendar dates with completed sets. Volume = Σ(weight × reps) for each completed set. 1RM uses the Epley formula: w × 36/(37−r). Consistency = unique training days in last 30d ÷ your weekly target.
        </p>
      </Section>

      {/* ── 3. Progressive Overload ─── */}
      <Section delay={0.14}>
        <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-emerald-500" size={17} />
            <h3 className="text-sm font-bold text-foreground uppercase tracking-wide">Progressive Overload Status</h3>
          </div>
          <div className="space-y-2.5">
            {progressionRecs.length > 0 ? (
              progressionRecs.map((rec) => {
                const isUp = rec.action === "increase_weight";
                const isDown = rec.action === "deload" || rec.action === "reduce_volume";
                const badgeStyle = isUp
                  ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
                  : isDown
                  ? "text-rose-500 bg-rose-500/10 border-rose-500/20"
                  : "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
                const ActionIcon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
                const label = isUp
                  ? `+${rec.suggestedWeightDelta ?? 2.5} ${profile?.weightUnit ?? "kg"}`
                  : isDown
                  ? rec.action === "deload" ? "Deload" : "−Volume"
                  : "Hold";
                return (
                  <div
                    key={rec.exerciseId}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-card-border hover:bg-zinc-100/40 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-sm font-extrabold text-foreground truncate">{rec.exerciseName}</p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{rec.reason}</p>
                    </div>
                    <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border shrink-0 ${badgeStyle}`}>
                      <ActionIcon size={12} />
                      {label}
                    </span>
                  </div>
                );
              })
            ) : (
              <EmptyChart message="Complete a few workouts with logged sets to generate progressive overload targets." />
            )}
          </div>
        </Card>
      </Section>

      {/* ── 4. Charts grid ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* 1RM Strength Trend */}
        <Section delay={0.18}>
          <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <LineChartIcon className="text-emerald-500" size={17} />
                <h3 className="text-sm font-bold text-foreground">Estimated 1RM Trend</h3>
              </div>
              <select
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl border border-card-border bg-surface text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/30 max-w-[190px]"
              >
                {exercisesWithHistory.map((ex) => (
                  <option key={ex.id} value={ex.id}>{ex.name}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              {strengthSeries.length >= 2 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={strengthSeries} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                      <defs>
                        <linearGradient id="strengthGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
                      <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Est. 1RM"]} />
                      <Area type="monotone" dataKey="estimated1rm" stroke="#10b981" strokeWidth={2.5} fill="url(#strengthGrad)" dot={{ r: 3.5, stroke: "#10b981", strokeWidth: 1.5, fill: "#fff" }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="Need 2+ sessions with this exercise to draw the strength trend." />
              )}
            </div>
            <p className="text-[10px] text-zinc-400">1RM estimated via Epley formula: w × (36 / (37 − r))</p>
          </Card>
        </Section>

        {/* Volume Trend */}
        <Section delay={0.21}>
          <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4 h-full flex flex-col">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="text-emerald-500" size={17} />
                <h3 className="text-sm font-bold text-foreground">Weekly Volume Trend</h3>
              </div>
              {targetVolume > 0 && (
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-surface border border-surface-border text-zinc-500">
                  Target: {targetVolume.toLocaleString()}
                </span>
              )}
            </div>
            <div className="flex-1">
              {volumeSeries.length >= 2 ? (
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={volumeSeries} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
                      <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                      <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Volume"]} />
                      <Bar dataKey="volume" fill="#34d399" radius={[6, 6, 0, 0]} maxBarSize={32} />
                      {targetVolume > 0 && (
                        <ReferenceLine y={targetVolume} stroke="#ef4444" strokeDasharray="4 4" strokeWidth={1.5} label={{ value: "Overload Line", position: "insideTopRight", fill: "#ef4444", fontSize: 9, fontWeight: "bold" }} />
                      )}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyChart message="Complete workouts over 2+ weeks to unlock your volume trend." />
              )}
            </div>
            <p className="text-[10px] text-zinc-400">Overload target set at 105% of weekly average volume.</p>
          </Card>
        </Section>
      </div>

      {/* ── 5. Muscle Balance + Recovery Correlation ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Muscle volume distribution */}
        <Section delay={0.24}>
          <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="text-violet-500" size={17} />
                <h3 className="text-sm font-bold text-foreground">Weekly Muscle Balance</h3>
              </div>
              <span className="text-[10px] text-zinc-400 font-medium">Tap row to see sources</span>
            </div>

            {weeklySetsPerMuscle.length > 0 ? (
              <div className="space-y-1">
                {weeklySetsPerMuscle.map(({ muscle, count, sources }) => {
                  const isOpen = expandedMuscle === muscle;
                  const directSets = sources.filter(s => s.isDirect).reduce((a, s) => a + s.sets, 0);
                  const indirectSets = count - directSets;
                  return (
                    <div key={muscle} className="rounded-xl overflow-hidden border border-card-border">
                      {/* Row header — tappable */}
                      <button
                        type="button"
                        onClick={() => setExpandedMuscle(isOpen ? null : muscle)}
                        className="w-full flex items-center gap-3 px-3.5 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors text-left"
                      >
                        {/* Progress bar fills */}
                        <div className="flex-1 space-y-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <span className="text-xs font-semibold text-foreground">{muscle}</span>
                            <span className="text-[10px] font-bold text-emerald-500 shrink-0 ml-2">{count} sets</span>
                          </div>
                          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                            <motion.div
                              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-emerald-400"
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.round((count / maxSets) * 100)}%` }}
                              transition={{ duration: 0.55, ease: "easeOut" }}
                            />
                          </div>
                        </div>
                        <motion.span
                          animate={{ rotate: isOpen ? 90 : 0 }}
                          transition={{ duration: 0.18 }}
                          className="text-zinc-400 shrink-0"
                        >
                          <ChevronRight size={14} />
                        </motion.span>
                      </button>

                      {/* Expandable breakdown table */}
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.22, ease: "easeInOut" }}
                            className="overflow-hidden"
                          >
                            <div className="px-3.5 pb-3 space-y-2 border-t border-card-border bg-zinc-50/60 dark:bg-zinc-900/40">
                              {/* Legend */}
                              <div className="flex items-center gap-3 pt-2.5 pb-1">
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-violet-500 inline-block"/>
                                  <span className="text-[9px] text-zinc-500 font-semibold">Direct (primary target)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-zinc-400 inline-block"/>
                                  <span className="text-[9px] text-zinc-500 font-semibold">Indirect (secondary)</span>
                                </div>
                              </div>

                              {/* Exercise rows */}
                              <div className="space-y-1">
                                {sources.sort((a, b) => b.sets - a.sets).map((src, i) => (
                                  <div
                                    key={i}
                                    className="flex items-center justify-between gap-2 py-1.5 border-b border-card-border/60 last:border-0"
                                  >
                                    <div className="flex items-center gap-2 min-w-0">
                                      <span className={`w-2 h-2 rounded-full shrink-0 ${src.isDirect ? "bg-violet-500" : "bg-zinc-400"}`} />
                                      <span className="text-[11px] font-semibold text-foreground truncate">{src.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <span className="text-[9px] text-zinc-400">{src.date}</span>
                                      <span className="text-[11px] font-bold text-emerald-500">{src.sets}×</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              {/* Summary */}
                              <div className="flex items-center justify-between text-[10px] pt-1 border-t border-card-border text-zinc-500">
                                <span>Direct: <strong className="text-violet-500">{directSets}</strong> · Indirect: <strong className="text-zinc-400">{indirectSets}</strong></span>
                                <span className={count >= 10 ? "text-emerald-500 font-bold" : count >= 6 ? "text-amber-500 font-bold" : "text-rose-500 font-bold"}>
                                  {count >= 10 ? "✓ In range" : count >= 6 ? "↑ Build more" : "↑ Below target"}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}

                <p className="text-[9px] text-zinc-400 pt-1">
                  Target: 10–20 sets/muscle/week · Indirect sets (e.g. biceps from rows) are counted because they cause real stimulus.
                </p>
              </div>
            ) : (
              <EmptyChart message="Train this week to see your muscle volume distribution." />
            )}
          </Card>
        </Section>

        {/* Recovery correlation */}
        <Section delay={0.27}>
          <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
            <div className="flex items-center gap-2">
              <BrainCircuit className="text-amber-500" size={17} />
              <h3 className="text-sm font-bold text-foreground">CNS ↔ Volume Correlation</h3>
            </div>
            {recoveryVolumeSeries.length >= 2 ? (
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={recoveryVolumeSeries} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                    <defs>
                      <linearGradient id="recVolGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                    <YAxis yAxisId="l" orientation="left" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                    <YAxis yAxisId="r" orientation="right" domain={[0, 100]} tick={{ fontSize: 9, fill: "#f59e0b" }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Area yAxisId="l" type="monotone" dataKey="volume" name="Volume" stroke="#10b981" strokeWidth={2} fill="transparent" />
                    <Area yAxisId="r" type="monotone" dataKey="recovery" name="Recovery" stroke="#f59e0b" strokeWidth={2} fill="url(#recVolGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart message="Log recovery scores and complete workouts to unlock correlation." />
            )}
            <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2">
              <Sparkles size={13} className="text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-500 font-semibold leading-relaxed">{correlationInsight}</p>
            </div>
          </Card>
        </Section>
      </div>

      {/* ── 6. Body Composition ─── */}
      <Section delay={0.3}>
        <Card className="p-5 border border-card-border bg-card rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Weight className="text-blue-500" size={17} />
              <h3 className="text-sm font-bold text-foreground">Body Composition Trend</h3>
            </div>
            {bodyweightSeries.length >= 2 && (
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border ${weightDelta > 0 ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : weightDelta < 0 ? "bg-rose-500/10 text-rose-500 border-rose-500/20" : "bg-surface text-zinc-500 border-surface-border"}`}>
                {weightDelta > 0 ? "+" : ""}{weightDelta} {profile?.weightUnit ?? "kg"}
              </span>
            )}
          </div>
          {bodyweightSeries.length >= 2 ? (
            <div className="h-44">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyweightSeries} margin={{ top: 8, right: 4, left: -28, bottom: 0 }}>
                  <defs>
                    <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.08)" />
                  <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                  <YAxis domain={["dataMin - 2", "dataMax + 2"]} tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Weight"]} />
                  <Area type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2.5} fill="url(#bwGrad)" dot={{ r: 3.5, stroke: "#3b82f6", strokeWidth: 1.5, fill: "#fff" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="Log your body weight in Today's check-in or Settings to track composition changes over time." />
          )}
          <p className="text-[10px] text-zinc-400">Weigh yourself in the morning before meals for most accurate tracking.</p>
        </Card>
      </Section>

      {/* ── Smart & AI Coaching Tips ─── */}
      <Section delay={0.33}>
        <div className="space-y-4">
          <SmartTipCard guidedMode={false} />
          <AiWorkoutTip />
        </div>
      </Section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ROOT EXPORT — handles mode switching
// ═══════════════════════════════════════════════════════════════════════════
export function AdvancedAnalyticsScreen() {
  // Reads guidedMode from store so the component stays self-contained
  const guidedMode = useAtlasStore((s) => s.guidedMode);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={guidedMode ? "beginner" : "advanced"}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22 }}
      >
        {guidedMode ? <BeginnerAnalytics /> : <AdvancedAnalytics />}
      </motion.div>
    </AnimatePresence>
  );
}
