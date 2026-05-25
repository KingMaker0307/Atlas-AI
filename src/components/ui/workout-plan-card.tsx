"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useAtlasStore } from "@/store/useAtlasStore";
import { AlertTriangle, Dumbbell } from "lucide-react";

interface WorkoutPlanCardProps {
  onBuild: () => void;
}

export function WorkoutPlanCard({ onBuild }: WorkoutPlanCardProps) {
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const startWorkout = useAtlasStore((state) => state.startWorkout);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const setActiveTab = useAtlasStore((state) => state.setActiveTab);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const workouts = useAtlasStore((state) => state.workouts);

  if (workoutPlans.length === 0) {
    return null;
  }

  const routine = workoutPlans[0].routines[0]; // Default to the first routine of the first plan for now

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
          void startWorkout(routine);
        }}
      >
        {activeWorkout ? "Resume" : isLimitReached ? "Daily Limit Reached (3/3)" : "Start"}
      </Button>

      {!activeWorkout && !isLimitReached && (
        <p className="text-[10px] text-zinc-505 dark:text-zinc-500 mt-2 text-center">
          Note: Sessions have a maximum duration of 3 hours.
        </p>
      )}

      {isLimitReached && !activeWorkout && (
        <div className="mt-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-200 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-semibold">
            <AlertTriangle size={14} className="text-amber-400 shrink-0" />
            <span>Overtraining Warning</span>
          </div>
          <p className="text-zinc-300 leading-relaxed">
            You've completed 3 workouts today. Performing more than 3 high-intensity sessions in a single day is not recommended. Excessive training increases the risk of muscle breakdown (rhabdomyolysis), central nervous fatigue, and chronic joint strain. Prioritize recovery today.
          </p>
        </div>
      )}
    </Card>
  );
}