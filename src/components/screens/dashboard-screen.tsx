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
import { useState, useMemo, useEffect, useRef } from "react";
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
        className="flex flex-col gap-3 sm:gap-5 pb-28"
      >
      {/* ─── HEADER ZONE ─── */}
      <section className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 sm:gap-4 p-4 sm:p-5 rounded-2xl border border-card-border bg-card shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Sparkles size={16} className="animate-pulse" />
            </span>
            <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">Your Daily Health Summary</p>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-955 dark:text-white">
            Welcome, {profile?.name ?? "Athlete"}
          </h1>
          <p className="text-xs text-zinc-555 dark:text-zinc-500 flex items-center gap-1.5 pt-0.5">
            <Calendar size={14} className="text-zinc-555 dark:text-zinc-500" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>

        <div className="flex flex-col gap-3 items-stretch md:items-end w-full md:w-auto">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex flex-wrap items-center gap-3">
              {/* Experience Mode Toggle */}
              <div className="flex rounded-xl bg-surface p-1 border border-surface-border select-none">
                <button
                  type="button"
                  onClick={() => void setGuidedMode(true)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    guidedMode ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white-keep shadow-md shadow-emerald-500/10" : "text-zinc-750 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white"
                  }`}
                >
                  Guided 🌱
                </button>
                <button
                  type="button"
                  onClick={() => void setGuidedMode(false)}
                  className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                    !guidedMode ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white-keep shadow-md shadow-violet-500/10" : "text-zinc-750 dark:text-zinc-400 hover:text-zinc-955 dark:hover:text-white"
                  }`}
                >
                  Expert ⚡
                </button>
              </div>

              {/* Select Year Dropdown */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 select-year-label font-sans">Year:</span>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-24 h-9 py-1 bg-input border-input-border text-foreground text-xs font-bold rounded-xl focus:border-emerald-500/50 cursor-pointer"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </Select>
              </div>

              {/* Export PDF Button */}
              {!guidedMode && (
                <Button
                  size="sm"
                  variant="primary"
                  className="h-9 bg-emerald-500 text-zinc-955 hover:bg-emerald-400 font-bold text-xs px-3 rounded-xl shadow cursor-pointer"
                  onClick={() => window.print()}
                >
                  Export PDF
                </Button>
              )}
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
                <div className="text-center flex items-baseline justify-center">
                  <span className="text-lg font-black text-zinc-955 dark:text-white leading-none">{recoveryScore}</span>
                  <span className="text-xs font-bold text-zinc-750 dark:text-zinc-400 leading-none ml-0.5">%</span>
                </div>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-750 dark:text-zinc-400">
                  {guidedMode ? "Rest & Recovery Score" : "Recovery Score"}
                </span>
                <p className="text-sm font-bold text-zinc-955 dark:text-white leading-tight">
                  {guidedMode ? (recoveryScore >= 80 ? "Feeling Great!" : recoveryScore >= 50 ? "Ready to train" : "Needs Rest") : insight.label}
                </p>
                <button 
                  onClick={() => setShowQuickLog(!showQuickLog)}
                  className="mt-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 transition-colors flex items-center gap-1"
                >
                  <TimerReset size={14} />
                  Record Daily Rest/Sleep
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── QUICK ACTIONS ZONE ─── */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Button
          variant="secondary"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            if (activeWorkout) {
              setActiveTab("workout");
              setActiveSubScreen("active-workout");
            } else if (todayRoutine) {
              handleLaunchWorkoutClick(todayRoutine);
            } else {
              setActiveTab("workout");
            }
          }}
          className="h-16 flex flex-col justify-center items-center gap-1 bg-emerald-500/10 dark:bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 rounded-2xl p-2 select-none"
        >
          <span className="text-lg">🏋️</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Start Workout</span>
        </Button>
        
        <Button
          variant="secondary"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setActiveTab("nutrition");
          }}
          className="h-16 flex flex-col justify-center items-center gap-1 bg-amber-500/10 dark:bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl p-2 select-none"
        >
          <span className="text-lg">🥗</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Log Meal</span>
        </Button>

        <Button
          variant="secondary"
          onClick={async () => {
            if (navigator.vibrate) navigator.vibrate(8);
            const addWaterLog = useAtlasStore.getState().addWaterLog;
            const entryId = createId("wat");
            await addWaterLog({
              id: entryId,
              timestamp: new Date().toISOString(),
              amount: 250,
            });
            alert("Success: Logged 250 ml (1 cup) of water!");
          }}
          className="h-16 flex flex-col justify-center items-center gap-1 bg-sky-500/10 dark:bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/20 text-sky-700 dark:text-sky-400 rounded-2xl p-2 select-none"
        >
          <span className="text-lg">🥤</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider">+1 Cup Water</span>
        </Button>

        <Button
          variant="secondary"
          onClick={() => {
            if (navigator.vibrate) navigator.vibrate(8);
            setShowQuickLog(!showQuickLog);
          }}
          className="h-16 flex flex-col justify-center items-center gap-1 bg-violet-500/10 dark:bg-violet-500/5 border-violet-500/20 hover:bg-violet-500/20 text-violet-700 dark:text-violet-400 rounded-2xl p-2 select-none"
        >
          <span className="text-lg">😴</span>
          <span className="text-[10px] font-extrabold uppercase tracking-wider">Log Sleep &amp; Mood 😴</span>
        </Button>
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
              <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-mono">
                {guidedMode ? "Keep your progress safe" : "Security & Sync Upgrade"}
              </p>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-zinc-955 dark:text-white">
              {guidedMode ? "💾 Back up your workouts" : "Upgrade to Secure Cloud Backup"}
            </h3>
            <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed max-w-2xl">
              {guidedMode
                ? "Link an email address to back up your workouts and access them from any device. It's free and takes 30 seconds."
                : "Establish a verified cloud-backup email identity. This secures your workouts and syncs your profile securely across all your devices."}
            </p>
          </div>
          <Button
            onClick={() => setShowMigrationModal(true)}
            className="sm:shrink-0 font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm h-9 text-xs px-4 rounded-xl relative z-10 flex items-center justify-center gap-1.5 self-start sm:self-center"
          >
            <Sparkles size={14} />
            {guidedMode ? "Back up now" : "Secure Profile Now"}
          </Button>
        </motion.div>
      )}

      {/* Quick-Log Recovery Card, shown in the main dashboard flow */}
      <AnimatePresence>
        {showQuickLog && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            {guidedMode ? (
              <div className="pb-4">
                <RecoveryCheckinSimple onSaved={() => setShowQuickLog(false)} />
              </div>
            ) : (
              <Card className="p-5 border border-emerald-500/25 dark:border-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/10 space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-emerald-200/60 dark:border-white/5 pb-2">
                <div className="flex items-center gap-2">
                  <Heart size={16} className="text-emerald-600 dark:text-emerald-400 animate-pulse" />
                  <h3 className="font-bold text-zinc-900 dark:text-white text-sm">Daily Rest &amp; Recovery Log</h3>
                </div>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white" onClick={() => setShowQuickLog(false)}>
                  <X size={16} />
                </Button>
              </div>

              {/* Sliders Grid */}
              <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
                {/* Sleep Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Sleep Duration</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">{logSleep} hrs</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="12"
                    step="0.5"
                    value={logSleep}
                    onChange={(e) => setLogSleep(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-emerald-200 dark:bg-zinc-700"
                  />
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500">Aim for 7.5 to 9 hours of sleep per night.</p>
                </div>

                {/* Soreness Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Muscle Soreness</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">{logSoreness}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logSoreness}
                    onChange={(e) => setLogSoreness(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-emerald-200 dark:bg-zinc-700"
                  />
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500">1 = feeling great, 10 = very sore muscles</p>
                </div>

                {/* Stress Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Daily Stress Level</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">{logStress}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logStress}
                    onChange={(e) => setLogStress(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-emerald-200 dark:bg-zinc-700"
                  />
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500">1 = very relaxed, 10 = extremely stressed</p>
                </div>

                {/* Energy Level Input */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">Energy Level</span>
                    <span className="text-emerald-700 dark:text-emerald-300 font-bold tabular-nums">{logEnergy}/10</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={logEnergy}
                    onChange={(e) => setLogEnergy(Number(e.target.value))}
                    className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-emerald-500 bg-emerald-200 dark:bg-zinc-700"
                  />
                  <p className="text-[10px] text-zinc-500 dark:text-zinc-500">1 = exhausted, 10 = fully energized</p>
                </div>
              </div>

              {/* Footer */}
              <div className="flex gap-2 justify-end pt-2 border-t border-emerald-200/60 dark:border-white/5">
                <Button variant="secondary" size="sm" onClick={() => setShowQuickLog(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleQuickLogSubmit} className="bg-emerald-600 hover:bg-emerald-500 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-white font-bold">
                  Save how I'm feeling ✓
                </Button>
              </div>
            </Card>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {coachBusy && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="relative overflow-hidden rounded-2xl border border-violet-500/30 dark:border-violet-500/30 bg-gradient-to-br from-violet-50 to-violet-100/80 dark:from-violet-950/60 dark:via-fuchsia-950/40 dark:to-zinc-950/80 shadow-[0_0_40px_rgba(139,92,246,0.08)] dark:shadow-[0_0_40px_rgba(139,92,246,0.15)] p-5"
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
              <p className="text-sm font-bold text-zinc-900 dark:text-white leading-snug">
                Something amazing is being crafted for you.
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Your AI Coach is designing a clinical-grade, personalised training program based on your biometrics and goals. This usually takes 15–30 seconds — grab a sip of water! 💧
              </p>

              {/* Shimmer progress bar */}
              <div className="h-1.5 w-full rounded-full bg-violet-200 dark:bg-violet-950/60 border border-violet-300/40 dark:border-violet-500/20 overflow-hidden mt-1">
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
            <h2 className="text-base font-bold text-zinc-955 dark:text-white tracking-tight">Getting Started Guide</h2>
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
                  <h3 className={`text-xs font-bold uppercase tracking-wider ${isStep1Done ? "text-zinc-555 dark:text-zinc-500 line-through" : "text-zinc-955 dark:text-white"}`}>
                    Activate a Workout Plan
                  </h3>
                  {isStep1Done && <span className="text-xs font-extrabold uppercase font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>}
                </div>
                {!isStep1Done && (
                  <>
                    <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed">
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
                <h3 className="text-xs font-bold text-zinc-955 dark:text-zinc-300 uppercase tracking-wider">Start Your First Session</h3>
                <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed">
                  Go to the <span className="text-emerald-600 dark:text-emerald-400 font-semibold cursor-pointer hover:underline" onClick={() => setActiveTab("workout")}>Plans</span> tab, select today's routine, and tap <span className="text-zinc-955 dark:text-white font-bold">Start Training Session</span> to log sets.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex gap-3 border-t border-zinc-100 dark:border-white/5 pt-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface border border-surface-border text-foreground text-xs font-bold font-mono">
                3
              </div>
              <div className="space-y-1">
                <h3 className="text-xs font-bold text-zinc-955 dark:text-zinc-300 uppercase tracking-wider">Track Strength Progress</h3>
                <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed">
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
          <p className="text-zinc-750 dark:text-zinc-300 leading-normal">{insight.text}</p>
        </div>
      )}

      {/* ─── TODAY'S TARGET HERO SECTION ─── */}
      <section className="relative overflow-hidden">
        {workoutPlans.length === 0 ? (
          <div className="space-y-4">
            {guidedMode && (
              <BeginnerTipCard
                emoji="🌱"
                headline="Welcome to your new fitness helper!"
                body="Getting started is easy. Let's load our friendly 3-Day workout plan template, or ask the AI Coach to design one based on your goals."
                cta="Let's Set Up a Plan! 🏋️"
                onCta={() => setShowCreatePlanModal(true)}
              />
            )}
            <Card className="p-6 border-dashed border-2 border-card-border bg-surface/10 dark:bg-white/[0.01]">
              <div className="text-center space-y-4">
                <ClipboardList className="mx-auto h-12 w-12 text-emerald-500 dark:text-emerald-400" />
                <div>
                  <h2 className="text-xl font-bold text-zinc-955 dark:text-white">No Active Plan Established</h2>
                  <p className="text-xs text-zinc-750 dark:text-zinc-400 max-w-sm mx-auto mt-1 leading-relaxed">
                    To begin logging metrics, progressive overload cycles, and streaks, create a customized program or let our AI coach build one.
                  </p>
                </div>
                <Button variant="primary" onClick={() => setActiveTab("workout")} className="mx-auto flex items-center gap-1.5 font-bold">
                  <Plus size={16} />
                  Initialize Training Plan
                </Button>
              </div>
            </Card>
          </div>
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
                  <span className="text-[10px] text-zinc-555 dark:text-zinc-500 font-bold font-mono uppercase">{todayRoutine.day}</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-955 dark:text-white leading-tight tracking-tight">Today's Training &amp; Nutrition Target</h2>
                <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed max-w-2xl">
                  Complete today's workout to build strength, and eat high-quality meals to fuel muscle recovery.
                </p>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-border">
                {/* Column 1: Workout */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-mono">Workout Plan</span>
                    <h3 className="text-sm sm:text-base font-black text-zinc-955 dark:text-white">{todayRoutine.name}</h3>
                    <p className="text-xs text-zinc-750 dark:text-zinc-400">
                      Focus: <strong className="text-zinc-955 dark:text-white font-bold">{todayRoutine.focus}</strong>
                    </p>
                    <div className="text-[10px] text-zinc-555 dark:text-zinc-500 font-bold font-mono uppercase pt-0.5">
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-450 font-mono">Daily Nutrition</span>
                    <h3 className="text-sm sm:text-base font-black text-zinc-955 dark:text-white">Nutrition &amp; Calories</h3>
                    <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed">
                      Target <strong className="text-zinc-955 dark:text-white font-bold font-mono">{nutritionTargets.calories} kcal</strong> and <strong className="text-zinc-955 dark:text-white font-bold font-mono">{nutritionTargets.protein}g protein</strong> today.
                    </p>
                    <div className="text-[10px] text-zinc-555 dark:text-zinc-500 font-bold font-mono uppercase pt-0.5">
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
                  <span className="text-[10px] text-zinc-555 dark:text-zinc-500 font-bold font-mono uppercase">{todayDayName} - Rest Day</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-zinc-955 dark:text-white leading-tight tracking-tight">Rest, Recharge &amp; Recovery</h2>
                <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed max-w-2xl">
                  Let your body recover from training, recharge your energy, and hit nutrition goals to stay on track.
                </p>
              </div>

              {/* Two-column grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-surface-border">
                {/* Column 1: Active Recovery */}
                <div className="flex flex-col justify-between gap-4">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400 font-mono">Recharge &amp; Rest</span>
                    <h3 className="text-sm sm:text-base font-black text-zinc-955 dark:text-white">Active Recovery</h3>
                    <p className="text-xs text-zinc-750 dark:text-zinc-400">
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-450 font-mono">Daily Nutrition</span>
                    <h3 className="text-sm sm:text-base font-black text-zinc-955 dark:text-white">Nutrition &amp; Energy</h3>
                    <p className="text-xs text-zinc-750 dark:text-zinc-400 leading-relaxed">
                      Aim for <strong className="text-zinc-955 dark:text-white font-bold font-mono">{nutritionTargets.calories} kcal</strong> and <strong className="text-zinc-955 dark:text-white font-bold font-mono">{nutritionTargets.protein}g protein</strong> to support recovery.
                    </p>
                    <div className="text-[10px] text-zinc-555 dark:text-zinc-500 font-bold font-mono uppercase pt-0.5">
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
          <h3 className="text-sm font-bold text-zinc-955 dark:text-white flex items-center gap-2">
            <ClipboardList className="text-emerald-600 dark:text-emerald-450" size={16} />
            How to Train with Atlas
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">1. Select a Plan</span>
              <p className="text-zinc-750 dark:text-zinc-400 leading-relaxed">
                {activeWorkoutPlanId 
                  ? "✓ Active plan selected. You can view or edit it anytime in the 'Plans' tab."
                  : "Go to 'Plans' or use the checklist above to activate a training plan."}
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">2. Launch Session</span>
              <p className="text-zinc-750 dark:text-zinc-400 leading-relaxed">
                Tap the green <strong>Launch Workout Session</strong> button on today's target card above to start tracking.
              </p>
            </div>
            <div className="space-y-1">
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">3. Log Sets & Save</span>
              <p className="text-zinc-750 dark:text-zinc-400 leading-relaxed">
                Enter weight and reps for completed sets during your workout, then tap <strong>Finish Workout</strong> to save.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* ─── PHYSIOLOGICAL METRICS GRID with Expandable Coach Insights ─── */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Streak */}
        <div className="flex flex-col">
          <MetricCard
            label="Daily Streak"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-700 dark:text-zinc-300 leading-normal"
              >
                {guidedMode 
                  ? "Streak is the number of consecutive days you have completed a scheduled workout. Consistent training helps you build healthy habits and stay strong!"
                  : "Streak is the count of consecutive plan-routine execution days. Keep consistent pacing to build myofibrillar habit patterns!"}
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-700 dark:text-zinc-300 leading-normal"
              >
                {guidedMode
                  ? "Consistency measures how well you stick to your target workouts (e.g. 3 workouts per week). Logging regularly is the key to achieving long-term fitness results!"
                  : "Evaluates the completed workouts against your target profile. Standard 30-day baseline is critical for athletic progress."}
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-700 dark:text-zinc-300 leading-normal"
              >
                {guidedMode
                  ? "Weekly Volume is the total weight you lifted this week (sets multiplied by reps and weight). Lifting more weight over time helps you build muscle and strength."
                  : "Total load lifted across all exercises this week (sets * reps * weight). Progressive load volume triggers mechanical tension."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Fatigue */}
        <div className="flex flex-col">
          <MetricCard
            label="Muscle Fatigue"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-700 dark:text-zinc-300 leading-normal"
              >
                {guidedMode
                  ? "Muscle Fatigue is estimated from your logged sleep, stress, and soreness. The coach uses this to adjust your workout weights so you stay safe and avoid injuries!"
                  : "Nervous system strain mapped from sleep, stress, and soreness variables. AI adjusts load intensities in active routines dynamically."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sleep */}
        <div className="flex flex-col col-span-2 md:col-span-1">
          <MetricCard
            label="Sleep Duration"
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
                className="mt-1 p-2.5 rounded-lg bg-surface border border-surface-border text-xs text-zinc-700 dark:text-zinc-300 leading-normal"
              >
                {guidedMode
                  ? "Your last logged sleep duration. Getting 7.5 to 9 hours of sleep per night is essential for your body to repair muscles and restore energy."
                  : "Your latest logged sleep. 7.5-9 hours is the critical physiological zone for protein synthesis and tissue restoration."}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ─── WEEKLY CONSISTENCY STREAKS GRID ─── */}
      <Card className="p-4 border border-card-border bg-card shadow-sm">
        <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-white/5 pb-2.5">
          <Calendar size={16} className="text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Your Activity Calendar</h2>
        </div>
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">
          Your active days of completed training and nutrition tracking. Log daily to build habits!
        </p>

        <div className="mt-4 flex flex-col md:flex-row items-center md:items-start justify-between gap-5">
          {/* Grid */}
          <div className="flex flex-col gap-1.5 select-none w-full max-w-[340px] shrink-0">
            {/* Day of Week Labels */}
            <div className="grid grid-cols-[36px_1fr] gap-2 items-center">
              <div /> {/* Spacer for row labels */}
              <div className="grid grid-cols-7 gap-1.5 text-center">
                {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label, idx) => (
                  <div key={idx} className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">
                    {label}
                  </div>
                ))}
              </div>
            </div>

            {/* Rows (4 weeks) */}
            {[0, 1, 2, 3].map((weekIdx) => {
              const weekDays = consistencyDays.slice(weekIdx * 7, (weekIdx + 1) * 7);
              const isCurrentWeek = weekIdx === 3;
              return (
                <div key={weekIdx} className="grid grid-cols-[36px_1fr] gap-2 items-center">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase font-mono">
                    {isCurrentWeek ? "This" : `W-${3 - weekIdx}`}
                  </span>
                  <div className="grid grid-cols-7 gap-1.5">
                    {weekDays.map((day) => {
                      let cellBgClass = "bg-zinc-150 dark:bg-zinc-800/40 border border-zinc-200/50 dark:border-zinc-800/60";
                      let titleText = `${day.dateStr}: Rest Day / No entries`;

                      if (day.isFuture) {
                        cellBgClass = "bg-zinc-100/50 dark:bg-zinc-900/20 border border-dashed border-zinc-200/30 dark:border-zinc-800/30 opacity-40";
                        titleText = `${day.dateStr}: Future day`;
                      } else if (day.hasWorkout && day.hasNutrition) {
                        cellBgClass = "bg-gradient-to-br from-emerald-450 to-teal-500 border border-emerald-500 text-white shadow-sm shadow-emerald-500/10";
                        titleText = `${day.dateStr}: Workout + Nutrition logged (Full consistency!)`;
                      } else if (day.hasWorkout) {
                        cellBgClass = "bg-teal-500/90 dark:bg-teal-500/70 border border-teal-500/80 text-white shadow-sm shadow-teal-500/10";
                        titleText = `${day.dateStr}: Workout logged`;
                      } else if (day.hasNutrition) {
                        cellBgClass = "bg-amber-500/90 dark:bg-amber-500/70 border border-amber-500/80 text-white shadow-sm shadow-amber-500/10";
                        titleText = `${day.dateStr}: Nutrition logged`;
                      }

                      return (
                        <div
                          key={day.dateStr}
                          className={`aspect-square w-full rounded-[6px] relative flex items-center justify-center transition-all duration-150 hover:scale-115 active:scale-95 cursor-help ${cellBgClass}`}
                          title={titleText}
                        >
                          {day.isToday && (
                            <span className="absolute -inset-0.5 rounded-[8px] border-2 border-indigo-500 dark:border-indigo-400 animate-pulse pointer-events-none" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend / Stats */}
          <div className="flex flex-col gap-3 justify-center w-full">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-surface-border">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-teal-500/90 border border-teal-500" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Workout Logged</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-surface-border">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-amber-500/90 border border-amber-500" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Nutrition Logged</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-xl bg-surface border border-surface-border col-span-2">
                <div className="w-3.5 h-3.5 rounded-[4px] bg-gradient-to-br from-emerald-450 to-teal-500 border border-emerald-500" />
                <span className="text-zinc-700 dark:text-zinc-300 font-medium">Full Lockstep (Workout + Diet)</span>
              </div>
            </div>

            {/* Minimal metrics text */}
            <div className="p-2.5 rounded-xl bg-surface border border-surface-border text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
              <div className="flex justify-between items-center mb-1">
                <span>Workouts completed (28d):</span>
                <strong className="text-zinc-850 dark:text-white font-bold font-mono">
                  {consistencyDays.filter(d => d.hasWorkout && !d.isFuture).length} days
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span>Diet tracked (28d):</span>
                <strong className="text-zinc-850 dark:text-white font-bold font-mono">
                  {consistencyDays.filter(d => d.hasNutrition && !d.isFuture).length} days
                </strong>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── DYNAMIC BIOMETRICS hub ─── */}
      <Card className="p-4 border border-card-border bg-card shadow">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <User size={16} className="text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">My Height &amp; Weight</h2>
          </div>
          <Button variant="ghost" size="icon" aria-label="Edit biometrics" className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-white" onClick={() => setActiveTab("settings")}>
            <Pencil size={14} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
            <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase">Age</span>
            <p className="font-bold text-zinc-955 dark:text-white text-sm">{profile?.age ?? "N/A"} <span className="text-xs font-normal text-zinc-500">yrs</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
            <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase">Weight</span>
            <p className="font-bold text-zinc-955 dark:text-white text-sm">{profile?.weight ?? "N/A"} <span className="text-xs font-normal text-zinc-500">{profile?.weightUnit}</span></p>
          </div>
          <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
            <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase">Height</span>
            <p className="font-bold text-zinc-955 dark:text-white text-sm">
              {profile?.height
                ? profile.heightUnit === "in"
                  ? `${Math.floor(profile.height / 12)}'${Math.round(profile.height % 12)}"`
                  : `${profile.height} cm`
                : "N/A"}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
            <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase">My Goal</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-450 text-xs truncate" title={profile?.targetPhysique ?? "N/A"}>
              {profile?.targetPhysique ?? "N/A"}
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-surface border border-surface-border space-y-0.5">
            <span className="text-xs text-zinc-555 dark:text-zinc-400 font-bold uppercase">Protein Goal</span>
            <p className="font-bold text-emerald-600 dark:text-emerald-450 text-sm">
              {nutritionTargets.protein ? `${nutritionTargets.protein} g/day` : "N/A"}
            </p>
          </div>
        </div>
      </Card>

      {/* ─── PRINT-ONLY CLINICAL HEADER & CUSTOM STYLES ─── */}
      <div className="hidden print:flex items-center justify-between border-b-2 border-zinc-955 dark:border-zinc-950 pb-3 mb-6">
        <div>
          <h1 className="text-xl font-bold uppercase tracking-tight text-zinc-955 dark:text-zinc-900">ATLAS AI CLINICAL REPORT</h1>
          <p className="text-xs text-zinc-500 font-bold font-sans">Telemetry Data &amp; Biological Analytics • Generated: {format(new Date(), "PPP")}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-extrabold text-zinc-955 dark:text-zinc-900">{profile?.name || "Client Summary"}</p>
          <p className="text-xs text-zinc-500 font-bold font-sans">Goal: {profile?.goal || "General Health"}</p>
        </div>
      </div>

      <style>{`
        @media print {
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            font-size: 11pt !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          nav, footer, header, button, select, 
          .no-print, [role="navigation"], [role="tablist"],
          .bg-header, .fixed, .absolute, .sticky,
          button[aria-label], select, input {
            display: none !important;
          }
          .space-y-4 {
            margin: 0 !important;
            padding: 0 !important;
            display: block !important;
          }
          .border-zinc-800, .border-card-border, .border-white\\/5, .border-surface-border {
            border: 1px solid #e4e4e7 !important;
            background: #ffffff !important;
            box-shadow: none !important;
          }
          .bg-card, .bg-surface, .bg-surface\\/60, .bg-zinc-900, .bg-zinc-955, .bg-zinc-900\\/50, .bg-zinc-900\\/10 {
            background-color: #f4f4f5 !important;
            background: #f4f4f5 !important;
            color: #18181b !important;
          }
          h1, h2, h3, h4, h5, h6, p, span, div {
            color: #09090b !important;
          }
          .text-zinc-400, .text-zinc-500, .text-zinc-600 {
            color: #71717a !important;
          }
          .text-emerald-400, .text-emerald-500, .text-emerald-300 {
            color: #047857 !important;
            font-weight: bold !important;
          }
          .text-violet-400, .text-violet-500 {
            color: #6d28d9 !important;
            font-weight: bold !important;
          }
          .text-amber-400, .text-amber-300, .text-amber-600 {
            color: #b45309 !important;
            font-weight: bold !important;
          }
          .text-rose-455, .text-rose-400, .text-rose-500 {
            color: #be123c !important;
            font-weight: bold !important;
          }
          .recharts-responsive-container {
            width: 100% !important;
            height: 250px !important;
          }
          .page-break-before {
            page-break-before: always !important;
          }
          .aspect-square {
            border: 1px solid #e4e4e7 !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* ─── UNIFIED PORTAL STATS BAR ─── */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-3 no-print">
        <div className="p-3 bg-surface border border-surface-border rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <Dumbbell size={16} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Completed Sessions</p>
            <p className="text-lg font-bold text-foreground leading-none mt-1">{totalWorkoutsInYear}</p>
          </div>
        </div>
        <div className="p-3 bg-surface border border-surface-border rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Clock3 size={16} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Duration Logged</p>
            <p className="text-lg font-bold text-foreground leading-none mt-1">{totalWorkoutDurationInYear} <span className="text-xs font-semibold text-zinc-500">min</span></p>
          </div>
        </div>
        <div className="p-3 bg-surface border border-surface-border rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Moon size={16} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">
              {guidedMode ? "Average Sleep" : "Avg Sleep Efficiency"}
            </p>
            <p className="text-lg font-bold text-foreground leading-none mt-1">{averageSleepHours} <span className="text-xs font-semibold text-zinc-500">hours</span></p>
          </div>
        </div>
        <div className="p-3 bg-surface border border-surface-border rounded-2xl flex items-center gap-2.5 select-none shadow">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
            <Weight size={16} />
          </div>
          <div>
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Latest Bodyweight</p>
            <p className="text-lg font-bold text-foreground leading-none mt-1">{latestBodyweight} <span className="text-xs font-semibold text-zinc-500">lbs</span></p>
          </div>
        </div>
      </section>

      {/* ─── UNIFIED CHARTS DECK CONSOLE ─── */}
      <Card className="p-4 shadow-xl relative overflow-hidden page-break-before">
        <button
          type="button"
          onClick={() => setShowCharts(!showCharts)}
          className="w-full flex items-center justify-between border-b border-white/5 pb-3 select-none text-left no-print"
        >
          <div className="flex items-center gap-2">
            <LineChartIcon className="text-violet-400 animate-pulse" size={18} />
            <h3 className="text-base font-bold text-foreground">Training Analytics &amp; Charts</h3>
          </div>
          <span className="text-xs text-zinc-500 font-bold">{showCharts ? "Hide Charts" : "Show Charts"}</span>
        </button>

        <div className={`print:block ${showCharts ? "block" : "hidden"}`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 py-3 no-print">
            <p className="text-xs text-zinc-400 font-medium">Select a category to view training progression trendlines:</p>
            
            {/* Segmented Controller */}
            <div className="flex flex-nowrap bg-input border border-input-border p-0.5 rounded-xl overflow-x-auto w-full sm:w-auto shrink-0 select-none">
              {[
                { id: "strength", label: "Strength" },
                { id: "cardio", label: "Cardio" },
                { id: "recovery", label: "Recovery" },
                { id: "mass", label: guidedMode ? "Weight & Volume" : "Mass & Vol" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setChartTab(tab.id as any)}
                  className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-lg transition-all shrink-0 whitespace-nowrap ${
                    chartTab === tab.id
                      ? "bg-white dark:bg-white/10 text-zinc-950 dark:text-white font-bold shadow-sm"
                      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
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
                  <p className="text-xs text-zinc-400 font-medium font-sans">
                    {guidedMode ? "How much weight you're lifting over time — bigger numbers mean you're getting stronger!" : "Estimated 1-Repetition Maximum (1RM) progression in weight loads."}
                  </p>
                  <Select 
                    value={selectedExercise} 
                    onChange={(e) => setSelectedExercise(e.target.value)}
                    className="w-full sm:w-64 h-10 py-1.5 bg-input border-input-border text-foreground text-xs font-bold font-sans rounded-xl focus:border-emerald-500/50 cursor-pointer"
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
                        <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)", borderRadius: "12px", color: "var(--foreground)" }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "#888" }} />
                        <Line dataKey="estimated1rm" stroke="#6ee7b7" strokeWidth={3} dot={{ r: 4, stroke: "#10b981", strokeWidth: 1.5, fill: "#fff" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-555 dark:text-zinc-500 text-xs select-none gap-2 p-6 text-center max-w-sm mx-auto">
                      <Info size={20} className="text-emerald-450 dark:text-emerald-400 shrink-0" />
                      <span>
                        {guidedMode
                          ? "Log some workouts first to see your strength chart here! Complete a few sets with weights to see your progress over time. 💪"
                          : "Insufficient load point records available. Log completed strength training sets containing weight load, reps, and RIR inside your active workouts to map your estimated 1-Repetition Maximum (1RM) progressive overload curves."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* cardio tab */}
            {chartTab === "cardio" && (
              <div className="space-y-4">
                <p className="text-xs text-zinc-400 font-medium font-sans">Aerobic active recovery duration, incline pacing, and calorie expenditure rates.</p>
                <div className="h-56">
                  {cardioSeries.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                      <BarChart data={cardioSeries}>
                        <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                        <YAxis stroke="#71717a" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)", borderRadius: "12px", color: "var(--foreground)" }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "#888" }} />
                        <Bar dataKey="minutes" name="Cardio Mins" fill="#818cf8" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="calories" name="Calories (kcal)" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-555 dark:text-zinc-500 text-xs select-none gap-2 p-6 text-center max-w-sm mx-auto">
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
                <p className="text-xs text-zinc-400 font-medium font-sans">Fluctuations in daily readiness, soreness thresholds, energy levels, and stress indices.</p>
                <div className="h-56">
                  {recoveryTrendSeries.length > 1 ? (
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                      <LineChart data={recoveryTrendSeries}>
                        <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                        <XAxis dataKey="date" stroke="#71717a" fontSize={10} />
                        <YAxis stroke="#71717a" fontSize={10} domain={[0, 10]} />
                        <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)", borderRadius: "12px", color: "var(--foreground)" }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "#888" }} />
                        <Line type="monotone" dataKey="energy" stroke="#facc15" strokeWidth={2} name="Energy" dot={false} />
                        <Line type="monotone" dataKey="soreness" stroke="#ef4444" strokeWidth={2} name="Soreness" dot={false} />
                        <Line type="monotone" dataKey="stress" stroke="#c084fc" strokeWidth={2} name="Stress" dot={false} />
                        <Line type="monotone" dataKey="readiness" stroke="#34d399" strokeWidth={2} name="Readiness" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-zinc-555 dark:text-zinc-500 text-xs select-none gap-2 p-6 text-center max-w-sm mx-auto">
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
                <p className="text-xs text-zinc-400 font-medium font-sans select-none">Comparison overlay between weekly strength training volume load and bodyweight mass.</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Bodyweight Mass Panel */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 select-none">Bodyweight Mass (Trend)</h4>
                    <div className="h-56">
                      {bodyweightSeries.length > 1 ? (
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
                            <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)", borderRadius: "12px", color: "var(--foreground)" }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "#888" }} />
                            <Area dataKey="weight" stroke="#c084fc" fill="url(#bodyweightGrad)" strokeWidth={2} name="Weight (lbs)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full border border-dashed border-surface-border rounded-xl text-zinc-555 dark:text-zinc-500 text-xs p-4 text-center select-none gap-2">
                          <Info size={18} className="text-zinc-500 shrink-0" />
                          <span>Record at least 2 bodyweight entries in the logs shelf below to view mass history.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weekly Training Volume Panel */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-555 dark:text-zinc-400 select-none">Weekly Training Volume (lbs)</h4>
                    <div className="h-56">
                      {yearVolumeSeries.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={150}>
                          <BarChart data={yearVolumeSeries}>
                            <CartesianGrid stroke="rgba(255,255,255,0.02)" strokeDasharray="3 3" />
                            <XAxis dataKey="week" stroke="#71717a" fontSize={10} />
                            <YAxis stroke="#71717a" fontSize={10} />
                            <Tooltip contentStyle={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)", borderRadius: "12px", color: "var(--foreground)" }} itemStyle={{ color: "var(--foreground)" }} labelStyle={{ color: "#888" }} />
                            <Bar dataKey="volume" fill="#10b981" radius={[4, 4, 0, 0]} name="Volume" />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full border border-dashed border-surface-border rounded-xl text-zinc-555 dark:text-zinc-500 text-xs p-4 text-center select-none gap-2">
                          <Info size={18} className="text-zinc-500 shrink-0" />
                          <span>Complete workouts with weight training sets to populate weekly volume analytics.</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* ─── INTERACTIVE ACTIVE RECOVERY HEATMAP ─── */}
      <Card className="p-4 shadow-xl relative overflow-hidden">
        <div className="mb-2 flex items-center justify-between border-b border-white/5 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="text-emerald-400" size={16} />
            <h3 className="text-sm font-bold text-zinc-955 dark:text-white">Active Recovery Heatmap</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-extrabold uppercase font-sans tracking-wider text-zinc-500">
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-emerald-500/80" /> Trained</span>
            <span>•</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-violet-600/60" /> Recovery</span>
          </div>
        </div>
        
        <p className="text-xs text-zinc-555 dark:text-zinc-400 mt-1 mb-3 font-sans">28-day training heatmap. Click any cell to log daily recovery or body weight metrics directly.</p>

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
                    ? "bg-emerald-500/80 border-emerald-400/35 text-zinc-955 dark:text-zinc-950 shadow"
                    : isRecovered
                    ? "bg-violet-600/60 border-violet-500/35 text-white-keep shadow"
                    : "bg-surface border-surface-border text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/10"
                }`}
              >
                <span className="text-xs font-sans tabular-nums leading-none tracking-tight font-bold">{day.label.slice(3)}</span>
                {isTrained && <Dumbbell size={11} className="self-end" />}
                {!isTrained && isRecovered && <Moon size={11} className="self-end" />}
              </button>
            );
          })}
        </div>
      </Card>

      {/* ─── HISTORICAL SEARCH & GROUPED LOGS DRAWER ─── */}
      <Card className="p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="text-zinc-400" size={16} />
            <h3 className="text-sm font-bold text-zinc-955 dark:text-white">Historical Training Logs</h3>
          </div>
          
          <div className="flex items-center gap-2 shrink-0 select-none">
            {["day", "week", "month"].map((view) => (
              <Button
                key={view}
                size="sm"
                variant={selectedHistoryView === view ? "primary" : "secondary"}
                onClick={() => setSelectedHistoryView(view as HistoryView)}
                className="h-7 text-xs uppercase font-bold animate-fadeIn"
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
            className="pl-9 text-xs h-8 bg-input border-input-border text-foreground w-full rounded-xl focus:border-violet-500/50"
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
                className="border border-surface-border rounded-2xl bg-surface/20 overflow-hidden animate-fadeIn"
              >
                {/* Folder Header */}
                <button
                  type="button"
                  onClick={() => setExpandedFolders(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="w-full p-4 flex items-center justify-between gap-4 text-left hover:bg-zinc-150/40 dark:hover:bg-white/[0.01] transition-all select-none"
                >
                  <div className="min-w-0 flex-1">
                    <h4 className="text-sm font-bold text-zinc-955 dark:text-white truncate capitalize leading-snug">{displayDate}</h4>
                    <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs font-bold font-sans text-zinc-500">
                      {totalWorkouts > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-emerald-500/5 border border-emerald-500/10 text-emerald-400">
                          {totalWorkouts} {totalWorkouts === 1 ? "workout" : "workouts"}
                        </span>
                      )}
                      {totalVolume > 0 && (
                        <span className="px-1.5 py-0.5 rounded bg-sky-500/5 border border-sky-500/10 text-sky-400 font-sans">
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

                {isFolderExpanded && (
                  <div className="p-4 border-t border-surface-border bg-surface/30 space-y-4 transition-all">
                    
                    {/* Recovery summary inside the folder */}
                    <div className="p-3 bg-card border border-card-border rounded-xl animate-fadeIn">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider font-sans">CNS &amp; Body Metrics</span>
                        <div className="flex gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-6 px-2 text-xs font-semibold text-zinc-600 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200/50 dark:border-transparent"
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
                            className="h-6 px-2 text-xs font-semibold text-zinc-600 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-white bg-zinc-100 dark:bg-white/5 rounded-lg border border-zinc-200/50 dark:border-transparent"
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
                        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2 pt-2 border-t border-white/5 text-xs text-zinc-400">
                          {currentDayRecoveryLog?.sleepHours && (
                            <div>
                              <span className="block text-xs text-zinc-600 font-bold uppercase tracking-wider font-sans">Sleep</span>
                              <span className="font-extrabold text-blue-400 font-sans tabular-nums">{currentDayRecoveryLog.sleepHours}h</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.energy && (
                            <div>
                              <span className="block text-xs text-zinc-600 font-bold uppercase tracking-wider font-sans">Energy</span>
                              <span className="font-extrabold text-yellow-400 font-sans tabular-nums">{currentDayRecoveryLog.energy}/10</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.soreness && (
                            <div>
                              <span className="block text-xs text-zinc-600 font-bold uppercase tracking-wider font-sans">Soreness</span>
                              <span className="font-extrabold text-red-400 font-sans tabular-nums">{currentDayRecoveryLog.soreness}/10</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.readiness && (
                            <div>
                              <span className="block text-xs text-zinc-600 font-bold uppercase tracking-wider font-sans">Readiness</span>
                              <span className="font-extrabold text-emerald-400 font-sans tabular-nums">{currentDayRecoveryLog.readiness}/10</span>
                            </div>
                          )}
                          {currentDayRecoveryLog?.stress && (
                            <div>
                              <span className="block text-xs text-zinc-600 font-bold uppercase tracking-wider font-sans">Stress</span>
                              <span className="font-extrabold text-purple-400 font-sans tabular-nums">{currentDayRecoveryLog.stress}/10</span>
                            </div>
                          )}
                          {currentDayBodyMetric?.bodyweight && (
                            <div>
                              <span className="block text-xs text-zinc-600 font-bold uppercase tracking-wider font-sans">Mass</span>
                              <span className="font-extrabold text-sky-400 font-sans tabular-nums">{currentDayBodyMetric.bodyweight} lbs</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-500 italic mt-1.5 pl-0.5 font-sans">No biological recovery metrics logged for this date.</p>
                      )}
                    </div>

                    {/* Logged Routines inside the folder */}
                    {hasWorkoutData ? (
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-zinc-555 dark:text-zinc-500 uppercase tracking-wider font-sans">Logged Routines</span>
                        <div className="space-y-3">
                          {workoutsInGroup.map((workout) => {
                            const wDuration = workout.durationMinutes || 0;
                            const wVolume = getVolumeForWorkout(workout);
                            const wSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.filter(s => s.completed).length, 0);

                            return (
                              <div key={workout.id} className="p-3.5 bg-card border border-card-border rounded-xl">
                                <div className="flex justify-between items-start gap-4 pb-2.5 border-b border-surface-border">
                                  <div>
                                    <h5 className="text-foreground text-xs font-bold leading-none">{workout.name}</h5>
                                    <p className="text-xs text-zinc-500 mt-1 flex items-center gap-1 font-semibold font-sans">
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
                                    <span className="text-xs font-bold text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded-full border border-white/5 font-sans">
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
                                      <div key={we.id} className="p-2 bg-white/[0.01] border border-white/5 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                                        <span className="font-bold text-zinc-850 dark:text-zinc-300">{exerciseName}</span>
                                        <div className="flex items-center gap-2">
                                          {completedSets.length > 0 && (
                                            <span className="text-xs text-zinc-400 font-sans tabular-nums">
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
                                          <span className="text-xs font-sans font-bold bg-surface border border-surface-border px-1.5 py-0.5 rounded leading-none text-zinc-500 dark:text-zinc-400 shrink-0 tabular-nums">
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
                      <p className="text-xs text-zinc-555 dark:text-zinc-500 italic mt-1 pl-0.5 font-sans">No logged strength or recovery workouts in this period.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── DYNAMIC PLANS, PERSONAL RECORDS & COACH NOTE (Only shown in Advanced Mode) ─── */}
      {!guidedMode && (
        <>
          {/* ─── DYNAMIC PLANS COLLECTION ─── */}
          <section className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <ClipboardList size={16} className="text-zinc-555 dark:text-zinc-500" />
              <h2 className="text-xs font-bold text-zinc-555 dark:text-zinc-500 uppercase tracking-widest">Workout Programs</h2>
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
                        <h3 className="text-xl font-bold text-zinc-955 dark:text-white">{plan.name}</h3>
                        {isActive && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Active Plan
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs leading-normal text-zinc-750 dark:text-zinc-400 max-w-sm">{plan.goal}</p>
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
                    <div className="flex items-center justify-between text-xs text-zinc-750 dark:text-zinc-400 font-semibold">
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
                <span className="text-xs text-zinc-750 dark:text-zinc-400 font-bold uppercase tracking-wider">Coach is designing new program...</span>
              </Card>
            )}
          </section>

          {/* ─── PERSONAL RECORDS achievements SHELF ─── */}
          <Card className="p-4 border border-card-border bg-card shadow">
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-white/5 pb-2.5">
              <div className="flex items-center gap-2">
                <Medal className="text-amber-400" size={16} />
                <h2 className="text-sm font-bold text-zinc-955 dark:text-white uppercase tracking-wider">Recent Personal Records</h2>
              </div>
            </div>
            <div className="mt-3 grid gap-2.5 sm:grid-cols-2 md:grid-cols-3">
              {recentPrs.length > 0 ? (
                recentPrs.slice(0, 6).map((pr) => (
                  <Surface key={`${pr.exerciseName}-${pr.value}`} className="flex items-center justify-between p-3 rounded-xl border border-surface-border bg-surface">
                    <div>
                      <p className="text-xs font-bold text-zinc-955 dark:text-white truncate max-w-36">{pr.exerciseName}</p>
                      <p className="text-xs text-zinc-555 dark:text-zinc-500">{pr.date}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 text-xs font-bold border border-amber-500/15">
                      {pr.value}
                    </span>
                  </Surface>
                ))
              ) : (
                <div className="col-span-full py-4 text-center text-xs text-zinc-555 dark:text-zinc-500 italic">
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
                  <h3 className="text-sm font-bold text-zinc-955 dark:text-white leading-snug">
                    {isLastMessageError ? "AI Coach Connection Problem" : "Today's Biomechanical Note"}
                  </h3>
                  <div className={`text-xs leading-relaxed max-w-none pt-1.5 ${isLastMessageError ? 'text-red-300/90' : 'text-zinc-750 dark:text-zinc-300'}`}>
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
                            <ReactMarkdown className="prose dark:prose-invert prose-p:leading-relaxed prose-a:text-emerald-600 dark:text-emerald-450 max-w-none text-xs text-zinc-750 dark:text-zinc-400">
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
            <h3 className="text-xl font-bold text-zinc-955 dark:text-white leading-tight">Switch Active Program</h3>
            <p className="text-zinc-750 dark:text-zinc-300 text-xs leading-relaxed">
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
            <h3 className="text-xl font-bold text-zinc-955 dark:text-white leading-tight">Delete Workout Program</h3>
            <p className="text-zinc-750 dark:text-zinc-300 text-xs leading-relaxed">
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
              <div className="relative overflow-hidden rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-50 to-fuchsia-50/80 dark:from-violet-950/60 dark:via-fuchsia-950/50 dark:to-zinc-950/80 p-5 space-y-3">
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
                    <p className="text-sm font-bold text-zinc-900 dark:text-white mt-0.5">Your plan is being generated!</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Your AI Coach is working hard to build a personalised, clinical-grade program for you. Other plan creation options are temporarily unavailable while generation is in progress.
                </p>
                {/* Shimmer bar */}
                <div className="h-1.5 w-full rounded-full bg-violet-200 dark:bg-violet-950/60 border border-violet-300/40 dark:border-violet-500/20 overflow-hidden">
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

                {/* Option 2: AI Coach Planner */}
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

                {/* Option 3: Custom Manual Builder (Collapsed or clearly labelled in Guided Mode) */}
                {guidedMode ? (
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedPlanOptions(!showAdvancedPlanOptions)}
                      className="w-full text-center text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 transition py-1"
                    >
                      {showAdvancedPlanOptions ? "Hide manual plan option ▲" : "Show advanced manual plan option ▼"}
                    </button>
                    {showAdvancedPlanOptions && (
                      <button
                        onClick={() => {
                          handleCreateManualPlan();
                          setShowCreatePlanModal(false);
                          setShowAdvancedPlanOptions(false);
                        }}
                        className="w-full text-left p-3.5 mt-2 rounded-xl border border-card-border bg-surface/30 hover:bg-surface transition-all flex gap-3.5 items-start group cursor-pointer animate-fadeIn"
                      >
                        <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-455 shrink-0">
                          <Plus size={18} />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            Create Manual Plan (Advanced)
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mt-0.5">
                            Design a completely customized plan from scratch. Add routines, configure days, target sets, and select exercises manually.
                          </p>
                        </div>
                      </button>
                    )}
                  </div>
                ) : (
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
                )}
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
  </>
);
}