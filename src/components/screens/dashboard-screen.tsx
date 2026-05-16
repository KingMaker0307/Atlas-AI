"use client";

import { motion } from "framer-motion";
import {
  Activity,
  ArrowUpRight,
  BatteryCharging,
  Flame,
  Medal,
  Moon,
  TimerReset,
} from "lucide-react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { MetricCard } from "@/components/ui/metric-card";
import { getExerciseById } from "@/data/exercises";
import {
  calculateRecoveryScore,
  getBodyweightSeries,
  getCurrentStreak,
  getFatigueLabel,
  getRecentPrs,
  getVolumeSeries,
  getWeeklyVolume,
} from "@/lib/progression/engine";
import { useAtlasStore } from "@/store/useAtlasStore";

export function DashboardScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const routines = useAtlasStore((state) => state.routines);
  const workouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const bodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const todayRoutine = routines[workouts.length % routines.length];
  const recoveryScore = calculateRecoveryScore(recoveryLogs.at(-1));
  const fatigue = getFatigueLabel(recoveryScore);
  const bodySeries = getBodyweightSeries(bodyMetrics);
  const volumeSeries = getVolumeSeries(workouts);
  const recentPrs = getRecentPrs(workouts);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28"
    >
      <section>
        <p className="text-sm text-zinc-400">Welcome back, {profile?.name ?? "Athlete"}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Today’s coach read</h1>
      </section>

      <Card className="overflow-hidden p-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">Today</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{todayRoutine?.name}</h2>
            <p className="mt-1 max-w-[18rem] text-sm leading-6 text-zinc-400">{todayRoutine?.focus}</p>
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-right">
            <p className="text-2xl font-semibold text-emerald-100">{recoveryScore}</p>
            <p className="text-xs text-emerald-200">Recovery</p>
          </div>
        </div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
          {todayRoutine?.exercises.map((item) => (
            <div
              className="min-w-36 rounded-xl border border-white/10 bg-white/[0.045] p-3"
              key={item.exerciseId}
            >
              <p className="line-clamp-1 text-sm font-medium text-white">
                {getExerciseById(item.exerciseId)?.name}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {item.targetSets} sets · {item.targetReps}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button
            variant="primary"
            onClick={() => {
              if (activeWorkout) {
                setActiveTab("workout");
                return;
              }
              void startWorkout(todayRoutine);
            }}
          >
            {activeWorkout ? "Resume" : "Start workout"}
          </Button>
          <Button variant="secondary" onClick={() => setActiveTab("coach")} icon={<ArrowUpRight size={16} />}>
            Ask coach
          </Button>
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Streak"
          value={`${getCurrentStreak(workouts)}d`}
          detail="training days"
          icon={<Flame size={18} />}
          tone="amber"
        />
        <MetricCard
          label="Volume"
          value={Math.round(getWeeklyVolume(workouts)).toLocaleString()}
          detail="this week"
          icon={<Activity size={18} />}
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
          <Surface className="h-44">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Bodyweight</p>
            <ResponsiveContainer width="100%" height="85%">
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
          </Surface>
          <Surface className="h-44">
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">Weekly volume</p>
            <ResponsiveContainer width="100%" height="85%">
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

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Coach summary</h2>
        <p className="mt-2 text-sm leading-6 text-zinc-300">{aiMessages.at(-1)?.content}</p>
      </Card>
    </motion.div>
  );
}
