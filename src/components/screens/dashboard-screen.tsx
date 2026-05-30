"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  Flame,
  Medal,
  Moon,
  Sun,
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
  AlertTriangle,
  Lock,
  ShieldCheck,
  Mail,
  Copy,
  Check,
  ArrowLeft,
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
import { useState, useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { UserProfile, RecoveryLog } from "@/types/domain";
import { createId } from "@/lib/id";
import { validateEmail } from "@/lib/email-validator";
import { restoreProfileByEmail } from "@/lib/sync";
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal";
import { calculateNutritionTargets } from "@/lib/calculators";

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
  const aiProviders = useAtlasStore((state) => state.aiProviders);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const setActiveSettingsTab = useAtlasStore((state) => state.setActiveSettingsTab);
  const updateProfile = useAtlasStore((state) => state.updateProfile);
  const setWorkoutTab = useAtlasStore((state) => state.setWorkoutTab);
  const theme = useAtlasStore((state) => state.theme);
  const setTheme = useAtlasStore((state) => state.setTheme);

  // One-time Cloud Sync Migration States
  const [showMigrationModal, setShowMigrationModal] = useState(false);
  const [migrationMethod, setMigrationMethod] = useState<"google" | "email">("google");
  const [migrationEmailInput, setMigrationEmailInput] = useState("");
  const [migrationEmailError, setMigrationEmailError] = useState<string | null>(null);
  const [isMigrationSubmitting, setIsMigrationSubmitting] = useState(false);
  const [migrationSubmitError, setMigrationSubmitError] = useState<string | null>(null);
  const [showMigrationSuccessAnimation, setShowMigrationSuccessAnimation] = useState(false);
  const [isMigrationFederatedLoading, setIsMigrationFederatedLoading] = useState(false);
  const [migrationCapturedProvider, setMigrationCapturedProvider] = useState<"apple" | "google" | null>(null);

  // OTP states for manual migration
  const [migrationOtpSent, setMigrationOtpSent] = useState(false);
  const [migrationGeneratedOtp, setMigrationGeneratedOtp] = useState("");
  const [migrationOtpInput, setMigrationOtpInput] = useState("");
  const [migrationOtpError, setMigrationOtpError] = useState<string | null>(null);
  const [isSendingMigrationOtp, setIsSendingMigrationOtp] = useState(false);
  const [showMigrationSandboxOtp, setShowMigrationSandboxOtp] = useState(false);
  const [migrationOtpCopied, setMigrationOtpCopied] = useState(false);

  const handleGoogleMigrationSubmit = async () => {
    setMigrationEmailError(null);
    setMigrationSubmitError(null);
    const validation = validateEmail(migrationEmailInput);
    if (!validation.isValid) {
      setMigrationEmailError(validation.error || "Invalid email address.");
      return;
    }

    setIsMigrationFederatedLoading(true);
    setMigrationCapturedProvider("google");

    const cleanEmail = migrationEmailInput.toLowerCase().trim();

    try {
      // Uniqueness check: email must not exist in cloud sync storage
      const checkRes = await restoreProfileByEmail(cleanEmail);
      if (checkRes.success && checkRes.snapshot) {
        setMigrationSubmitError("This email is already associated with an existing profile. To load that profile, please refresh/logout and sign in using Google or email restore on the welcome screen.");
        setIsMigrationFederatedLoading(false);
        return;
      }

      await updateProfile({
        email: cleanEmail,
        emailVerified: true,
      });

      setShowMigrationSuccessAnimation(true);
      setTimeout(() => {
        setShowMigrationSuccessAnimation(false);
        setShowMigrationModal(false);
        setMigrationEmailInput("");
        setMigrationEmailError(null);
      }, 3500);
    } catch (e: any) {
      console.error("Google Migration failed:", e);
      setMigrationSubmitError(e.message || "Failed to upgrade profile. Please verify your connection.");
    } finally {
      setIsMigrationFederatedLoading(false);
    }
  };

  const handleSendMigrationOtp = async () => {
    setMigrationEmailError(null);
    setMigrationOtpError(null);
    setMigrationSubmitError(null);
    const validation = validateEmail(migrationEmailInput);
    if (!validation.isValid) {
      setMigrationEmailError(validation.error || "Invalid email address.");
      return;
    }

    setIsSendingMigrationOtp(true);

    try {
      // Uniqueness check
      const checkRes = await restoreProfileByEmail(migrationEmailInput.toLowerCase().trim());
      if (checkRes.success && checkRes.snapshot) {
        setMigrationEmailError("This email is already associated with an existing profile. Please use a different email or log out to restore it.");
        setIsSendingMigrationOtp(false);
        return;
      }
    } catch (e) {
      console.warn("Migration uniqueness check failed:", e);
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setMigrationGeneratedOtp(code);
    setMigrationOtpCopied(false);

    try {
      const response = await fetch("/api/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: migrationEmailInput,
          otp: code,
          userName: profile?.name || "Athlete"
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setMigrationOtpSent(true);
        setShowMigrationSandboxOtp(false);
      } else {
        setMigrationOtpSent(true);
        setShowMigrationSandboxOtp(true);
        console.warn("Falling back to simulated sandbox mailbox:", data.error);
      }
    } catch (e) {
      setMigrationOtpSent(true);
      setShowMigrationSandboxOtp(true);
      console.warn("Network error during API dispatch. Falling back to simulated sandbox mailbox.");
    } finally {
      setIsSendingMigrationOtp(false);
    }
  };

  const handleVerifyMigrationOtp = async () => {
    setMigrationOtpError(null);
    setMigrationSubmitError(null);
    if (migrationOtpInput.trim() !== migrationGeneratedOtp) {
      setMigrationOtpError("Incorrect 6-digit verification code. Please check your simulated sandbox mailbox and try again.");
      return;
    }

    setIsMigrationSubmitting(true);
    const cleanEmail = migrationEmailInput.toLowerCase().trim();

    try {
      await updateProfile({
        email: cleanEmail,
        emailVerified: true,
      });

      setShowMigrationSuccessAnimation(true);
      setTimeout(() => {
        setShowMigrationSuccessAnimation(false);
        setShowMigrationModal(false);
        setMigrationEmailInput("");
        setMigrationEmailError(null);
        setMigrationOtpSent(false);
        setMigrationOtpInput("");
        setShowMigrationSandboxOtp(false);
      }, 3500);
    } catch (e: any) {
      setMigrationOtpError(e.message || "Failed to verify and update profile.");
    } finally {
      setIsMigrationSubmitting(false);
    }
  };

  // Modal & Edit States
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);
  const [showCreatePlanModal, setShowCreatePlanModal] = useState(false);
  const [showAiErrorModal, setShowAiErrorModal] = useState(false);
  const [aiErrorMessage, setAiErrorMessage] = useState("");

  // Detect when AI generation finishes with an error
  const prevCoachBusy = useRef(false);
  useEffect(() => {
    if (prevCoachBusy.current && !coachBusy) {
      // Generation just finished — check if last message is an error
      const lastMsg = aiMessages.at(-1);
      if (lastMsg?.role === "assistant" && lastMsg.content.includes("**Error:**")) {
        // Extract just the error detail after "**Error:**"
        const parts = lastMsg.content.split("**Error:**");
        setAiErrorMessage(parts.length > 1 ? parts[1].trim() : lastMsg.content);
        setShowAiErrorModal(true);
      }
    }
    prevCoachBusy.current = coachBusy;
  }, [coachBusy, aiMessages]);


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

  const nutritionTargets = useMemo(() => {
    return calculateNutritionTargets(profile);
  }, [profile]);

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
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        ringColor: "#10b981",
      };
    } else if (score >= 50) {
      return {
        label: "Moderate training capability",
        text: "Your systems are functionally recovered, but minor neuromuscular fatigue is present. Train at planned target volumes, keeping RIR limits strictly managed.",
        color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
        ringColor: "#f59e0b",
      };
    } else {
      return {
        label: "Prioritize System Recovery",
        text: "High metabolic strain and elevated cortisol indicators suggest fatigue accumulation. We advise active recovery flows, mobility work, and targeted sleep focus tonight to prevent injury.",
        color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
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
    const activeProvider = aiProviders.find((p) => p.id === activeProviderId);
    const hasKey = activeProvider && (activeProvider.apiKey || activeProvider.type === "ollama" || activeProvider.type === "lmstudio");

    if (!hasKey) {
      alert("To generate a plan with our AI Coach, please configure your API Key/AI Engine first. Redirecting you to settings...");
      setActiveSettingsTab("ai");
      setActiveTab("settings");
      return;
    }

    if (typeof window !== "undefined") {
      (window as any).coachPrompt = "Help me generate a beginner workout plan based on my biometrics.";
    }
    setActiveTab("coach");
  };

  const handleCreateManualPlan = () => {
    setEditingWorkoutPlanId(null);
    setActiveSubScreen("workout-plan-builder");
    setActiveTab("workout");
  };

  const toggleMetricInsight = (metric: string) => {
    setExpandedMetric(expandedMetric === metric ? null : metric);
  };

  // Custom tooltips for graphs
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-xl border border-card-border bg-card p-3 shadow-xl backdrop-blur-md">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            {payload[0].name === "weight" ? `${payload[0].value} lbs` : `${payload[0].value.toLocaleString()} lbs volume`}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <>
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
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={16} className="animate-pulse" />
            </span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Atlas Bio-Telemetry</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Welcome back, {profile?.name ?? "Athlete"}
          </h1>
          <p className="text-xs text-zinc-400 flex items-center gap-1.5 pt-0.5">
            <Calendar size={14} className="text-zinc-500" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-col gap-3 items-stretch md:items-end w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            {/* Experience Mode Toggle */}
            <div className="flex rounded-xl bg-surface p-1 border border-surface-border self-start sm:self-center select-none">
              <button
                type="button"
                onClick={() => void setGuidedMode(true)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  guidedMode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white-keep shadow-md shadow-emerald-500/10" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Guided
              </button>
              <button
                type="button"
                onClick={() => void setGuidedMode(false)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                  !guidedMode ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white-keep shadow-md shadow-violet-500/10" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
                }`}
              >
                Advanced
              </button>
            </div>

            {/* Theme Mode Switcher */}
            <button
              type="button"
              onClick={() => void setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center justify-center h-[38px] w-[38px] rounded-xl border border-surface-border bg-surface text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition duration-200 self-start sm:self-center cursor-pointer shadow-sm active:scale-95 shrink-0"
              aria-label="Toggle display theme"
              title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>

            {/* Dynamic Recovery Ring */}
            {!guidedMode && (
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
                    <span className="text-lg font-black text-zinc-900 dark:text-white">{recoveryScore}</span>
                    <span className="text-xs font-bold text-zinc-500 block -mt-1 uppercase">%</span>
                  </div>
                </div>
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">Recovery Score</span>
                  <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{insight.label}</p>
                  <button 
                    onClick={() => setShowQuickLog(!showQuickLog)}
                    className="mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
                  >
                    <TimerReset size={14} />
                    Quick-Log Daily Recovery
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ─── SECURE CLOUD BACKUP MIGRATION BANNER ─── */}
      {profile && !profile.email && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl border border-card-border bg-card shadow-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
        >
          <div className="absolute -right-16 -top-16 w-36 h-36 rounded-full bg-emerald-500/5 dark:bg-emerald-500/10 blur-[50px] pointer-events-none" />
          <div className="space-y-1 relative z-10 flex-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">Security & Sync Upgrade</p>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">Upgrade to Secure Cloud Backup</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-2xl">
              Establish a verified cloud-backup email identity. This secures your workouts and syncs your profile securely across all your devices using high-fidelity naming conventions.
            </p>
          </div>
          <Button
            onClick={() => setShowMigrationModal(true)}
            className="sm:shrink-0 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm h-9 text-xs px-4 rounded-xl relative z-10 flex items-center justify-center gap-1.5 self-start sm:self-center"
          >
            <Sparkles size={14} />
            Secure Profile Now
          </Button>
        </motion.div>
      )}

      {/* Quick-Log Recovery Card in Advanced mode, shown in the main dashboard flow */}
      <AnimatePresence>
        {!guidedMode && showQuickLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden keep-dark"
          >
            <Card className="p-5 border-emerald-500/20 bg-emerald-950/5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-emerald-450 animate-pulse" />
                  <h3 className="font-bold text-white-keep text-sm">Bio-Telemetry Recovery Log</h3>
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
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold">{logSleep} Hours</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={logSleep}
                    onChange={(e) => setLogSleep(Number(e.target.value))}
                    className="w-full h-1 bg-surface border border-surface-border/50 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Soreness Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Muscle Soreness</span>
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold">{logSoreness}/10 (High = Pain)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logSoreness}
                    onChange={(e) => setLogSoreness(Number(e.target.value))}
                    className="w-full h-1 bg-surface border border-surface-border/50 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Stress Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Systemic Stress</span>
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold">{logStress}/10 (High = Stressed)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logStress}
                    onChange={(e) => setLogStress(Number(e.target.value))}
                    className="w-full h-1 bg-surface border border-surface-border/50 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>

                {/* Nervous Energy Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-300 font-semibold">Nervous Energy</span>
                    <span className="text-emerald-600 dark:text-emerald-300 font-bold">{logEnergy}/10 (High = Energetic)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(Number(e.target.value))}
                    className="w-full h-1 bg-surface border border-surface-border/50 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
                <Button variant="secondary" size="sm" onClick={() => setShowQuickLog(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleQuickLogSubmit} className="bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold">
                  Log Recovery metrics
                </Button>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {coachBusy && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="keep-dark relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 via-fuchsia-950/40 to-zinc-950/80 shadow-[0_0_40px_rgba(139,92,246,0.15)] p-5"
        >
          {/* Ambient glow orb */}
          <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-violet-500/20 blur-[60px] pointer-events-none" />
          <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-fuchsia-500/15 blur-[40px] pointer-events-none" />

          <div className="relative flex items-start gap-4">
            {/* Animated icon */}
            <div className="shrink-0 h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center">
              <motion.div
                animate={{ rotate: [0, 10, -10, 10, 0] }}
                transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                className="text-lg select-none"
              >
                🍳
              </motion.div>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-widest text-violet-400">AI Coach</span>
                <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                  Cooking
                </span>
              </div>
              <p className="text-sm font-bold text-white-keep leading-snug">
                Something amazing is being crafted for you.
              </p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Your AI Coach is designing a clinical-grade, personalised training program based on your biometrics and goals. This usually takes 15–30 seconds — grab a sip of water! 💧
              </p>

              {/* Shimmer progress bar */}
              <div className="h-1.5 w-full rounded-full bg-violet-950/60 border border-violet-500/20 overflow-hidden mt-1">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-violet-500 rounded-full"
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                  style={{ width: "60%" }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}


      {/* ─── GETTING STARTED CHECKLIST (FOR NEW USERS) ─── */}
      {isNewUser && (
        <Card className="p-5 border border-emerald-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-3 select-none">
            <Sparkles className="text-emerald-500 dark:text-emerald-400 animate-pulse" size={18} />
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Getting Started Guide</h2>
          </div>
          
          <div className="space-y-4">
            {/* Step 1 */}
            <div className="flex gap-3">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold font-mono ${
                isStep1Done 
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-emerald-500/15 border-2 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
              }`}>
                {isStep1Done ? "✓" : "1"}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 select-none">
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isStep1Done ? "text-zinc-400 dark:text-zinc-500 line-through" : "text-zinc-800 dark:text-zinc-100"}`}>
                    Activate a Workout Plan
                  </h3>
                  {isStep1Done && <span className="text-xs font-extrabold uppercase font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>}
                </div>
                {!isStep1Done && (
                  <>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                      To start tracking, you need a plan. Choose an option below to set up your routine instantly:
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleLoadSeedPlan}
                        disabled={coachBusy}
                        className="text-xs font-bold text-white bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Load 3-Day Seed Plan
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowCreatePlanModal(true)}
                        disabled={coachBusy}
                        className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 border border-emerald-700 px-3 py-1.5 rounded-lg transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Plan
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex gap-3 border-t border-zinc-100 dark:border-white/5 pt-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-surface-border text-foreground text-xs font-bold font-mono">
                2
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider">Start Your First Session</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  Go to the <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab("workout")}>Plans</span> tab, select today's routine, and tap <span className="text-zinc-900 dark:text-white font-bold">Start Training Session</span> to log sets.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 border-t border-zinc-100 dark:border-white/5 pt-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-surface-border text-foreground text-xs font-bold font-mono">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-800 dark:text-zinc-300 uppercase tracking-wider">Track Strength Progress</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                  After completing a workout, visit the <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab("progress")}>Progress</span> tab to watch your strength and consistency charts update.
                </p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* ─── PHYSIOLOGICAL GUIDANCE BLOCK ─── */}
      {!guidedMode && (
        <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1.5 ${insight.color}`}>
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <BrainCircuit size={14} className="shrink-0" />
            <span>Biomechanical System Guidance</span>
          </div>
          <p className="text-zinc-300 leading-normal">{insight.text}</p>
        </div>
      )}

      {/* ─── TODAY'S TARGET HERO SECTION ─── */}
      <section className="relative overflow-hidden">
        {workoutPlans.length === 0 ? (
          <Card className="p-6 border-dashed border-2 border-card-border bg-surface/10 dark:bg-white/[0.01]">
            <div className="text-center space-y-4">
              <ClipboardList className="mx-auto h-12 w-12 text-emerald-500 dark:text-emerald-400" />
              <div>
                <h2 className="text-xl font-bold text-foreground">No Active Plan Established</h2>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
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
          <div className="p-5 sm:p-6 border border-emerald-500/20 dark:border-emerald-500/20 bg-card relative shadow-sm overflow-hidden group rounded-2xl">
            {/* Ambient glow — theme-safe, pointer-events off */}
            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-emerald-500/8 dark:bg-emerald-500/10 blur-[70px] group-hover:bg-emerald-500/12 transition-all duration-500 pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-amber-500/6 dark:bg-amber-500/8 blur-[70px] group-hover:bg-amber-500/10 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="space-y-1.5 select-none">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Today's Target
                  </span>
                  <span className="text-[10px] text-zinc-555 dark:text-zinc-450 font-bold font-mono uppercase">{todayRoutine.day}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight tracking-tight">Today's Training &amp; Nutrition Target</h2>
                <p className="text-xs text-zinc-555 dark:text-zinc-450 leading-relaxed max-w-2xl">
                  Complete today's workout to build strength, and eat high-quality meals to fuel muscle recovery.
                </p>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-border">
                {/* Column 1: Workout */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">Workout Plan</span>
                    <h3 className="text-sm sm:text-base font-black text-foreground">{todayRoutine.name}</h3>
                    <p className="text-xs text-zinc-555 dark:text-zinc-450">
                      Focus: <strong className="text-zinc-850 dark:text-zinc-955 font-bold">{todayRoutine.focus}</strong>
                    </p>
                    <div className="text-[10px] text-zinc-555 dark:text-zinc-450 font-bold font-mono uppercase pt-0.5">
                      {todayRoutine.exercises.length} exercises · {todayRoutine.estimatedMinutes} mins
                    </div>
                  </div>
                  <Button
                    onClick={() => handleLaunchWorkoutClick(todayRoutine)}
                    className="w-full font-black uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-2 h-10 text-xs shadow-[0_4px_14px_rgba(16,185,129,0.25)] rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    <Dumbbell size={14} />
                    Launch Workout
                  </Button>
                </div>

                {/* Column 2: Nutrition */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-450 font-mono">Daily Nutrition</span>
                    <h3 className="text-sm sm:text-base font-black text-foreground">Nutrition &amp; Calories</h3>
                    <p className="text-xs text-zinc-555 dark:text-zinc-450 leading-relaxed">
                      Target <strong className="text-zinc-850 dark:text-zinc-955 font-bold font-mono">{nutritionTargets.calories} kcal</strong> and <strong className="text-zinc-850 dark:text-zinc-955 font-bold font-mono">{nutritionTargets.protein}g protein</strong> today.
                    </p>
                    <div className="text-[10px] text-zinc-555 dark:text-zinc-450 font-bold font-mono uppercase pt-0.5">
                      2,500 ml water · Log all meals
                    </div>
                  </div>
                  <Button
                    onClick={() => { setWorkoutTab("nutrition"); setActiveTab("workout"); }}
                    className="w-full font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center gap-2 h-10 text-xs shadow-[0_4px_14px_rgba(245,158,11,0.25)] rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Flame size={14} />
                    Log Nutrients
                  </Button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Rest Day Restorative Hero */
          <div className="p-5 sm:p-6 border border-violet-500/20 dark:border-violet-500/20 bg-card relative shadow-sm overflow-hidden group rounded-2xl">
            {/* Ambient glow — theme-safe */}
            <div className="absolute -right-16 -top-16 w-40 h-40 rounded-full bg-violet-500/8 dark:bg-violet-500/10 blur-[70px] group-hover:bg-violet-500/12 transition-all duration-500 pointer-events-none" />
            <div className="absolute -left-16 -bottom-16 w-40 h-40 rounded-full bg-amber-500/6 dark:bg-amber-500/8 blur-[70px] group-hover:bg-amber-500/10 transition-all duration-500 pointer-events-none" />

            <div className="relative z-10 space-y-5">
              {/* Header */}
              <div className="space-y-1.5 select-none">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                    Today's Target
                  </span>
                  <span className="text-[10px] text-zinc-555 dark:text-zinc-450 font-bold font-mono uppercase">{todayDayName} - Rest Day</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-foreground leading-tight tracking-tight">Rest, Recharge &amp; Recovery</h2>
                <p className="text-xs text-zinc-555 dark:text-zinc-450 leading-relaxed max-w-2xl">
                  Let your body recover from training, recharge your energy, and hit nutrition goals to stay on track.
                </p>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-border">
                {/* Column 1: Active Recovery */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 font-mono">Recharge &amp; Rest</span>
                    <h3 className="text-sm sm:text-base font-black text-foreground">Active Recovery</h3>
                    <p className="text-xs text-zinc-555 dark:text-zinc-450">
                      Focus on deep sleep, body relaxation, and light stretching.
                    </p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="px-2 py-0.5 rounded-lg border border-violet-500/20 bg-violet-500/5 text-[9px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <Activity size={10} />
                        Light Stretching
                      </span>
                      <span className="px-2 py-0.5 rounded-lg border border-violet-500/20 bg-violet-500/5 text-[9px] font-semibold text-violet-600 dark:text-violet-400 flex items-center gap-1">
                        <Moon size={10} />
                        Deep Rest
                      </span>
                    </div>
                  </div>
                  <Button
                    onClick={() => {
                      if (activePlan) {
                        setEditingWorkoutPlanId(activePlan.id);
                        setActiveSubScreen("workout-plan-detail");
                      }
                    }}
                    className="w-full font-black uppercase tracking-wider bg-violet-600 hover:bg-violet-500 text-white flex items-center justify-center gap-2 h-10 text-xs shadow-[0_4px_14px_rgba(124,58,237,0.25)] rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                  >
                    <ClipboardList size={14} />
                    Weekly Schedule
                  </Button>
                </div>

                {/* Column 2: Nutrition */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-450 font-mono">Daily Nutrition</span>
                    <h3 className="text-sm sm:text-base font-black text-foreground">Nutrition &amp; Energy</h3>
                    <p className="text-xs text-zinc-555 dark:text-zinc-450 leading-relaxed">
                      Aim for <strong className="text-zinc-850 dark:text-zinc-955 font-bold font-mono">{nutritionTargets.calories} kcal</strong> and <strong className="text-zinc-850 dark:text-zinc-955 font-bold font-mono">{nutritionTargets.protein}g protein</strong> to support recovery.
                    </p>
                    <div className="text-[10px] text-zinc-555 dark:text-zinc-450 font-bold font-mono uppercase pt-0.5">
                      2,500 ml water · Log all meals
                    </div>
                  </div>
                  <Button
                    onClick={() => { setWorkoutTab("nutrition"); setActiveTab("workout"); }}
                    className="w-full font-black uppercase tracking-wider bg-amber-500 hover:bg-amber-400 text-white flex items-center justify-center gap-2 h-10 text-xs shadow-[0_4px_14px_rgba(245,158,11,0.25)] rounded-xl transition-all active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                  >
                    <Flame size={14} />
                    Log Nutrients
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─── GUIDED TRACKING WALKTHROUGH (Only shown in Guided Mode) ─── */}
      {guidedMode && (
        <Card className="p-5 border border-emerald-500/10 bg-emerald-500/[0.02] space-y-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <ClipboardList className="text-emerald-600 dark:text-emerald-450" size={16} />
            How to Train with Atlas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">1. Select a Plan</span>
              <p className="text-zinc-500 leading-relaxed">
                {activeWorkoutPlanId 
                  ? "✓ Active plan selected. You can view or edit it anytime in the 'Plans' tab."
                  : "Go to 'Plans' or use the checklist above to activate a training plan."}
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">2. Launch Session</span>
              <p className="text-zinc-500 leading-relaxed">
                Tap the green <strong>Launch Workout Session</strong> button on today's target card above to start tracking.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">3. Log Sets & Save</span>
              <p className="text-zinc-500 leading-relaxed">
                Enter weight and reps for completed sets during your workout, then tap <strong>Finish Workout</strong> to save.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ─── PHYSIOLOGICAL METRICS GRID with Expandable Coach Insights ─── */}
      {!guidedMode && (
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-300 leading-normal"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-300 leading-normal"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-300 leading-normal"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-300 leading-normal"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-300 leading-normal"
              >
                Your latest logged sleep. 7.5-9 hours is the critical physiological zone for protein synthesis and tissue restoration.
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
      )}

      {/* ─── DYNAMIC BIOMETRICS hub ─── */}
      {!guidedMode && (
        <Card className="p-4 border border-card-border bg-card shadow">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2.5">
            <div className="flex items-center gap-2">
              <User size={16} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Athlete Biometrics</h2>
            </div>
            <Button variant="ghost" size="icon" aria-label="Edit biometrics" className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-white" onClick={() => setActiveTab("settings")}>
              <Pencil size={14} />
            </Button>
          </div>
          <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-xs text-zinc-500 font-bold uppercase">Age</span>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">{profile?.age ?? "N/A"} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">yrs</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-xs text-zinc-500 font-bold uppercase">Weight</span>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">{profile?.weight ?? "N/A"} <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">{profile?.weightUnit}</span></p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-xs text-zinc-500 font-bold uppercase">Height</span>
              <p className="font-bold text-zinc-900 dark:text-white text-sm">
                {profile?.height
                  ? profile.heightUnit === "in"
                    ? `${Math.floor(profile.height / 12)}'${Math.round(profile.height % 12)}"`
                    : `${profile.height} cm`
                  : "N/A"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-xs text-zinc-500 font-bold uppercase">Target Physique</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-300 text-xs truncate" title={profile?.targetPhysique ?? "N/A"}>
                {profile?.targetPhysique ?? "N/A"}
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
              <span className="text-xs text-zinc-500 font-bold uppercase">Protein Target</span>
              <p className="font-bold text-emerald-600 dark:text-emerald-300 text-sm">
                {nutritionTargets.protein ? `${nutritionTargets.protein} g/day` : "N/A"}
              </p>
            </div>
          </div>
        </Card>
      )}
  
      {/* ─── HIGH-FIDELITY TABBED TRENDS CONSOLE ─── */}
      {!guidedMode && (
        <Card className="p-5 border border-card-border bg-card shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-100 dark:border-white/5 pb-4">
            <div>
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white leading-tight">Bio-Analytics Console</h2>
              <p className="text-xs text-zinc-400">Biological markers and load volume trendlines</p>
            </div>
            
            {/* Custom Tabs */}
            <div className="flex rounded-xl bg-surface p-1 border border-surface-border max-w-xs self-start sm:self-center">
              <button
                onClick={() => setActiveChartTab("weight")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === "weight" ? "bg-foreground text-background shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
              >
                <span className="flex items-center gap-1.5">
                  <Weight size={14} />
                  Bodyweight
                </span>
              </button>
              <button
                onClick={() => setActiveChartTab("volume")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === "volume" ? "bg-foreground text-background shadow-sm" : "text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"}`}
              >
                <span className="flex items-center gap-1.5">
                  <TrendingUp size={14} />
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
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
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
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500 italic">
                      Log at least two workout sessions containing sets to evaluate dynamic training volume graphs.
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Card>
      )}

      {/* ─── DYNAMIC PLANS, PERSONAL RECORDS & COACH NOTE (Only shown in Advanced Mode) ─── */}
      {!guidedMode && (
        <>
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
                        <h3 className="text-xl font-bold text-zinc-900 dark:text-white">{plan.name}</h3>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Active Plan
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-normal text-zinc-400 max-w-sm">{plan.goal}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" aria-label="Edit workout plan" className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white disabled:opacity-40" disabled={coachBusy} onClick={() => {
                        setEditingWorkoutPlanId(plan.id);
                        setActiveSubScreen("workout-plan-builder");
                      }}>
                        <Pencil size={15} />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-400 hover:text-red-400 disabled:opacity-40" disabled={coachBusy} onClick={() => {
                        setPlanToDelete({ id: plan.id, name: plan.name });
                        setShowDeleteModal(true);
                      }}>
                        <Trash2 size={15} />
                      </Button>
                    </div>
                  </div>

                  {/* Progress Indicator */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-zinc-500 font-semibold">
                      <span>Weekly Routines Progress</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">{completedCount}/{routinesCount}</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface border border-surface-border/50 overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300" 
                        style={{ width: `${progressPercent}%` }} 
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1 text-xs font-semibold py-2 disabled:opacity-40" variant="primary" disabled={coachBusy} onClick={() => {
                      setEditingWorkoutPlanId(plan.id);
                      setActiveSubScreen("workout-plan-detail");
                    }}>
                      View Detailed Plan
                    </Button>
                    {!isActive && (
                      <Button 
                        className="flex-1 text-xs font-semibold py-2 border-btn-secondary-border bg-btn-secondary hover:bg-btn-secondary-hover text-foreground disabled:opacity-40"
                        variant="secondary"
                        disabled={coachBusy}
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
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Coach is designing new program...</span>
              </Card>
            )}
          </section>

          {/* ─── PERSONAL RECORDS achievements SHELF ─── */}
          <Card className="p-4 border border-card-border bg-card shadow">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Medal className="text-amber-400" size={16} />
                <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Recent Personal Records</h2>
              </div>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {recentPrs.length > 0 ? (
                recentPrs.slice(0, 6).map((pr) => (
                  <Surface key={`${pr.exerciseName}-${pr.value}`} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface">
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-white truncate max-w-36">{pr.exerciseName}</p>
                      <p className="text-xs text-zinc-500">{pr.date}</p>
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
                <div className={`p-2 rounded-xl shrink-0 ${isLastMessageError ? 'bg-red-500/10 text-red-400 border border-red-500/15' : 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/15'}`}>
                  <Bot size={22} className={isLastMessageError ? 'text-red-400' : 'text-emerald-500'} />
                </div>
                <div className="flex-1 space-y-1">
                  <span className={`text-xs font-black uppercase tracking-widest ${isLastMessageError ? 'text-red-400' : 'text-emerald-500'}`}>
                    {isLastMessageError ? "Central Link Impaired" : "Dynamic Coaching Directive"}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
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
                            <ReactMarkdown className="prose dark:prose-invert prose-p:leading-relaxed prose-a:text-emerald-600 dark:text-emerald-450 max-w-none text-xs text-zinc-400">
                              {nonJson}
                            </ReactMarkdown>
                          ) : null;
                        })() || null}
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                          I have compiled and generated a customized training plan for your bio-profile. You can activate it directly below.
                        </p>
                      </div>
                    ) : (
                      lastMessage?.content
                    )}
                  </div>
                  
                  <div className="pt-2 flex justify-start">
                    <Button
                      className={`text-xs font-bold py-1.5 px-3 flex items-center gap-1 border ${isLastMessageError ? 'border-red-500/20 bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:border-red-500/20 dark:bg-red-950/30 dark:hover:bg-red-900/30 dark:text-red-300' : 'border-emerald-500/20 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/30 dark:text-emerald-300'}`}
                      variant="secondary"
                      onClick={() => setActiveTab("coach")}
                    >
                      Ask Coach Detailed Question
                      <ArrowUpRight size={15} />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </>
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
            <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" onClick={() => {
              setShowSwitchModal(false);
              setPlanToActivate(null);
            }}>
              <X size={20} />
            </Button>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">Switch Active Program</h3>
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
            <Button variant="ghost" size="icon" aria-label="Close" className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white" onClick={() => {
              setShowDeleteModal(false);
              setPlanToDelete(null);
            }}>
              <X size={20} />
            </Button>
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">Delete Workout Program</h3>
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

      {/* \u2500\u2500\u2500 AI PLAN GENERATION ERROR MODAL \u2500\u2500\u2500 */}
      {showAiErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 supports-[backdrop-filter]:backdrop-blur-md">
          <Card className="w-full max-w-md p-6 space-y-4 relative border border-rose-500/30 bg-card shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2.5 right-2.5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              onClick={() => setShowAiErrorModal(false)}
            >
              <X size={20} />
            </Button>

            {/* Header */}
            <div className="flex items-start gap-3.5">
              <div className="shrink-0 h-11 w-11 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center">
                <AlertTriangle className="text-rose-500 dark:text-rose-400" size={22} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-rose-500 dark:text-rose-400">AI Coach</p>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white leading-snug mt-0.5">Plan Generation Failed</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">Something went wrong while your AI Coach was building your plan.</p>
              </div>
            </div>

            {/* Error detail */}
            <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.04] dark:bg-rose-500/[0.07] p-3.5 space-y-1">
              <p className="text-xs font-extrabold uppercase tracking-wider text-rose-500 dark:text-rose-400">Error Detail</p>
              <p className="text-xs text-zinc-700 dark:text-zinc-300 leading-relaxed font-mono break-words">
                {aiErrorMessage || "An unknown error occurred communicating with the AI provider."}
              </p>
            </div>

            {/* Tips */}
            <div className="space-y-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <p className="font-semibold text-zinc-700 dark:text-zinc-300">Common causes:</p>
              <ul className="list-disc list-inside space-y-1 leading-relaxed">
                <li>Invalid or expired API key</li>
                <li>No active AI provider configured</li>
                <li>Network connection issue or provider outage</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-1">
              <Button
                variant="secondary"
                onClick={() => setShowAiErrorModal(false)}
                className="flex-1 text-xs font-bold"
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  setShowAiErrorModal(false);
                  setActiveTab("settings");
                  setActiveSettingsTab?.("ai");
                }}
                className="flex-1 text-xs font-bold"
              >
                <Settings size={16} />
                Check AI Settings
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showCreatePlanModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 supports-[backdrop-filter]:backdrop-blur-md">
          <Card className="w-full max-w-md p-6 space-y-4 relative border border-card-border bg-card shadow-2xl">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2.5 right-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              onClick={() => setShowCreatePlanModal(false)}
            >
              <X size={20} />
            </Button>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white leading-tight">Create Workout Program</h3>
              <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                Select a method to establish your training plan.
              </p>
            </div>

            {/* AI BUSY OVERLAY — shown instead of options when AI is generating */}
            {coachBusy ? (
              <div className="keep-dark relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/60 via-fuchsia-950/50 to-zinc-950/80 p-5 space-y-3">
                {/* Ambient glow */}
                <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-violet-500/20 blur-[50px] pointer-events-none" />
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-violet-500/20 border border-violet-500/30 flex items-center justify-center shrink-0">
                    <motion.span
                      animate={{ rotate: [0, 10, -10, 10, 0] }}
                      transition={{ repeat: Infinity, duration: 2.4, ease: "easeInOut" }}
                      className="text-lg select-none"
                    >
                      🍳
                    </motion.span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-widest text-violet-400">AI Coach</span>
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold uppercase tracking-wider bg-violet-500/20 text-violet-300 border border-violet-500/30 px-1.5 py-0.5 rounded-full">
                        <span className="h-1.5 w-1.5 rounded-full bg-violet-400 animate-pulse" />
                        Cooking
                      </span>
                    </div>
                    <p className="text-sm font-bold text-white-keep mt-0.5">Your plan is being generated!</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Your AI Coach is working hard to build a personalised, clinical-grade program for you. Other plan creation options are temporarily unavailable while generation is in progress.
                </p>
                {/* Shimmer bar */}
                <div className="h-1.5 w-full rounded-full bg-violet-950/60 border border-violet-500/20 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-400 to-violet-500 rounded-full"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                    style={{ width: "60%" }}
                  />
                </div>
                <p className="text-xs text-zinc-500 text-center italic">Switch to the Coach tab to watch the plan arrive in real-time ✨</p>
              </div>
            ) : (
              <div className="space-y-3 pt-2">
                {/* Option 1: Template Seed Plan */}
                <button
                  onClick={() => {
                    void handleLoadSeedPlan();
                    setShowCreatePlanModal(false);
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-card-border bg-surface/30 hover:bg-surface transition-all flex gap-3.5 items-start group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-450 shrink-0">
                    <ClipboardList size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      Load 3-Day Seed Plan
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                      Start tracking immediately with a pre-configured, beginner-friendly full-body template split.
                    </p>
                  </div>
                </button>

                {/* Option 2: Custom Manual Builder */}
                <button
                  onClick={() => {
                    handleCreateManualPlan();
                    setShowCreatePlanModal(false);
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-card-border bg-surface/30 hover:bg-surface transition-all flex gap-3.5 items-start group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-455 shrink-0">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      Create Manual Plan
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                      Design a completely customized plan from scratch. Add routines, configure days, target sets, and select exercises manually.
                    </p>
                  </div>
                </button>

                {/* Option 3: AI Coach Planner */}
                <button
                  onClick={() => {
                    handleGenerateAiPlan();
                    setShowCreatePlanModal(false);
                  }}
                  className="w-full text-left p-3.5 rounded-xl border border-card-border bg-surface/30 hover:bg-surface transition-all flex gap-3.5 items-start group cursor-pointer"
                >
                  <div className="p-2 rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-455 shrink-0">
                    <Bot size={18} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                      Generate with AI Coach
                    </h4>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                      Have the AI Coach write a personalized plan for you based on your biometrics, target goals, and training experience.
                    </p>
                  </div>
                </button>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ─── SECURE BACKUP UPGRADE MODAL ─── */}
      {showMigrationModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md">
          <Card className="w-full max-w-md p-6 relative overflow-hidden bg-card/95 border border-card-border shadow-2xl">
            <div className="absolute -right-20 -top-20 w-40 h-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

            {!showMigrationSuccessAnimation ? (
              <>
                <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-3 mb-5 select-none">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-emerald-500" size={20} />
                    <h3 className="font-bold text-zinc-900 dark:text-white text-base">Secure Cloud Sync Setup</h3>
                  </div>
                  {!isMigrationSubmitting && (
                    <button
                      onClick={() => {
                        setShowMigrationModal(false);
                        setMigrationEmailInput("");
                        setMigrationSubmitError(null);
                      }}
                      className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition"
                      aria-label="Close sync setup"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>

                {migrationSubmitError && (
                  <div className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-455 text-xs">
                    {migrationSubmitError}
                  </div>
                )}

                {/* Tab selector for Google vs Manual Email Sync */}
                <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-950/40 border border-zinc-500/10 dark:border-white/5 rounded-xl mb-4 select-none">
                  <button
                    type="button"
                    onClick={() => {
                      setMigrationMethod("google");
                      setMigrationEmailError(null);
                      setMigrationSubmitError(null);
                    }}
                    className={`py-2 text-[11px] font-bold rounded-lg transition duration-200 cursor-pointer ${
                      migrationMethod === "google"
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                    }`}
                    disabled={isMigrationFederatedLoading || isMigrationSubmitting || isSendingMigrationOtp}
                  >
                    Google Sign-In
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMigrationMethod("email");
                      setMigrationEmailError(null);
                      setMigrationSubmitError(null);
                      setMigrationOtpError(null);
                    }}
                    className={`py-2 text-[11px] font-bold rounded-lg transition duration-200 cursor-pointer ${
                      migrationMethod === "email"
                        ? "bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-150 shadow-sm"
                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-850 dark:hover:text-zinc-200"
                    }`}
                    disabled={isMigrationFederatedLoading || isMigrationSubmitting || isSendingMigrationOtp}
                  >
                    Manual Email Sync
                  </button>
                </div>

                {migrationMethod === "google" ? (
                  <div className="space-y-4 animate-fadeIn">
                    {isMigrationFederatedLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center space-y-4 animate-fadeIn select-none">
                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent shadow-md" />
                        <p className="text-xs text-zinc-400 font-bold uppercase tracking-wider font-mono">
                          Checking sync status...
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="migration-google-email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Google Email Address</Label>
                          <div className="relative">
                            <Input
                              id="migration-google-email"
                              type="email"
                              value={migrationEmailInput}
                              onChange={(e) => {
                                setMigrationEmailInput(e.target.value);
                                setMigrationEmailError(null);
                              }}
                              placeholder="e.g. athlete.dev@gmail.com"
                              className="pl-9 text-xs font-medium focus:ring-2 focus:ring-emerald-450/10"
                            />
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          </div>
                          {migrationEmailError && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{migrationEmailError}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 pt-2">
                          <button
                            type="button"
                            onClick={handleGoogleMigrationSubmit}
                            disabled={!migrationEmailInput.trim()}
                            className="w-full py-2.5 px-4 rounded-xl bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 hover:border-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-bold transition duration-200 cursor-pointer text-center select-none active:scale-[0.99] disabled:opacity-50"
                          >
                            Simulate Google Sign-In (Sandbox Sync)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    {!migrationOtpSent ? (
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <Label htmlFor="migration-manual-email" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Email Address</Label>
                          <div className="relative">
                            <Input
                              id="migration-manual-email"
                              type="email"
                              value={migrationEmailInput}
                              onChange={(e) => {
                                setMigrationEmailInput(e.target.value);
                                setMigrationEmailError(null);
                              }}
                              placeholder="e.g. athlete.dev@gmail.com"
                              className="pl-9 text-xs font-medium focus:ring-2 focus:ring-emerald-450/10"
                              disabled={isSendingMigrationOtp}
                            />
                            <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                          </div>
                          {migrationEmailError && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{migrationEmailError}</p>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-2.5 pt-2">
                          <Button
                            className="w-full bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-950 font-bold"
                            variant="primary"
                            onClick={handleSendMigrationOtp}
                            icon={isSendingMigrationOtp ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                            ) : (
                              <Mail size={16} className="text-zinc-955" />
                            )}
                            disabled={isSendingMigrationOtp || !migrationEmailInput.trim()}
                          >
                            {isSendingMigrationOtp ? "Sending OTP..." : "Send Verification Code"}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-fadeIn">
                        {showMigrationSandboxOtp && (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-3">
                            <Lock size={14} className="text-emerald-500 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Sandbox Verification Code</p>
                              <p className="text-[11px] font-mono text-foreground font-bold tracking-widest">{migrationGeneratedOtp}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(migrationGeneratedOtp);
                                setMigrationOtpCopied(true);
                                setTimeout(() => setMigrationOtpCopied(false), 2000);
                              }}
                              className="shrink-0 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded hover:bg-emerald-500/10 transition"
                            >
                              {migrationOtpCopied ? "Copied" : "Copy"}
                            </button>
                          </div>
                        )}

                        <div className="space-y-1">
                          <Label htmlFor="migration-otp" className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">6-Digit Code</Label>
                          <Input
                            id="migration-otp"
                            type="text"
                            maxLength={6}
                            value={migrationOtpInput}
                            onChange={(e) => {
                              setMigrationOtpInput(e.target.value.replace(/[^0-9]/g, ""));
                              setMigrationOtpError(null);
                            }}
                            placeholder="e.g. 123456"
                            className="text-xs font-mono font-black text-center tracking-widest focus:ring-2 focus:ring-emerald-450/10"
                            disabled={isMigrationSubmitting}
                          />
                          {migrationOtpError && (
                            <p className="text-[10px] text-rose-500 font-medium mt-1">{migrationOtpError}</p>
                          )}
                        </div>

                        <div className="flex gap-3 border-t border-card-border pt-4 mt-6">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                              setMigrationOtpSent(false);
                              setMigrationOtpInput("");
                              setMigrationOtpError(null);
                              setShowMigrationSandboxOtp(false);
                            }}
                            icon={<ArrowLeft size={16} />}
                            disabled={isMigrationSubmitting}
                          >
                            Change Email
                          </Button>
                          <Button
                            className="ml-auto bg-emerald-500 hover:bg-emerald-600 dark:bg-emerald-450 dark:hover:bg-emerald-500 text-zinc-950 font-bold"
                            variant="primary"
                            onClick={handleVerifyMigrationOtp}
                            icon={isMigrationSubmitting ? (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                            ) : (
                              <Check size={16} className="text-zinc-955 font-bold" />
                            )}
                            disabled={isMigrationSubmitting || migrationOtpInput.length !== 6}
                          >
                            {isMigrationSubmitting ? "Verifying..." : "Verify & Enable Sync"}
                          </Button>
                        </div>
                      </div>
                    )}
                    
                    <div className="rounded-2xl border border-zinc-500/10 dark:border-white/5 bg-zinc-500/5 p-4 space-y-1.5 mt-4">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        ⚠️ Crucial Data Warning
                      </span>
                      <p className="text-[10px] text-zinc-555 dark:text-zinc-500 leading-relaxed">
                        If you want to sync your training data seamlessly to any device, pick this option. Otherwise, your training data remains local to this browser session and may be lost if your browser cache is cleared.
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Success / Migration animation step */
              <div className="text-center py-6 space-y-4 select-none">
                <div className="mx-auto h-16 w-16 bg-emerald-500/20 border border-emerald-500/40 rounded-full flex items-center justify-center text-emerald-400">
                  <Check className="stroke-[3]" size={32} />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-black text-zinc-900 dark:text-white">Upgrade Successful</h3>
                  <p className="text-xs text-zinc-400 leading-relaxed max-w-sm mx-auto">
                    A secure email sync record has been verified. Your legacy backing file has been converted to the safe naming format:
                  </p>
                  <div className="bg-zinc-950/60 border border-white/5 py-1.5 px-3 rounded-lg font-mono text-[10px] font-bold text-emerald-400 max-w-sm mx-auto select-all break-all">
                    profile_email_{migrationEmailInput.toLowerCase().trim()}.json
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed max-w-xs mx-auto pt-1">
                    Your full logs, metrics, plans, and history have been successfully preserved and synced.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </motion.div>
  </>
);
}