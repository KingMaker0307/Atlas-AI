"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";
import { useState, useEffect } from "react";
import type { Routine, Exercise } from "@/types/domain";
import { createId } from "@/lib/id";
import { ArrowLeft, AlertCircle } from "lucide-react";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const freshRoutine = (): Routine => ({
  id: createId("routine"),
  name: "New Routine",
  focus: "General",
  estimatedMinutes: 0,
  day: "Sunday",
  exercises: [],
});

export function RoutineBuilderScreen() {
  const exercises = useAtlasStore((state) => state.exercises);
  const saveRoutine = useAtlasStore((state) => state.saveRoutine);
  const editingWorkoutPlanId = useAtlasStore((state) => state.editingWorkoutPlanId);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const setActiveSubScreen = useAtlasStore((state) => state.setActiveSubScreen);
  const editingRoutineId = useAtlasStore((state) => state.editingRoutineId);
  const setEditingRoutineId = useAtlasStore((state) => state.setEditingRoutineId);

  const [routine, setRoutine] = useState<Routine>(freshRoutine());
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (editingWorkoutPlanId && editingRoutineId) {
      const plan = workoutPlans.find(p => p.id === editingWorkoutPlanId);
      const existingRoutine = plan?.routines.find((r) => r.id === editingRoutineId);
      if (existingRoutine) {
        setRoutine(existingRoutine);
      }
    } else {
      setRoutine(freshRoutine());
    }
  }, [editingWorkoutPlanId, editingRoutineId, workoutPlans]);

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const setDay = (day: string) => {
    setRoutine((prev) => ({ ...prev, day }));
  };

  const addExerciseToRoutine = (exercise: Exercise) => {
    if (routine.exercises.some((ex) => ex.exerciseId === exercise.id)) {
      return; // Already in routine
    }
    setRoutine((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exerciseId: exercise.id,
          targetSets: 3,
          targetReps: "8-12",
          restSeconds: 60,
        },
      ],
    }));
  };

  const handleExerciseDetailChange = (exerciseId: string, field: string, value: string | number) => {
    setRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.map((ex) =>
        ex.exerciseId === exerciseId ? { ...ex, [field]: value } : ex
      ),
    }));
  };

  const removeExerciseFromRoutine = (exerciseId: string) => {
    setRoutine((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((ex) => ex.exerciseId !== exerciseId),
    }));
  };

  const handleSave = () => {
    if (!editingWorkoutPlanId) {
      setErrorMessage("No workout plan selected.");
      return;
    }
    if (routine.exercises.length === 0) {
      setErrorMessage("A routine must have at least one exercise.");
      return;
    }
    setErrorMessage(null);

    saveRoutine(editingWorkoutPlanId, routine);
    setEditingRoutineId(null);
    setActiveSubScreen("workout-plan-detail");
  };
  
  const handleBack = () => {
    setEditingRoutineId(null);
    setActiveSubScreen("workout-plan-detail");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28"
    >
      <section className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft size={20} />
          </Button>
          <h1 className="text-3xl font-semibold tracking-normal text-white">
            {editingRoutineId ? "Edit Routine" : "Create Routine"}
          </h1>
        </div>
        <Button onClick={handleSave}>Save</Button>
      </section>

      {errorMessage && (
        <Card className="p-4 border-red-500/50 bg-red-900/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="text-red-400" size={20} />
            <p className="text-red-400 text-sm font-medium">{errorMessage}</p>
          </div>
        </Card>
      )}

      <Card className="p-4">
        <Label>Routine Name</Label>
        <Input
          value={routine.name}
          onChange={(e) => setRoutine({ ...routine, name: e.target.value })}
          className="mt-2"
        />
        
        <Label className="mt-4 block">Focus</Label>
        <Input
          value={routine.focus}
          onChange={(e) => setRoutine({ ...routine, focus: e.target.value })}
          className="mt-2"
        />
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Assign Day</h2>
        <div className="mt-3 grid grid-cols-4 gap-2">
          {daysOfWeek.map((day) => (
            <Button
              key={day}
              variant={routine.day === day ? "primary" : "secondary"}
              onClick={() => setDay(day)}
            >
              {day.substring(0, 3)}
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Exercises</h2>
        {routine.exercises.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No exercises added yet.</p>
        ) : (
          routine.exercises.map((ex) => {
            const exercise = exercises.find((e) => e.id === ex.exerciseId);
            if (!exercise) return null;
            return (
              <Surface key={ex.exerciseId} className="p-3 my-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-white">{exercise.name}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeExerciseFromRoutine(ex.exerciseId)}>
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      value={ex.targetSets}
                      onChange={(e) => handleExerciseDetailChange(ex.exerciseId, "targetSets", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Reps</Label>
                    <Input
                      value={ex.targetReps}
                      onChange={(e) => handleExerciseDetailChange(ex.exerciseId, "targetReps", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Rest (s)</Label>
                    <Input
                      type="number"
                      value={ex.restSeconds}
                      onChange={(e) => handleExerciseDetailChange(ex.exerciseId, "restSeconds", Number(e.target.value))}
                    />
                  </div>
                </div>
              </Surface>
            );
          })
        )}
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Search Exercises</h2>
        <Input
          className="mt-3"
          placeholder="Search for exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {filteredExercises.map((exercise, index) => (
            <div key={`${exercise.id}-${index}`} className="flex items-center justify-between rounded-lg bg-zinc-800 p-3">
              <p className="font-medium text-white">{exercise.name}</p>
              <Button size="sm" variant="secondary" onClick={() => addExerciseToRoutine(exercise)} disabled={routine.exercises.some(ex => ex.exerciseId === exercise.id)}>
                {routine.exercises.some(ex => ex.exerciseId === exercise.id) ? "Added" : "Add"}
              </Button>
            </div>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}