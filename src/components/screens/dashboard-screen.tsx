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
  Search,
  LineChart as LineChartIcon,
  Info,
  Clock3,
  Zap,
  Thermometer,
  PlusCircle,
  Edit,
} from "lucide-react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { BeginnerTipCard } from "@/components/beginner-tip-card";
import { RecoveryCheckinSimple } from "@/components/recovery-checkin-simple";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
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
  getStrengthSeries,
  topExercisesForAnalytics,
} from "@/lib/progression/engine";
import { useAtlasStore } from "@/store/useAtlasStore";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import type { UserProfile, RecoveryLog, BodyMetric, Workout } from "@/types/domain";
import { createId } from "@/lib/id";
import { validateEmail } from "@/lib/email-validator";
import { restoreProfileByEmail } from "@/lib/sync";
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal";
import { calculateNutritionTargets } from "@/lib/calculators";
import { DailyRecoveryModal } from "@/components/daily-recovery-modal";
import { DailyBodyMetricModal } from "@/components/daily-body-metric-modal";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { format, getISOWeek, getYear as getDateFnsYear, parseISO } from "date-fns";
function parseLocalDate(dateStr: string): Date {
  if (dateStr.includes("T")) {
    return new Date(dateStr);
  }
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type HistoryView = "day" | "week" | "month" | "year";

function getVolumeForWorkout(workout: Workout): number {
  return workout.exercises.reduce((totalVolume, exercise) => {
    return totalVolume + exercise.sets.reduce((setVolume, set) => {
      return setVolume + (set.completed ? (set.reps || 0) * (set.weight || 0) : 0);
    }, 0);
  }, 0);
}

// ─── Safe Responsive Container to prevent Recharts SSR & initial dimension warnings ───
function SafeResponsiveContainer({ children, height = "100%" }: { children: React.ReactNode; width?: string | number; height?: string | number; minWidth?: string | number; minHeight?: string | number }) {
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
    return () => {
      observer.disconnect();
    };
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

export function DashboardScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const allWorkouts = useAtlasStore((state) => state.workouts);
  
  // Filter empty workouts reactively
  const workouts = useMemo(() => {
    return allWorkouts.filter(w => w.exercises.some(ex => ex.sets.some(s => s.completed)));
  }, [allWorkouts]);

  const nutritionEntries = useAtlasStore((state) => state.nutritionEntries || []);
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
  const logBodyMetric = useAtlasStore((state) => state.logBodyMetric);
  const storeExercises = useAtlasStore((state) => state.exercises);

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
  const [showAdvancedPlanOptions, setShowAdvancedPlanOptions] = useState(false);
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

  const availableYears = useMemo(() => {
    const years = new Set<number>();
    workouts.forEach(w => years.add(new Date(w.startedAt).getFullYear()));
    recoveryLogs.forEach(r => years.add(new Date(r.date).getFullYear()));
    bodyMetrics.forEach(b => years.add(new Date(b.date).getFullYear()));
    const sortedYears = Array.from(years).sort((a, b) => b - a);
    if (sortedYears.length === 0) {
      sortedYears.push(new Date().getFullYear());
    }
    return sortedYears;
  }, [workouts, recoveryLogs, bodyMetrics]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());

  const filteredWorkoutsForYear = useMemo(() => {
    return workouts.filter(w => 
      new Date(w.startedAt).getFullYear() === selectedYear &&
      w.exercises.some(ex => ex.sets.some(s => s.completed))
    );
  }, [workouts, selectedYear]);

  const filteredRecoveryLogsForYear = useMemo(() => {
    return recoveryLogs.filter(r => new Date(r.date).getFullYear() === selectedYear);
  }, [recoveryLogs, selectedYear]);

  const filteredBodyMetricsForYear = useMemo(() => {
    return bodyMetrics.filter(b => new Date(b.date).getFullYear() === selectedYear);
  }, [bodyMetrics, selectedYear]);

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
  }, [workouts]);

  const strengthSeries = useMemo(() => {
    return getStrengthSeries(filteredWorkoutsForYear, selectedExercise);
  }, [filteredWorkoutsForYear, selectedExercise]);

  const cardioSeries = useMemo(() => {
    const series: Record<string, { date: string; minutes: number; distance: number; calories: number }> = {};
    filteredWorkoutsForYear.forEach((w) => {
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
  }, [filteredWorkoutsForYear]);

  const recoveryTrendSeries = useMemo(() => {
    return [...filteredRecoveryLogsForYear]
      .sort((a, b) => parseLocalDate(a.date).getTime() - parseLocalDate(b.date).getTime())
      .map(log => ({
        date: format(parseLocalDate(log.date), "MMM dd"),
        energy: log.energy,
        soreness: log.soreness,
        stress: log.stress,
        readiness: log.readiness,
      }));
  }, [filteredRecoveryLogsForYear]);

  const totalWorkoutsInYear = filteredWorkoutsForYear.length;
  const totalWorkoutDurationInYear = filteredWorkoutsForYear.reduce((sum, w) => sum + (w.durationMinutes || 0), 0);

  const averageSleepHours = useMemo(() => {
    if (filteredRecoveryLogsForYear.length === 0) return "0.0";
    const totalSleepHours = filteredRecoveryLogsForYear.reduce((sum, log) => sum + (log.sleepHours || 0), 0);
    return (totalSleepHours / filteredRecoveryLogsForYear.length).toFixed(1);
  }, [filteredRecoveryLogsForYear]);

  const bodyweightSeries = useMemo(() => {
    return getBodyweightSeries(filteredBodyMetricsForYear);
  }, [filteredBodyMetricsForYear]);

  const yearVolumeSeries = useMemo(() => {
    return getVolumeSeries(filteredWorkoutsForYear);
  }, [filteredWorkoutsForYear]);

  const groupedData = useMemo(() => {
    const groups: Record<string, { workouts: Workout[], recoveryLogs: RecoveryLog[], bodyMetrics: BodyMetric[] }> = {};

    [...filteredWorkoutsForYear, ...filteredRecoveryLogsForYear, ...filteredBodyMetricsForYear].forEach(item => {
      const date = parseLocalDate('startedAt' in item ? item.startedAt : item.date);
      let key: string;
      switch (selectedHistoryView) {
        case "day":
          key = format(date, "yyyy-MM-dd");
          break;
        case "week":
          key = `${date.getFullYear()}-W${getISOWeek(date)}`;
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
  }, [filteredWorkoutsForYear, filteredRecoveryLogsForYear, filteredBodyMetricsForYear, selectedHistoryView]);

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

  const modalDailyRecoveryLog = useMemo(() => {
    return recoveryLogs.find(r => r.date === modalSelectedDate);
  }, [recoveryLogs, modalSelectedDate]);

  const modalDailyBodyMetric = useMemo(() => {
    return bodyMetrics.find(b => b.date === modalSelectedDate);
  }, [bodyMetrics, modalSelectedDate]);

  const latestBodyweight = useMemo(() => {
    const sortedBodyMetrics = [...bodyMetrics].sort((a, b) => parseLocalDate(b.date).getTime() - parseLocalDate(a.date).getTime());
    return sortedBodyMetrics.length > 0 ? sortedBodyMetrics[0].bodyweight : 0;
  }, [bodyMetrics]);
  
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

  const consistencyDays = useMemo(() => {
    const today = new Date();
    const todayStr = getLocalDateString(today);
    
    // Find the Monday of this week to align columns
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday...
    const daysToMonday = currentDay === 0 ? 6 : currentDay - 1;
    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() - daysToMonday);

    // Generate 4 full weeks starting from Monday 3 weeks ago
    const days = [];
    for (let w = 3; w >= 0; w--) {
      const weekMonday = new Date(thisMonday);
      weekMonday.setDate(thisMonday.getDate() - w * 7);
      
      for (let d = 0; d < 7; d++) {
        const current = new Date(weekMonday);
        current.setDate(weekMonday.getDate() + d);
        const dateStr = getLocalDateString(current);
        const isFuture = dateStr > todayStr;
        const isToday = dateStr === todayStr;

        // Check if workout completed on this day
        const hasWorkout = workouts.some(w => {
          if (!w.completedAt) return false;
          try {
            return getLocalDateString(new Date(w.completedAt)) === dateStr;
          } catch {
            return false;
          }
        });

        // Check if food logged on this day
        const hasNutrition = (nutritionEntries || []).some(entry => {
          if (!entry.timestamp) return false;
          try {
            return getLocalDateString(new Date(entry.timestamp)) === dateStr;
          } catch {
            return false;
          }
        });

        days.push({
          dateStr,
          isFuture,
          isToday,
          hasWorkout,
          hasNutrition,
          dayOfWeek: d
        });
      }
    }
    return days;
  }, [workouts, nutritionEntries]);

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
    if (guidedMode) {
      // Plain English for beginners
      if (score >= 80) return {
        label: "Your body feels great today! 💪",
        text: "You're well-rested and full of energy. This is a great day to push yourself in your workout!",
        color: "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
        ringColor: "#10b981",
      };
      if (score >= 50) return {
        label: "You're doing well 🙂",
        text: "You're in good shape — train as planned today. Listen to your body and don't push too hard.",
        color: "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20",
        ringColor: "#f59e0b",
      };
      return {
        label: "Your body needs rest 😴",
        text: "It looks like you need some rest today. Consider going easy, doing a light walk, or taking the day off.",
        color: "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20",
        ringColor: "#f43f5e",
      };
    }
    // Expert mode — technical detail
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
        className="flex flex-col gap-4 pb-10"
      >



        {/* ── Body feeling card ── */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🌡️</span>
              <div>
                <p className="text-sm font-bold text-foreground">How your body is doing</p>
                <p className="text-xs text-zinc-500">Based on your last check-in</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQuickLog(!showQuickLog)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              <TimerReset size={13} aria-hidden="true" />
              Update
            </button>
          </div>

          {/* Recovery ring + insight */}
          <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-surface border border-surface-border">
            {/* Ring */}
            <div className="relative h-16 w-16 shrink-0 flex items-center justify-center">
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="27" fill="none" stroke="currentColor" strokeWidth="5" className="text-zinc-200 dark:text-zinc-800" />
                <motion.circle
                  cx="32" cy="32" r="27" fill="none"
                  stroke={insight.ringColor}
                  strokeWidth="5"
                  strokeDasharray="170"
                  initial={{ strokeDashoffset: 170 }}
                  animate={{ strokeDashoffset: 170 - (170 * recoveryScore) / 100 }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <span className="text-base font-black text-foreground leading-none">
                {recoveryScore}<span className="text-xs font-bold text-zinc-500">%</span>
              </span>
            </div>
            {/* Insight text */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground leading-snug">{insight.label}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">{insight.text}</p>
            </div>
          </div>

          {/* Quick-log form */}
          <AnimatePresence>
            {showQuickLog && (
              <motion.div
                key="quicklog"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="pt-1">
                  <RecoveryCheckinSimple onSaved={() => setShowQuickLog(false)} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* ── Stats at a glance ── */}
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1 mb-2">This year ({selectedYear})</p>
          <div className="grid grid-cols-2 gap-2.5">
            {[
              {
                emoji: "🏋️",
                label: "Workouts done",
                value: String(totalWorkoutsInYear),
                sub: "sessions completed",
                color: "border-emerald-500/20 bg-emerald-500/5",
              },
              {
                emoji: "⏱️",
                label: "Time exercising",
                value:
                  totalWorkoutDurationInYear >= 60
                    ? `${Math.floor(totalWorkoutDurationInYear / 60)}h ${totalWorkoutDurationInYear % 60}m`
                    : `${totalWorkoutDurationInYear}m`,
                sub: "total active time",
                color: "border-violet-500/20 bg-violet-500/5",
              },
              {
                emoji: "😴",
                label: "Average sleep",
                value: `${averageSleepHours}h`,
                sub: "per night logged",
                color: "border-indigo-500/20 bg-indigo-500/5",
              },
              {
                emoji: "⚖️",
                label: "Current weight",
                value:
                  (latestBodyweight ?? 0) > 0
                    ? `${latestBodyweight} ${profile?.weightUnit ?? "kg"}`
                    : "—",
                sub: (latestBodyweight ?? 0) > 0 ? "latest measurement" : "not yet logged",
                color: "border-amber-500/20 bg-amber-500/5",
              },
            ].map((item) => (
              <div key={item.label} className={`rounded-2xl border p-4 space-y-1 ${item.color}`}>
                <span className="text-2xl" aria-hidden="true">{item.emoji}</span>
                <p className="text-xl font-extrabold text-foreground leading-none">{item.value}</p>
                <p className="text-xs font-semibold text-foreground">{item.label}</p>
                <p className="text-[10px] text-zinc-500">{item.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── 4-week consistency calendar ── */}
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xl" aria-hidden="true">📅</span>
            <div>
              <p className="text-sm font-bold text-foreground">Consistency — last 4 weeks</p>
              <p className="text-xs text-zinc-500">🟢 workout · 🟡 meal logged · ⬜ rest day</p>
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
              <div key={d} className="text-center text-[9px] font-bold text-zinc-400 uppercase">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {consistencyDays.map((day) => {
              let bg = "bg-zinc-100 dark:bg-zinc-800";
              if (day.isFuture) bg = "bg-zinc-100/40 dark:bg-zinc-800/40 opacity-30";
              else if (day.hasWorkout && day.hasNutrition) bg = "bg-emerald-400 dark:bg-emerald-500";
              else if (day.hasWorkout) bg = "bg-emerald-300 dark:bg-emerald-600/70";
              else if (day.hasNutrition) bg = "bg-amber-300 dark:bg-amber-500/60";
              return (
                <div
                  key={day.dateStr}
                  className={`aspect-square rounded-lg transition-all ${bg} ${day.isToday ? "ring-2 ring-emerald-500 ring-offset-1 ring-offset-background" : ""}`}
                  title={`${day.dateStr}${day.hasWorkout ? " · Workout ✓" : ""}${day.hasNutrition ? " · Meal ✓" : ""}`}
                />
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 pt-1">
            {[
              { color: "bg-emerald-400", label: "Workout + meal" },
              { color: "bg-emerald-300 dark:bg-emerald-600/70", label: "Workout only" },
              { color: "bg-amber-300 dark:bg-amber-500/60", label: "Meal only" },
              { color: "bg-zinc-100 dark:bg-zinc-800", label: "Rest day" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <div className={`h-3 w-3 rounded ${item.color}`} />
                <span className="text-[10px] text-zinc-500 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Bodyweight trend ── */}
        {bodyweightSeries.length >= 2 && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">⚖️</span>
              <div>
                <p className="text-sm font-bold text-foreground">Weight over time</p>
                <p className="text-xs text-zinc-500">Your bodyweight history this year</p>
              </div>
            </div>
            <SafeResponsiveContainer width="100%" height={140} minWidth={0} minHeight={0}>
              <AreaChart data={bodyweightSeries} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="bwGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="10%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="date" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-card-border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [`${v} ${profile?.weightUnit ?? "kg"}`, "Weight"]}
                />
                <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={2} fill="url(#bwGrad)" dot={false} />
              </AreaChart>
            </SafeResponsiveContainer>
          </Card>
        )}

        {/* ── Weekly workout effort ── */}
        {yearVolumeSeries.length >= 2 && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">📈</span>
              <div>
                <p className="text-sm font-bold text-foreground">Weekly workout effort</p>
                <p className="text-xs text-zinc-500">Total weight lifted each week — bigger is better!</p>
              </div>
            </div>
            <SafeResponsiveContainer width="100%" height={130} minWidth={0} minHeight={0}>
              <BarChart data={yearVolumeSeries} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="week" tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fill: "#71717a" }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-card-border)", borderRadius: 12, fontSize: 12 }}
                  formatter={(v: any) => [`${Number(v).toLocaleString()} ${profile?.weightUnit ?? "kg"}`, "Volume"]}
                />
                <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </SafeResponsiveContainer>
          </Card>
        )}

        {/* ── Recent personal bests ── */}
        {recentPrs.length > 0 && (
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl" aria-hidden="true">🏆</span>
              <div>
                <p className="text-sm font-bold text-foreground">Recent personal bests</p>
                <p className="text-xs text-zinc-500">New records you've set — great job!</p>
              </div>
            </div>
            <div className="space-y-2">
              {recentPrs.slice(0, 5).map((pr) => (
                <div key={pr.exerciseName + pr.date} className="flex items-center justify-between p-3 rounded-xl bg-surface border border-surface-border">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{pr.exerciseName}</p>
                    <p className="text-xs text-zinc-500">{pr.date}</p>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                      {pr.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* ── Cloud backup prompt ── */}
        {profile && !profile.email && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-4 flex items-start gap-3"
          >
            <span className="text-2xl shrink-0" aria-hidden="true">💾</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">Back up your progress</p>
              <p className="text-xs text-zinc-500 mt-0.5 leading-relaxed">
                Link a free email to keep your workouts safe across devices. Takes 30 seconds.
              </p>
              <button
                type="button"
                onClick={() => setShowMigrationModal(true)}
                className="mt-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                Set up backup →
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Empty state ── */}
        {isNewUser && (
          <Card className="p-5 text-center space-y-3 border-dashed border-zinc-300 dark:border-zinc-700">
            <span className="text-4xl" aria-hidden="true">🌱</span>
            <p className="text-sm font-bold text-foreground">Your journey starts here!</p>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-xs mx-auto">
              Complete your first workout and log a meal — your progress charts will appear here automatically.
            </p>
            <Button variant="primary" className="w-full max-w-xs mx-auto" onClick={() => setActiveTab("workout")}>
              <Dumbbell size={15} className="mr-2" />
              Start my first workout
            </Button>
          </Card>
        )}

        {/* ── Year selector ── */}
        {availableYears.length > 1 && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Showing year:</span>
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-20 h-8 text-xs font-bold rounded-xl bg-input border-input-border text-foreground"
            >
              {availableYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Select>
          </div>
        )}

      </motion.div>

      {/* ── Cloud backup modal ── */}
      <AnimatePresence>
        {showMigrationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/50 backdrop-blur-sm p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setShowMigrationModal(false); }}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-background rounded-2xl border border-card-border shadow-2xl w-full max-w-md p-6 space-y-4"
            >
              {showMigrationSuccessAnimation ? (
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                  <span className="text-5xl">🎉</span>
                  <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">Backup set up!</p>
                  <p className="text-xs text-zinc-500">Your progress is now safe and secure.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-foreground">Back up your progress</p>
                    <button type="button" onClick={() => setShowMigrationModal(false)} className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
                      <X size={18} />
                    </button>
                  </div>
                  <p className="text-xs text-zinc-500 leading-relaxed">
                    Enter your email and we'll link it to your profile so your workouts are safe on any device.
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="dash-migration-email" className="text-xs font-bold text-zinc-600 dark:text-zinc-400">Email address</Label>
                    <Input
                      id="dash-migration-email"
                      type="email"
                      placeholder="you@example.com"
                      value={migrationEmailInput}
                      onChange={(e) => { setMigrationEmailInput(e.target.value); setMigrationEmailError(null); }}
                      className="text-sm"
                    />
                    {migrationEmailError && <p className="text-xs text-red-500">{migrationEmailError}</p>}
                  </div>
                  {!migrationOtpSent ? (
                    <Button variant="primary" className="w-full" onClick={handleSendMigrationOtp} disabled={isSendingMigrationOtp}>
                      {isSendingMigrationOtp ? "Sending code…" : "Send verification code →"}
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-xs text-zinc-500">Enter the 6-digit code we sent to your email.</p>
                      {showMigrationSandboxOtp && (
                        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-xs text-amber-700 dark:text-amber-300 font-mono flex items-center justify-between gap-2">
                          <span>Sandbox code: <strong>{migrationGeneratedOtp}</strong></span>
                          <button type="button" onClick={async () => { await navigator.clipboard.writeText(migrationGeneratedOtp); setMigrationOtpCopied(true); }} className="cursor-pointer">
                            {migrationOtpCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                          </button>
                        </div>
                      )}
                      <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="123456"
                        maxLength={6}
                        value={migrationOtpInput}
                        onChange={(e) => { setMigrationOtpInput(e.target.value); setMigrationOtpError(null); }}
                        className="text-sm text-center tracking-widest font-mono font-bold"
                      />
                      {migrationOtpError && <p className="text-xs text-red-500">{migrationOtpError}</p>}
                      {migrationSubmitError && <p className="text-xs text-red-500">{migrationSubmitError}</p>}
                      <Button variant="primary" className="w-full" onClick={handleVerifyMigrationOtp} disabled={isMigrationSubmitting}>
                        {isMigrationSubmitting ? "Verifying…" : "Confirm & back up →"}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recovery & body metric modals */}
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
    </>
  );
}
