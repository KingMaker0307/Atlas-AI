"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";
import { useState } from "react";
import type { WorkoutPlan } from "@/types/domain";
import { createId } from "@/lib/id";
import { ArrowLeft } from "lucide-react";

export function WorkoutPlanBuilderScreen() {
  const saveWorkoutPlan = useAtlasStore((state) => state.saveWorkoutPlan);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const editingWorkoutPlanId = useAtlasStore((state) => state.editingWorkoutPlanId);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);

  const [plan, setPlan] = useState<WorkoutPlan>(() => {
    if (editingWorkoutPlanId) {
      const existingPlan = workoutPlans.find(p => p.id === editingWorkoutPlanId);
      return existingPlan ? { ...existingPlan } : { id: createId("plan"), name: "New Plan", goal: "", routines: [] };
    }
    return { id: createId("plan"), name: "New Plan", goal: "", routines: [] };
  });

  const handleSave = () => {
    saveWorkoutPlan(plan);
    setActiveSubScreen(null);
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
          <h1 className="text-3xl font-semibold tracking-normal text-white">
            {editingWorkoutPlanId ? "Edit Workout Plan" : "Create Workout Plan"}
          </h1>
        </div>
        <Button onClick={handleSave}>Save</Button>
      </section>

      <Card className="p-4">
        <Label>Plan Name</Label>
        <Input
          value={plan.name}
          onChange={(e) => setPlan({ ...plan, name: e.target.value })}
        />
      </Card>
      
      <Card className="p-4">
        <Label>Goal</Label>
        <Input
          value={plan.goal}
          onChange={(e) => setPlan({ ...plan, goal: e.target.value })}
        />
      </Card>
    </motion.div>
  );
}