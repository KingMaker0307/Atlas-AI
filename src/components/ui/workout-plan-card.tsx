"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Dumbbell, Plus, Sparkles, Edit, RefreshCcw } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Routine } from "@/types/domain";

interface WorkoutPlanCardProps {
  onBuild: () => void;
}

export function WorkoutPlanCard({ onBuild }: WorkoutPlanCardProps) {
  const routines = useAtlasStore((state) => state.routines);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const getExerciseById = useAtlasStore((state) => state.getExerciseById);
  const saveRoutines = useAtlasStore((state) => state.saveRoutines);
  const [expandedDay, setExpandedDay] = useState<string | null>(routines[0]?.id ?? null);

  if (!routines.length) {
    return (
      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">This Week's Plan</h2>
        <p className="mt-2 text-sm text-zinc-400">
          You don't have a workout plan yet. Create one manually or generate one with your AI Coach.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Button variant="secondary" icon={<Plus size={16} />} onClick={onBuild}>
            Create Manually
          </Button>
          <Button
            variant="primary"
            icon={<Sparkles size={16} />}
            onClick={() => setActiveTab("coach")}
          >
            Generate with AI
          </Button>
        </div>
      </Card>
    );
  }

  const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const scheduledRoutines = routines.sort((a, b) => weekDays.indexOf(a.days[0]) - weekDays.indexOf(b.days[0]));

  const handleReset = async () => {
    await saveRoutines([]);
  };

  return (
    <Card className="overflow-hidden p-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">This Week's Plan</h2>
          <p className="text-sm text-zinc-500">Your weekly training schedule</p>
        </div>
        <div className="flex gap-2">
          <Button size="icon" variant="secondary" onClick={onBuild}>
            <Edit size={16} />
          </Button>
          <Button size="icon" variant="danger" onClick={handleReset}>
            <RefreshCcw size={16} />
          </Button>
        </div>
      </div>
      <div className="mt-4 space-y-2">
        {weekDays.map((day) => {
          const routineForDay = scheduledRoutines.find((r) => r.days.includes(day));
          if (!routineForDay) {
            return (
              <div key={day} className="rounded-xl border border-white/10 bg-white/[0.045] p-3">
                <p className="text-xs text-zinc-400">{day}</p>
                <p className="font-medium text-white">Rest Day</p>
              </div>
            );
          }
          return (
            <div key={routineForDay.id} className="overflow-hidden rounded-xl border border-white/10 bg-white/[0.045]">
              <button
                className="flex w-full items-center justify-between p-3 text-left"
                onClick={() => setExpandedDay(expandedDay === routineForDay.id ? null : routineForDay.id)}
              >
                <div>
                  <p className="text-xs text-emerald-200">{day}</p>
                  <p className="font-medium text-white">{routineForDay.name}</p>
                </div>
                <motion.div animate={{ rotate: expandedDay === routineForDay.id ? 180 : 0 }}>
                  <ChevronDown size={20} className="text-zinc-400" />
                </motion.div>
              </button>
              <AnimatePresence>
                {expandedDay === routineForDay.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-3 pb-3"
                  >
                    <div className="mb-3 space-y-2 border-t border-white/10 pt-3">
                      {routineForDay.exercises.map((item) => (
                        <div key={item.exerciseId} className="flex items-center justify-between">
                          <p className="text-sm text-zinc-200">{getExerciseById(item.exerciseId)?.name}</p>
                          <p className="text-sm text-zinc-400">
                            {item.targetSets} × {item.targetReps}
                          </p>
                        </div>
                      ))}
                    </div>
                    <Button
                      className="w-full"
                      variant="primary"
                      icon={<Dumbbell size={16} />}
                      onClick={() => {
                        if (activeWorkout) {
                          setActiveTab("workout");
                          return;
                        }
                        void startWorkout(routineForDay);
                      }}
                    >
                      {activeWorkout ? "Resume" : "Start Workout"}
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}