"use client";

import { motion } from "framer-motion";
import {
  Check,
  ChevronRight,
  CirclePlus,
  Clock3,
  Dumbbell,
  Flame,
  Layers3,
  Search,
  Timer,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea } from "@/components/ui/input";
import { ExerciseDetail } from "@/components/exercise-detail";
import { exercises, getExerciseById } from "@/data/exercises";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Exercise } from "@/types/domain";

export function WorkoutScreen() {
  const routines = useAtlasStore((state) => state.routines);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const restTimerEndsAt = useAtlasStore((state) => state.restTimerEndsAt);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const updateSet = useAtlasStore((state) => state.updateSet);
  const addSet = useAtlasStore((state) => state.addSet);
  const finishWorkout = useAtlasStore((state) => state.finishWorkout);
  const discardWorkout = useAtlasStore((state) => state.discardWorkout);
  const startRestTimer = useAtlasStore((state) => state.startRestTimer);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [query, setQuery] = useState("");
  const [fatigue, setFatigue] = useState(6);
  const [notes, setNotes] = useState("");
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    const tick = () => {
      if (!restTimerEndsAt) {
        setRemaining(0);
        return;
      }
      setRemaining(Math.max(0, Math.ceil((new Date(restTimerEndsAt).getTime() - Date.now()) / 1000)));
    };
    tick();
    const interval = window.setInterval(tick, 1000);
    return () => window.clearInterval(interval);
  }, [restTimerEndsAt]);

  const filteredExercises = useMemo(() => {
    const lowered = query.toLowerCase();
    return exercises.filter((exercise) => {
      return (
        exercise.name.toLowerCase().includes(lowered) ||
        exercise.muscles.some((muscle) => muscle.includes(lowered)) ||
        exercise.equipment.some((equipment) => equipment.includes(lowered))
      );
    });
  }, [query]);

  if (!activeWorkout) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-4 pb-28"
      >
        <section>
          <p className="text-sm text-zinc-400">Plan and log fast</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Workout</h1>
        </section>

        <div className="grid gap-3 md:grid-cols-3">
          {routines.map((routine) => (
            <Card className="p-4" key={routine.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
                    {routine.estimatedMinutes} min
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-white">{routine.name}</h2>
                  <p className="mt-2 text-sm leading-6 text-zinc-400">{routine.focus}</p>
                </div>
                <Dumbbell className="text-zinc-500" size={20} />
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {routine.days.map((day) => (
                  <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300" key={day}>
                    {day}
                  </span>
                ))}
              </div>
              <Button className="mt-4 w-full" variant="primary" onClick={() => void startWorkout(routine)}>
                Start
              </Button>
            </Card>
          ))}
        </div>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Exercise database</h2>
              <p className="text-sm text-zinc-500">Structured cues, safety, and progression tips</p>
            </div>
            <Search className="text-zinc-500" size={18} />
          </div>
          <Input placeholder="Search movement, muscle, equipment" value={query} onChange={(event) => setQuery(event.target.value)} />
          <div className="mt-3 grid gap-2 md:grid-cols-2">
            {filteredExercises.map((exercise) => (
              <button
                className="rounded-xl border border-white/10 bg-white/[0.045] p-3 text-left transition hover:bg-white/10"
                key={exercise.id}
                onClick={() => setSelectedExercise(exercise)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{exercise.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {exercise.muscles.slice(0, 3).join(", ")}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-zinc-500" />
                </div>
              </button>
            ))}
          </div>
        </Card>

        {selectedExercise ? <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} /> : null}
      </motion.div>
    );
  }

  const completedSets = activeWorkout.exercises.reduce(
    (total, exercise) => total + exercise.sets.filter((set) => set.completed).length,
    0,
  );
  const totalSets = activeWorkout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-32"
    >
      <Card className="sticky top-[calc(env(safe-area-inset-top)+0.75rem)] z-20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm text-zinc-400">Active workout</p>
            <h1 className="mt-1 text-2xl font-semibold text-white">{activeWorkout.name}</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {completedSets}/{totalSets} sets complete
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-center">
            <p className="text-xl font-semibold text-emerald-100">
              {remaining > 0 ? formatTimer(remaining) : "Ready"}
            </p>
            <p className="text-xs text-emerald-200">Rest</p>
          </div>
        </div>
      </Card>

      {activeWorkout.exercises.map((workoutExercise, exerciseIndex) => {
        const exercise = getExerciseById(workoutExercise.exerciseId);
        return (
          <Card className="p-4" key={workoutExercise.id}>
            <div className="flex items-start justify-between gap-3">
              <button className="text-left" onClick={() => exercise && setSelectedExercise(exercise)}>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  {workoutExercise.targetSets} x {workoutExercise.targetReps}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">{exercise?.name}</h2>
              </button>
              <div className="flex gap-2">
                {exerciseIndex % 2 === 1 ? (
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                    <Layers3 size={16} />
                  </span>
                ) : null}
                <Button
                  aria-label="Add set"
                  size="icon"
                  variant="ghost"
                  onClick={() => void addSet(workoutExercise.id)}
                >
                  <CirclePlus size={20} />
                </Button>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="grid grid-cols-[2rem_1fr_1fr_1fr_3rem] gap-2 px-1 text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                <span>#</span>
                <span>Reps</span>
                <span>Load</span>
                <span>RIR</span>
                <span />
              </div>
              {workoutExercise.sets.map((set, setIndex) => (
                <div
                  className="grid grid-cols-[2rem_1fr_1fr_1fr_3rem] items-center gap-2 rounded-xl border border-white/10 bg-white/[0.045] p-2"
                  key={set.id}
                >
                  <span className="text-sm font-semibold text-zinc-400">{setIndex + 1}</span>
                  <Input
                    inputMode="numeric"
                    type="number"
                    min={0}
                    value={set.reps}
                    onChange={(event) =>
                      void updateSet(workoutExercise.id, set.id, { reps: Number(event.target.value) })
                    }
                  />
                  <Input
                    inputMode="decimal"
                    type="number"
                    min={0}
                    value={set.weight}
                    onChange={(event) =>
                      void updateSet(workoutExercise.id, set.id, { weight: Number(event.target.value) })
                    }
                  />
                  <Input
                    inputMode="numeric"
                    type="number"
                    min={0}
                    max={5}
                    value={set.rir ?? 2}
                    onChange={(event) =>
                      void updateSet(workoutExercise.id, set.id, { rir: Number(event.target.value) })
                    }
                  />
                  <Button
                    aria-label="Complete set"
                    className={set.completed ? "bg-emerald-300 text-zinc-950 hover:bg-emerald-200" : ""}
                    size="icon"
                    variant={set.completed ? "primary" : "secondary"}
                    onClick={() => {
                      if (navigator.vibrate) navigator.vibrate(12);
                      void updateSet(workoutExercise.id, set.id, { completed: !set.completed });
                      if (!set.completed) void startRestTimer(workoutExercise.restSeconds);
                    }}
                  >
                    <Check size={18} />
                  </Button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                icon={<Flame size={16} />}
                onClick={() => {
                  const last = workoutExercise.sets.at(-1);
                  if (!last) return;
                  void updateSet(workoutExercise.id, last.id, { isDropSet: !last.isDropSet });
                }}
              >
                Dropset
              </Button>
              <Button
                size="sm"
                variant="ghost"
                icon={<Timer size={16} />}
                onClick={() => void startRestTimer(workoutExercise.restSeconds)}
              >
                Rest {Math.round(workoutExercise.restSeconds / 60)}m
              </Button>
            </div>
          </Card>
        );
      })}

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Finish session</h2>
        <div className="mt-3 grid grid-cols-[1fr_7rem] gap-3">
          <div>
            <Label>Notes</Label>
            <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
          </div>
          <div>
            <Label>Fatigue</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={fatigue}
              onChange={(event) => setFatigue(Number(event.target.value))}
            />
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="danger" icon={<Trash2 size={16} />} onClick={() => void discardWorkout()}>
            Discard
          </Button>
          <Button variant="primary" icon={<Clock3 size={16} />} onClick={() => void finishWorkout(fatigue, notes)}>
            Finish
          </Button>
        </div>
      </Card>

      {selectedExercise ? <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} /> : null}
    </motion.div>
  );
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}
