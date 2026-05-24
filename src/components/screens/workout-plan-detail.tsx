"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { ArrowLeft, Plus, Pencil, Trash2, Dumbbell, Play } from "lucide-react";
import { getExerciseById } from "@/data/exercises";

export function WorkoutPlanDetailScreen() {
  const editingWorkoutPlanId = useAtlasStore((state) => state.editingWorkoutPlanId);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const setEditingRoutineId = useAtlasStore((state) => state.setEditingRoutineId);
  const deleteRoutine = useAtlasStore((state) => state.deleteRoutine);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);

  const plan = workoutPlans.find(p => p.id === editingWorkoutPlanId);

  if (!plan) return null;

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
            <h1 className="text-3xl font-semibold tracking-normal text-white">{plan.name}</h1>
            <p className="text-sm text-zinc-400">{plan.goal}</p>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-2">
        {plan.routines.map((routine) => (
          <Card className="p-4" key={routine.id}>
             <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.12em] text-emerald-200">
                  {routine.day || "No day assigned"}
                </p>
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
              onClick={() => {
                if (activeWorkout) {
                   setActiveTab("workout");
                   return;
                }
                void startWorkout(routine);
              }}
            >
               {activeWorkout ? "Resume" : "Start workout"}
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
    </motion.div>
  );
}