"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { AlertTriangle, ArrowLeft, Plus, Pencil, Trash2, Dumbbell, Play, Info, X, Moon, Sparkles } from "lucide-react";
import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import type { Routine } from "@/types/domain"; // Import Routine type
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal"; // Import the new modal
import { RoutineDayConflictModal } from "@/components/routine-day-conflict-modal"; // Import the conflict modal
import { useState, useMemo } from "react";

export function WorkoutPlanDetailScreen() {
  const storeExercises = useAtlasStore((state) => state.exercises);
  const getExerciseById = (id: string) => {
    return storeExercises.find((e) => e.id === id) || getStaticExerciseById(id);
  };
  const editingWorkoutPlanId = useAtlasStore((state) => state.editingWorkoutPlanId);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingRoutineId = useAtlasStore((state) => state.setEditingRoutineId);
  const deleteRoutine = useAtlasStore((state) => state.deleteRoutine);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const allWorkouts = useAtlasStore((state) => state.workouts);
  const workouts = useMemo(() => {
    return allWorkouts.filter(w => w.exercises.some(ex => ex.sets.some(s => s.completed)));
  }, [allWorkouts]);

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

  // State for pre-workout check-in modal
  const [showPreWorkoutModal, setShowPreWorkoutModal] = useState(false);
  const [routineToStart, setRoutineToStart] = useState<Routine | null>(null);

  // State for routine deletion confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [routineToDelete, setRoutineToDelete] = useState<{ id: string; name: string } | null>(null);

  // States for Schedule Conflict warning modal
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictRoutine, setConflictRoutine] = useState<Routine | null>(null);
  const [conflictingRoutineToday, setConflictingRoutineToday] = useState<Routine | null>(null);

  const plan = workoutPlans.find(p => p.id === editingWorkoutPlanId);

  if (!plan) return null;

  const isReadOnly = plan.creatorType === "template" || plan.creatorType === "ai";
  const startDay = plan.startDay || "Monday";
  const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const idx = DAYS_OF_WEEK.indexOf(startDay);
  const daysSequence = idx === -1 ? DAYS_OF_WEEK : [...DAYS_OF_WEEK.slice(idx), ...DAYS_OF_WEEK.slice(0, idx)];

  const handleStartRoutineClick = (routine: Routine) => {
    setRoutineToStart(routine);
    setShowPreWorkoutModal(true);
  };

  const handleTryStartWorkout = (routine: Routine) => {
    const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    
    if (routine.day.toLowerCase() !== todayDayName.toLowerCase()) {
      // Find if another routine is already scheduled for today in this plan
      const todayRoutine = plan.routines.find(
        (r) => r.day.toLowerCase() === todayDayName.toLowerCase()
      );
      setConflictRoutine(routine);
      setConflictingRoutineToday(todayRoutine || null);
      setShowConflictModal(true);
    } else {
      handleStartRoutineClick(routine);
    }
  };

  const handleStartAnyway = () => {
    setShowConflictModal(false);
    if (conflictRoutine) {
      handleStartRoutineClick(conflictRoutine);
    }
  };

  const handleReorganizeAndStart = async () => {
    setShowConflictModal(false);
    if (!conflictRoutine) return;

    const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" });
    const originalScheduledDay = conflictRoutine.day;

    if (conflictingRoutineToday) {
      // Swap their days
      const updatedConflicting = { ...conflictingRoutineToday, day: originalScheduledDay };
      const updatedCurrent = { ...conflictRoutine, day: todayDayName };
      await useAtlasStore.getState().saveRoutine(plan.id, updatedConflicting);
      await useAtlasStore.getState().saveRoutine(plan.id, updatedCurrent);
    } else {
      // Move this routine to today (since today is a Rest Day)
      const updatedCurrent = { ...conflictRoutine, day: todayDayName };
      await useAtlasStore.getState().saveRoutine(plan.id, updatedCurrent);
    }

    // After reorganization, start the workout!
    handleStartRoutineClick({ ...conflictRoutine, day: todayDayName });
  };

  const handleCancelConflict = () => {
    setShowConflictModal(false);
    setConflictRoutine(null);
    setConflictingRoutineToday(null);
  };

  const handlePreWorkoutConfirm = (sleepHours: number | undefined) => {
    if (routineToStart) {
      void startWorkout(routineToStart);
    }
    setShowPreWorkoutModal(false);
    setRoutineToStart(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-5 pb-28"
    >
      {/* ─── DETAIL HEADER ─── */}
      <section className="flex items-center justify-between p-4 rounded-2xl border border-card-border bg-card shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white rounded-lg hover:bg-zinc-100 dark:hover:bg-white/5" onClick={() => setActiveSubScreen(null)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-foreground leading-tight">{plan.name}</h1>
              <span title="Daily Workout Limit: A maximum of 3 workouts can be logged per day to prevent overtraining and ensure recovery.">
                <Info 
                  size={15} 
                  className="text-zinc-500 hover:text-emerald-500 transition-colors cursor-help" 
                />
              </span>
            </div>
            <p className="text-xs text-zinc-400 pt-0.5">{plan.goal}</p>
          </div>
        </div>
      </section>

      {/* ─── SYSTEM STATUS WARNINGS ─── */}
      {(() => {
        const lastCompletedWorkout = workouts.filter(w => w.completedAt).at(-1);
        if (lastCompletedWorkout?.notes?.includes("Force stopped")) {
          return (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs space-y-1">
              <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
                <AlertTriangle size={16} className="text-rose-400 shrink-0" />
                <span>Last Workout Session Force Stopped</span>
              </div>
              <p className="text-zinc-300 leading-normal">
                Your last session ("{lastCompletedWorkout.name}") was automatically stopped because it exceeded the maximum 3-hour limit.
              </p>
            </div>
          );
        }
        return null;
      })()}

      {isLimitReached && !activeWorkout && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs">
            <AlertTriangle size={16} className="text-amber-400 shrink-0" />
            <span>Daily Workout Limit Reached (3/3)</span>
          </div>
          <p className="text-zinc-400 leading-normal">
            You have logged 3 workouts today. Doing more than 3 sessions a day can trigger overtraining syndrome—causing elevated cortisol, severe muscle strain, and decreased performance. Protect your muscles; your body grows during rest!
          </p>
        </div>
      )}

      {plan.notes && (
        <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-200 text-xs space-y-1.5">
          <div className="flex items-center gap-2 font-bold uppercase tracking-wider text-xs text-purple-300">
            <Sparkles size={16} className="text-purple-400 shrink-0 animate-pulse" />
            <span>AI Coach Periodization & Timeline Directive</span>
          </div>
          <p className="text-zinc-400 leading-relaxed whitespace-pre-line text-xs">
            {plan.notes}
          </p>
        </div>
      )}

      {/* ─── WEEKLY CALENDAR TRAINING GRID ─── */}
      <div className="grid gap-4 md:grid-cols-2">
        {daysSequence.map((day) => {
          const routine = plan.routines.find((r) => r.day.toLowerCase() === day.toLowerCase());

          if (routine) {
            const isThisRoutineActive = activeWorkout && activeWorkout.name === routine.name && activeWorkout.planId === plan.id;
            const isAnotherRoutineActive = activeWorkout && !isThisRoutineActive;

            return (
              <Card className="p-5 flex flex-col justify-between border border-card-border bg-card shadow-md hover:border-white/10 transition-all duration-300 relative group" key={routine.id}>
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3">
                    <div>
                      <span className="text-xs text-emerald-600 dark:text-emerald-400 font-black uppercase tracking-widest bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/20">{day}</span>
                      <h2 className="mt-2 text-xl font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">{routine.name}</h2>
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400 leading-normal">{routine.focus}</p>

                      {/* Rescheduling Dropdown */}
                      <div className="flex items-center gap-2 mt-3.5">
                        <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Schedule:</span>
                        <select
                          value={routine.day}
                          onChange={async (e) => {
                            const newDay = e.target.value;
                            const isDayTaken = plan.routines.some(r => r.day.toLowerCase() === newDay.toLowerCase() && r.id !== routine.id);
                            if (isDayTaken) {
                              const conflictingRoutine = plan.routines.find(r => r.day.toLowerCase() === newDay.toLowerCase() && r.id !== routine.id);
                              if (conflictingRoutine) {
                                const oldDay = routine.day;
                                const updatedConflicting = { ...conflictingRoutine, day: oldDay };
                                const updatedCurrent = { ...routine, day: newDay };
                                await useAtlasStore.getState().saveRoutine(plan.id, updatedConflicting);
                                await useAtlasStore.getState().saveRoutine(plan.id, updatedCurrent);
                                return;
                              }
                            }
                            const updatedRoutine = { ...routine, day: newDay };
                            await useAtlasStore.getState().saveRoutine(plan.id, updatedRoutine);
                          }}
                          className="rounded-lg border border-input-border bg-input px-2.5 py-1 text-xs font-semibold text-foreground focus:outline-none cursor-pointer hover:bg-input-focus-bg transition-colors"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                         <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-500 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white" onClick={() => {
                          setEditingRoutineId(routine.id);
                          setActiveSubScreen("routine-builder");
                        }}>
                          <Pencil size={15} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-8 sm:w-8 text-zinc-500 dark:text-zinc-400 hover:text-rose-500" onClick={() => {
                          setRoutineToDelete({ id: routine.id, name: routine.name });
                          setShowDeleteModal(true);
                        }}>
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Exercises badges grid */}
                  <div className="mt-4 space-y-2">
                    <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Target Exercises</span>
                    <div className="grid gap-2">
                      {routine.exercises.map((item) => {
                        const exDetails = getExerciseById(item.exerciseId);
                        const equipmentName = exDetails?.equipment[0] ?? "other";

                        return (
                          <div
                            className="flex items-center justify-between p-2.5 rounded-xl border border-surface-border bg-surface text-xs shadow-sm"
                            key={item.exerciseId}
                          >
                            <div className="space-y-0.5 max-w-[12rem] sm:max-w-[14rem]">
                              <p className="font-bold text-foreground truncate leading-snug">
                                {exDetails?.name}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-zinc-500 font-bold uppercase">
                                  {equipmentName}
                                </span>
                              </div>
                            </div>
                            
                            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-xs font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
                              {item.targetSets}s x {item.targetReps}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <Button
                  className="mt-5 w-full font-bold shadow"
                  variant={isThisRoutineActive ? "primary" : isAnotherRoutineActive ? "secondary" : "primary"}
                  disabled={!!isAnotherRoutineActive || (isLimitReached && !activeWorkout)}
                  onClick={() => {
                    if (activeWorkout) {
                      setActiveTab("workout");
                      setActiveSubScreen("active-workout");
                      return;
                    }
                    handleTryStartWorkout(routine); // Trigger the conflict check handler
                  }}
                >
                  {isThisRoutineActive ? "Resume Session" : isAnotherRoutineActive ? "Another routine active" : isLimitReached ? "Daily Limit Reached (3/3)" : "Start Training Session"}
                </Button>
              </Card>
            );
          } else {
            // Rest Day block
            return (
              <Card className="p-5 border border-dashed border-violet-500/15 dark:border-violet-500/20 bg-gradient-to-br from-black to-violet-950/20 flex flex-col items-center justify-center min-h-[220px] text-center" key={day}>
                <div className="p-3 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/15 mb-2.5">
                  <Moon size={24} />
                </div>
                <span className="text-xs text-violet-600 dark:text-violet-400 font-black uppercase tracking-widest bg-violet-500/10 px-2.5 py-0.5 rounded border border-violet-500/25 mb-1.5">{day}</span>
                <p className="text-sm font-bold text-foreground mt-1">Rest & CNS Restoration</p>
                <p className="text-xs text-zinc-550 dark:text-zinc-400 max-w-[220px] mt-0.5 leading-normal">
                  Muscle hypertrophy and neural system recovery occur on rest cycles. Focus on targeted hydration and sleep.
                </p>

                {/* Quick Active Recovery cardio launchers */}
                <div className="mt-4 w-full flex flex-col gap-1.5 border-t border-violet-500/10 pt-4">
                  <p className="text-xs text-violet-600 dark:text-violet-300 font-bold uppercase tracking-wider text-left">Quick Active Recovery</p>
                  <div className="grid grid-cols-2 gap-1.5 mt-1">
                    {[
                      { name: "Incline Hike", id: "treadmill-walk-incline", icon: "🏔️" },
                      { name: "Stationary Bike", id: "stationary-bike-moderate", icon: "🚲" },
                      { name: "Elliptical Ride", id: "elliptical-trainer", icon: "🌀" },
                      { name: "Rowing Cardio", id: "rowing-machine", icon: "🚣" },
                    ].map((item) => (
                      <Button
                        key={item.id}
                        variant="ghost"
                        className="h-10 sm:h-8 text-xs sm:text-xs text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white bg-violet-500/5 hover:bg-violet-500/10 dark:hover:bg-violet-500/15 border border-violet-500/10 rounded-lg flex items-center justify-start gap-1.5 px-2.5 sm:px-2 font-semibold transition-all disabled:opacity-50"
                        disabled={isLimitReached}
                        onClick={() => {
                          const quickRoutine: Routine = {
                            id: `quick-cardio-${Date.now()}`,
                            name: `Light Cardio: ${item.name}`,
                            focus: "Active Recovery",
                            estimatedMinutes: 30,
                            day: "Rest Day",
                            exercises: [
                              {
                                exerciseId: item.id,
                                targetSets: 1,
                                targetReps: "30 min LISS",
                                restSeconds: 60,
                              },
                            ],
                          };
                          void startWorkout(quickRoutine);
                          setActiveTab("workout");
                          setActiveSubScreen("active-workout");
                        }}
                      >
                        <span>{item.icon}</span>
                        <span className="truncate">{item.name}</span>
                      </Button>
                    ))}
                  </div>
                  {isLimitReached && (
                    <span className="text-xs text-amber-500 font-bold mt-1 select-none">
                      Daily Limit Reached (3/3 sessions completed)
                    </span>
                  )}
                </div>
              </Card>
            );
          }
        })}

        {/* Add Routine card */}
        {!isReadOnly && plan.routines.length < 7 && (
          <Card className="p-5 flex flex-col items-center justify-center border-dashed border-2 border-card-border hover:border-emerald-500/20 bg-white/[0.005] hover:bg-emerald-500/[0.01] transition-all cursor-pointer min-h-[220px] group"
            onClick={() => {
              setEditingRoutineId(null);
              setActiveSubScreen("routine-builder");
            }}
          >
             <div className="p-3 rounded-full bg-emerald-500/5 text-emerald-500 border border-emerald-500/10 mb-2.5 group-hover:scale-105 transition-transform duration-300">
              <Plus size={28} />
            </div>
            <p className="text-zinc-900 dark:text-white font-bold group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">Add Scheduled Routine</p>
            <p className="text-xs text-zinc-500 text-center mt-0.5 max-w-[200px] leading-normal">Configure a new training routine day for this workout plan.</p>
          </Card>
        )}
      </div>

      <PreWorkoutCheckinModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onConfirm={handlePreWorkoutConfirm}
      />

      <RoutineDayConflictModal
        isOpen={showConflictModal}
        onClose={handleCancelConflict}
        routineName={conflictRoutine?.name ?? ""}
        scheduledDay={conflictRoutine?.day ?? ""}
        currentDay={new Date().toLocaleDateString("en-US", { weekday: "long" })}
        hasConflictWithRoutine={conflictingRoutineToday?.name ?? null}
        onStartAnyway={handleStartAnyway}
        onReorganize={handleReorganizeAndStart}
      />

      {showDeleteModal && routineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm p-6 space-y-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white" onClick={() => {
              setShowDeleteModal(false);
              setRoutineToDelete(null);
            }}>
              <X size={20} />
            </Button>
            <h2 className="text-xl font-semibold text-foreground">Delete Routine</h2>
            <p className="text-zinc-600 dark:text-zinc-300 text-sm leading-relaxed">
              {activeWorkout && activeWorkout.name === routineToDelete.name && activeWorkout.planId === plan.id
                ? `Are you sure you want to delete the routine "${routineToDelete.name}"? You have a workout session in progress for this routine. Deleting it will discard the active session and remove the routine from the plan.`
                : `Are you sure you want to delete the routine "${routineToDelete.name}"? This action cannot be undone and the routine will be removed from your plan.`}
            </p>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => {
                setShowDeleteModal(false);
                setRoutineToDelete(null);
              }} className="flex-1">
                Cancel
              </Button>
              <Button variant="danger" onClick={async () => {
                if (routineToDelete) {
                  if (activeWorkout && activeWorkout.name === routineToDelete.name && activeWorkout.planId === plan.id) {
                    await useAtlasStore.getState().discardWorkout();
                  }
                  await deleteRoutine(plan.id, routineToDelete.id);
                }
                setShowDeleteModal(false);
                setRoutineToDelete(null);
              }} className="flex-1">
                Delete
              </Button>
            </div>
          </Card>
        </div>
      )}
    </motion.div>
  );
}