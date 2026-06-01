import { StateCreator } from "zustand";
import type { AtlasStoreState } from "../useAtlasStore";
import type { Workout, WorkoutPlan, Exercise, Routine, WorkoutSet, WeightUnit } from "@/types/domain";
import { createId, minutesBetween } from "@/lib/id";
import { exercises as staticExercises, getExerciseById as getStaticExerciseById } from "@/data/exercises";

export interface WorkoutSlice {
  workouts: Workout[];
  activeWorkout: Workout | null;
  restTimerEndsAt?: string;
  workoutPlans: WorkoutPlan[];
  activeWorkoutPlanId: string | null;
  editingWorkoutPlanId: string | null;
  editingRoutineId: string | null;
  routineBuilderDefaultDay: string | null;
  exercises: Exercise[];

  setEditingWorkoutPlanId: (id: string | null) => void;
  setEditingRoutineId: (id: string | null) => void;
  setRoutineBuilderDefaultDay: (day: string | null) => void;
  setActiveWorkoutPlanId: (id: string | null) => Promise<void>;
  checkAndAutoStopActiveWorkout: () => Promise<void>;
  startWorkout: (routine: Routine) => Promise<void>;
  addSet: (workoutExerciseId: string) => Promise<void>;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<WorkoutSet>,
  ) => Promise<void>;
  deleteSet: (workoutExerciseId: string, setId: string) => Promise<void>;
  updateExerciseUnit: (workoutExerciseId: string, unit: WeightUnit) => Promise<void>;
  finishWorkout: (fatigueRating?: number, notes?: string) => Promise<void>;
  discardWorkout: () => Promise<void>;
  swapWorkoutExercise: (workoutExerciseId: string, newExerciseId: string) => Promise<void>;
  skipWorkoutExercise: (workoutExerciseId: string) => Promise<void>;
  startRestTimer: (seconds: number) => Promise<void>;
  stopRestTimer: () => Promise<void>;
  adjustRestTimer: (seconds: number) => Promise<void>;
  saveWorkoutPlan: (plan: WorkoutPlan) => Promise<void>;
  deleteWorkoutPlan: (planId: string) => Promise<void>;
  saveRoutine: (planId: string, routine: Routine) => Promise<void>;
  deleteRoutine: (planId: string, routineId: string) => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
}

function recentWeightForExercise(workouts: Workout[], exerciseId: string): number {
  const last = [...workouts]
    .reverse()
    .flatMap((workout) => workout.exercises)
    .find((exercise) => exercise.exerciseId === exerciseId);
  const best = last?.sets
    .filter((set) => set.completed)
    .sort((a, b) => b.weight * b.reps - a.weight * a.reps)[0];
  return best?.weight ?? 0;
}

function buildWorkoutFromRoutine(
  get: () => AtlasStoreState,
  routine: Routine,
  parentPlanId?: string | null
): Workout {
  const state = get();
  const newWorkout: Workout = {
    id: createId("workout"),
    name: routine.name,
    startedAt: new Date().toISOString(),
    planId: parentPlanId || state.activeWorkoutPlanId,
    exercises: routine.exercises.map((exercise) => {
      const exerciseData = get().getExerciseById(exercise.exerciseId);
      const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
      const lastWeight = recentWeightForExercise(state.workouts, exercise.exerciseId);
      const targetReps = Number(exercise.targetReps.match(/\d+/)?.[0] ?? 8);

      const numSets = isCardio ? 1 : exercise.targetSets;

      return {
        id: createId("workout_exercise"),
        exerciseId: exercise.exerciseId,
        targetSets: isCardio ? 1 : exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        sets: Array.from({ length: numSets }).map(() => isCardio ? ({
          id: createId("set"),
          reps: 0,
          weight: 0,
          completed: false,
          durationSeconds: 1800,
          distance: 0,
          incline: 0,
          resistance: 0,
          calories: 0,
        }) : ({
          id: createId("set"),
          reps: targetReps,
          weight: lastWeight,
          rir: 2,
          completed: false,
        })),
      };
    }),
  };
  return newWorkout;
}

export const createWorkoutSlice: StateCreator<
  AtlasStoreState,
  [],
  [],
  WorkoutSlice
> = (set, get) => ({
  workouts: [],
  activeWorkout: null,
  restTimerEndsAt: undefined,
  workoutPlans: [],
  activeWorkoutPlanId: null,
  editingWorkoutPlanId: null,
  editingRoutineId: null,
  routineBuilderDefaultDay: null,
  exercises: staticExercises,

  setEditingWorkoutPlanId: (id) => set({ editingWorkoutPlanId: id }),
  setEditingRoutineId: (id) => set({ editingRoutineId: id }),
  setRoutineBuilderDefaultDay: (day) => set({ routineBuilderDefaultDay: day }),
  
  setActiveWorkoutPlanId: async (id) => {
    const activeWorkout = get().activeWorkout;
    let nextActiveWorkout = activeWorkout;
    let nextRestTimer = get().restTimerEndsAt;
    let nextSubScreen = get().activeSubScreen;
    if (activeWorkout) {
      nextActiveWorkout = null;
      nextRestTimer = undefined;
      if (get().activeSubScreen === "active-workout") {
        nextSubScreen = null;
      }
    }
    set({
      activeWorkoutPlanId: id,
      activeWorkout: nextActiveWorkout,
      restTimerEndsAt: nextRestTimer,
      activeSubScreen: nextSubScreen,
    });
  },

  checkAndAutoStopActiveWorkout: async () => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    const elapsedMs = Date.now() - new Date(activeWorkout.startedAt).getTime();
    const maxMs = 3 * 60 * 60 * 1000; // 3 hours
    if (elapsedMs >= maxMs) {
      const forceStoppedAt = new Date(new Date(activeWorkout.startedAt).getTime() + maxMs).toISOString();
      const completedWorkout = {
        ...activeWorkout,
        notes: "Force stopped: Session exceeded maximum limit of 3 hours.",
        fatigueRating: 5,
        completedAt: forceStoppedAt,
        durationMinutes: 180,
      };
      set({
        workouts: [...get().workouts, completedWorkout],
        activeWorkout: null,
        restTimerEndsAt: undefined,
        aiMessages: [
          ...get().aiMessages,
          {
            id: createId("assistant"),
            role: "assistant",
            createdAt: new Date().toISOString(),
            content: `The active workout "${activeWorkout.name}" was automatically stopped because it exceeded the 3-hour limit.`,
          },
        ],
        activeSubScreen: null,
        workoutTab: "plans",
      });
    }
  },

  getExerciseById: (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      get().exercises.find((exercise) => {
        const exerciseNormId = exercise.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        const hasAliasMatch = exercise.aliases?.some(
          alias => alias.trim().toLowerCase() === id.trim().toLowerCase()
        );
        return (
          exercise.id === id ||
          exerciseNormId === normId ||
          exercise.name.trim().toLowerCase() === id.trim().toLowerCase() ||
          hasAliasMatch
        );
      }) || getStaticExerciseById(id)
    );
  },

  saveWorkoutPlan: async (plan: WorkoutPlan) => {
    const sanitizedPlan = {
      ...plan,
      routines: plan.routines.map(routine => ({
        ...routine,
        exercises: routine.exercises.map(ex => {
          const exerciseData = get().getExerciseById(ex.exerciseId);
          const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
          return isCardio ? { ...ex, targetSets: 1 } : ex;
        })
      }))
    };

    const plans = get().workoutPlans;
    const existing = plans.find(p => p.id === sanitizedPlan.id);
    const nextPlans = existing
      ? plans.map(p => p.id === sanitizedPlan.id ? sanitizedPlan : p)
      : [...plans, sanitizedPlan];

    let activeId = get().activeWorkoutPlanId;
    if (!activeId || nextPlans.length === 1 || !nextPlans.some(p => p.id === activeId)) {
      activeId = nextPlans[0]?.id ?? null;
    }

    set({ workoutPlans: nextPlans, activeWorkoutPlanId: activeId });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.plan.savePlan(uid, sanitizedPlan));
  },

  deleteWorkoutPlan: async (planId: string) => {
    const nextPlans = get().workoutPlans.filter(p => p.id !== planId);
    let activeId = get().activeWorkoutPlanId;
    if (activeId === planId || !activeId || nextPlans.length === 1 || !nextPlans.some(p => p.id === activeId)) {
      activeId = nextPlans[0]?.id ?? null;
    }

    const activeWorkout = get().activeWorkout;
    let nextActiveWorkout = activeWorkout;
    let nextRestTimer = get().restTimerEndsAt;
    let nextSubScreen = get().activeSubScreen;
    if (activeWorkout && activeWorkout.planId === planId) {
      nextActiveWorkout = null;
      nextRestTimer = undefined;
      if (get().activeSubScreen === "active-workout") {
        nextSubScreen = null;
      }
    }

    set({
      workoutPlans: nextPlans,
      activeWorkoutPlanId: activeId,
      activeWorkout: nextActiveWorkout,
      restTimerEndsAt: nextRestTimer,
      activeSubScreen: nextSubScreen,
    });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.plan.deletePlan(uid, planId));
  },

  saveRoutine: async (planId: string, routine: Routine) => {
    const plans = get().workoutPlans;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;

    const sanitizedRoutine = {
      ...routine,
      exercises: routine.exercises.map(ex => {
        const exerciseData = get().getExerciseById(ex.exerciseId);
        const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
        return isCardio ? { ...ex, targetSets: 1 } : ex;
      })
    };

    const existing = plan.routines.find(r => r.id === sanitizedRoutine.id);
    if (existing) {
      plan.routines = plan.routines.map(r => r.id === sanitizedRoutine.id ? sanitizedRoutine : r);
    } else {
      plan.routines.push(sanitizedRoutine);
    }
    set({ workoutPlans: plans.map(p => p.id === planId ? plan : p) });
  },

  deleteRoutine: async (planId: string, routineId: string) => {
    const plans = get().workoutPlans;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    plan.routines = plan.routines.filter(r => r.id !== routineId);
    set({ workoutPlans: plans.map(p => p.id === planId ? plan : p) });
  },

  startWorkout: async (routine) => {
    const workouts = get().workouts;
    const todayStr = new Date().toISOString().split("T")[0];
    const workoutsToday = workouts.filter(
      (w) =>
        w.startedAt.split("T")[0] === todayStr &&
        w.exercises.some((ex) => ex.sets.some((s) => s.completed))
    );

    if (workoutsToday.length >= 3) {
      if (typeof window !== "undefined") {
        window.alert("Daily Limit Reached: You have already logged 3 workouts today.");
      }
      return;
    }

    const plans = get().workoutPlans;
    const parentPlan = plans.find((p) => p.routines.some((r) => r.id === routine.id));
    const parentPlanId = parentPlan ? parentPlan.id : get().activeWorkoutPlanId;

    const newWorkout = buildWorkoutFromRoutine(get, routine, parentPlanId);

    set({
      activeWorkout: newWorkout,
      activeWorkoutPlanId: parentPlanId,
      activeTab: "workout",
      activeSubScreen: "active-workout",
      workoutTab: "plans",
    });
  },

  addSet: async (workoutExerciseId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          const last = exercise.sets.at(-1);
          const exerciseData = get().getExerciseById(exercise.exerciseId);
          const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              isCardio
                ? {
                    id: createId("set"),
                    reps: 0,
                    weight: 0,
                    completed: false,
                    durationSeconds: last?.durationSeconds ?? 1800,
                    distance: last?.distance ?? 0,
                    incline: last?.incline ?? 0,
                    resistance: last?.resistance ?? 0,
                    calories: last?.calories ?? 0,
                  }
                : {
                    id: createId("set"),
                    reps: last?.reps ?? 8,
                    weight: last?.weight ?? 0,
                    rir: last?.rir ?? 2,
                    completed: false,
                  },
            ],
          };
        }),
      },
    });
  },

  updateSet: async (workoutExerciseId, setId, patch) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((workoutSet) =>
              workoutSet.id === setId ? { ...workoutSet, ...patch } : workoutSet,
            ),
          };
        }),
      },
    });
  },

  deleteSet: async (workoutExerciseId, setId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.filter((s) => s.id !== setId),
          };
        }),
      },
    });
  },

  updateExerciseUnit: async (workoutExerciseId, unit) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          return { ...exercise, weightUnit: unit };
        }),
      },
    });
  },

  finishWorkout: async (fatigueRating = 6, notes) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    const completedAt = new Date().toISOString();
    const completedWorkout: Workout = {
      ...activeWorkout,
      notes,
      fatigueRating,
      completedAt,
      durationMinutes: minutesBetween(activeWorkout.startedAt, completedAt),
    };
    set({
      workouts: [...get().workouts, completedWorkout],
      activeWorkout: null,
      restTimerEndsAt: undefined,
      aiMessages: [
        ...get().aiMessages,
        {
          id: createId("assistant"),
          role: "assistant",
          createdAt: new Date().toISOString(),
          content: `Logged ${completedWorkout.name}.`,
        },
      ],
      activeTab: "dashboard",
      activeSubScreen: null,
      workoutTab: "plans",
    });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.workout.saveWorkout(uid, completedWorkout));
  },

  discardWorkout: async () => {
    set({
      activeWorkout: null,
      restTimerEndsAt: undefined,
      activeSubScreen: null,
      workoutTab: "plans",
    });
  },

  swapWorkoutExercise: async (workoutExerciseId, newExerciseId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;

    const exerciseToSwap = activeWorkout.exercises.find((ex) => ex.id === workoutExerciseId);
    if (!exerciseToSwap) return;

    const oldExerciseId = exerciseToSwap.exerciseId;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === workoutExerciseId) {
        return { ...ex, exerciseId: newExerciseId };
      }
      return ex;
    });

    const nextActiveWorkout = {
      ...activeWorkout,
      exercises: updatedExercises,
    };

    let nextWorkoutPlans = get().workoutPlans;
    if (activeWorkout.planId) {
      nextWorkoutPlans = get().workoutPlans.map((plan) => {
        if (plan.id !== activeWorkout.planId) return plan;

        const updatedRoutines = plan.routines.map((routine) => {
          if (routine.name !== activeWorkout.name) return routine;

          const updatedExs = routine.exercises.map((re) => {
            if (re.exerciseId === oldExerciseId) {
              return { ...re, exerciseId: newExerciseId };
            }
            return re;
          });

          return { ...routine, exercises: updatedExs };
        });

        return { ...plan, routines: updatedRoutines };
      });
    }

    set({
      activeWorkout: nextActiveWorkout,
      workoutPlans: nextWorkoutPlans,
    });
  },

  skipWorkoutExercise: async (workoutExerciseId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === workoutExerciseId) {
        const nextSkipped = !ex.skipped;
        return {
          ...ex,
          skipped: nextSkipped,
          sets: ex.sets.map((s) => ({ ...s, completed: false })),
        };
      }
      return ex;
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: updatedExercises,
      },
    });
  },

  startRestTimer: async (seconds) => {
    set({ restTimerEndsAt: new Date(Date.now() + seconds * 1000).toISOString() });
  },

  stopRestTimer: async () => {
    set({ restTimerEndsAt: undefined });
  },

  adjustRestTimer: async (seconds) => {
    const currentEndsAt = get().restTimerEndsAt;
    if (currentEndsAt) {
      const newEndsAt = new Date(new Date(currentEndsAt).getTime() + seconds * 1000).toISOString();
      set({ restTimerEndsAt: newEndsAt });
    } else {
      set({ restTimerEndsAt: new Date(Date.now() + seconds * 1000).toISOString() });
    }
  },
});
