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
import { cn } from "@/lib/cn";

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
  const routineBuilderDefaultDay = useAtlasStore((state) => state.routineBuilderDefaultDay);
  const setRoutineBuilderDefaultDay = useAtlasStore((state) => state.setRoutineBuilderDefaultDay);

  const [routine, setRoutine] = useState<Routine>(freshRoutine());
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<"all" | "chest" | "back" | "legs" | "core">("all");
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
      // Use the pre-selected day from a rest-day card, or fall back to first available
      const preselectedDay = routineBuilderDefaultDay && !takenDays.has(routineBuilderDefaultDay)
        ? routineBuilderDefaultDay
        : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].find(d => !takenDays.has(d)) || "Monday";
      setRoutine({
        ...freshRoutine(),
        day: preselectedDay,
      });
      // Clear the default day after consuming it
      if (routineBuilderDefaultDay) setRoutineBuilderDefaultDay(null);
    }
  }, [editingWorkoutPlanId, editingRoutineId, workoutPlans]);

  const filteredExercises = exercises.filter((exercise) => {
    // 1. Search term match
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exercise.aliases?.some(alias => alias.toLowerCase().includes(searchTerm.toLowerCase()));
      
    if (!matchesSearch) return false;

    // 2. Category muscle match
    if (activeCategory === "all") return true;

    const muscles = exercise.muscles.map(m => m.toLowerCase());
    if (activeCategory === "chest") {
      return muscles.some(m => m.includes("chest") || m.includes("pectoral") || m.includes("pecs"));
    }
    if (activeCategory === "back") {
      return muscles.some(m => m.includes("lats") || m.includes("latissimus") || m.includes("traps") || m.includes("trapezius") || m.includes("rhomboids") || m.includes("back") || m.includes("erector"));
    }
    if (activeCategory === "legs") {
      return muscles.some(m => m.includes("quad") || m.includes("hamstring") || m.includes("glute") || m.includes("calf") || m.includes("calves") || m.includes("legs") || m.includes("thigh") || m.includes("adductor"));
    }
    if (activeCategory === "core") {
      return muscles.some(m => m.includes("abs") || m.includes("abdominals") || m.includes("obliques") || m.includes("core") || m.includes("transverse"));
    }

    return true;
  });



  const addExerciseToRoutine = (exercise: Exercise) => {
    if (routine.exercises.some((ex) => ex.exerciseId === exercise.id)) {
      return; // Already in routine
    }
    const isCardio = exercise.category === "cardio" || exercise.category === "steady-state";
    setRoutine((prev) => ({
      ...prev,
      exercises: [
        ...prev.exercises,
        {
          exerciseId: exercise.id,
          targetSets: isCardio ? 1 : 3,
          targetReps: isCardio ? "30 mins" : "8-12",
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
                  {(() => {
                    const isCardio = exercise.category === "cardio" || exercise.category === "steady-state";
                    return (
                      <div>
                        <Label>Sets</Label>
                        <Input
                          type="number"
                          min={1}
                          max={20}
                          disabled={isCardio}
                          value={isCardio ? 1 : ex.targetSets}
                          onChange={(e) => handleExerciseDetailChange(ex.exerciseId, "targetSets", Number(e.target.value))}
                        />
                      </div>
                    );
                  })()}
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

        {/* Category Tabs */}
        <div className="mt-3 flex gap-1.5 p-1 bg-zinc-150 dark:bg-zinc-900 border border-card-border rounded-xl select-none overflow-x-auto scrollbar-none">
          {([
            { id: "all" as const, label: "All" },
            { id: "chest" as const, label: "Chest" },
            { id: "back" as const, label: "Back" },
            { id: "legs" as const, label: "Legs" },
            { id: "core" as const, label: "Core" },
          ] as const).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-155 whitespace-nowrap active:scale-[0.98] min-h-[36px]",
                activeCategory === cat.id
                  ? "bg-white dark:bg-zinc-800 text-emerald-650 dark:text-emerald-400 shadow-sm"
                  : "text-zinc-500 hover:text-zinc-850 dark:hover:text-zinc-200"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
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