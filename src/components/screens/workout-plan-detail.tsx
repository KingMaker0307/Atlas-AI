"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { AlertTriangle, ArrowLeft, Plus, Pencil, Trash2, Dumbbell, Play, Info } from "lucide-react";
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

  const plan = workoutPlans.find(p => p.id === editingWorkoutPlanId);

  if (!plan) return null;

  const handleStartRoutineClick = (routine: Routine) => {
    setRoutineToStart(routine);
    setShowPreWorkoutModal(true);
  };

  const handlePreWorkoutConfirm = (sleepHours: number | undefined) => {
    if (routineToStart) {
      void startWorkout(routineToStart);
      setActiveSubScreen(null); // Clear sub-screen to show WorkoutScreen
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
                  className="text-zinc-500 hover:text-emerald-300 cursor-pointer transition-colors" 
                />
              </span>
            </div>
            <p className="text-sm text-zinc-400">{plan.goal}</p>
          </div>
        </div>
      </section>

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
        {plan.routines.map((routine) => (
          <Card className="p-4" key={routine.id}>
             <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="mt-2 text-xl font-semibold text-white">{routine.name}</h2>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{routine.focus}</p>
              </div>
              <div className="flex items-center gap-2">
                 <Button variant="ghost" size="icon" onClick={() => {
                  setEditingRoutineId(routine.id);
                  setActiveSubScreen("routine-builder");
                }}>
                  <Pencil size={16} />
                </Button>
                <Button variant="ghost" size="icon" onClick={() => deleteRoutine(plan.id, routine.id)}>
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
            
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {routine.exercises.map((item) => (
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
            
            <Button
              className="mt-4 w-full"
              variant="primary"
              disabled={isLimitReached && !activeWorkout}
              onClick={() => {
                if (activeWorkout) {
                   setActiveTab("workout");
                   setActiveSubScreen("active-workout");
                   return;
                }
                handleStartRoutineClick(routine); // Use the new handler
              }}
            >
               {activeWorkout ? "Resume" : isLimitReached ? "Daily Limit Reached (3/3)" : "Start workout"}
            </Button>
          </Card>
        ))}
        
         <Card className="p-4 flex flex-col items-center justify-center border-dashed border-2 border-white/10 hover:border-white/20 transition cursor-pointer min-h-[200px]"
            onClick={() => {
              setEditingRoutineId(null);
              setActiveSubScreen("routine-builder");
            }}
         >
           <Plus size={32} className="text-emerald-300 mb-2" />
           <p className="text-white font-medium">Add Routine</p>
           <p className="text-sm text-zinc-500 text-center mt-1">Create a new routine for this plan</p>
         </Card>
      </div>

      <PreWorkoutCheckinModal
        isOpen={showPreWorkoutModal}
        onClose={() => setShowPreWorkoutModal(false)}
        onConfirm={handlePreWorkoutConfirm}
      />
    </motion.div>
  );
}