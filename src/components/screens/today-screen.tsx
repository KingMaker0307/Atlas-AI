"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
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
  Circle,
  Sparkles,
  ArrowRight,
  Sun,
  Sunset,
  Moon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { createId, todayKey } from "@/lib/id";
import { GlossaryTooltip } from "@/components/glossary-tooltip";

// ─── Helpers ───────────────────────────────────────────────────────
function getGreeting(name: string): { text: string; emoji: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour < 12) return { text: `Good morning, ${name}! ☀️`, emoji: <Sun size={18} className="text-amber-400" /> };
  if (hour < 17) return { text: `Good afternoon, ${name}! 👋`, emoji: <Sunset size={18} className="text-orange-400" /> };
  return { text: `Good evening, ${name}! 🌙`, emoji: <Moon size={18} className="text-indigo-400" /> };
}

function getTodayMotivation(workoutsDone: boolean, mealLogged: boolean): string {
  if (!workoutsDone && !mealLogged) {
    return "Ready to start? Every step counts. Let's make today great! 💪";
  }
  if (workoutsDone && !mealLogged) {
    return "Workout done — amazing! 🎉 Don't forget to fuel your body with a meal.";
  }
  if (!workoutsDone && mealLogged) {
    return "Food logged! ✅ A workout today would complete your day perfectly.";
  }
  return "You're crushing it today! Workout done, meals logged. 🏆";
}

// ─── Water button ─────────────────────────────────────────────────
const CUP_ML = 250;
const WATER_GOAL_ML = 2000;

function WaterCounter() {
  const waterLogs = useAtlasStore((s) => s.waterLogs);
  const addWaterLog = useAtlasStore((s) => s.addWaterLog);
  const deleteWaterLog = useAtlasStore((s) => s.deleteWaterLog);

  const todayStr = todayKey();
  const todayLogs = waterLogs.filter((w) => w.timestamp?.startsWith(todayStr));
  const totalMl = todayLogs.reduce((acc, w) => acc + w.amount, 0);
  const cups = Math.round(totalMl / CUP_ML);
  const targetCups = Math.round(WATER_GOAL_ML / CUP_ML);
  const pct = Math.min((totalMl / WATER_GOAL_ML) * 100, 100);

  const handleAdd = async () => {
    await addWaterLog({
      id: createId("water"),
      amount: CUP_ML,
      timestamp: new Date().toISOString(),
    });
  };

  const handleRemove = async () => {
    if (todayLogs.length === 0) return;
    const last = todayLogs.at(-1)!;
    await deleteWaterLog(last.id);
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets size={16} className="text-sky-500" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">Water</span>
        </div>
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-medium">
          {cups} / {targetCups} cups
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden" aria-hidden="true">
        <motion.div
          className="h-full rounded-full bg-sky-400"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>

      {/* Cup icons */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {Array.from({ length: targetCups }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "text-lg transition-all duration-150 select-none",
              i < cups ? "opacity-100" : "opacity-25 grayscale"
            )}
            aria-hidden="true"
          >
            💧
          </span>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleRemove}
          disabled={todayLogs.length === 0}
          className="flex-none w-9 h-9 rounded-xl border border-card-border bg-card text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition text-lg font-bold cursor-pointer flex items-center justify-center"
          aria-label="Remove one cup"
        >
          −
        </button>
        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 h-9 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          <Droplets size={14} aria-hidden="true" />
          +1 cup
        </button>
      </div>
    </div>
  );
}

// ─── Daily Checklist ──────────────────────────────────────────────
interface ChecklistItemProps {
  done: boolean;
  label: string;
  emoji: string;
  onAction?: () => void;
  actionLabel?: string;
}

function ChecklistItem({ done, label, emoji, onAction, actionLabel }: ChecklistItemProps) {
  return (
    <div className="flex items-center gap-3">
      {done ? (
        <CheckCircle2 size={20} className="text-emerald-500 shrink-0" aria-hidden="true" />
      ) : (
        <Circle size={20} className="text-zinc-300 dark:text-zinc-700 shrink-0" aria-hidden="true" />
      )}
      <span className={cn("text-sm flex-1 font-medium", done ? "line-through text-zinc-400 dark:text-zinc-600" : "text-foreground")}>
        {emoji} {label}
      </span>
      {!done && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5 cursor-pointer"
        >
          {actionLabel}
          <ArrowRight size={11} />
        </button>
      )}
    </div>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────
export function TodayScreen() {
  const profile = useAtlasStore((s) => s.profile);
  const workouts = useAtlasStore((s) => s.workouts);
  const nutritionEntries = useAtlasStore((s) => s.nutritionEntries);
  const waterLogs = useAtlasStore((s) => s.waterLogs);
  const workoutPlans = useAtlasStore((s) => s.workoutPlans);
  const activeWorkoutPlanId = useAtlasStore((s) => s.activeWorkoutPlanId);
  const setActiveTab = useAtlasStore((s) => s.setActiveTab);
  const guidedMode = useAtlasStore((s) => s.guidedMode);

  const todayStr = todayKey();
  const todayDate = new Date().toISOString().split("T")[0]!;

  const workoutDoneToday = useMemo(
    () => workouts.some((w) => w.startedAt.startsWith(todayDate) && w.completedAt),
    [workouts, todayDate]
  );

  const mealLoggedToday = useMemo(
    () => (nutritionEntries ?? []).some((e) => e.timestamp?.startsWith(todayDate)),
    [nutritionEntries, todayDate]
  );

  const totalWaterMl = useMemo(
    () => (waterLogs ?? []).filter((w) => w.timestamp?.startsWith(todayDate)).reduce((acc, w) => acc + w.amount, 0),
    [waterLogs, todayDate]
  );

  const waterGoalMet = totalWaterMl >= WATER_GOAL_ML;

  const activePlan = workoutPlans.find((p) => p.id === activeWorkoutPlanId);
  const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const todayRoutine = activePlan?.routines?.find((r) => r.day === todayDayName);

  const greeting = getGreeting(profile?.name ?? "there");
  const motivation = getTodayMotivation(workoutDoneToday, mealLoggedToday);

  // What to show as the big action card
  const hour = new Date().getHours();
  const showWorkout = !workoutDoneToday;
  const showMeal = !mealLoggedToday && (hour >= 6);

  const TIPS = [
    "💡 Drinking water before meals helps with digestion and keeps you feeling full.",
    "💡 Rest days are just as important as workout days — your muscles grow when you rest!",
    "💡 Protein helps your muscles repair after a workout. Aim for some in every meal.",
    "💡 Consistency beats perfection. Showing up 3 days a week for a year beats 7 days for a month.",
    "💡 Sleep is when your body repairs itself. Try to get 7–9 hours if you can.",
  ];

  const dailyTip = TIPS[new Date().getDay() % TIPS.length];

  return (
    <div className="space-y-4 pb-6">
      {/* Greeting */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="px-1"
      >
        <h1 className="text-xl font-bold text-foreground">{greeting.text}</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">{motivation}</p>
      </motion.div>

      {/* Big action card */}
      {(showWorkout || showMeal) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {showWorkout ? (
            <Card className="p-5 relative overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-400/10 blur-2xl pointer-events-none" />
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/15 flex items-center justify-center">
                      <Dumbbell size={16} className="text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                    </div>
                    <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      {todayRoutine ? "Today's workout" : "Time to move!"}
                    </p>
                  </div>
                  <h2 className="text-base font-bold text-foreground">
                    {todayRoutine ? todayRoutine.name : "Start a workout"}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {todayRoutine
                      ? `${todayRoutine.exercises.length} exercises · ~${profile?.workoutDuration ?? 45} min`
                      : workoutPlans.length === 0
                        ? "Create a plan and start building your routine 💪"
                        : "Pick a workout from your plan and get started!"}
                  </p>
                </div>
              </div>
              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => setActiveTab("workout")}
              >
                <Dumbbell size={15} className="mr-1.5" aria-hidden="true" />
                {todayRoutine ? "Start today's workout" : "Go to workouts"}
              </Button>
            </Card>
          ) : showMeal ? (
            <Card className="p-5 relative overflow-hidden border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-orange-500/5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-amber-400/10 blur-2xl pointer-events-none" />
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Utensils size={16} className="text-amber-600 dark:text-amber-400" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Log your food
                  </p>
                  <h2 className="text-base font-bold text-foreground mt-0.5">What did you eat today?</h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                    Tracking your food helps you reach your goals faster
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                className="mt-4 w-full"
                onClick={() => setActiveTab("nutrition")}
              >
                <Utensils size={15} className="mr-1.5" aria-hidden="true" />
                Log a meal
              </Button>
            </Card>
          ) : null}
        </motion.div>
      )}

      {/* Daily checklist */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
      >
        <Card className="p-5 space-y-4">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <Flame size={16} className="text-orange-500" aria-hidden="true" />
            Today&apos;s checklist
          </h3>
          <div className="space-y-3.5">
            <ChecklistItem
              done={workoutDoneToday}
              label="Complete a workout"
              emoji="🏋️"
              onAction={() => setActiveTab("workout")}
              actionLabel="Go"
            />
            <ChecklistItem
              done={mealLoggedToday}
              label="Log at least one meal"
              emoji="🍽️"
              onAction={() => setActiveTab("nutrition")}
              actionLabel="Log"
            />
            <ChecklistItem
              done={waterGoalMet}
              label="Drink 8 cups of water"
              emoji="💧"
            />
          </div>

          {workoutDoneToday && mealLoggedToday && waterGoalMet && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center"
            >
              <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                🏆 Perfect day! You hit all your goals!
              </p>
            </motion.div>
          )}
        </Card>
      </motion.div>

      {/* Water tracker */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15 }}
      >
        <Card className="p-5">
          <WaterCounter />
        </Card>
      </motion.div>

      {/* Tip of the day */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2 }}
      >
        <Card className="p-4 border-violet-500/20 bg-gradient-to-br from-violet-500/5 to-indigo-500/5">
          <div className="flex items-start gap-3">
            <Sparkles size={16} className="text-violet-500 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-xs font-bold text-violet-600 dark:text-violet-400 uppercase tracking-wider mb-1">
                Tip of the day
              </p>
              <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                {dailyTip.includes("Protein") ? (
                  <>
                    💡 <GlossaryTooltip term="protein">Protein</GlossaryTooltip> helps your muscles repair after a workout. Aim for some in every meal.
                  </>
                ) : dailyTip.includes("Rest days") ? (
                  <>
                    💡 <GlossaryTooltip term="rest">Rest</GlossaryTooltip> days are just as important as workout days — your muscles grow when you rest!
                  </>
                ) : (
                  dailyTip
                )}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick links */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.25 }}
        className="grid grid-cols-2 gap-2.5"
      >
        {[
          { label: "Ask AI Coach", emoji: "🤖", tab: "coach" as const, color: "border-emerald-500/20 hover:border-emerald-500/50" },
          { label: "View Progress", emoji: "📈", tab: "progress" as const, color: "border-sky-500/20 hover:border-sky-500/50" },
        ].map((item) => (
          <button
            key={item.tab}
            type="button"
            onClick={() => setActiveTab(item.tab)}
            className={cn(
              "flex items-center gap-2.5 p-3.5 rounded-2xl border bg-card transition-all duration-150 cursor-pointer group",
              item.color
            )}
          >
            <span className="text-xl" aria-hidden="true">{item.emoji}</span>
            <span className="text-sm font-semibold text-foreground">{item.label}</span>
            <ChevronRight size={14} className="ml-auto text-zinc-400 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </button>
        ))}
      </motion.div>

      {/* Switch to full dashboard */}
      {!guidedMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="text-center pt-1"
        >
          <button
            type="button"
            onClick={() => setActiveTab("dashboard")}
            className="text-xs text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            Switch to full dashboard
            <ChevronRight size={12} />
          </button>
        </motion.div>
      )}
    </div>
  );
}
