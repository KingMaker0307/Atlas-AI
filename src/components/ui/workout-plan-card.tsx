"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { Dumbbell } from "lucide-react";

interface WorkoutPlanCardProps {
  onBuild: () => void;
}

export function WorkoutPlanCard({ onBuild }: WorkoutPlanCardProps) {
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);

  if (workoutPlans.length === 0) {
    return null;
  }

  const routine = workoutPlans[0].routines[0]; // Default to the first routine of the first plan for now

  return (
    <Card className="p-4">
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
        <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-zinc-300" key={routine.day}>
          {routine.day}
        </span>
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
        {activeWorkout ? "Resume" : "Start"}
      </Button>
    </Card>
  );
}