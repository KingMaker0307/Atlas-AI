"use client";

import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowLeft,
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
  Square,
  Plus,
  Minus,
  ClipboardList,
  Pencil,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Textarea }
 from "@/components/ui/input";
import { ExerciseDetail } from "@/components/exercise-detail";
import { exercises, getExerciseById } from "@/data/exercises";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Exercise, Routine } from "@/types/domain";
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal";
import { PostWorkoutCheckinModal } from "@/components/post-workout-checkin-modal";
import { FinishSessionModal } from "@/components/finish-session-modal";

export function WorkoutScreen() {
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const restTimerEndsAt = useAtlasStore((state) => state.restTimerEndsAt);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const updateSet = useAtlasStore((state) => state.updateSet);
  const addSet = useAtlasStore((state) => state.addSet);
  const finishWorkout = useAtlasStore((state) => state.finishWorkout);
  const discardWorkout = useAtlasStore((state) => state.discardWorkout);
  const startRestTimer = useAtlasStore((state) => state.startRestTimer);
  const stopRestTimer = useAtlasStore((state) => state.stopRestTimer);
  const adjustRestTimer = useAtlasStore((state) => state.adjustRestTimer);
  const workouts = useAtlasStore((state) => state.workouts);
  const activeSubScreen = useAtlasStore((state) => state.activeSubScreen);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingWorkoutPlanId = useAtlasStore((state) => state.setEditingWorkoutPlanId);
  const deleteWorkoutPlan = useAtlasStore((state) => state.deleteWorkoutPlan);
  const activeWorkoutPlanId = useAtlasStore((state) => state.activeWorkoutPlanId);
  const setActiveWorkoutPlanId = useAtlasStore((state) => state.setActiveWorkoutPlanId);

  // Daily limit check
  const getLocalDateString = (dateOrStr: Date | string) => {
    const d = typeof dateOrStr === "string" ? new Date(dateOrStr) : dateOrStr;
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const todayStr = getLocalDateString(new Date());
  const workoutsToday = workouts.filter((w) => getLocalDateString(w.startedAt) === todayStr);
  const isLimitReached = workoutsToday.length >= 3;

  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [query, setQuery] = useState("");
  const [fatigue, setFatigue] = useState(6);
  const [notes, setNotes] = useState("");
  const [remaining, setRemaining] = useState(0);
  const [elapsedWorkoutTime, setElapsedWorkoutTime] = useState(0);

  // State for pre-workout check-in modal
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState(false);
  const [routineToStart, setRoutineToStart] = useState<Routine | null>(null);

  // State for post-workout check-in modal
  const [showPostWorkoutModal, setShowPostWorkoutModal] = useState(false);
  // State for finish session modal
  const [showFinishSessionModal, setShowFinishSessionModal] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);
  const [planToActivate, setPlanToActivate] = useState<string | null>(null);


  // Effect for rest timer
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

  // Effect for workout duration timer
  useEffect(() => {
    if (!activeWorkout?.startedAt) {
      setElapsedWorkoutTime(0);
      return;
    }

    const workoutStartedAt = new Date(activeWorkout.startedAt).getTime();
    const tickWorkoutDuration = () => {
      setElapsedWorkoutTime(Math.floor((Date.now() - workoutStartedAt) / 1000));
    };

    tickWorkoutDuration(); // Initial call
    const interval = window.setInterval(tickWorkoutDuration, 1000);
    return () => window.clearInterval(interval);
  }, [activeWorkout?.startedAt]);


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

  const handleStartRoutineClick = (routine: Routine) => {
    setRoutineToStart(routine);
    setShowPreWorkoutModal(true);
  };

  const handlePreWorkoutConfirm = (sleepHours: number | undefined) => {
    if (routineToStart) {
      void startWorkout(routineToStart);
    }
    setShowPreWorkoutModal(false);
    setRoutineToStart(null);
  };

  const handleFinishSessionClick = () => {
    setShowFinishSessionModal(true);
  };

  const handleFinishSessionConfirm = (fatigueRating: number, workoutNotes: string) => {
    void finishWorkout(fatigueRating, workoutNotes); // Call finishWorkout here
    setFatigue(fatigueRating);
    setNotes(workoutNotes);
    setShowFinishSessionModal(false);
    setShowPostWorkoutModal(true); // Proceed to PostWorkoutCheckinModal
  };

  const handleFinishSessionDiscard = () => {
    void discardWorkout();
    setShowFinishSessionModal(false);
  };

  const handlePostWorkoutConfirm = (
    energy: number,
    soreness: number,
    stress: number,
    readiness: number,
  ) => {
    // logRecovery is handled within the PostWorkoutCheckinModal
    // finishWorkout is already called in handleFinishSessionConfirm
    setShowPostWorkoutModal(false);
  };

  if (!activeWorkout || activeSubScreen !== "active-workout") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-4 pb-28"
      >
        <section className="flex items-center justify-between">
          <div>
            <p className="text-sm text-zinc-400">Manage and track your plans</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Plans</h1>
          </div>
          <Button
            size="sm"
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => {
              setEditingWorkoutPlanId(null);
              setActiveSubScreen("workout-plan-builder");
            }}
          >
            Create Plan
          </Button>
        </section>

        {activeWorkout && (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-sm flex items-center justify-between">
            <div>
              <p className="font-semibold">Workout in Progress</p>
              <p className="text-zinc-300 text-xs mt-0.5">"{activeWorkout.name}" is currently active in the background.</p>
            </div>
            <Button size="sm" variant="primary" onClick={() => setActiveSubScreen("active-workout")}>
              Resume Workout
            </Button>
          </div>
        )}

        {isLimitReached && !activeWorkout && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle size={18} className="text-amber-400 shrink-0" />
              <span>Daily Workout Limit Reached (3/3)</span>
            </div>
            <p className="text-zinc-300 leading-relaxed">
              You've completed 3 workouts today. Logging more than 3 sessions in a single day increases the risk of overtraining syndrome. This causes excessive muscle damage (rhabdomyolysis), central nervous fatigue, joint strain, and elevated cortisol. Give your body the rest it needs to recover and grow.
            </p>
          </div>
        )}

        {workoutPlans.length === 0 ? (
          <Card className="p-8 text-center flex flex-col items-center justify-center">
            <ClipboardList className="h-12 w-12 text-emerald-300 mb-4" />
            <h2 className="text-xl font-semibold text-white">No workout plans found</h2>
            <p className="text-sm text-zinc-400 mt-2 max-w-sm">
              Create a custom workout plan manually or get help from the AI coach on the Dashboard tab.
            </p>
            <Button
              className="mt-6"
              variant="primary"
              onClick={() => {
                setEditingWorkoutPlanId(null);
                setActiveSubScreen("workout-plan-builder");
              }}
            >
              Create Plan Manually
            </Button>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {workoutPlans.map((plan) => {
              const planWorkouts = workouts.filter((w) => w.planId === plan.id && w.completedAt);
              const completedRoutineNames = new Set(planWorkouts.map((w) => w.name));
              const routinesCount = plan.routines.length;
              const completedCount = plan.routines.filter((r) => completedRoutineNames.has(r.name)).length;
              const progressPercent = routinesCount > 0 ? Math.round((completedCount / routinesCount) * 100) : 0;
              const isActive = plan.id === activeWorkoutPlanId;

              return (
                <Card className="overflow-hidden p-4 flex flex-col justify-between" key={plan.id}>
                  <div>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-xl font-semibold text-white">{plan.name}</h2>
                          {isActive && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Active
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-zinc-400">{plan.goal}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setEditingWorkoutPlanId(plan.id);
                            setActiveSubScreen("workout-plan-builder");
                          }}
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteWorkoutPlan(plan.id)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-zinc-300">
                        {plan.routines.length} {plan.routines.length === 1 ? "routine" : "routines"}
                      </span>
                      {plan.targetDate && (
                        <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10px] text-zinc-300">
                          Target: {plan.targetDate}
                        </span>
                      )}
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
            })}
          </div>
        )}

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Exercise database</h2>
              <p className="text-sm text-zinc-500">Structured cues, safety, and progression tips</p>
            </div>
            <Search className="text-zinc-500" size={18} />
          </div>
          <Input maxLength={100} placeholder="Search movement, muscle, equipment" value={query} onChange={(event) => setQuery(event.target.value)} />
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

        <PreWorkoutCheckinModal
          isOpen={showPreWorkoutModal}
          onClose={() => setShowPreWorkoutModal(false)}
          onConfirm={handlePreWorkoutConfirm}
        />

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
                Switching Active Plan: This will recalculate your streaks, consistency, and progress metrics for the new plan. Old progress will be saved separately. Do you want to continue?
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
      className="space-y-4 pb-32 pt-[calc(10rem+env(safe-area-inset-top))]"
    >
      <Card className="fixed inset-x-0 top-[calc(4rem+env(safe-area-inset-top))] z-20 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="-ml-2 h-8 w-8 text-zinc-400 hover:text-white"
                onClick={() => setActiveSubScreen(null)}
              >
                <ArrowLeft size={16} />
              </Button>
              <p className="text-sm text-zinc-400">Active workout</p>
            </div>
            <h1 className="mt-1 text-2xl font-semibold text-white">{activeWorkout.name}</h1>
            <p className="mt-1 text-xl font-semibold text-emerald-200">
              {formatDuration(elapsedWorkoutTime)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {completedSets}/{totalSets} sets complete
            </p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/10 px-3 py-2 text-center">
              <p className="text-xl font-semibold text-emerald-100">
                {remaining > 0 ? formatTimer(remaining) : "Ready"}
              </p>
              <p className="text-xs text-emerald-200">Rest</p>
            </div>
            {restTimerEndsAt && (
              <div className="flex flex-wrap justify-center gap-1 mt-2">
                <Button size="sm" variant="secondary" onClick={() => void stopRestTimer()}>
                  <Square size={16} className="mr-1" /> Stop
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void adjustRestTimer(-60)}>
                  <Minus size={16} className="mr-1" /> -60s
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void adjustRestTimer(-15)}>
                  <Minus size={16} className="mr-1" /> -15s
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void adjustRestTimer(15)}>
                  <Plus size={16} className="mr-1" /> +15s
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void adjustRestTimer(60)}>
                  <Plus size={16} className="mr-1" /> +60s
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {activeWorkout.exercises.map((workoutExercise, exerciseIndex) => {
        const exercise = getExerciseById(workoutExercise.exerciseId);
        if (!exercise) {
          console.error("WorkoutScreen: Exercise not found for ID:", workoutExercise.exerciseId);
          return null;
        }
        return (
          <Card className="p-4" key={workoutExercise.id}>
            <div className="flex items-start justify-between gap-3">
              <button className="text-left" onClick={() => exercise && setSelectedExercise(exercise)}>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-zinc-500">
                  {workoutExercise.targetSets} x {workoutExercise.targetReps}
                </p>
                <h2 className="mt-1 text-xl font-semibold text-white">{exercise.name}</h2>
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
                    max={100}
                    value={set.reps}
                    onChange={(event) => {
                      const val = Math.min(100, Math.max(0, Number(event.target.value)));
                      void updateSet(workoutExercise.id, set.id, { reps: val });
                    }}
                  />
                  <Input
                    inputMode="decimal"
                    type="number"
                    min={0}
                    max={2000}
                    value={set.weight}
                    onChange={(event) => {
                      const val = Math.min(2000, Math.max(0, Number(event.target.value)));
                      void updateSet(workoutExercise.id, set.id, { weight: val });
                    }}
                  />
                  <Input
                    inputMode="numeric"
                    type="number"
                    min={0}
                    max={10}
                    value={set.rir ?? 2}
                    onChange={(event) => {
                      const val = Math.min(10, Math.max(0, Number(event.target.value)));
                      void updateSet(workoutExercise.id, set.id, { rir: val });
                    }}
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

      <Button className="w-full mt-4" variant="primary" onClick={handleFinishSessionClick}>
        Finish Session
      </Button>

      {selectedExercise ? <ExerciseDetail exercise={selectedExercise} onClose={() => setSelectedExercise(null)} /> : null}

      <PreWorkoutCheckinModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onConfirm={handlePreWorkoutConfirm}
      />

      <FinishSessionModal
        isOpen={showFinishSessionModal}
        onClose={() => setShowFinishSessionModal(false)}
        onConfirm={handleFinishSessionConfirm}
        onDiscard={handleFinishSessionDiscard}
        initialFatigue={fatigue}
        initialNotes={notes}
      />

      <PostWorkoutCheckinModal
        isOpen={showPostWorkoutModal}
        onClose={() => setShowPostWorkoutModal(false)}
        onConfirm={handlePostWorkoutConfirm}
        workoutNotes={notes} // Pass the notes state here
      />
    </motion.div>
  );
}

function formatTimer(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const parts = [];
  if (hours > 0) {
    parts.push(hours.toString());
  }
  parts.push(minutes.toString().padStart(2, "0"));
  parts.push(seconds.toString().padStart(2, "0"));

  return parts.join(":");
}