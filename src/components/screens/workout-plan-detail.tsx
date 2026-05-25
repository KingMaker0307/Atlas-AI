"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { AlertTriangle, ArrowLeft, Plus, Pencil, Trash2, Dumbbell, Play, Info, X, Moon } from "lucide-react";
import { getExerciseById } from "@/data/exercises";
import type { Routine } from "@/types/domain"; // Import Routine type
import { PreWorkoutCheckinModal } from "@/components/pre-workout-checkin-modal"; // Import the new modal
import { useState } from "react"; // Import useState

export function WorkoutPlanDetailScreen() {
  const editingWorkoutPlanId = useAtlasStore((state) => state.editingWorkoutPlanId);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingRoutineId = useAtlasStore((state) => state.setEditingRoutineId);
  const deleteRoutine = useAtlasStore((state) => state.deleteRoutine);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const workouts = useAtlasStore((state) => state.workouts);

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
      className="space-y-4 pb-28"
    >
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => setActiveSubScreen(null)}>
            <ArrowLeft size={20} />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-semibold tracking-normal text-white">{plan.name}</h1>
              <span title="Daily Workout Limit: A maximum of 3 workouts can be logged per day to prevent overtraining and ensure recovery.">
                <Info 
                  size={16} 
                  className="text-zinc-500 hover:text-emerald-300 transition-colors" 
                />
              </span>
            </div>
            <p className="text-sm text-zinc-400">{plan.goal}</p>
          </div>
        </div>
      </section>

      {(() => {
        const lastCompletedWorkout = workouts.filter(w => w.completedAt).at(-1);
        if (lastCompletedWorkout?.notes?.includes("Force stopped")) {
          return (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-sm space-y-1">
              <div className="flex items-center gap-2 font-semibold">
                <AlertTriangle size={18} className="text-rose-400 shrink-0" />
                <span>Last Workout Force Stopped</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-xs">
                Your last session ("{lastCompletedWorkout.name}") was automatically stopped because it exceeded the maximum 3-hour limit.
              </p>
            </div>
          );
        }
        return null;
      })()}

      {isLimitReached && !activeWorkout && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-sm space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <AlertTriangle size={18} className="text-amber-400 shrink-0" />
            <span>Daily Workout Limit Reached (3/3)</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            You've logged 3 workouts today. Doing more than 3 sessions a day can trigger overtraining syndrome—causing elevated cortisol, severe muscle strain, and decreased performance. Protect your muscles and joints; your body grows during rest, not work!
          </p>
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {daysSequence.map((day) => {
          const routine = plan.routines.find((r) => r.day.toLowerCase() === day.toLowerCase());

          if (routine) {
            const isThisRoutineActive = activeWorkout && activeWorkout.name === routine.name && activeWorkout.planId === plan.id;
            const isAnotherRoutineActive = activeWorkout && !isThisRoutineActive;

            return (
              <Card className="p-4 flex flex-col justify-between" key={routine.id}>
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] text-emerald-450 font-bold uppercase tracking-wider bg-emerald-500/10 px-2 py-0.5 rounded-full">{day}</span>
                      <h2 className="mt-2 text-xl font-semibold text-white">{routine.name}</h2>
                      <p className="mt-1 text-sm leading-relaxed text-zinc-400">{routine.focus}</p>

                      {/* Rescheduling Selector */}
                      <div className="flex items-center gap-2 mt-3">
                        <span className="text-[11px] text-zinc-500 font-semibold uppercase">Reschedule:</span>
                        <select
                          value={routine.day}
                          onChange={async (e) => {
                            const newDay = e.target.value;
                            const isDayTaken = plan.routines.some(r => r.day.toLowerCase() === newDay.toLowerCase() && r.id !== routine.id);
                            if (isDayTaken) {
                              alert(`There is already a routine scheduled on ${newDay}. Please reschedule that routine first.`);
                              return;
                            }
                            const updatedRoutine = { ...routine, day: newDay };
                            await useAtlasStore.getState().saveRoutine(plan.id, updatedRoutine);
                          }}
                          className="rounded-lg border border-white/10 bg-zinc-900 px-2 py-0.5 text-xs text-zinc-300 focus:outline-none cursor-pointer"
                        >
                          {DAYS_OF_WEEK.map(d => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {!isReadOnly && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => {
                          setEditingRoutineId(routine.id);
                          setActiveSubScreen("routine-builder");
                        }}>
                          <Pencil size={16} />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => {
                          setRoutineToDelete({ id: routine.id, name: routine.name });
                          setShowDeleteModal(true);
                        }}>
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
                    {routine.exercises.map((item) => (
                      <div
                        className="min-w-36 rounded-xl border border-white/10 bg-white/[0.045] p-3 animate-fade-in"
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
                </div>

                <Button
                  className="mt-5 w-full"
                  variant={isThisRoutineActive ? "primary" : isAnotherRoutineActive ? "secondary" : "primary"}
                  disabled={!!isAnotherRoutineActive || (isLimitReached && !activeWorkout)}
                  onClick={() => {
                    if (activeWorkout) {
                      setActiveTab("workout");
                      setActiveSubScreen("active-workout");
                      return;
                    }
                    handleStartRoutineClick(routine); // Use the new handler
                  }}
                >
                  {isThisRoutineActive ? "Resume" : isAnotherRoutineActive ? "Another routine active" : isLimitReached ? "Daily Limit Reached (3/3)" : "Start workout"}
                </Button>
              </Card>
            );
          } else {
            // Render Rest Day block
            return (
              <Card className="p-4 border border-dashed border-white/5 bg-white/[0.01] flex flex-col items-center justify-center min-h-[160px] text-center" key={day}>
                <Moon className="text-zinc-650 mb-1" size={24} />
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-full mb-1">{day}</span>
                <p className="text-sm font-semibold text-zinc-400 mt-1">Rest & Recovery</p>
                <p className="text-[11px] text-zinc-500 max-w-[200px] mt-0.5">Let your muscles rebuild and recover today.</p>
              </Card>
            );
          }
        })}

        {/* Render Add Routine card only for manual plans and if count < 7 */}
        {!isReadOnly && plan.routines.length < 7 && (
          <Card className="p-4 flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-white/20 transition cursor-pointer min-h-[160px]"
            onClick={() => {
              setEditingRoutineId(null);
              setActiveSubScreen("routine-builder");
            }}
          >
            <Plus size={32} className="text-emerald-300 mb-2" />
            <p className="text-white font-medium">Add Routine</p>
            <p className="text-sm text-zinc-500 text-center mt-1">Create a new routine for this plan</p>
          </Card>
        )}
      </div>

      <PreWorkoutCheckinModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onConfirm={handlePreWorkoutConfirm}
      />

      {showDeleteModal && routineToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="w-full max-w-sm p-6 space-y-4 relative">
            <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-zinc-400 hover:text-white" onClick={() => {
              setShowDeleteModal(false);
              setRoutineToDelete(null);
            }}>
              <X size={20} />
            </Button>
            <h2 className="text-xl font-semibold text-white">Delete Routine</h2>
            <p className="text-zinc-300 text-sm leading-relaxed">
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