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

const freshRoutine = (): Routine => ({
  id: createId("routine"),
  name: "New Routine",
  focus: "General",
  estimatedMinutes: 0,
  day: "",
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
  const coachBusy = useAtlasStore((state) => state.coachBusy);
  const generateGlobalExercise = useAtlasStore((state) => state.generateGlobalExercise);

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
      const plan = workoutPlans.find(p => p.id === editingWorkoutPlanId);
      const takenDays = new Set(plan?.routines.map(r => r.day) ?? []);
      const availableDay = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].find(d => !takenDays.has(d)) || "Monday";
      setRoutine({
        ...freshRoutine(),
        day: availableDay,
      });
    }
  }, [editingWorkoutPlanId, editingRoutineId, workoutPlans]);

  const filteredExercises = exercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
  );



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
    const name = routine.name.trim();
    const focus = routine.focus.trim();
    
    if (name.length === 0) {
      setErrorMessage("Routine name is required.");
      return;
    }
    if (name.length > 40) {
      setErrorMessage("Routine name must be 40 characters or less.");
      return;
    }
    if (focus.length > 60) {
      setErrorMessage("Focus must be 60 characters or less.");
      return;
    }
    if (routine.exercises.length === 0) {
      setErrorMessage("A routine must have at least one exercise.");
      return;
    }

    // Validate exercises details
    for (const ex of routine.exercises) {
      const sets = Number(ex.targetSets);
      const reps = ex.targetReps.trim();
      const rest = Number(ex.restSeconds);

      if (isNaN(sets) || sets < 1 || sets > 20) {
        setErrorMessage("Exercise sets must be between 1 and 20.");
        return;
      }
      if (reps.length === 0 || reps.length > 10) {
        setErrorMessage("Exercise reps format must be between 1 and 10 characters (e.g. '8-12').");
        return;
      }
      if (isNaN(rest) || rest < 0 || rest > 3600) {
        setErrorMessage("Exercise rest seconds must be between 0 and 3600.");
        return;
      }
    }

    setErrorMessage(null);

    // Check for day of the week scheduling conflicts
    const activePlan = workoutPlans.find(p => p.id === editingWorkoutPlanId);
    if (activePlan) {
      const isDayTaken = activePlan.routines.some(
        r => r.day.toLowerCase() === routine.day.toLowerCase() && r.id !== routine.id
      );
      if (isDayTaken) {
        const conflictingRoutine = activePlan.routines.find(
          r => r.day.toLowerCase() === routine.day.toLowerCase() && r.id !== routine.id
        );
        const existingRoutine = activePlan.routines.find(r => r.id === editingRoutineId);
        
        if (conflictingRoutine && existingRoutine) {
          // Swap: update conflicting routine to take the edited routine's old day
          const oldDay = existingRoutine.day;
          saveRoutine(editingWorkoutPlanId, {
            ...conflictingRoutine,
            day: oldDay,
          });
        } else {
          setErrorMessage(`A routine is already scheduled for ${routine.day}. Please select another day.`);
          return;
        }
      }
    }

    saveRoutine(editingWorkoutPlanId, {
      ...routine,
      name,
      focus,
    });
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
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-normal text-foreground">
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
          maxLength={40}
          onChange={(e) => setRoutine({ ...routine, name: e.target.value })}
          className="mt-2"
        />
        
        <Label className="mt-4 block">Focus</Label>
        <Input
          value={routine.focus}
          maxLength={60}
          onChange={(e) => setRoutine({ ...routine, focus: e.target.value })}
          className="mt-2"
        />

        <Label className="mt-4 block">Day of the Week</Label>
        <select
          value={routine.day || "Monday"}
          onChange={(e) => setRoutine({ ...routine, day: e.target.value })}
          className="mt-2 block w-full rounded-xl border border-input-border bg-input px-3 py-2 text-sm text-foreground focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        >
          {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map(day => (
            <option key={day} value={day}>{day}</option>
          ))}
        </select>
      </Card>



      <Card className="p-4">
        <h2 className="text-lg font-semibold text-foreground">Exercises</h2>
        {routine.exercises.length === 0 ? (
          <p className="mt-2 text-sm text-zinc-400">No exercises added yet.</p>
        ) : (
          routine.exercises.map((ex) => {
            const exercise = exercises.find((e) => e.id === ex.exerciseId);
            if (!exercise) return null;
            return (
              <Surface key={ex.exerciseId} className="p-3 my-2">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium text-foreground">{exercise.name}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeExerciseFromRoutine(ex.exerciseId)}>
                    Remove
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  <div>
                    <Label>Sets</Label>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      value={ex.targetSets}
                      onChange={(e) => handleExerciseDetailChange(ex.exerciseId, "targetSets", Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <Label>Reps</Label>
                    <Input
                      value={ex.targetReps}
                      maxLength={10}
                      onChange={(e) => handleExerciseDetailChange(ex.exerciseId, "targetReps", e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Rest (s)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={3600}
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
        <h2 className="text-lg font-semibold text-foreground">Search Exercises</h2>
        <Input
          className="mt-3"
          placeholder="Search for exercises..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm.trim().length > 2 && (
          <div className="mt-3 flex items-center justify-between p-3 rounded-2xl border border-purple-500/15 dark:border-purple-500/20 bg-purple-500/5 dark:bg-purple-950/10 select-none">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-bold text-purple-900 dark:text-white leading-none">Can't find "{searchTerm}"?</p>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-1 leading-normal">Our AI Coach can generate its biomechanical profile instantly!</p>
            </div>
            <Button
              size="sm"
              disabled={coachBusy}
              onClick={async () => {
                try {
                  setErrorMessage(null);
                  const generated = await generateGlobalExercise(searchTerm.trim());
                  if (generated) {
                    addExerciseToRoutine(generated);
                    setSearchTerm("");
                  }
                } catch (e: any) {
                  setErrorMessage(e.message || "Failed to generate exercise profile.");
                }
              }}
              className="h-7 text-[10px] font-bold uppercase bg-purple-600 hover:bg-purple-500 border-none shrink-0 text-white"
            >
              {coachBusy ? "Generating..." : "AI Generate"}
            </Button>
          </div>
        )}
        <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
          {filteredExercises.map((exercise, index) => (
            <div key={`${exercise.id}-${index}`} className="flex items-center justify-between rounded-xl bg-surface border border-surface-border p-3">
              <p className="font-medium text-foreground">{exercise.name}</p>
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