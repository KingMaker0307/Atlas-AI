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
  Cpu,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createId, todayKey } from "@/lib/id";
import { AiSetupModal } from "@/components/ai-setup-modal";

// ─── Constants ──────────────────────────────────────────────────────
const CUP_ML = 250;
const WATER_GOAL_ML = 2000;

// ─── Greeting helper ────────────────────────────────────────────────
function getGreeting(name: string): { text: string; Icon: typeof Sun; iconClass: string } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)
    return { text: `Good morning, ${name}! ☀️`, Icon: Sun, iconClass: "text-amber-400" };
  if (hour >= 12 && hour < 17)
    return { text: `Good afternoon, ${name}! 👋`, Icon: Sunset, iconClass: "text-orange-400" };
  if (hour >= 17)
    return { text: `Good evening, ${name}! 🌙`, Icon: Moon, iconClass: "text-indigo-400" };
  // Late night / early morning (midnight–5am)
  return { text: `Still up, ${name}? 🌙`, Icon: Moon, iconClass: "text-indigo-400" };
}

// ─── Time-aware tips ─────────────────────────────────────────────────
type TipTime = "morning" | "afternoon" | "evening" | "night";

interface Tip {
  emoji: string;
  headline: string;
  body: string;
}

const TIPS: Record<TipTime, Tip[]> = {
  morning: [
    {
      emoji: "💧",
      headline: "Drink water before anything else",
      body: "A glass of water right after waking up jumpstarts your metabolism and flushes out toxins that built up overnight.",
    },
    {
      emoji: "🌅",
      headline: "Morning sunlight sets your clock",
      body: "Just 5–10 minutes of natural light in the morning helps regulate your sleep-wake cycle and boosts mood for the whole day.",
    },
    {
      emoji: "🥚",
      headline: "Start the day with protein",
      body: "A protein-rich breakfast keeps you fuller longer and reduces energy crashes before lunch. Fueling up early supports sustained energy and recovery.",
    },
    {
      emoji: "🧘",
      headline: "3 deep breaths before you check your phone",
      body: "Starting with slow breaths lowers cortisol and sets a calm, focused tone for the morning. Your notifications can wait 30 seconds!",
    },
    {
      emoji: "🎯",
      headline: "Pick just one priority for today",
      body: "Decide on the single most important thing you want to accomplish today. Everything else is a bonus.",
    },
    {
      emoji: "🏃",
      headline: "Morning movement wakes your brain",
      body: "Even a 10-minute walk before work boosts focus and energy for hours. Your body and brain run better when they're warm.",
    },
    {
      emoji: "☕",
      headline: "Delay coffee by 90 minutes",
      body: "Your natural cortisol peak is highest in the first 90 minutes after waking. Letting it do its job before adding caffeine means better alertness all day.",
    },
  ],
  afternoon: [
    {
      emoji: "🥗",
      headline: "Don't skip lunch — fuel the second half",
      body: "A balanced midday meal prevents the 3pm energy slump. Aim for protein, healthy fats, and some slow carbs like brown rice or sweet potato.",
    },
    {
      emoji: "🚶",
      headline: "A short walk beats another coffee",
      body: "Feeling foggy after lunch? A 10-minute walk outside clears your head better than caffeine and won't disrupt your sleep later.",
    },
    {
      emoji: "💧",
      headline: "You're probably not drinking enough water",
      body: "Most people are mildly dehydrated by midday. Thirst often hides as hunger or fatigue — try a glass of water first!",
    },
    {
      emoji: "🧠",
      headline: "Afternoon is peak problem-solving time",
      body: "For most people, reaction time and analytical thinking are at their best from 2–5pm. Use this window for your hardest tasks.",
    },
    {
      emoji: "🐢",
      headline: "Slow and steady beats crash and burn",
      body: "Showing up consistently 3 days a week for a year beats going every day for a month and burning out. Pace is everything.",
    },
    {
      emoji: "🍎",
      headline: "Reach for a snack with staying power",
      body: "Pair a carb with protein for your afternoon snack — apple with almond butter, or hummus with veggies. It keeps blood sugar steady.",
    },
    {
      emoji: "📵",
      headline: "Take a screen break every 90 minutes",
      body: "Your brain works in natural focus cycles of about 90 minutes. Getting up, stretching, or looking outside resets your concentration.",
    },
  ],
  evening: [
    {
      emoji: "🍽️",
      headline: "Eat a lighter dinner for better sleep",
      body: "Heavy meals close to bedtime make your body work hard digesting instead of recovering. Try to finish eating 2–3 hours before bed.",
    },
    {
      emoji: "🛌",
      headline: "Rest days are just as important as workout days",
      body: "Your muscles actually grow while you rest — not during the workout itself. Recovery is where the magic happens.",
    },
    {
      emoji: "📵",
      headline: "Cut screens an hour before bed",
      body: "Blue light from phones and laptops tricks your brain into thinking it's daytime. Try reading, stretching, or journaling instead.",
    },
    {
      emoji: "🧘",
      headline: "An evening stretch does wonders",
      body: "5–10 minutes of light stretching before bed improves circulation, reduces soreness, and signals your body that it's time to wind down.",
    },
    {
      emoji: "📝",
      headline: "Brain dump before you sleep",
      body: "Write down tomorrow's to-do list before bed. It offloads the mental loops keeping you awake and lets your brain fully switch off.",
    },
    {
      emoji: "❄️",
      headline: "Cool your room for deeper sleep",
      body: "Your body temperature naturally drops as you fall asleep. A cooler room (around 18°C / 65°F) signals deeper, more restorative sleep.",
    },
    {
      emoji: "😴",
      headline: "Consistency beats duration for sleep",
      body: "Going to bed and waking at the same time every day — even on weekends — is more powerful than sleeping in. Your body loves rhythm.",
    },
  ],
  night: [
    {
      emoji: "🌙",
      headline: "Your body repairs itself while you sleep",
      body: "Deep sleep is when your muscles rebuild, your brain consolidates memories, and your immune system recharges. Prioritise getting to bed soon.",
    },
    {
      emoji: "😴",
      headline: "Sleep is your best performance tool",
      body: "7–9 hours of quality sleep improves strength, focus, mood, and metabolism. No supplement or workout can replace it.",
    },
    {
      emoji: "📵",
      headline: "Put the phone down — for real",
      body: "Even 30 minutes less of scrolling at night can meaningfully improve the quality and depth of your sleep. Try leaving it in another room.",
    },
    {
      emoji: "💧",
      headline: "Stay hydrated even at night",
      body: "You lose water through breathing while you sleep. Keep a glass of water by your bed so you can hydrate easily if you wake up.",
    },
    {
      emoji: "🧘",
      headline: "Try box breathing to fall asleep faster",
      body: "Inhale for 4 counts, hold for 4, exhale for 4, hold for 4. Repeat 4 times. This activates your parasympathetic system and calms your mind.",
    },
    {
      emoji: "🌡️",
      headline: "Listen to how your body feels right now",
      body: "Before sleeping, check in: are you tense? Sore? Anxious? A quick 2-minute body scan helps you notice — and release — what you're holding.",
    },
    {
      emoji: "🎯",
      headline: "Tomorrow starts with tonight",
      body: "Set your workout clothes out, prep your water bottle, and decide on breakfast now. Small evening wins make mornings effortless.",
    },
  ],
};

function getTipTimeOfDay(): TipTime {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 22) return "evening";
  return "night";
}

const TIP_LABELS: Record<TipTime, string> = {
  morning: "Morning tip",
  afternoon: "Afternoon tip",
  evening: "Evening tip",
  night: "Late night tip",
};

function getDailySeed(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

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
  const aiProviders = useAtlasStore((s) => s.aiProviders);
  const activeProviderId = useAtlasStore((s) => s.activeProviderId);
  const activeWorkout = useAtlasStore((s) => s.activeWorkout);
  const setActiveSubScreen = useAtlasStore((s) => s.setActiveSubScreen);

  const hasActiveAi = useMemo(() => {
    const active = aiProviders.find((p) => p.id === activeProviderId);
    return !!(active && (active.apiKey || active.type === "ollama" || active.type === "lmstudio"));
  }, [aiProviders, activeProviderId]);

  const [showAiModal, setShowAiModal] = useState(false);

  useEffect(() => {
    if (!hasActiveAi && localStorage.getItem("atlas_has_seen_ai_popup") !== "true") {
      setShowAiModal(true);
    }
  }, [hasActiveAi]);

  const handleCloseAiModal = () => {
    localStorage.setItem("atlas_has_seen_ai_popup", "true");
    setShowAiModal(false);
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
  const tipTime = getTipTimeOfDay();
  const initialTip = useMemo(() => {
    const pool = TIPS[tipTime];
    const seed = getDailySeed(todayDate);
    return pool[seed % pool.length];
  }, [todayDate, tipTime]);

  const [dailyTip, setDailyTip] = useState<Tip>(initialTip);

  useEffect(() => {
    let active = true;
    const fetchTips = async () => {
      try {
        let res = await fetch("/api/daily-tips", { cache: "no-cache" });
        if (!res.ok) res = await fetch("/daily-tips.json");
        if (res.ok) {
          const remoteTips = await res.json();
          // Remote tips are expected to be a flat array; filter by time-of-day tag if present
          if (Array.isArray(remoteTips) && remoteTips.length > 0) {
            const timeTagged = remoteTips.filter((t: any) => !t.time || t.time === tipTime);
            const pool = timeTagged.length > 0 ? timeTagged : remoteTips;
            const seed = getDailySeed(todayDate);
            const chosen = pool[seed % pool.length];
            if (active && chosen) setDailyTip(chosen);
          }
        }
      } catch (err) {
        console.warn("Failed to fetch daily tips, using local fallback.", err);
      }
    };
    void fetchTips();
    return () => { active = false; };
  }, [todayDate, tipTime]);

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

      {/* ── Step 1: How are you feeling? (Morning only) ── */}
      {(() => {
        const hour = new Date().getHours();
        const isMorning = hour >= 5 && hour < 12;
        if (checkedInToday) {
          // Already checked in — show the done state regardless of time
          return (
            <DailyStep
              step={1}
              done={true}
              emoji="🌡️"
              title="How does your body feel today?"
              subtitle="Check-in saved ✓"
              delay={0.05}
            >
              <BodyCheckIn todayDate={todayDate} />
            </DailyStep>
          );
        }
        if (!isMorning) {
          // Not morning and not yet checked in — show a gentle nudge
          return (
            <DailyStep
              step={1}
              done={false}
              emoji="🌅"
              title="Morning check-in"
              subtitle="Available between 5 AM – 12 PM"
              delay={0.05}
            >
              <div className="flex flex-col items-center gap-2 py-4 text-center">
                <span className="text-3xl">🌙</span>
                <p className="text-sm font-bold text-foreground">Check back in the morning</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] leading-relaxed">
                  Your body check-in is most accurate when done first thing in the morning — before caffeine, food, or exercise affect how you feel.
                </p>
              </div>
            </DailyStep>
          );
        }
        // Morning + not checked in — show the check-in form
        return (
          <DailyStep
            step={1}
            done={false}
            emoji="🌡️"
            title="How does your body feel today?"
            subtitle="Takes just 30 seconds — no gym knowledge needed!"
            delay={0.05}
          >
            <BodyCheckIn todayDate={todayDate} />
          </DailyStep>
        );
      })()}

      {/* ── Step 2: Move your body ── */}
      <DailyStep
        step={2}
        done={workoutDoneToday}
        emoji="🏃"
        title={
          activeWorkout
            ? "Workout in Progress"
            : workoutDoneToday
            ? "Movement complete!"
            : "Time to move your body"
        }
        subtitle={
          activeWorkout
            ? `"${activeWorkout.name}" is currently active.`
            : workoutDoneToday
            ? "Great job! Your body will thank you. 🌟"
            : todayRoutine
            ? `${todayRoutine.name} · ${todayRoutine.exercises.length} exercises`
            : "Any movement counts — a walk, stretching, or a full workout!"
        }
        delay={0.1}
      >
        <div className="space-y-3">
          {activeWorkout ? (
            <div className="rounded-xl bg-emerald-500/8 border border-emerald-500/20 p-3.5 space-y-1">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active session</p>
              <p className="text-sm font-bold text-foreground">{activeWorkout.name}</p>
              <p className="text-xs text-zinc-500">Currently active in the background.</p>
            </div>
          ) : todayRoutine ? (
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
            onClick={() => {
              setActiveTab("workout");
              if (activeWorkout) {
                setActiveSubScreen("active-workout");
              }
            }}
          >
            <Dumbbell size={15} className={cn("mr-2 shrink-0", activeWorkout && "animate-pulse")} aria-hidden="true" />
            {activeWorkout ? "Resume" : todayRoutine ? "Start today's workout" : "Go to workouts →"}
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

      {/* ── AI Coach Setup Card (only if no active AI setup) ── */}
      {!hasActiveAi && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
        >
          <Card className="p-4 border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                <Cpu size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground leading-snug">Set up your AI Coach Assistant</h3>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed max-w-md">
                  Connect an AI provider to enable personalized program design, workout summaries, and interactive training logs.
                </p>
              </div>
            </div>
            <Button
              variant="primary"
              onClick={() => setShowAiModal(true)}
              className="w-full sm:w-auto text-xs py-1.5 shrink-0 animate-click"
            >
              Configure AI Coach
            </Button>
          </Card>
        </motion.div>
      )}

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
                {TIP_LABELS[tipTime]}
              </p>
              <p className="text-xl mb-1.5">{dailyTip.emoji}</p>
              <p className="text-sm font-semibold text-foreground leading-snug mb-1">{dailyTip.headline}</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">{dailyTip.body}</p>
            </div>
          </div>
        </Card>
      </motion.div>

      <AnimatePresence>
        {showAiModal && (
          <AiSetupModal onClose={handleCloseAiModal} />
        )}
      </AnimatePresence>
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
      const todayLog = recoveryLogs.find((r) => r.date === todayDate);
      await logRecovery({
        id: todayLog?.id || createId("recovery"),
        date: todayDate,
        sleepHours: sleep,
        soreness,
        stress: 5,
        readiness: Math.max(1, Math.min(10, Math.round((((sleep - 3) / 7) * 40 + ((soreness - 1) / 9) * 30 + ((energy - 1) / 9) * 30) / 10))),
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
