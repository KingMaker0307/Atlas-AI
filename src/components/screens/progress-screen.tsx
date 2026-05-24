"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
import { Activity, Battery, LineChartIcon, Save, Scale } from "lucide-react";
import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useForm } from "react-hook-form";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { MetricCard } from "@/components/ui/metric-card";
import { createId, todayKey } from "@/lib/id";
import {
  calculateRecoveryScore,
  getBodyweightSeries,
  getProgressionRecommendations,
  getStrengthSeries,
  getVolumeSeries,
  getWeeklyVolume,
  topExercisesForAnalytics,
} from "@/lib/progression/engine";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Workout } from "@/types/domain";

const recoverySchema = z.object({
  sleepHours: z.number().min(0).max(16),
  soreness: z.number().min(1).max(10),
  stress: z.number().min(1).max(10),
  readiness: z.number().min(1).max(10),
  energy: z.number().min(1).max(10),
  note: z.string().optional(),
});

const bodySchema = z.object({
  bodyweight: z.number().min(0),
  waist: z.number().min(0),
  bodyFat: z.number().min(0).max(80),
});

type RecoveryForm = z.infer<typeof recoverySchema>;
type BodyForm = z.infer<typeof bodySchema>;

export function ProgressScreen() {
  const workouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const bodyMetrics = useAtlasStore((state) => state.bodyMetrics);
  const logRecovery = useAtlasStore((state) => state.logRecovery);
  const logBodyMetric = useAtlasStore((state) => state.logBodyMetric);
  const [selectedExercise, setSelectedExercise] = useState(topExercisesForAnalytics()[0]?.id ?? "bench-press");
  const recoveryScore = calculateRecoveryScore(recoveryLogs.at(-1));
  const volumeSeries = getVolumeSeries(workouts);
  const bodyweightSeries = getBodyweightSeries(bodyMetrics);
  const strengthSeries = getStrengthSeries(workouts, selectedExercise);
  const recommendations = getProgressionRecommendations(workouts, recoveryScore);
  const consistency = useMemo(() => buildConsistencySeries(workouts), [workouts]);

  const recoveryForm = useForm<RecoveryForm>({
    resolver: zodResolver(recoverySchema),
    defaultValues: {
      sleepHours: recoveryLogs.at(-1)?.sleepHours ?? 7.5,
      soreness: recoveryLogs.at(-1)?.soreness ?? 4,
      stress: recoveryLogs.at(-1)?.stress ?? 3,
      readiness: recoveryLogs.at(-1)?.readiness ?? 8,
      energy: recoveryLogs.at(-1)?.energy ?? 7,
      note: "",
    },
  });

  const bodyForm = useForm<BodyForm>({
    resolver: zodResolver(bodySchema),
    defaultValues: {
      bodyweight: bodyMetrics.at(-1)?.bodyweight ?? 0,
      waist: bodyMetrics.at(-1)?.waist ?? 0,
      bodyFat: bodyMetrics.at(-1)?.bodyFat ?? 0,
    },
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28"
    >
      <section>
        <p className="text-sm text-zinc-400">Recovery, body metrics, analytics</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Progress</h1>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <MetricCard
          label="Recovery"
          value={`${recoveryScore}`}
          detail="readiness score"
          icon={<Battery size={18} />}
          tone={recoveryScore > 75 ? "emerald" : recoveryScore > 58 ? "amber" : "rose"}
        />
        <MetricCard
          label="Volume"
          value={Math.round(getWeeklyVolume(workouts)).toLocaleString()}
          detail="last 7 days"
          icon={<Activity size={18} />}
          tone="sky"
        />
      </div>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Strength progression</h2>
            <p className="text-sm text-zinc-500">Estimated 1RM by movement</p>
          </div>
          <LineChartIcon className="text-zinc-500" size={18} />
        </div>
        <Select value={selectedExercise} onChange={(event) => setSelectedExercise(event.target.value)}>
          {topExercisesForAnalytics().map((exercise) => (
            <option key={exercise.id} value={exercise.id}>
              {exercise.name}
            </option>
          ))}
        </Select>
        <div className="mt-4 h-56">
          {strengthSeries.length > 1 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={strengthSeries}>
                <CartesianGrid stroke="#27272a" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} />
                <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                <Line dataKey="estimated1rm" stroke="#6ee7b7" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
             <div className="flex h-full items-center justify-center text-sm text-zinc-500">
               Not enough data
             </div>
          )}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white">Weekly volume</h2>
          <div className="mt-4 h-52">
            {volumeSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeSeries}>
                  <XAxis dataKey="week" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Bar dataKey="volume" radius={[6, 6, 0, 0]} fill="#38bdf8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                 Not enough data
               </div>
            )}
          </div>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white">Bodyweight</h2>
          <div className="mt-4 h-52">
            {bodyweightSeries.length > 1 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bodyweightSeries}>
                  <defs>
                    <linearGradient id="progressBodyweight" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} domain={["dataMin - 2", "dataMax + 2"]} />
                  <Tooltip contentStyle={{ background: "#09090b", border: "1px solid #27272a" }} />
                  <Area dataKey="weight" stroke="#a78bfa" fill="url(#progressBodyweight)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">
                 Not enough data
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Consistency</h2>
        <div className="mt-4 grid grid-cols-7 gap-2">
          {consistency.map((day) => (
            <div key={day.date} className="space-y-1">
              <div
                className={`aspect-square rounded-lg border ${
                  day.trained
                    ? "border-emerald-300/30 bg-emerald-300/80"
                    : "border-white/10 bg-white/[0.055]"
                }`}
              />
              <p className="truncate text-center text-[10px] text-zinc-600">{day.label}</p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Smart progression</h2>
        <div className="mt-3 space-y-2">
          {recommendations.map((item) => (
            <Surface key={item.exerciseId} className="p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium text-white">{item.exerciseName}</p>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300">
                  {item.action.replace("_", " ")}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-400">{item.reason}</p>
            </Surface>
          ))}
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white">Recovery log</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={recoveryForm.handleSubmit(async (values) => {
              await logRecovery({
                id: createId("recovery"),
                date: todayKey(),
                ...values,
              });
            })}
          >
            <div className="grid grid-cols-2 gap-3">
              <Field label="Sleep">
                <Input type="number" step="0.1" {...recoveryForm.register("sleepHours", { valueAsNumber: true })} />
              </Field>
              <Field label="Energy">
                <Input type="number" min={1} max={10} {...recoveryForm.register("energy", { valueAsNumber: true })} />
              </Field>
              <Field label="Soreness">
                <Input type="number" min={1} max={10} {...recoveryForm.register("soreness", { valueAsNumber: true })} />
              </Field>
              <Field label="Stress">
                <Input type="number" min={1} max={10} {...recoveryForm.register("stress", { valueAsNumber: true })} />
              </Field>
            </div>
            <Field label="Readiness">
              <Input type="number" min={1} max={10} {...recoveryForm.register("readiness", { valueAsNumber: true })} />
            </Field>
            <Field label="Note">
              <Textarea {...recoveryForm.register("note")} />
            </Field>
            <Button type="submit" variant="primary" icon={<Save size={16} />}>
              Save recovery
            </Button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="text-lg font-semibold text-white">Body metrics</h2>
          <form
            className="mt-3 space-y-3"
            onSubmit={bodyForm.handleSubmit(async (values) => {
              await logBodyMetric({
                id: createId("body"),
                date: todayKey(),
                ...values,
              });
            })}
          >
            <div className="grid grid-cols-3 gap-3">
              <Field label="Weight">
                <Input type="number" step="0.1" {...bodyForm.register("bodyweight", { valueAsNumber: true })} />
              </Field>
              <Field label="Waist">
                <Input type="number" step="0.1" {...bodyForm.register("waist", { valueAsNumber: true })} />
              </Field>
              <Field label="Body fat">
                <Input type="number" step="0.1" {...bodyForm.register("bodyFat", { valueAsNumber: true })} />
              </Field>
            </div>
            <Surface className="border-dashed border-white/10 text-sm text-zinc-500">
              Progress photo storage is ready for local image attachments in a future build.
            </Surface>
            <Button type="submit" variant="primary" icon={<Scale size={16} />}>
              Save metrics
            </Button>
          </form>
        </Card>
      </div>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function buildConsistencySeries(workouts: Workout[]) {
  const trained = new Set(workouts.map((workout) => workout.startedAt.slice(0, 10)));
  return Array.from({ length: 28 }).map((_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (27 - index));
    const key = date.toISOString().slice(0, 10);
    return {
      date: key,
      label: key.slice(5),
      trained: trained.has(key),
    };
  });
}