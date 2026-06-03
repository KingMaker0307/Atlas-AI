"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dumbbell,
  Utensils,
  Droplets,
  ChevronRight,
  Flame,
  CheckCircle2,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  Heart,
  Plus,
  Minus,
  Leaf,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createId, todayKey } from "@/lib/id";

// ─── Constants ──────────────────────────────────────────────────────
const CUP_ML = 250;
const WATER_GOAL_ML = 2000;

// ─── Greeting helper ────────────────────────────────────────────────
function getGreeting(name: string): { text: string; Icon: typeof Sun; iconClass: string } {
  const hour = new Date().getHours();
  if (hour < 12)
    return { text: `Good morning, ${name}! ☀️`, Icon: Sun, iconClass: "text-amber-400" };
  if (hour < 17)
    return { text: `Good afternoon, ${name}! 👋`, Icon: Sunset, iconClass: "text-orange-400" };
  return { text: `Good evening, ${name}! 🌙`, Icon: Moon, iconClass: "text-indigo-400" };
}

interface Tip {
  emoji: string;
  headline: string;
  body: string;
  tags?: string[];
}

function filterTipByDiet(tip: Tip, dietaryPreferences: string): boolean {
  const pref = (dietaryPreferences ?? "").toLowerCase();
  const text = `${tip.headline} ${tip.body}`.toLowerCase();
  
  if (pref.includes("vegan")) {
    const animalWords = ["egg", "chicken", "meat", "beef", "pork", "fish", "yogurt", "yoghurt", "milk", "cheese", "whey", "dairy", "turkey", "steak"];
    if (animalWords.some(word => text.includes(word))) return false;
    if (tip.tags?.some(tag => ["meat", "non-veg", "dairy"].includes(tag))) return false;
  }
  
  if (pref.includes("vegetarian")) {
    const meatWords = ["chicken", "meat", "beef", "pork", "fish", "steak", "turkey"];
    if (meatWords.some(word => text.includes(word))) return false;
    if (tip.tags?.some(tag => ["meat", "non-veg"].includes(tag))) return false;
  }
  
  return true;
}

function getDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

// ─── Beginner tips ──────────────────────────────────────────────────
const TIPS: Tip[] = [
  {
    emoji: "💧",
    headline: "Drink water first thing in the morning",
    body: "A glass of water right after waking up jumpstarts your body. Think of it like charging your phone overnight!",
  },
  {
    emoji: "🛌",
    headline: "Rest days are just as important as workout days",
    body: "Your muscles actually grow while you sleep and rest — not during the workout itself. Don't feel guilty for resting!",
  },
  {
    emoji: "🥚",
    headline: "Eat some protein at every meal",
    body: "Protein is what your muscles use to repair themselves after movement. Eggs, chicken, yoghurt, beans — all great choices.",
  },
  {
    emoji: "🐢",
    headline: "Slow and steady wins the race",
    body: "Showing up 3 days a week consistently for a year beats going every day for one month and burning out. Progress takes time.",
  },
  {
    emoji: "🧘",
    headline: "Any movement counts",
    body: "A 20-minute walk, gentle stretching, or even gardening — it all helps your body get stronger and healthier.",
  },
  {
    emoji: "😴",
    headline: "Sleep is your secret superpower",
    body: "7–9 hours of sleep helps your body heal, your memory sharpen, and your energy stay high the next day.",
  },
  {
    emoji: "🎯",
    headline: "Start small and build up",
    body: "Even 5 minutes of exercise is better than nothing. You can always do more next time — the key is to start!",
  },
];

// ─── Water Counter ───────────────────────────────────────────────────
function WaterStep() {
  const waterLogs = useAtlasStore((s) => s.waterLogs);
  const addWaterLog = useAtlasStore((s) => s.addWaterLog);
  const deleteWaterLog = useAtlasStore((s) => s.deleteWaterLog);

  const todayStr = todayKey();
  const todayLogs = waterLogs.filter((w) => w.timestamp?.startsWith(todayStr));
  const totalMl = todayLogs.reduce((acc, w) => acc + w.amount, 0);
  const cups = Math.round(totalMl / CUP_ML);
  const targetCups = Math.round(WATER_GOAL_ML / CUP_ML);
  const pct = Math.min((totalMl / WATER_GOAL_ML) * 100, 100);
  const done = totalMl >= WATER_GOAL_ML;

  const handleAdd = async () => {
    if (navigator.vibrate) navigator.vibrate(8);
    await addWaterLog({ id: createId("water"), amount: CUP_ML, timestamp: new Date().toISOString() });
  };
  const handleRemove = async () => {
    if (todayLogs.length === 0) return;
    await deleteWaterLog(todayLogs.at(-1)!.id);
  };

  return (
    <div className="space-y-3">
      {/* Progress bar */}
      <div className="flex items-center justify-between text-xs font-semibold text-zinc-500">
        <span>Today's water</span>
        <span className={cn(done ? "text-sky-500 font-bold" : "")}>
          {cups} / {targetCups} glasses {done ? "✅" : ""}
        </span>
      </div>
      <div className="h-3 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          className="h-full rounded-full bg-sky-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>

      {/* Glass emoji row */}
      <div className="flex gap-1.5 flex-wrap">
        {Array.from({ length: targetCups }).map((_, i) => (
          <span
            key={i}
            className={cn("text-xl transition-all duration-200 select-none", i < cups ? "opacity-100" : "opacity-25 grayscale")}
            aria-hidden="true"
          >
            💧
          </span>
        ))}
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleRemove}
          disabled={todayLogs.length === 0}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-card-border bg-card text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed transition active:scale-95 cursor-pointer text-lg font-bold shrink-0"
          aria-label="Remove one glass"
        >
          <Minus size={16} />
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 h-11 rounded-2xl bg-sky-500 hover:bg-sky-600 active:scale-95 text-white text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2"
        >
          <Plus size={16} aria-hidden="true" />
          I drank a glass of water
        </button>
      </div>
    </div>
  );
}

// ─── Step item (numbered) ────────────────────────────────────────────
interface StepProps {
  step: number;
  done: boolean;
  emoji: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  delay?: number;
}

function DailyStep({ step, done, emoji, title, subtitle, children, delay = 0 }: StepProps) {
  const [open, setOpen] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <Card className={cn("overflow-hidden transition-all duration-300", done && "border-emerald-500/30 bg-emerald-500/5")}>
        {/* Step header — always visible */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="w-full flex items-center gap-4 p-4 text-left cursor-pointer"
          aria-expanded={open}
        >
          {/* Step number / done badge */}
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-extrabold text-sm transition-colors",
              done
                ? "bg-emerald-500 text-white"
                : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
            )}
            aria-hidden="true"
          >
            {done ? <CheckCircle2 size={18} /> : step}
          </div>

          {/* Title block */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xl select-none" aria-hidden="true">{emoji}</span>
              <p className={cn("text-sm font-bold leading-snug", done ? "text-emerald-600 dark:text-emerald-400 line-through opacity-70" : "text-foreground")}>
                {title}
              </p>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{subtitle}</p>
          </div>

          {/* Chevron toggle */}
          <ChevronRight
            size={16}
            className={cn("shrink-0 text-zinc-400 transition-transform duration-200", open && !done && "rotate-90")}
            aria-hidden="true"
          />
        </button>

        {/* Step body — collapsible */}
        <AnimatePresence initial={false}>
          {open && !done && (
            <motion.div
              key="body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-card-border pt-3">
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────
export function TodayScreen() {
  const profile      = useAtlasStore((s) => s.profile);
  const workouts     = useAtlasStore((s) => s.workouts);
  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries);
  const waterLogs    = useAtlasStore((s) => s.waterLogs);
  const recoveryLogs = useAtlasStore((s) => s.recoveryLogs);
  const workoutPlans = useAtlasStore((s) => s.workoutPlans);
  const activeWorkoutPlanId = useAtlasStore((s) => s.activeWorkoutPlanId);
  const setActiveTab = useAtlasStore((s) => s.setActiveTab);
  const setHomeSubTab = useAtlasStore((s) => s.setHomeSubTab);
  const setActiveSettingsTab = useAtlasStore((s) => s.setActiveSettingsTab);

  const handleGoToDietSettings = () => {
    setActiveTab("settings");
    setActiveSettingsTab("profile");
  };

  const todayDate = todayKey();

  const workoutDoneToday = useMemo(
    () => workouts.some((w) => w.startedAt.startsWith(todayDate) && w.completedAt),
    [workouts, todayDate]
  );
  const mealLoggedToday = useMemo(
    () => (nutritionEntries ?? []).some((e) => e.timestamp?.startsWith(todayDate)),
    [nutritionEntries, todayDate]
  );
  const totalWaterMl = useMemo(
    () => (waterLogs ?? []).filter((w) => w.timestamp?.startsWith(todayDate)).reduce((a, w) => a + w.amount, 0),
    [waterLogs, todayDate]
  );
  const checkedInToday = useMemo(
    () => recoveryLogs.some((r) => r.date === todayDate),
    [recoveryLogs, todayDate]
  );
  const waterGoalMet = totalWaterMl >= WATER_GOAL_ML;

  const activePlan = workoutPlans.find((p) => p.id === activeWorkoutPlanId);
  const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayRoutine = activePlan?.routines?.find((r) => r.day === todayDayName);

  const { text: greetingText, Icon: GreetingIcon, iconClass } = getGreeting(profile?.name ?? "there");
  // Synchronous initial tip filtered for user's diet
  const initialTip = useMemo(() => {
    const diet = profile?.dietaryPreferences ?? "";
    const filtered = TIPS.filter(tip => filterTipByDiet(tip, diet));
    const list = filtered.length > 0 ? filtered : TIPS;
    const seed = getDailySeed(todayDate);
    return list[seed % list.length];
  }, [profile?.dietaryPreferences, todayDate]);

  const [dailyTip, setDailyTip] = useState<Tip>(initialTip);

  useEffect(() => {
    let active = true;
    const fetchTips = async () => {
      try {
        let res = await fetch("/api/daily-tips", {
          cache: "no-cache"
        });
        if (!res.ok) {
          res = await fetch("/daily-tips.json");
        }
        if (res.ok) {
          const remoteTips = await res.json();
          if (Array.isArray(remoteTips) && remoteTips.length > 0) {
            const diet = profile?.dietaryPreferences ?? "";
            const filtered = remoteTips.filter(tip => filterTipByDiet(tip, diet));
            const list = filtered.length > 0 ? filtered : remoteTips;
            const seed = getDailySeed(todayDate);
            const chosen = list[seed % list.length];
            if (active && chosen) {
              setDailyTip(chosen);
            }
          }
        }
      } catch (err) {
        console.warn("Failed to fetch daily tips from internet, using local fallback.", err);
      }
    };
    void fetchTips();
    return () => {
      active = false;
    };
  }, [profile?.dietaryPreferences, todayDate]);

  // Count steps done
  const nutritionDone = mealLoggedToday && waterGoalMet;
  const stepsDone = [checkedInToday, workoutDoneToday, nutritionDone].filter(Boolean).length;
  const allDone = stepsDone === 3;

  return (
    <div className="space-y-4 pb-8">

      {/* ── Greeting banner ── */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-1"
      >
        <div className="flex items-center gap-2.5">
          <GreetingIcon size={22} className={cn("shrink-0", iconClass)} aria-hidden="true" />
          <h1 className="text-xl font-bold text-foreground leading-snug">{greetingText}</h1>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed pl-8">
          {allDone
            ? "You've completed everything today! Amazing work. 🏆"
            : `${stepsDone} of 3 healthy habits done today — keep going! 💪`}
        </p>
      </motion.div>

      {/* ── All-done celebration ── */}
      <AnimatePresence>
        {allDone && (
          <motion.div
            key="allDone"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            className="rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-5 text-center space-y-1"
          >
            <p className="text-3xl">🎉</p>
            <p className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">Perfect day! You hit all 4 habits!</p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">Come back tomorrow for a fresh start.</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Step 1: How are you feeling? ── */}
      <DailyStep
        step={1}
        done={checkedInToday}
        emoji="🌡️"
        title="How does your body feel today?"
        subtitle={checkedInToday ? "Check-in saved ✓" : "Takes just 30 seconds — no gym knowledge needed!"}
        delay={0.05}
      >
        <BodyCheckIn todayDate={todayDate} />
      </DailyStep>

      {/* ── Step 2: Move your body ── */}
      <DailyStep
        step={2}
        done={workoutDoneToday}
        emoji="🏃"
        title={workoutDoneToday ? "Movement complete!" : "Time to move your body"}
        subtitle={
          workoutDoneToday
            ? "Great job! Your body will thank you. 🌟"
            : todayRoutine
            ? `${todayRoutine.name} · ${todayRoutine.exercises.length} exercises`
            : "Any movement counts — a walk, stretching, or a full workout!"
        }
        delay={0.1}
      >
        <div className="space-y-3">
          {todayRoutine ? (
            <div className="rounded-xl bg-violet-500/8 border border-violet-500/20 p-3.5 space-y-1">
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider">Your routine for today</p>
              <p className="text-sm font-bold text-foreground">{todayRoutine.name}</p>
              <p className="text-xs text-zinc-500">{todayRoutine.exercises.length} exercises · about {profile?.workoutDuration ?? 45} minutes</p>
            </div>
          ) : (
            <div className="rounded-xl bg-zinc-500/8 border border-card-border p-3.5 space-y-1">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">No specific routine today</p>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Even a 15-minute walk counts as movement. Or tap below to pick a workout from your plan!
              </p>
            </div>
          )}
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setActiveTab("workout")}
          >
            <Dumbbell size={15} className="mr-2 shrink-0" aria-hidden="true" />
            {todayRoutine ? "Start today's workout" : "Go to workouts →"}
          </Button>
        </div>
      </DailyStep>

      {/* ── Step 3: Log your nutrition & water ── */}
      <DailyStep
        step={3}
        done={mealLoggedToday && waterGoalMet}
        emoji="🥗"
        title={(mealLoggedToday && waterGoalMet) ? "Nutrition & Hydration complete!" : "Log your nutrition & water"}
        subtitle={
          (mealLoggedToday && waterGoalMet)
            ? "Great job fueling and hydrating your body today!"
            : `Log today's meals (${mealLoggedToday ? "✓ Logged" : "Not logged yet"}) and water (${totalWaterMl}/${WATER_GOAL_ML}ml).`
        }
        delay={0.15}
      >
        <div className="space-y-3">
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Keep track of your meals, calories, and daily hydration level to optimize your recovery and performance.
          </p>
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setActiveTab("nutrition")}
          >
            <Utensils size={15} className="mr-2 shrink-0" aria-hidden="true" />
            Go to nutrition logs →
          </Button>
        </div>
      </DailyStep>

      {/* ── Tip of the day ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
      >
        <Card className="p-4 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="text-violet-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
                Did you know?
              </p>
              <p className="text-xl mb-1.5">{dailyTip.emoji}</p>
              <p className="text-sm font-semibold text-foreground leading-snug mb-1">{dailyTip.headline}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{dailyTip.body}</p>
              {!profile?.dietaryPreferences && (
                <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-2 select-none border-t border-violet-500/10 pt-2 leading-tight">
                  💡 Want personalized nutrition tips? Update your{" "}
                  <button
                    onClick={handleGoToDietSettings}
                    className="text-violet-500 hover:text-violet-600 dark:text-violet-400 dark:hover:text-violet-300 font-bold underline cursor-pointer inline p-0 bg-transparent border-none text-left"
                  >
                    Dietary Preferences in Settings
                  </button>.
                </p>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}

// ─── Body Check-In (inline, no modal) ───────────────────────────────
interface BodyCheckInProps {
  todayDate: string;
}

function BodyCheckIn({ todayDate }: BodyCheckInProps) {
  const logRecovery = useAtlasStore((s) => s.logRecovery);
  const recoveryLogs = useAtlasStore((s) => s.recoveryLogs);
  const alreadySaved = recoveryLogs.some((r) => r.date === todayDate);

  const ENERGY_OPTIONS = [
    { label: "Exhausted 😩", value: 2 },
    { label: "Tired 😕", value: 4 },
    { label: "Okay 😐", value: 6 },
    { label: "Good 🙂", value: 8 },
    { label: "Amazing! ⚡", value: 10 },
  ];
  const SORE_OPTIONS = [
    { label: "Very sore 😣", value: 2 },
    { label: "A little sore 😕", value: 4 },
    { label: "Neutral 😐", value: 6 },
    { label: "Fresh 💪", value: 8 },
    { label: "No soreness! 🌟", value: 10 },
  ];
  const SLEEP_OPTIONS = [
    { label: "Terrible 😩", value: 4 },
    { label: "Not great 😕", value: 5.5 },
    { label: "Okay 😐", value: 7 },
    { label: "Good 😊", value: 8 },
    { label: "Great! 😄", value: 9 },
  ];

  const last = recoveryLogs.at(-1);
  const [energy, setEnergy] = useState(last?.energy ?? 6);
  const [soreness, setSoreness] = useState(last?.soreness ?? 6);
  const [sleep, setSleep] = useState(last?.sleepHours ?? 7);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  if (alreadySaved || saved) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-2 py-4 text-center"
      >
        <span className="text-4xl">✅</span>
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          Check-in saved! We've got it.
        </p>
        <p className="text-xs text-zinc-500">Come back tomorrow to check in again.</p>
      </motion.div>
    );
  }

  const handleSave = async () => {
    if (navigator.vibrate) navigator.vibrate(15);
    setSaving(true);
    try {
      await logRecovery({
        id: todayDate,
        date: todayDate,
        sleepHours: sleep,
        soreness,
        stress: 5,
        readiness: Math.round(((sleep - 3) / 7) * 40 + ((soreness - 1) / 9) * 30 + ((energy - 1) / 9) * 30),
        energy,
        note: "",
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Energy */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-foreground">⚡ How's your energy right now?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ENERGY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setEnergy(opt.value)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer text-left leading-snug active:scale-95",
                energy === opt.value
                  ? "border-emerald-500 bg-emerald-500/12 text-emerald-700 dark:text-emerald-300"
                  : "border-card-border bg-card text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Soreness */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-foreground">💪 How do your muscles feel?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SORE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSoreness(opt.value)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer text-left leading-snug active:scale-95",
                soreness === opt.value
                  ? "border-amber-500 bg-amber-500/12 text-amber-700 dark:text-amber-300"
                  : "border-card-border bg-card text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sleep */}
      <div className="space-y-2">
        <p className="text-sm font-bold text-foreground">😴 How did you sleep last night?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {SLEEP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSleep(opt.value)}
              className={cn(
                "py-2.5 px-3 rounded-xl text-sm font-semibold border transition-all duration-150 cursor-pointer text-left leading-snug active:scale-95",
                sleep === opt.value
                  ? "border-indigo-500 bg-indigo-500/12 text-indigo-700 dark:text-indigo-300"
                  : "border-card-border bg-card text-zinc-600 dark:text-zinc-300 hover:border-zinc-400"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <Button variant="primary" className="w-full" onClick={handleSave} disabled={saving}>
        {saving ? (
          <span className="flex items-center gap-2">
            <span className="h-3.5 w-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            Saving…
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Heart size={15} aria-hidden="true" />
            Save my check-in
          </span>
        )}
      </Button>
    </div>
  );
}
