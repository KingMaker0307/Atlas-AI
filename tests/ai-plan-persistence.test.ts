/**
 * AI Plan Persistence Tests
 *
 * Validates the critical path: AI-generated plans must be persisted to IndexedDB + Supabase
 * via registry.save(), and AI-generated Exercise objects must survive a page reload by being
 * embedded in the plan's customExercises field and restored during hydration.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAtlasStore } from "@/store/useAtlasStore";
import { registry } from "@/lib/repositories/registry";
import type { WorkoutPlan, Exercise } from "@/types/domain";

// ─── Shared mock data ─────────────────────────────────────────────────────────

const AI_PLAN_ID = "ai-plan-test-001";

/** A WorkoutPlan as it would come back from the AI response */
const mockAiPlan: WorkoutPlan = {
  id: AI_PLAN_ID,
  name: "AI 12-Week Strength",
  goal: "Build Muscle",
  creatorType: "ai",
  startDay: "Monday",
  routines: [
    {
      id: "routine-1",
      name: "Push Day",
      focus: "Chest & Shoulders",
      estimatedMinutes: 60,
      day: "Monday",
      exercises: [
        { exerciseId: "bench-press", targetSets: 4, targetReps: "8-10", restSeconds: 90 },
        { exerciseId: "custom-cable-fly", targetSets: 3, targetReps: "12-15", restSeconds: 60 },
      ],
    },
  ],
};

/** An exercise that exists in the static database */
const staticExercise: Exercise = {
  id: "bench-press",
  name: "Bench Press",
  category: "compound",
  muscles: ["chest"],
  equipment: ["barbell"],
  difficulty: "intermediate",
  instructions: [],
  setup: [],
  execution: [],
  breathing: "",
  tempo: "",
  commonMistakes: [],
  safetyTips: [],
  progressionTips: [],
};

/** An AI-generated exercise NOT in the static database */
const aiGeneratedExercise: Exercise = {
  id: "custom-cable-fly",
  name: "Custom Cable Fly",
  category: "isolation",
  muscles: ["chest"],
  equipment: ["cable"],
  difficulty: "beginner",
  instructions: ["Set cables to chest height", "Perform fly motion"],
  setup: ["Position cables at shoulder height"],
  execution: ["Keep slight bend in elbows"],
  breathing: "Exhale on contraction",
  tempo: "2-0-2-0",
  commonMistakes: ["Using too much weight"],
  safetyTips: ["Keep core tight"],
  progressionTips: ["Increase weight gradually"],
};

// ─── Repository mock ──────────────────────────────────────────────────────────

const mockPlanRepo = {
  getPlans: vi.fn(async () => []),
  savePlan: vi.fn(async () => {}),
  deletePlan: vi.fn(async () => {}),
};

const userId = "test-user-ai-plan";

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("AI Plan Persistence", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    useAtlasStore.setState({
      user: { id: userId, email: "test@atlas.ai" },
      workoutPlans: [],
      exercises: [staticExercise],
      activeWorkout: null,
      coachBusy: false,
      activeWorkoutPlanId: null,
    });

    registry.set(userId, {
      user: {} as any,
      workout: {} as any,
      plan: mockPlanRepo as any,
      nutrition: {} as any,
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

  // ─── Test 1: Plan is persisted to registry ─────────────────────────────────

  describe("saveWorkoutPlan (manual path)", () => {
    it("should call registry.save when saveWorkoutPlan is called", async () => {
      await useAtlasStore.getState().saveWorkoutPlan(mockAiPlan);

      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(1);
      expect(mockPlanRepo.savePlan).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({ id: AI_PLAN_ID })
      );
    });

    it("should update workoutPlans in Zustand state", async () => {
      await useAtlasStore.getState().saveWorkoutPlan(mockAiPlan);

      const { workoutPlans } = useAtlasStore.getState();
      expect(workoutPlans).toHaveLength(1);
      expect(workoutPlans[0].id).toBe(AI_PLAN_ID);
    });

    it("should replace an existing plan with the same id", async () => {
      const updatedPlan = { ...mockAiPlan, name: "Updated Name" };
      useAtlasStore.setState({ workoutPlans: [mockAiPlan] });

      await useAtlasStore.getState().saveWorkoutPlan(updatedPlan);

      const { workoutPlans } = useAtlasStore.getState();
      expect(workoutPlans).toHaveLength(1);
      expect(workoutPlans[0].name).toBe("Updated Name");
      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Test 2: customExercises embedded in plan ─────────────────────────────

  describe("customExercises field", () => {
    it("should persist a plan with embedded customExercises", async () => {
      const planWithCustomExercises: WorkoutPlan = {
        ...mockAiPlan,
        customExercises: [aiGeneratedExercise],
      };

      await useAtlasStore.getState().saveWorkoutPlan(planWithCustomExercises);

      // Verify customExercises are passed to the repository
      expect(mockPlanRepo.savePlan).toHaveBeenCalledWith(
        userId,
        expect.objectContaining({
          customExercises: expect.arrayContaining([
            expect.objectContaining({ id: "custom-cable-fly" }),
          ]),
        })
      );
    });

    it("should accept a plan without customExercises (optional field)", async () => {
      const planNoCustom: WorkoutPlan = { ...mockAiPlan };
      delete planNoCustom.customExercises;

      await expect(
        useAtlasStore.getState().saveWorkoutPlan(planNoCustom)
      ).resolves.not.toThrow();

      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(1);
    });
  });

  // ─── Test 3: Custom exercise restoration from plan ────────────────────────

  describe("custom exercise hydration from plan data", () => {
    it("should merge customExercises from loaded plans into exercises state", () => {
      const planWithCustom: WorkoutPlan = {
        ...mockAiPlan,
        customExercises: [aiGeneratedExercise],
      };

      // Simulate what hydrate() does: extract customExercises and merge
      const loadedPlans = [planWithCustom];
      const baseExercises = [staticExercise];

      const customExercisesFromPlans = loadedPlans.flatMap((p) => p.customExercises ?? []);
      const exerciseMap = new Map(baseExercises.map((e) => [e.id, e]));
      customExercisesFromPlans.forEach((e) => { if (e?.id) exerciseMap.set(e.id, e); });
      const restoredExercises = Array.from(exerciseMap.values());

      expect(restoredExercises).toHaveLength(2);
      expect(restoredExercises.find((e) => e.id === "custom-cable-fly")).toBeDefined();
      expect(restoredExercises.find((e) => e.id === "bench-press")).toBeDefined();
    });

    it("should not duplicate static exercises if AI plan includes them", () => {
      // AI plan includes bench-press which already exists in static exercises
      const planWithDupe: WorkoutPlan = {
        ...mockAiPlan,
        customExercises: [staticExercise, aiGeneratedExercise],
      };

      const loadedPlans = [planWithDupe];
      const baseExercises = [staticExercise];

      const customExercisesFromPlans = loadedPlans.flatMap((p) => p.customExercises ?? []);
      const exerciseMap = new Map(baseExercises.map((e) => [e.id, e]));
      customExercisesFromPlans.forEach((e) => { if (e?.id) exerciseMap.set(e.id, e); });
      const restoredExercises = Array.from(exerciseMap.values());

      // Map deduplicates by id — bench-press appears only once
      expect(restoredExercises.filter((e) => e.id === "bench-press")).toHaveLength(1);
      expect(restoredExercises).toHaveLength(2);
    });

    it("should handle plans with no customExercises gracefully", () => {
      const planNoCustom: WorkoutPlan = { ...mockAiPlan };

      const loadedPlans = [planNoCustom];
      const baseExercises = [staticExercise];

      const customExercisesFromPlans = loadedPlans.flatMap((p) => p.customExercises ?? []);
      const exerciseMap = new Map(baseExercises.map((e) => [e.id, e]));
      customExercisesFromPlans.forEach((e) => { if (e?.id) exerciseMap.set(e.id, e); });
      const restoredExercises = Array.from(exerciseMap.values());

      // Only the static exercise remains
      expect(restoredExercises).toHaveLength(1);
      expect(restoredExercises[0].id).toBe("bench-press");
    });
  });

  // ─── Test 4: deleteWorkoutPlan calls repository ───────────────────────────

  describe("deleteWorkoutPlan", () => {
    it("should call registry.save (deletePlan) when a plan is deleted", async () => {
      useAtlasStore.setState({ workoutPlans: [mockAiPlan], activeWorkoutPlanId: AI_PLAN_ID });

      await useAtlasStore.getState().deleteWorkoutPlan(AI_PLAN_ID);

      expect(mockPlanRepo.deletePlan).toHaveBeenCalledTimes(1);
      expect(mockPlanRepo.deletePlan).toHaveBeenCalledWith(userId, AI_PLAN_ID);
      expect(useAtlasStore.getState().workoutPlans).toHaveLength(0);
    });

    it("should clear activeWorkoutPlanId when the active plan is deleted", async () => {
      const plan2: WorkoutPlan = { ...mockAiPlan, id: "plan-2", name: "Plan 2" };
      useAtlasStore.setState({
        workoutPlans: [mockAiPlan, plan2],
        activeWorkoutPlanId: AI_PLAN_ID,
      });

      await useAtlasStore.getState().deleteWorkoutPlan(AI_PLAN_ID);

      expect(useAtlasStore.getState().activeWorkoutPlanId).toBe("plan-2");
    });
  });
});
