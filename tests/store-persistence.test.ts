import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAtlasStore } from "@/store/useAtlasStore";
import { registry } from "@/lib/repositories/registry";
import type { NutritionEntry, Routine, WorkoutPlan, Workout } from "@/types/domain";

describe("Store Persistence Integration", () => {
  const userId = "test-store-user";

  // Mocks for repositories
  const mockNutritionRepo = {
    getEntries: vi.fn(),
    addEntry: vi.fn(async () => {}),
    deleteEntry: vi.fn(),
    deleteEntriesForDate: vi.fn(),
  };

  const mockPlanRepo = {
    getPlans: vi.fn(),
    savePlan: vi.fn(async () => {}),
    deletePlan: vi.fn(),
  };

  const mockWorkoutRepo = {
    getWorkouts: vi.fn(),
    saveWorkout: vi.fn(async () => {}),
    deleteWorkout: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Set user in store
    useAtlasStore.setState({
      user: { id: userId, email: "test@domain.com" },
      workoutPlans: [],
      nutritionEntries: [],
      workouts: [],
      activeWorkout: null,
    });

    // Wire up mock container in the registry
    registry.set(userId, {
      user: {} as any,
      workout: mockWorkoutRepo as any,
      plan: mockPlanRepo as any,
      nutrition: mockNutritionRepo as any,
      water: {} as any,
      body: {} as any,
      recovery: {} as any,
      aiProvider: {} as any,
      subscription: {} as any,
    });
  });

  afterEach(() => {
    registry.clear();
  });

  describe("addNutritionEntries", () => {
    it("should save all batched entries to the repository", async () => {
      const entries: NutritionEntry[] = [
        {
          id: "nutri-1",
          name: "Chicken Breast",
          calories: 165,
          protein: 31,
          carbs: 0,
          fat: 3.6,
          fiber: 0,
          sugar: 0,
          sodium: 74,
          potassium: 256,
          vitaminC: 0,
          calcium: 15,
          iron: 1,
          meal: "lunch",
          servingSize: 1,
          servingUnit: "100g",
          timestamp: new Date().toISOString(),
        },
        {
          id: "nutri-2",
          name: "White Rice",
          calories: 205,
          protein: 4.2,
          carbs: 44,
          fat: 0.4,
          fiber: 0.6,
          sugar: 0.1,
          sodium: 5,
          potassium: 55,
          vitaminC: 0,
          calcium: 16,
          iron: 1.9,
          meal: "lunch",
          servingSize: 1,
          servingUnit: "1 cup",
          timestamp: new Date().toISOString(),
        },
      ];

      await useAtlasStore.getState().addNutritionEntries(entries);

      // Verify store state is updated
      expect(useAtlasStore.getState().nutritionEntries).toContain(entries[0]);
      expect(useAtlasStore.getState().nutritionEntries).toContain(entries[1]);

      // Verify repository save calls
      expect(mockNutritionRepo.addEntry).toHaveBeenCalledTimes(2);
      expect(mockNutritionRepo.addEntry).toHaveBeenNthCalledWith(1, userId, entries[0]);
      expect(mockNutritionRepo.addEntry).toHaveBeenNthCalledWith(2, userId, entries[1]);
    });
  });

  describe("saveRoutine and deleteRoutine", () => {
    const dummyPlan: WorkoutPlan = {
      id: "plan-1",
      name: "Strength Plan",
      goal: "Build Muscle",
      routines: [],
      creatorType: "manual",
      startDay: "Monday",
    };

    const dummyRoutine: Routine = {
      id: "routine-1",
      name: "Leg Day",
      focus: "Quads & Glutes",
      estimatedMinutes: 60,
      day: "Monday",
      exercises: [],
    };

    it("should call plan repository save when saveRoutine is called", async () => {
      useAtlasStore.setState({ workoutPlans: [dummyPlan] });

      await useAtlasStore.getState().saveRoutine("plan-1", dummyRoutine);

      // Verify routine is added in memory
      const plans = useAtlasStore.getState().workoutPlans;
      expect(plans[0].routines).toHaveLength(1);
      expect(plans[0].routines[0].id).toBe("routine-1");

      // Verify repository save
      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(1);
      expect(mockPlanRepo.savePlan).toHaveBeenCalledWith(userId, expect.objectContaining({
        id: "plan-1",
        routines: expect.arrayContaining([expect.objectContaining({ id: "routine-1" })]),
      }));
    });

    it("should call plan repository save when deleteRoutine is called", async () => {
      const planWithRoutine = {
        ...dummyPlan,
        routines: [dummyRoutine],
      };
      useAtlasStore.setState({ workoutPlans: [planWithRoutine] });

      await useAtlasStore.getState().deleteRoutine("plan-1", "routine-1");

      // Verify routine is removed in memory
      const plans = useAtlasStore.getState().workoutPlans;
      expect(plans[0].routines).toHaveLength(0);

      // Verify repository save
      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(1);
      expect(mockPlanRepo.savePlan).toHaveBeenCalledWith(userId, expect.objectContaining({
        id: "plan-1",
        routines: [],
      }));
    });
  });

  describe("checkAndAutoStopActiveWorkout", () => {
    it("should save the completed force-stopped workout to the repository", async () => {
      const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
      const activeWorkout: Workout = {
        id: "active-1",
        name: "Morning Push",
        startedAt: fourHoursAgo,
        exercises: [],
      };

      useAtlasStore.setState({ activeWorkout });

      await useAtlasStore.getState().checkAndAutoStopActiveWorkout();

      // Verify active workout is cleared in memory
      expect(useAtlasStore.getState().activeWorkout).toBeNull();
      // Verify completed workout is added to history in memory
      expect(useAtlasStore.getState().workouts).toHaveLength(1);
      expect(useAtlasStore.getState().workouts[0].id).toBe("active-1");

      // Verify repository save
      expect(mockWorkoutRepo.saveWorkout).toHaveBeenCalledTimes(1);
      expect(mockWorkoutRepo.saveWorkout).toHaveBeenCalledWith(userId, expect.objectContaining({
        id: "active-1",
        notes: expect.stringContaining("Force stopped"),
      }));
    });
  });

  describe("swapWorkoutExercise", () => {
    it("should save the updated plan if the workout has a planId", async () => {
      const dummyPlan: WorkoutPlan = {
        id: "plan-1",
        name: "Strength Plan",
        routines: [
          {
            id: "routine-1",
            name: "Morning Push",
            focus: "Chest",
            estimatedMinutes: 45,
            day: "Monday",
            exercises: [{ exerciseId: "bench-press", targetSets: 3, targetReps: "8-12", restSeconds: 90 }],
          },
        ],
        creatorType: "manual",
        startDay: "Monday",
      };

      const activeWorkout: Workout = {
        id: "active-1",
        name: "Morning Push",
        startedAt: new Date().toISOString(),
        planId: "plan-1",
        exercises: [
          {
            id: "we-1",
            exerciseId: "bench-press",
            targetSets: 3,
            targetReps: "8-12",
            restSeconds: 90,
            sets: [],
          },
        ],
      };

      useAtlasStore.setState({
        workoutPlans: [dummyPlan],
        activeWorkout,
        exercises: [
          { id: "bench-press", name: "Bench Press", category: "compound", muscles: ["chest"], equipment: [], difficulty: "beginner", instructions: [], setup: [], execution: [], breathing: "", tempo: "", commonMistakes: [], safetyTips: [], progressionTips: [] },
          { id: "db-press", name: "Dumbbell Press", category: "compound", muscles: ["chest"], equipment: [], difficulty: "beginner", instructions: [], setup: [], execution: [], breathing: "", tempo: "", commonMistakes: [], safetyTips: [], progressionTips: [] }
        ]
      });

      await useAtlasStore.getState().swapWorkoutExercise("we-1", "db-press");

      // Verify local store updated
      expect(useAtlasStore.getState().activeWorkout?.exercises[0].exerciseId).toBe("db-press");
      const updatedPlan = useAtlasStore.getState().workoutPlans.find(p => p.id === "plan-1");
      expect(updatedPlan?.routines[0].exercises[0].exerciseId).toBe("db-press");

      // Verify repository save called
      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(1);
      expect(mockPlanRepo.savePlan).toHaveBeenCalledWith(userId, expect.objectContaining({
        id: "plan-1",
        routines: expect.arrayContaining([expect.objectContaining({
          exercises: expect.arrayContaining([expect.objectContaining({ exerciseId: "db-press" })])
        })]),
      }));
    });
  });
});
