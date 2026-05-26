"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  Flame,
  Medal,
  Moon,
  TimerReset,
  Pencil,
  Sparkles,
  Plus,
  Bot,
  Trash2,
  X,
  User,
  Calendar,
  Weight,
  Ruler,
  Dumbbell,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Heart,
  TrendingUp,
  BrainCircuit,
  Settings,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import {
  calculateRecoveryScore,
  getBodyweightSeries,
  getCurrentStreak,
  getFatigueLabel,
  getRecentPrs,
  getVolumeSeries,
  getWeeklyVolume,
  getTrainingConsistency,
} from "@/lib/progression/engine";
import { useAtlasStore } from "@/store/useAtlasStore";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import { useState, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import type { UserProfile, RecoveryLog } from "@/types/domain";
import { createId } from "@/lib/id";
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal";

export function DashboardScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const allWorkouts = useAtlasStore((state) => state.workouts);
  
  // Filter empty workouts reactively
  const workouts = useMemo(() => {
    return allWorkouts.filter(w => w.exercises.some(ex => ex.sets.some(s => s.completed)));
  }, [allWorkouts]);

  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const bodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const deleteWorkoutPlan = useAtlasStore((state) => state.deleteWorkoutPlan);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const setActiveWorkoutPlanId = useAtlasStore((state) => state.setActiveWorkoutPlanId);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const logRecovery = useAtlasStore((state) => state.logRecovery);
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const setGuidedMode = useAtlasStore((state) => state.setGuidedMode);

  // Modal & Edit States
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

  // Interactive Metrics Drawer State
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  // Chart Tab Selection State
  const [activeChartTab, setActiveChartTab] = useState<"weight" | "volume">("weight");

  // Inline Recovery Logger States
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [logSleep, setLogSleep] = useState(8);
  const [logSoreness, setLogSoreness] = useState(2);
  const [logStress, setLogStress] = useState(2);
  const [logReadiness, setLogReadiness] = useState(7);
  const [logEnergy, setLogEnergy] = useState(7);

  // Pre-Workout Launch State
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState(false);
  const [routineToStart, setRoutineToStart] = useState<any>(null);

  // Calculations
  const latestRecoveryLog = recoveryLogs.at(-1);
  const recoveryScore = calculateRecoveryScore(latestRecoveryLog);
  const fatigue = getFatigueLabel(recoveryScore);
  const bodySeries = getBodyweightSeries(bodyMetrics);
  const volumeSeries = getVolumeSeries(workouts);
  const recentPrs = getRecentPrs(workouts);
  
  const lastMessage = aiMessages.at(-1);
  const isLastMessageError = lastMessage?.content.includes("**Error:**");

  const activePlan = useMemo(() => {
    return workoutPlans.find(p => p.id === activeWorkoutPlanId);
  }, [workoutPlans, activeWorkoutPlanId]);

  const todayDayName = useMemo(() => {
    return new Date().toLocaleDateString("en-US", { weekday: "long" });
  }, []);

  const todayRoutine = useMemo(() => {
    if (!activePlan) return null;
    return activePlan.routines.find(r => r.day.toLowerCase() === todayDayName.toLowerCase());
  }, [activePlan, todayDayName]);

  const isWorkoutPlan = (content: string) => {
    return parseAiWorkoutPlan(content) !== null;
  };

  const getLocalDateString = (d: Date) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const handleLaunchWorkoutClick = (routine: any) => {
    if (activeWorkout) {
      setActiveTab("workout");
      setActiveSubScreen("active-workout");
      return;
    }
    setRoutineToStart(routine);
    setShowPreWorkoutModal(true);
  };

  const handlePreWorkoutConfirm = (sleepHours: number | undefined) => {
    if (routineToStart) {
      void startWorkout(routineToStart);
      setActiveTab("workout");
      setActiveSubScreen("active-workout");
    }
    setShowPreWorkoutModal(false);
    setRoutineToStart(null);
  };

  const handleQuickLogSubmit = async () => {
    const todayStr = getLocalDateString(new Date());
    const logId = createId("rec");
    const newLog: RecoveryLog = {
      id: logId,
      date: todayStr,
      sleepHours: Number(logSleep),
      soreness: Number(logSoreness),
      stress: Number(logStress),
      readiness: Number(logReadiness),
      energy: Number(logEnergy),
    };
    await logRecovery(newLog);
    setShowQuickLog(false);
  };

  const getCoachingInsight = (score: number) => {
    if (score >= 80) {
      return {
        label: "Peak Performance primed",
        text: "Your central nervous system is fully restored and homeostatic markers are optimal. This is the physiological window to push load volume or test progressive overload thresholds.",
        color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        ringColor: "#10b981",
      };
    } else if (score >= 50) {
      return {
        label: "Moderate training capability",
        text: "Your systems are functionally recovered, but minor neuromuscular fatigue is present. Train at planned target volumes, keeping RIR limits strictly managed.",
        color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
        ringColor: "#f59e0b",
      };
    } else {
      return {
        label: "Prioritize System Recovery",
        text: "High metabolic strain and elevated cortisol indicators suggest fatigue accumulation. We advise active recovery flows, mobility work, and targeted sleep focus tonight to prevent injury.",
        color: "text-rose-400 bg-rose-500/10 border-rose-500/20",
        ringColor: "#f43f5e",
      };
    }
  };

  const insight = getCoachingInsight(recoveryScore);

  const isNewUser = workouts.length === 0;
  const isStep1Done = activeWorkoutPlanId !== null;

  const handleLoadSeedPlan = async () => {
    const newPlanId = createId("plan");
    const newPlan = {
      id: newPlanId,
      name: "Beginner Full Body Split",
      goal: "Build overall strength, movement coordination, and baseline fitness",
      creatorType: "template" as const,
      startDay: "Monday" as const,
      routines: [
        {
          id: createId("routine"),
          name: "Workout A",
          focus: "Squat, Push & Pull focus",
          estimatedMinutes: 45,
          day: "Monday",
          exercises: [
            { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "8-10", restSeconds: 120 },
            { exerciseId: "bench-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "barbell-row", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
            { exerciseId: "plank", targetSets: 3, targetReps: "60s", restSeconds: 60 }
          ]
        },
        {
          id: createId("routine"),
          name: "Workout B",
          focus: "Deadlift & Shoulder focus",
          estimatedMinutes: 45,
          day: "Wednesday",
          exercises: [
            { exerciseId: "deadlift", targetSets: 3, targetReps: "5", restSeconds: 120 },
            { exerciseId: "overhead-press", targetSets: 3, targetReps: "8-10", restSeconds: 90 },
            { exerciseId: "lat-pulldown", targetSets: 3, targetReps: "10-12", restSeconds: 75 },
            { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "15", restSeconds: 60 }
          ]
        },
        {
          id: createId("routine"),
          name: "Workout C",
          focus: "Squat, Incline Push & Biceps focus",
          estimatedMinutes: 45,
          day: "Friday",
          exercises: [
            { exerciseId: "barbell-back-squat", targetSets: 3, targetReps: "8-10", restSeconds: 120 },
            { exerciseId: "incline-dumbbell-press", targetSets: 3, targetReps: "10-12", restSeconds: 75 },
            { exerciseId: "dumbbell-curl", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
            { exerciseId: "hanging-leg-raise", targetSets: 3, targetReps: "15", restSeconds: 60 }
          ]
        }
      ]
    };
    const saveWorkoutPlan = useAtlasStore.getState().saveWorkoutPlan;
    const setActiveWorkoutPlanId = useAtlasStore.getState().setActiveWorkoutPlanId;
    await saveWorkoutPlan(newPlan);
    await setActiveWorkoutPlanId(newPlanId);
  };

  const handleGenerateAiPlan = () => {
    if (typeof window !== "undefined") {
      (window as any).coachPrompt = "Help me generate a beginner workout plan based on my biometrics.";
    }
    setActiveTab("coach");
  };

  const toggleMetricInsight = (metric: string) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
  };

  // Custom tooltips for graphs
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-card-border bg-zinc-950/95 p-3 shadow-xl backdrop-blur-md">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-sm font-semibold text-white">
            {payload[0].name === "weight" ? `${payload[0].value} lbs` : `${payload[0].value.toLocaleString()} lbs volume`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-3 sm:gap-5 pb-28"
    >
      {/* ─── HEADER ZONE ─── */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-card-border bg-card shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Sparkles size={16} className="animate-pulse" />
            </span>
            <p className="text-xs font-bold text-emerald-450 uppercase tracking-wider">Atlas Bio-Telemetry</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            Welcome back, {profile?.name ?? "Athlete"}
          </h1>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
            <Calendar size={13} className="text-zinc-500" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Experience Mode Toggle */}
          <div className="flex rounded-xl bg-surface p-1 border border-surface-border self-start sm:self-center select-none">
            <button
              type="button"
              onClick={() => void setGuidedMode(true)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                guidedMode ? "bg-emerald-400 text-zinc-950 shadow-sm" : "text-zinc-500 hover:text-white"
              }`}
            >
              Guided
            </button>
            <button
              type="button"
              onClick={() => void setGuidedMode(false)}
              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider transition-all duration-200 ${
                !guidedMode ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"
              }`}
            >
              Advanced
            </button>
          </div>

          {/* Dynamic Recovery Ring */}
          <div className="flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3.5 rounded-xl bg-surface/50 border border-surface-border">
            <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4.5" />
                <motion.circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke={insight.ringColor}
                  strokeWidth="4.5"
                  strokeDasharray="176"
                  initial={{ strokeDashoffset: 176 }}
                  animate={{ strokeDashoffset: 176 - (176 * recoveryScore) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="text-center">
                <span className="text-lg font-black text-white">{recoveryScore}</span>
                <span className="text-[8px] font-bold text-zinc-500 block -mt-1 uppercase">%</span>
              </div>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Recovery Score</span>
              <p className="text-sm font-bold text-white leading-tight">{insight.label}</p>
              <button 
                onClick={() => setShowQuickLog(!showQuickLog)}
                className="mt-1 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                <TimerReset size={12} />
                Quick-Log Daily Recovery
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── GETTING STARTED CHECKLIST (FOR NEW USERS) ─── */}
      {isNewUser && (
        <Card className="p-5 border border-emerald-500/20 bg-gradient-to-br from-zinc-900 to-zinc-950/40 shadow-xl space-y-4 keep-dark">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 select-none">
            <Sparkles className="text-emerald-400 animate-pulse" size={18} />
            <h2 className="text-base font-bold text-white tracking-tight">Getting Started Guide</h2>
          </div>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono ${
                isStep1Done 
                  ? "bg-emerald-500/20 border border-emerald-400/35 text-emerald-400"
                  : "bg-emerald-500/10 border border-emerald-400/25 text-emerald-400"
              }`}>
                {isStep1Done ? "✓" : "1"}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 select-none">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isStep1Done ? "text-zinc-500 line-through" : "text-zinc-100"}`}>
                    Activate a Workout Plan
                  </h3>
                  {isStep1Done && <span className="text-[10px] font-extrabold uppercase font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>}
                </div>
                {!isStep1Done && (
                  <>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      To start tracking, you need a plan. Choose an option below to set up your routine instantly:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleLoadSeedPlan}
                        className="text-xs font-bold text-zinc-950 bg-emerald-450 hover:bg-emerald-400 px-3 py-1.5 rounded-lg transition-all"
                      >
                        Load 3-Day Seed Plan
                      </button>
                      <button
                        type="button"
                        onClick={handleGenerateAiPlan}
                        className="text-xs font-bold text-zinc-350 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <Bot size={13} className="text-emerald-450" />
                        Generate with AI Coach
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 border-t border-white/5 pt-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold font-mono">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Start Your First Session</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Go to the <span className="text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab("workout")}>Plans</span> tab, select today's routine, and tap <span className="text-white font-bold">Start Training Session</span> to log sets.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 border-t border-white/5 pt-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400 text-xs font-bold font-mono">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Track Strength Progress</h3>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  After completing a workout, visit the <span className="text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab("progress")}>Progress</span> tab to watch your strength and consistency charts update.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── INLINE RECOVERY LOGGER DRAWER ─── */}
      <AnimatePresence>
        {showQuickLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="p-5 border-emerald-500/20 bg-emerald-950/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-emerald-450 animate-pulse" />
                  <h3 className="font-bold text-white text-sm">Bio-Telemetry Recovery Log</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-400 hover:text-white" onClick={() => setShowQuickLog(false)}>
                  <X size={16} />
                </Button>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Sleep Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Sleep Duration</span>
                    <span className="text-emerald-300 font-bold">{logSleep} Hours</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={logSleep}
                    onChange={(e) => setLogSleep(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Soreness Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Muscle Soreness</span>
                    <span className="text-emerald-300 font-bold">{logSoreness}/10 (High = Pain)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logSoreness}
                    onChange={(e) => setLogSoreness(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Stress Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Systemic Stress</span>
                    <span className="text-emerald-300 font-bold">{logStress}/10 (High = Stressed)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logStress}
                    onChange={(e) => setLogStress(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Nervous Energy Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Nervous Energy</span>
                    <span className="text-emerald-300 font-bold">{logEnergy}/10 (High = Energetic)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(Number(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <Button variant="secondary" size="sm" onClick={() => setShowQuickLog(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleQuickLogSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold">
                  Save Bio-Recovery Log
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── PHYSIOLOGICAL GUIDANCE BLOCK ─── */}
      <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${insight.color}`}>
        <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-[10px]">
          <BrainCircuit size={14} className="shrink-0" />
          <span>Biomechanical System Guidance</span>
        </div>
        <p className="text-zinc-300 leading-normal">{insight.text}</p>
      </div>

      {/* ─── TODAY'S TARGET HERO SECTION ─── */}
      <section className="relative overflow-hidden">
        {workoutPlans.length === 0 ? (
          <Card className="p-6 border-dashed border-2 border-card-border bg-white/[0.01]">
            <div className="text-center space-y-4">
              <ClipboardList className="mx-auto h-12 w-12 text-emerald-400/80" />
              <div>
                <h2 className="text-xl font-bold text-white">No Active Plan Established</h2>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                  To begin logging metrics, progressive overload cycles, and streaks, create a customized program or let our AI coach build one.
                </p>
              </div>
              <Button variant="primary" onClick={() => setActiveTab("workout")} className="mx-auto flex items-center gap-1.5 font-bold">
                <Plus size={16} />
                Initialize Training Plan
              </Button>
            </div>
          </Card>
        ) : todayRoutine ? (
          /* Active Routine Day Hero */
          <Card className="p-5 border-emerald-500/20 bg-gradient-to-br from-zinc-900 to-emerald-950/20 relative shadow-xl overflow-hidden group keep-dark">
            {/* Visual glow element */}
            <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-emerald-500/10 blur-[80px] group-hover:bg-emerald-500/15 transition-all duration-300" />
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Today's Scheduled Target · {todayRoutine.day}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">{todayRoutine.name}</h2>
                <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                  {todayRoutine.focus}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1.5">
                  {todayRoutine.exercises.map((item: any) => (
                    <span 
                      key={item.exerciseId}
                      className="px-2.5 py-1 rounded-lg border border-white/5 bg-white/[0.03] text-[10px] font-medium text-zinc-300"
                    >
                      {item.exerciseId.split("-").map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")}
                    </span>
                  ))}
                </div>
              </div>

              <div className="sm:text-right shrink-0 flex flex-col justify-between sm:h-28">
                <div className="text-zinc-500 text-xs">
                  <span className="font-bold text-zinc-300">{todayRoutine.exercises.length}</span> exercises · <span className="font-bold text-zinc-300">{todayRoutine.estimatedMinutes}</span> mins
                </div>
                <Button 
                  onClick={() => handleLaunchWorkoutClick(todayRoutine)}
                  className="mt-4 sm:mt-0 font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center gap-1.5 px-6 shadow-[0_4px_14px_rgba(16,185,129,0.3)] group-hover:scale-[1.02] transition-transform"
                >
                  <Dumbbell size={16} />
                  Launch Workout Session
                </Button>
              </div>
            </div>
          </Card>
        ) : (
          /* Rest Day Restorative Hero */
          <Card className="p-5 border-violet-500/20 bg-gradient-to-br from-zinc-900 to-violet-950/20 relative shadow-xl overflow-hidden group keep-dark">
            {/* Visual glow element */}
            <div className="absolute -right-20 -top-20 w-44 h-44 rounded-full bg-violet-500/10 blur-[80px]" />
            
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 relative z-10">
              <div className="space-y-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest bg-violet-500/10 text-violet-400 border border-violet-500/20">
                  Rest & Recovery Cycle · {todayDayName}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white">Active Muscle Restoration</h2>
                <p className="text-xs text-zinc-300 max-w-md leading-relaxed">
                  Your plan designates today as a rest day. Muscle hypertrophy and central nervous system repair occur during down cycles, not training volume.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <span className="px-2 py-1 rounded-lg border border-violet-500/10 bg-violet-500/5 text-[10px] font-semibold text-violet-300 flex items-center gap-1">
                    <Activity size={12} />
                    Light Mobility Flow
                  </span>
                  <span className="px-2 py-1 rounded-lg border border-violet-500/10 bg-violet-500/5 text-[10px] font-semibold text-violet-300 flex items-center gap-1">
                    <Moon size={12} />
                    CNS Sleep Focus
                  </span>
                  <span className="px-2 py-1 rounded-lg border border-violet-500/10 bg-violet-500/5 text-[10px] font-semibold text-violet-300 flex items-center gap-1">
                    <TimerReset size={12} />
                    Hydration & Nutrition
                  </span>
                </div>
              </div>

              <div className="shrink-0 sm:text-right flex flex-col justify-between gap-3 sm:min-w-[180px]">
                <div className="text-zinc-400 font-bold font-mono text-[10px] tracking-widest">
                  REST DAY CYCLE
                </div>
                <div className="flex flex-col gap-2 mt-2 sm:mt-0">
                  <Button 
                    onClick={() => {
                      if (activePlan) {
                        setEditingWorkoutPlanId(activePlan.id);
                        setActiveSubScreen("workout-plan-detail");
                      }
                    }}
                    variant="secondary"
                    className="w-full font-semibold border-btn-secondary-border bg-zinc-800 hover:bg-zinc-700 dark:bg-white/5 dark:hover:bg-white/10 text-foreground flex items-center justify-center gap-1.5 h-9 text-xs"
                  >
                    <ClipboardList size={14} />
                    Weekly Schedule
                  </Button>
                  <Button 
                    onClick={() => {
                      if (activePlan) {
                        setEditingWorkoutPlanId(activePlan.id);
                        setActiveSubScreen("workout-plan-detail");
                      }
                    }}
                    className="w-full font-bold bg-violet-600 hover:bg-violet-500 dark:bg-violet-600 dark:hover:bg-violet-500 text-white flex items-center justify-center gap-1.5 h-9 text-xs shadow-[0_4px_14px_rgba(124,58,237,0.3)] transition-all"
                  >
                    <Activity size={14} />
                    Active Recovery
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
      </section>

      {/* ─── PHYSIOLOGICAL METRICS GRID with Expandable Coach Insights ─── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Streak */}
        <div className="flex flex-col">
          <MetricCard
            label="Streak"
            value={`${getCurrentStreak(workouts, activeWorkoutPlanId)}d`}
            detail="training days"
            icon={<Flame size={18} />}
            tone="amber"
            onClick={() => toggleMetricInsight("streak")}
            className="cursor-pointer hover:border-amber-500/30 transition-all select-none"
          />
          <AnimatePresence>
            {expandedMetric === "streak" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-[11px] text-zinc-300 leading-normal"
              >
                Streak is the count of consecutive plan-routine execution days. Keep consistent pacing to build myofibrillar habit patterns!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Consistency */}
        <div className="flex flex-col">
          <MetricCard
            label="Consistency"
            value={`${getTrainingConsistency(workouts, profile?.daysPerWeek ?? 3, activeWorkoutPlanId)}%`}
            detail="30d target"
            icon={<Activity size={18} />}
            tone="emerald"
            onClick={() => toggleMetricInsight("consistency")}
            className="cursor-pointer hover:border-emerald-500/30 transition-all select-none"
          />
          <AnimatePresence>
            {expandedMetric === "consistency" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-[11px] text-zinc-300 leading-normal"
              >
                Evaluates the completed workouts against your target profile ({profile?.daysPerWeek ?? 3} days/week). Standard 30-day baseline is critical for athletic progress.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Weekly Volume */}
        <div className="flex flex-col">
          <MetricCard
            label="Weekly Volume"
            value={Math.round(getWeeklyVolume(workouts)).toLocaleString()}
            detail="lbs logged"
            icon={<Dumbbell size={18} />}
            tone="sky"
            onClick={() => toggleMetricInsight("volume")}
            className="cursor-pointer hover:border-sky-500/30 transition-all select-none"
          />
          <AnimatePresence>
            {expandedMetric === "volume" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-[11px] text-zinc-300 leading-normal"
              >
                Total load lifted across all exercises this week (sets * reps * weight). Progressive load volume triggers mechanical tension.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fatigue */}
        <div className="flex flex-col">
          <MetricCard
            label="Fatigue Rating"
            value={fatigue.label}
            detail="auto tracked"
            icon={<BatteryCharging size={18} />}
            tone={fatigue.tone === "good" ? "emerald" : fatigue.tone === "warn" ? "amber" : "rose"}
            onClick={() => toggleMetricInsight("fatigue")}
            className="cursor-pointer hover:border-zinc-500/30 transition-all select-none"
          />
          <AnimatePresence>
            {expandedMetric === "fatigue" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-[11px] text-zinc-300 leading-normal"
              >
                Nervous system strain mapped from sleep, stress, and soreness variables. AI adjusts load intensities in active routines dynamically.
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sleep */}
        <div className="flex flex-col col-span-2 md:col-span-1">
          <MetricCard
            label="CNS Sleep"
            value={`${latestRecoveryLog?.sleepHours ?? 7.5}h`}
            detail="last logged"
            icon={<Moon size={18} />}
            tone="violet"
            onClick={() => toggleMetricInsight("sleep")}
            className="cursor-pointer hover:border-violet-500/30 transition-all select-none"
          />
          <AnimatePresence>
            {expandedMetric === "sleep" && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-[11px] text-zinc-300 leading-normal"
              >
                Your latest logged sleep. 7.5-9 hours is the critical physiological zone for protein synthesis and tissue restoration.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── DYNAMIC BIOMETRICS hub ─── */}
      {!guidedMode && (
        <Card className="p-4 border border-card-border bg-card shadow">
          <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <User size={16} className="text-emerald-455" />
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Athlete Biometrics</h2>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-white" onClick={() => setActiveTab("settings")}>
              <Pencil size={14} />
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Age</span>
              <p className="font-bold text-white text-sm">{profile?.age ?? "N/A"} <span className="text-xs font-normal text-zinc-450">yrs</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Weight</span>
              <p className="font-bold text-white text-sm">{profile?.weight ?? "N/A"} <span className="text-xs font-normal text-zinc-450">{profile?.weightUnit}</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Height</span>
              <p className="font-bold text-white text-sm">
                {profile?.height
                  ? profile.heightUnit === "in"
                    ? `${Math.floor(profile.height / 12)}'${Math.round(profile.height % 12)}"`
                    : `${profile.height} cm`
                  : "N/A"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">Target Physique</span>
              <p className="font-bold text-emerald-300 text-xs truncate" title={profile?.targetPhysique ?? "N/A"}>
                {profile?.targetPhysique ?? "N/A"}
              </p>
            </div>
          </div>
        </Card>
      )}
  
      {/* ─── HIGH-FIDELITY TABBED TRENDS CONSOLE ─── */}
      {!guidedMode && (
        <Card className="p-5 border border-card-border bg-card shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Bio-Analytics Console</h2>
              <p className="text-xs text-zinc-400">Biological markers and load volume trendlines</p>
            </div>
            
            {/* Custom Tabs */}
            <div className="flex rounded-xl bg-surface p-1 border border-surface-border max-w-xs self-start sm:self-center">
              <button
                onClick={() => setActiveChartTab("weight")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === "weight" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"}`}
              >
                <span className="flex items-center gap-1.5">
                  <Weight size={13} />
                  Bodyweight
                </span>
              </button>
              <button
                onClick={() => setActiveChartTab("volume")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === "volume" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-500 hover:text-white"}`}
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={13} />
                  Weekly Volume
                </span>
              </button>
            </div>
          </div>
  
          <div className="mt-5 h-48 relative">
            <AnimatePresence mode="wait">
              {activeChartTab === "weight" ? (
                <motion.div 
                  key="weight-chart"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="w-full h-full"
                >
                  {bodySeries.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={bodySeries} margin={{ left: -30, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="bodyweight" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} domain={["dataMin - 3", "dataMax + 3"]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" name="weight" dataKey="weight" stroke="#10b981" strokeWidth={2.5} fill="url(#bodyweight)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-550 italic">
                      Requires at least two bodyweight logs to generate analytical trendlines.
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="volume-chart"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="w-full h-full"
                >
                  {volumeSeries.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={volumeSeries} margin={{ left: -30, right: 10, top: 10, bottom: 0 }}>
                        <defs>
                          <linearGradient id="volume" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="week" stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <YAxis stroke="#52525b" fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" name="volume" dataKey="volume" stroke="#0ea5e9" strokeWidth={2.5} fill="url(#volume)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-550 italic">
                      Log at least two workout sessions containing sets to evaluate dynamic training volume graphs.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* ─── DYNAMIC PLANS COLLECTION ─── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <ClipboardList size={16} className="text-zinc-500" />
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Workout Programs</h2>
        </div>

        {workoutPlans.map(plan => {
          const startOfWeek = (() => {
            const now = new Date();
            const day = now.getDay();
            const diff = now.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(now.setDate(diff));
            monday.setHours(0, 0, 0, 0);
            return monday;
          })();

          const planWorkouts = workouts.filter((w) => {
            const hasCompletedSets = w.exercises.some((ex) => ex.sets.some((s) => s.completed));
            return (
              w.planId === plan.id &&
              w.completedAt &&
              new Date(w.completedAt).getTime() >= startOfWeek.getTime() &&
              hasCompletedSets
            );
          });
          const completedRoutineNames = new Set(planWorkouts.map((w) => w.name));
          const routinesCount = plan.routines.length;
          const completedCount = plan.routines.filter((r) => completedRoutineNames.has(r.name)).length;
          const progressPercent = routinesCount > 0 ? Math.round((completedCount / routinesCount) * 100) : 0;
          const isActive = plan.id === activeWorkoutPlanId;

          return (
            <Card className="p-4 border border-card-border bg-card shadow relative group" key={plan.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-450 border border-emerald-500/20">
                        Active Plan
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-normal text-zinc-400 max-w-sm">{plan.goal}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-400 hover:text-white" onClick={() => {
                    setEditingWorkoutPlanId(plan.id);
                    setActiveSubScreen("workout-plan-builder");
                  }}>
                    <Pencil size={15} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-450 hover:text-red-400" onClick={() => {
                    setPlanToDelete({ id: plan.id, name: plan.name });
                    setShowDeleteModal(true);
                  }}>
                    <Trash2 size={15} />
                  </Button>
                </div>
              </div>

              {/* Progress Indicator */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-[11px] text-zinc-500 font-semibold">
                  <span>Weekly Routines Progress</span>
                  <span className="font-bold text-emerald-350">{completedCount}/{routinesCount}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button className="flex-1 text-xs font-semibold py-2" variant="primary" onClick={() => {
                  setEditingWorkoutPlanId(plan.id);
                  setActiveSubScreen("workout-plan-detail");
                }}>
                  View Detailed Plan
                </Button>
                {!isActive && (
                  <Button 
                    className="flex-1 text-xs font-semibold py-2 border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground"
                    variant="secondary"
                    onClick={() => {
                      setPlanToActivate(plan.id);
                      setShowSwitchModal(true);
                    }}
                  >
                    Set Active Plan
                  </Button>
                )}
              </div>
            </Card>
          );
        })}

        {coachBusy && (
          <Card className="p-4 border border-card-border bg-card shadow flex items-center justify-center gap-3">
            <Bot className="h-5 w-5 text-emerald-400 animate-pulse" />
            <span className="text-xs text-zinc-450 font-bold uppercase tracking-wider">Coach is designing new program...</span>
          </Card>
        )}
      </section>

      {/* ─── PERSONAL RECORDS achievements SHELF ─── */}
      <Card className="p-4 border border-card-border bg-card shadow">
        <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Medal className="text-amber-400" size={16} />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Recent Personal Records</h2>
          </div>
        </div>
        <div className="mt-3 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
          {recentPrs.length > 0 ? (
            recentPrs.slice(0, 6).map((pr) => (
              <Surface key={`${pr.exerciseName}-${pr.value}`} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface">
                <div>
                  <p className="text-xs font-bold text-white truncate max-w-36">{pr.exerciseName}</p>
                  <p className="text-[10px] text-zinc-500">{pr.date}</p>
                </div>
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-bold border border-amber-500/15">
                  {pr.value}
                </span>
              </Surface>
            ))
          ) : (
            <div className="col-span-full py-4 text-center text-xs text-zinc-500 italic">
              Perform sets in your scheduled workouts to register new personal records.
            </div>
          )}
        </div>
      </Card>

      {/* ─── INTERACTIVE COACH NOTE chat bubble ─── */}
      {lastMessage && (
        <Card className={`p-4 border relative overflow-hidden group shadow-lg ${isLastMessageError ? 'bg-red-950/15 border-red-500/20' : 'bg-emerald-950/15 border-emerald-500/20'}`}>
          <div className="flex items-start gap-3.5 relative z-10">
            <div className={`p-2 rounded-xl shrink-0 ${isLastMessageError ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'}`}>
              <Bot size={22} className={isLastMessageError ? 'text-red-400' : 'text-emerald-400'} />
            </div>
            <div className="flex-1 space-y-1">
              <span className={`text-[9px] font-black uppercase tracking-widest ${isLastMessageError ? 'text-red-400' : 'text-emerald-400'}`}>
                {isLastMessageError ? "Central Link Impaired" : "Dynamic Coaching Directive"}
              </span>
              <h3 className="text-sm font-bold text-white leading-snug">
                {isLastMessageError ? "AI Coach Connection Problem" : "Today's Biomechanical Note"}
              </h3>
              <div className={`text-xs leading-relaxed max-w-none pt-1.5 ${isLastMessageError ? 'text-red-300/90' : 'text-zinc-300'}`}>
                {lastMessage && isWorkoutPlan(lastMessage.content) ? (
                  <div className="space-y-3">
                    {(() => {
                      let nonJson = lastMessage.content;
                      const jsonMatch = lastMessage.content.match(/```json\n([\s\S]*?)\n```/);
                      if (jsonMatch) {
                        nonJson = lastMessage.content.replace(jsonMatch[0], "").trim();
                      } else if (lastMessage.content.trim().startsWith("{")) {
                        nonJson = "";
                      }
                      return nonJson ? (
                        <ReactMarkdown className="prose prose-invert prose-p:leading-relaxed prose-a:text-emerald-350 max-w-none text-xs text-zinc-450">
                          {nonJson}
                        </ReactMarkdown>
                      ) : null;
                    })() || null}
                    <p className="font-semibold text-emerald-400">
                      I have compiled and generated a customized training plan for your bio-profile. You can activate it directly below.
                    </p>
                  </div>
                ) : (
                  lastMessage?.content
                )}
              </div>
              
              <div className="pt-2 flex justify-start">
                <Button
                  className={`text-[11px] font-bold py-1.5 px-3 flex items-center gap-1 border ${isLastMessageError ? 'border-red-500/20 bg-red-950/30 hover:bg-red-900/30 text-red-300' : 'border-emerald-500/20 bg-emerald-950/30 hover:bg-emerald-900/30 text-emerald-300'}`}
                  variant="secondary"
                  onClick={() => setActiveTab("coach")}
                >
                  Ask Coach Detailed Question
                  <ArrowUpRight size={13} />
                </Button>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── MODALS & DIALOGS ─── */}
      <PreWorkoutCheckinModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onConfirm={handlePreWorkoutConfirm}
      />

      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 supports-[backdrop-filter]:backdrop-blur-md">
          <Card className="w-full max-w-sm p-6 space-y-4 relative border border-card-border bg-card shadow-2xl">
            <Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-white" onClick={() => {
              setShowSwitchModal(false);
              setPlanToActivate(null);
            }}>
              <X size={20} />
            </Button>
            <h3 className="text-xl font-bold text-white leading-tight">Switch Active Program</h3>
            <p className="text-zinc-300 text-xs leading-relaxed">
              {activeWorkout 
                ? "Switching active plan: You currently have a workout session in progress. Switching plans now will discard your active session and wipe uncompleted tracking data. Do you want to proceed?"
                : "Switching active plan: This will recalibrate your training metrics, weekly streaks, and consistency targets to map the new plan schedule."}
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => {
                setShowSwitchModal(false);
                setPlanToActivate(null);
              }} className="flex-1 border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground text-xs font-bold py-2">
                Cancel
              </Button>
              <Button variant="primary" onClick={async () => {
                if (planToActivate) {
                  await setActiveWorkoutPlanId(planToActivate);
                }
                setShowSwitchModal(false);
                setPlanToActivate(null);
              }} className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs py-2">
                Confirm Switch
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteModal && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 supports-[backdrop-filter]:backdrop-blur-md">
          <Card className="w-full max-w-sm p-6 space-y-4 relative border border-card-border bg-card shadow-2xl">
            <Button variant="ghost" size="icon" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-white" onClick={() => {
              setShowDeleteModal(false);
              setPlanToDelete(null);
            }}>
              <X size={20} />
            </Button>
            <h3 className="text-xl font-bold text-white leading-tight">Delete Workout Program</h3>
            <p className="text-zinc-300 text-xs leading-relaxed">
              {activeWorkout && activeWorkout.planId === planToDelete.id
                ? `Are you sure you want to delete the plan "${planToDelete.name}"? You have a workout session in progress for this plan. Deleting it will permanently discard the active workout and delete this program file.`
                : `Are you sure you want to delete the plan "${planToDelete.name}"? This action is permanent. All weekly scheduled routines and exercise layouts in this program will be deleted.`}
            </p>
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" onClick={() => {
                setShowDeleteModal(false);
                setPlanToDelete(null);
              }} className="flex-1 border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground text-xs font-semibold py-2">
                Cancel
              </Button>
              <Button variant="danger" onClick={async () => {
                if (planToDelete) {
                  await deleteWorkoutPlan(planToDelete.id);
                }
                setShowDeleteModal(false);
                setPlanToDelete(null);
              }} className="flex-1 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs py-2">
                Delete Program
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}