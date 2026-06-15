import { describe, it, expect, beforeEach } from "vitest";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Routine, Workout } from "@/types/domain";

describe("Smart Auto-Regulatory Progression", () => {
  const dummyRoutine: Routine = {
    id: "routine-1",
    name: "Auto-Reg Leg Day",
    focus: "Legs",
    estimatedMinutes: 45,
    day: "Monday",
    exercises: [
      {
        exerciseId: "squat",
        targetSets: 3,
        targetReps: "8",
        restSeconds: 90,
      },
    ],
  };

  beforeEach(() => {
    useAtlasStore.setState({
      recoveryLogs: [],
      workouts: [],
      activeWorkout: null,
      activeDeloadCycle: false,
      exercises: [
        {
          id: "squat",
          name: "Barbell Squat",
          category: "compound",
          muscles: ["quads"],
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
        },
      ],
    });
  });

  describe("Inter-workout progression / regression starting load calculation", () => {
    it("should carry forward the last weight if no target matches or no past workouts exist", async () => {
      await useAtlasStore.getState().startWorkout(dummyRoutine);

      const active = useAtlasStore.getState().activeWorkout;
      expect(active).toBeDefined();
      expect(active?.exercises[0].sets[0].weight).toBe(0); // fallback weight is 0
    });

    it("should apply progressive overload (+5%) if target reps are hit near failure (RIR <= 1)", async () => {
      const pastWorkout: Workout = {
        id: "w-past",
        name: "Leg Day",
        startedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        exercises: [
          {
            id: "we-past",
            exerciseId: "squat",
            targetSets: 3,
            targetReps: "8",
            restSeconds: 90,
            sets: [
              { id: "s1", reps: 8, weight: 100, rir: 1, completed: true },
              { id: "s2", reps: 8, weight: 100, rir: 1, completed: true },
              { id: "s3", reps: 8, weight: 100, rir: 0, completed: true },
            ],
          },
        ],
      };

      useAtlasStore.setState({ workouts: [pastWorkout] });

      await useAtlasStore.getState().startWorkout(dummyRoutine);

      const active = useAtlasStore.getState().activeWorkout;
      const recommendedWeight = active?.exercises[0].sets[0].weight;
      // 100 * 1.05 = 105
      expect(recommendedWeight).toBe(105);
    });

    it("should drop weight by 10% if targets are missed near failure (RIR <= 1)", async () => {
      const pastWorkout: Workout = {
        id: "w-past",
        name: "Leg Day",
        startedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        exercises: [
          {
            id: "we-past",
            exerciseId: "squat",
            targetSets: 3,
            targetReps: "8",
            restSeconds: 90,
            sets: [
              { id: "s1", reps: 6, weight: 100, rir: 0, completed: true },
              { id: "s2", reps: 6, weight: 100, rir: 0, completed: true },
              { id: "s3", reps: 5, weight: 100, rir: 0, completed: true },
            ],
          },
        ],
      };

      useAtlasStore.setState({ workouts: [pastWorkout] });

      await useAtlasStore.getState().startWorkout(dummyRoutine);

      const active = useAtlasStore.getState().activeWorkout;
      const recommendedWeight = active?.exercises[0].sets[0].weight;
      // 100 * 0.90 = 90
      expect(recommendedWeight).toBe(90);
    });

    it("should increase weight by 5% if last session was too easy (RIR >= 3)", async () => {
      const pastWorkout: Workout = {
        id: "w-past",
        name: "Leg Day",
        startedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        exercises: [
          {
            id: "we-past",
            exerciseId: "squat",
            targetSets: 3,
            targetReps: "8",
            restSeconds: 90,
            sets: [
              { id: "s1", reps: 8, weight: 100, rir: 3, completed: true },
              { id: "s2", reps: 8, weight: 100, rir: 4, completed: true },
              { id: "s3", reps: 8, weight: 100, rir: 3, completed: true },
            ],
          },
        ],
      };

      useAtlasStore.setState({ workouts: [pastWorkout] });

      await useAtlasStore.getState().startWorkout(dummyRoutine);

      const active = useAtlasStore.getState().activeWorkout;
      const recommendedWeight = active?.exercises[0].sets[0].weight;
      // 100 * 1.05 = 105
      expect(recommendedWeight).toBe(105);
    });

    it("should apply deload scaling (-35% sets and weight) when deload is active", async () => {
      // Past session weight = 100
      const pastWorkout: Workout = {
        id: "w-past",
        name: "Leg Day",
        startedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        completedAt: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(),
        exercises: [
          {
            id: "we-past",
            exerciseId: "squat",
            targetSets: 3,
            targetReps: "8",
            restSeconds: 90,
            sets: [
              { id: "s1", reps: 8, weight: 100, rir: 2, completed: true },
            ],
          },
        ],
      };

      useAtlasStore.setState({
        workouts: [pastWorkout],
        activeDeloadCycle: true,
      });

      await useAtlasStore.getState().startWorkout(dummyRoutine);

      const active = useAtlasStore.getState().activeWorkout;
      expect(active).toBeDefined();
      const exercise = active?.exercises[0];
      // Target sets: 3 scaled down to 65% is Math.round(3 * 0.65) = 2 sets
      expect(exercise?.sets.length).toBe(2);
      // Weight: recommended 100 scaled down to 65% is Math.round(100 * 0.65 / 5) * 5 = 65
      expect(exercise?.sets[0].weight).toBe(65);
    });
  });

  describe("Intra-workout Auto-Regulation set adjustments", () => {
    it("should scale down remaining sets by 8% if target reps are missed at RIR 0-1", async () => {
      // Set active workout with target reps "8" and sets weight 100
      const activeWorkout: Workout = {
        id: "active-1",
        name: "Leg Day",
        startedAt: new Date().toISOString(),
        exercises: [
          {
            id: "we-active",
            exerciseId: "squat",
            targetSets: 3,
            targetReps: "8",
            restSeconds: 90,
            sets: [
              { id: "set-1", reps: 8, weight: 100, rir: 2, completed: false },
              { id: "set-2", reps: 8, weight: 100, rir: 2, completed: false },
              { id: "set-3", reps: 8, weight: 100, rir: 2, completed: false },
            ],
          },
        ],
      };

      useAtlasStore.setState({ activeWorkout });

      // Fail target reps on first set (6 reps, RIR = 0)
      await useAtlasStore.getState().updateSet("we-active", "set-1", {
        reps: 6,
        rir: 0,
        completed: true,
      });

      const updatedWorkout = useAtlasStore.getState().activeWorkout;
      const updatedSets = updatedWorkout?.exercises[0].sets;

      expect(updatedSets?.[0].completed).toBe(true);
      expect(updatedSets?.[0].reps).toBe(6);

      // Subsequent sets (2 and 3) should scale down weight to Math.round((100 * 0.92) / 5) * 5 = 90
      expect(updatedSets?.[1].weight).toBe(90);
      expect(updatedSets?.[2].weight).toBe(90);
    });

    it("should scale up remaining sets by 5% if target reps are exceeded significantly at RIR 0-1", async () => {
      const activeWorkout: Workout = {
        id: "active-1",
        name: "Leg Day",
        startedAt: new Date().toISOString(),
        exercises: [
          {
            id: "we-active",
            exerciseId: "squat",
            targetSets: 3,
            targetReps: "8",
            restSeconds: 90,
            sets: [
              { id: "set-1", reps: 8, weight: 100, rir: 2, completed: false },
              { id: "set-2", reps: 8, weight: 100, rir: 2, completed: false },
              { id: "set-3", reps: 8, weight: 100, rir: 2, completed: false },
            ],
          },
        ],
      };

      useAtlasStore.setState({ activeWorkout });

      // Exceed target reps significantly (11 reps, target is 8, which is > 8+2) at RIR = 1
      await useAtlasStore.getState().updateSet("we-active", "set-1", {
        reps: 11,
        rir: 1,
        completed: true,
      });

      const updatedWorkout = useAtlasStore.getState().activeWorkout;
      const updatedSets = updatedWorkout?.exercises[0].sets;

      expect(updatedSets?.[0].completed).toBe(true);
      expect(updatedSets?.[0].reps).toBe(11);

      // Subsequent sets (2 and 3) should scale up weight to Math.round((100 * 1.05) / 5) * 5 = 105
      expect(updatedSets?.[1].weight).toBe(105);
      expect(updatedSets?.[2].weight).toBe(105);
    });
  });
});
