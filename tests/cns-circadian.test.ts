import { describe, it, expect, beforeEach } from "vitest";
import { useAtlasStore } from "@/store/useAtlasStore";
import { calculateRecoveryScore } from "@/lib/progression/engine";
import type { RecoveryLog, Workout } from "@/types/domain";

describe("CNS Readiness & Deload Triggers", () => {
  beforeEach(() => {
    // Reset store state
    useAtlasStore.setState({
      recoveryLogs: [],
      workouts: [],
      activeDeloadCycle: false,
    });
  });

  describe("calculateRecoveryScore Formula", () => {
    it("should calculate score correctly with baseline values", () => {
      // sleepHours = 8 (100% sleepFactor)
      // soreness = 0 (100% factor)
      // stress = 0 (100% factor)
      // readiness = 10 (100% factor)
      // energy = 10 (100% factor)
      // expected score = 100
      const perfectLog: RecoveryLog = {
        id: "perfect",
        date: new Date().toISOString(),
        sleepHours: 8,
        soreness: 0,
        stress: 0,
        readiness: 10,
        energy: 10,
      };

      const score = calculateRecoveryScore(perfectLog);
      expect(score).toBe(100);
    });

    it("should return default recovery score (72) for undefined log", () => {
      expect(calculateRecoveryScore(undefined)).toBe(72);
    });

    it("should handle severe exhaustion and output low recovery scores", () => {
      // sleepHours = 4 (50% sleepFactor)
      // soreness = 10 (0% factor)
      // stress = 10 (0% factor)
      // readiness = 1 (10% factor)
      // energy = 1 (10% factor)
      const badLog: RecoveryLog = {
        id: "bad",
        date: new Date().toISOString(),
        sleepHours: 4,
        soreness: 10,
        stress: 10,
        readiness: 1,
        energy: 1,
      };

      const score = calculateRecoveryScore(badLog);
      // sleep: 50 * 0.3 = 15
      // soreness: 0 * 0.18 = 0
      // stress: 0 * 0.16 = 0
      // readiness: 10 * 0.2 = 2
      // energy: 10 * 0.16 = 1.6
      // raw = 15 + 0 + 0 + 2 + 1.6 = 18.6 => Math.round(18.6) = 19
      expect(score).toBe(19);
    });
  });

  describe("checkDeloadTriggers CNS Readiness rule", () => {
    it("should return false when there are no logs", () => {
      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(false);
    });

    it("should return false if there are less than 3 logs, even if scores are < 40%", () => {
      const badLog: RecoveryLog = {
        id: "bad-1",
        date: new Date().toISOString(),
        sleepHours: 4,
        soreness: 9,
        stress: 9,
        readiness: 2,
        energy: 2,
      };

      useAtlasStore.setState({
        recoveryLogs: [badLog, badLog],
      });

      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(false);
    });

    it("should return false if 3 logs exist but only 2 have recovery score < 40%", () => {
      const badLog: RecoveryLog = {
        id: "bad",
        date: new Date().toISOString(),
        sleepHours: 4,
        soreness: 9,
        stress: 9,
        readiness: 2,
        energy: 2,
      };

      const goodLog: RecoveryLog = {
        id: "good",
        date: new Date().toISOString(),
        sleepHours: 8,
        soreness: 2,
        stress: 2,
        readiness: 8,
        energy: 8,
      };

      useAtlasStore.setState({
        recoveryLogs: [badLog, badLog, goodLog],
      });

      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(false);
    });

    it("should return true if last 3 consecutive logs have recovery score < 40%", () => {
      const badLog = (id: string): RecoveryLog => ({
        id,
        date: new Date().toISOString(),
        sleepHours: 4,
        soreness: 9,
        stress: 9,
        readiness: 2,
        energy: 2,
      });

      useAtlasStore.setState({
        recoveryLogs: [badLog("1"), badLog("2"), badLog("3")],
      });

      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(true);
    });
  });

  describe("checkDeloadTriggers Workout Volume crash rule", () => {
    const createCompletedWorkout = (startedAt: string, volume: number): Workout => {
      const reps = 10;
      const weight = volume / 10; // reps * weight = volume
      return {
        id: `w-${startedAt}`,
        name: "Mock Workout",
        startedAt,
        completedAt: startedAt,
        exercises: [
          {
            id: `ex-${startedAt}`,
            exerciseId: "bench-press",
            targetSets: 1,
            targetReps: "10",
            restSeconds: 60,
            sets: [
              {
                id: `set-${startedAt}`,
                reps,
                weight,
                completed: true,
              },
            ],
          },
        ],
      };
    };

    it("should return false if there is no volume crash", () => {
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;

      // Week 1: 1000 volume
      const wWeek1 = createCompletedWorkout(new Date(now.getTime() - 2 * oneDay).toISOString(), 1000);
      // Week 2: 1000 volume
      const wWeek2 = createCompletedWorkout(new Date(now.getTime() - 9 * oneDay).toISOString(), 1000);
      // Week 3: 1000 volume
      const wWeek3 = createCompletedWorkout(new Date(now.getTime() - 16 * oneDay).toISOString(), 1000);

      useAtlasStore.setState({
        workouts: [wWeek3, wWeek2, wWeek1],
      });

      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(false);
    });

    it("should return true if Week 1 volume drops by >35% vs average of Week 2 & Week 3", () => {
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;

      // Week 3 volume = 10000
      const wWeek3 = createCompletedWorkout(new Date(now.getTime() - 16 * oneDay).toISOString(), 10000);
      // Week 2 volume = 10000
      const wWeek2 = createCompletedWorkout(new Date(now.getTime() - 9 * oneDay).toISOString(), 10000);
      // Week 1 volume = 6000 (which is 60% of average 10000, i.e. 40% crash)
      const wWeek1 = createCompletedWorkout(new Date(now.getTime() - 2 * oneDay).toISOString(), 6000);

      useAtlasStore.setState({
        workouts: [wWeek3, wWeek2, wWeek1],
      });

      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(true);
    });

    it("should return false if Week 1 volume drops by less than 35% vs average of Week 2 & Week 3", () => {
      const now = new Date();
      const oneDay = 24 * 60 * 60 * 1000;

      // Week 3 volume = 10000
      const wWeek3 = createCompletedWorkout(new Date(now.getTime() - 16 * oneDay).toISOString(), 10000);
      // Week 2 volume = 10000
      const wWeek2 = createCompletedWorkout(new Date(now.getTime() - 9 * oneDay).toISOString(), 10000);
      // Week 1 volume = 8000 (which is 80% of average 10000, i.e. 20% crash)
      const wWeek1 = createCompletedWorkout(new Date(now.getTime() - 2 * oneDay).toISOString(), 8000);

      useAtlasStore.setState({
        workouts: [wWeek3, wWeek2, wWeek1],
      });

      const trigger = useAtlasStore.getState().checkDeloadTriggers();
      expect(trigger).toBe(false);
    });
  });
});
