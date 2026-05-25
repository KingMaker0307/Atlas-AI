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
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
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
import { useState } from "react";
import ReactMarkdown from "react-markdown";
import type { UserProfile } from "@/types/domain";

export function DashboardScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const workouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const bodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const sendCoachMessage = useAtlasStore((state) => state.sendCoachMessage);
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const deleteWorkoutPlan = useAtlasStore((state) => state.deleteWorkoutPlan);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const setActiveWorkoutPlanId = useAtlasStore((state) => state.setActiveWorkoutPlanId);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);

  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<{ id: string; name: string } | null>(null);

  const recoveryScore = calculateRecoveryScore(recoveryLogs.at(-1));
  const fatigue = getFatigueLabel(recoveryScore);
  const bodySeries = getBodyweightSeries(bodyMetrics);
  const volumeSeries = getVolumeSeries(workouts);
  const recentPrs = getRecentPrs(workouts);
  
  const lastMessage = aiMessages.at(-1);
  const isLastMessageError = lastMessage?.content.includes("**Error:**");

  const isWorkoutPlan = (content: string) => {
    return parseAiWorkoutPlan(content) !== null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex flex-col gap-4 pb-28"
    >


      <section>
        <p className="text-sm text-zinc-400">Welcome back, {profile?.name ?? "Athlete"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Today’s coach read</h1>
      </section>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Biometrics</h2>
          <Button variant="ghost" size="icon" onClick={() => setActiveTab("settings")}>
            <Pencil size={16} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <MetricCard label="Age" value={`${profile?.age ?? "N/A"}`} detail="years" />
          <MetricCard label="Weight" value={`${profile?.weight ?? "N/A"} ${profile?.weightUnit}`} />
          <MetricCard label="Height" value={`${profile?.height ?? "N/A"} ${profile?.heightUnit}`} />
          <MetricCard label="Target" value={profile?.targetPhysique ?? "N/A"} />
        </div>
        {profile?.dietaryPreferences && (
          <div className="mt-3">
            <h3 className="text-sm font-medium text-zinc-400">Dietary Preferences</h3>
            <p className="text-sm text-white">{profile.dietaryPreferences}</p>
          </div>
        )}
      </Card>

      {workoutPlans.length === 0 ? (
        <Card className="p-4">
          <div className="text-center">
            {coachBusy ? (
               <div className="py-6 flex flex-col items-center">
                 <Bot className="mx-auto h-12 w-12 text-emerald-300 animate-pulse" />
                 <h2 className="mt-4 text-xl font-semibold text-white">Coach is working...</h2>
                 <p className="mt-2 text-sm text-zinc-400">Generating your personalized workout plan.</p>
               </div>
            ) : (
              <>
                <ClipboardList className="mx-auto h-12 w-12 text-emerald-300" />
                <h2 className="mt-4 text-xl font-semibold text-white">No workout plans found</h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Go to the Plans tab to create or select a workout plan.
                </p>
                <div className="mt-6">
                  <Button variant="primary" className="w-full" onClick={() => setActiveTab("workout")}>
                    Go to Plans
                  </Button>
                </div>
              </>
            )}
          </div>
        </Card>
      ) : (
        workoutPlans.map(plan => {
          const planWorkouts = workouts.filter((w) => w.planId === plan.id && w.completedAt);
          const completedRoutineNames = new Set(planWorkouts.map((w) => w.name));
          const routinesCount = plan.routines.length;
          const completedCount = plan.routines.filter((r) => completedRoutineNames.has(r.name)).length;
          const progressPercent = routinesCount > 0 ? Math.round((completedCount / routinesCount) * 100) : 0;
          const isActive = plan.id === activeWorkoutPlanId;

          return (
            <Card className="overflow-hidden p-4" key={plan.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-semibold text-white">{plan.name}</h2>
                    {isActive && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 max-w-[18rem] text-sm leading-6 text-zinc-400">{plan.goal}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => {
                    setEditingWorkoutPlanId(plan.id);
                    setActiveSubScreen("workout-plan-builder");
                  }}>
                    <Pencil size={16} />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => {
                    setPlanToDelete({ id: plan.id, name: plan.name });
                    setShowDeleteModal(true);
                  }}>
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-4 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Routines Completed</span>
                  <span className="font-medium text-emerald-300">{completedCount}/{routinesCount}</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-zinc-850 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-300" 
                    style={{ width: `${progressPercent}%` }} 
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-2">
                <Button className="flex-1" variant="primary" onClick={() => {
                  setEditingWorkoutPlanId(plan.id);
                  setActiveSubScreen("workout-plan-detail");
                }}>
                  View Plan
                </Button>
                {!isActive && (
                  <Button 
                    className="flex-1"
                    variant="secondary"
                    onClick={() => {
                      setPlanToActivate(plan.id);
                      setShowSwitchModal(true);
                    }}
                  >
                    Set Active
                  </Button>
                )}
              </div>
            </Card>
          );
        })
      )}

      {workoutPlans.length > 0 && coachBusy && (
        <Card className="p-4">
          <div className="py-2 flex flex-col items-center">
            <Bot className="h-6 w-6 text-emerald-300 animate-pulse mb-2" />
            <p className="text-sm font-medium text-white">Coach is generating a new plan...</p>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Streak"
          value={`${getCurrentStreak(workouts, activeWorkoutPlanId)}d`}
          detail="training days"
          icon={<Flame size={18} />}
          tone="amber"
        />
        <MetricCard
          label="Consistency"
          value={`${getTrainingConsistency(workouts, profile?.daysPerWeek ?? 3, activeWorkoutPlanId)}%`}
          detail="monthly target"
          icon={<Activity size={18} />}
          tone="emerald"
        />
        <MetricCard
          label="Volume"
          value={Math.round(getWeeklyVolume(workouts)).toLocaleString()}
          detail="this week"
          icon={<Dumbbell size={18} />}
          tone="sky"
        />
        <MetricCard
          label="Fatigue"
          value={fatigue.label}
          detail="auto adjusted"
          icon={<BatteryCharging size={18} />}
          tone={fatigue.tone === "good" ? "emerald" : fatigue.tone === "warn" ? "amber" : "rose"}
        />
        <MetricCard
          label="Sleep"
          value={`${recoveryLogs.at(-1)?.sleepHours ?? 7.2}h`}
          detail="last log"
          icon={<Moon size={18} />}
          tone="violet"
          className="col-span-2"
        />
      </div>

      <Card className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Trendline</h2>
            <p className="text-sm text-zinc-500">Bodyweight and training volume</p>
          </div>
          <TimerReset className="text-zinc-500" size={18} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Surface className="h-44 flex flex-col">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Bodyweight</p>
            {bodySeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                <AreaChart data={bodySeries}>
                  <defs>
                    <linearGradient id="bodyweight" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#6ee7b7" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#6ee7b7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" hide />
                  <YAxis hide domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Area type="monotone" dataKey="weight" stroke="#6ee7b7" fill="url(#bodyweight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center pb-8 text-sm text-zinc-500">
                Not enough data
              </div>
            )}
          </Surface>
          <Surface className="h-44 flex flex-col">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Weekly volume</p>
            {volumeSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%" minHeight={150}>
                <AreaChart data={volumeSeries}>
                  <defs>
                    <linearGradient id="volume" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.55} />
                      <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="week" hide />
                  <YAxis hide />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Area type="monotone" dataKey="volume" stroke="#38bdf8" fill="url(#volume)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center pb-8 text-sm text-zinc-500">
                Not enough data
              </div>
            )}
          </Surface>
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Recent PRs</h2>
          <Medal className="text-amber-200" size={18} />
        </div>
        <div className="mt-3 space-y-2">
          {recentPrs.map((pr) => (
            <Surface key={`${pr.exerciseName}-${pr.value}`} className="flex items-center justify-between p-3">
              <div>
                <p className="text-sm font-medium text-white">{pr.exerciseName}</p>
                <p className="text-xs text-zinc-500">{pr.date}</p>
              </div>
              <p className="text-sm font-semibold text-amber-100">{pr.value}</p>
            </Surface>
          ))}
        </div>
      </Card>

      <Card className={`p-4 ${isLastMessageError ? 'bg-red-900/20 border-red-300/20' : 'bg-emerald-900/20 border-emerald-300/20'}`}>
        <div className="flex items-start gap-4">
          <Bot className={isLastMessageError ? 'text-red-300' : 'text-emerald-300'} size={24} />
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-white">
              {isLastMessageError ? "Coach Connection Error" : "Coach's Note"}
            </h2>
            <div className={`mt-2 text-sm leading-6 ${isLastMessageError ? 'text-red-300' : 'text-zinc-300'}`}>
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
                      <ReactMarkdown className="prose prose-invert prose-p:leading-relaxed prose-a:text-emerald-300 max-w-none text-xs text-zinc-400">
                        {nonJson}
                      </ReactMarkdown>
                    ) : null;
                  })() || null}
                  <p className="font-medium text-emerald-300">
                    I've generated a new workout plan for you. Check it out on your dashboard.
                  </p>
                </div>
              ) : (
                lastMessage?.content
              )}
            </div>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => setActiveTab("coach")}
              icon={<ArrowUpRight size={16} />}
            >
              Ask Coach
            </Button>
          </div>
        </div>
      </Card>

      {showSwitchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm p-6 space-y-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-zinc-400 hover:text-white" onClick={() => {
              setShowSwitchModal(false);
              setPlanToActivate(null);
            }}>
              <X size={20} />
            </Button>
            <h2 className="text-xl font-semibold text-white">Switch Active Plan</h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {activeWorkout 
                ? "Switching Active Plan: You have a workout session in progress. Switching plans will discard your current active workout and reset active tracking. Do you want to continue?"
                : "Switching Active Plan: This will recalculate your streaks, consistency, and progress metrics for the new plan. Old progress will be saved separately. Do you want to continue?"}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => {
                setShowSwitchModal(false);
                setPlanToActivate(null);
              }} className="flex-1">
                Cancel
              </Button>
              <Button variant="primary" onClick={async () => {
                if (planToActivate) {
                  await setActiveWorkoutPlanId(planToActivate);
                }
                setShowSwitchModal(false);
                setPlanToActivate(null);
              }} className="flex-1">
                Confirm Switch
              </Button>
            </div>
          </Card>
        </div>
      )}

      {showDeleteModal && planToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm p-6 space-y-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-zinc-400 hover:text-white" onClick={() => {
              setShowDeleteModal(false);
              setPlanToDelete(null);
            }}>
              <X size={20} />
            </Button>
            <h2 className="text-xl font-semibold text-white">Delete Workout Plan</h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
              {activeWorkout && activeWorkout.planId === planToDelete.id
                ? `Are you sure you want to delete the plan "${planToDelete.name}"? You have a workout session in progress for this plan. Deleting it will permanently remove the plan and discard your current active workout.`
                : `Are you sure you want to delete the plan "${planToDelete.name}"? This action cannot be undone and all routines inside this plan will be lost.`}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => {
                setShowDeleteModal(false);
                setPlanToDelete(null);
              }} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onClick={async () => {
                if (planToDelete) {
                  await deleteWorkoutPlan(planToDelete.id);
                }
                setShowDeleteModal(false);
                setPlanToDelete(null);
              }} className="flex-1">
                Delete Plan
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}