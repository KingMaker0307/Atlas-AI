import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateRecoveryScore,
  calculateWorkoutVolume,
  getWeeklyVolume,
  estimateOneRepMax,
  getCurrentStreak,
  getTrainingConsistency,
  getProgressionRecommendations,
  getFatigueLabel,
} from "./engine";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { Workout, RecoveryLog, WorkoutExercise } from "@/types/domain";

describe("progression/engine.ts business logic", () => {
  beforeEach(() => {
    // Reset store state with properly typed static exercises
    useAtlasStore.setState({
      exercises: [
        {
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
        },
        {
          id: "barbell-back-squat",
          name: "Barbell Back Squat",
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

  describe("calculateRecoveryScore", () => {
    it("should return 72 when no log is provided", () => {
      expect(calculateRecoveryScore(undefined)).toBe(72);
    });

    it("should return high score (fresh) for optimal recovery conditions", () => {
      const log: RecoveryLog = {
        id: "log-1",
        date: "2026-06-01",
        sleepHours: 8,
        soreness: 2, // low soreness
        stress: 1, // low stress
        readiness: 9, // high readiness
        energy: 9, // high energy
      };
      expect(calculateRecoveryScore(log)).toBe(91);
    });

    it("should return low score (high fatigue) for poor recovery conditions", () => {
      const log: RecoveryLog = {
        id: "log-2",
        date: "2026-06-01",
        sleepHours: 5,
        soreness: 8, // high soreness
        stress: 8, // high stress
        readiness: 3,
        energy: 3,
      };
      expect(calculateRecoveryScore(log)).toBe(36);
    });
  });

  describe("calculateWorkoutVolume", () => {
    it("should return 0 for empty or uncompleted sets", () => {
      const workout: Workout = {
        id: "w-1",
        name: "Upper A",
        startedAt: "2026-06-01T12:00:00Z",
        exercises: [
          {
            id: "we-1",
            exerciseId: "bench-press",
            targetSets: 3,
            targetReps: "8-10",
            restSeconds: 90,
            sets: [
              { id: "s-1", reps: 8, weight: 135, completed: false },
              { id: "s-2", reps: 8, weight: 135, completed: false },
            ],
          },
        ],
      };
      expect(calculateWorkoutVolume(workout)).toBe(0);
    });

    it("should calculate correct volume for completed sets only", () => {
      const workout: Workout = {
        id: "w-2",
        name: "Upper A",
        startedAt: "2026-06-01T12:00:00Z",
        exercises: [
          {
            id: "we-2",
            exerciseId: "bench-press",
            targetSets: 3,
            targetReps: "8-10",
            restSeconds: 90,
            sets: [
              { id: "s-1", reps: 10, weight: 135, completed: true },
              { id: "s-2", reps: 8, weight: 135, completed: true },
              { id: "s-3", reps: 8, weight: 140, completed: false }, // not completed
            ],
          },
        ],
      };
      expect(calculateWorkoutVolume(workout)).toBe(2430);
    });
  });

  describe("getWeeklyVolume", () => {
    it("should aggregate volume for workouts in the last 7 days", () => {
      const now = new Date();
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(now.getDate() - 3);
      const tenDaysAgo = new Date();
      tenDaysAgo.setDate(now.getDate() - 10);

      const workouts: Workout[] = [
        {
          id: "w-recent",
          name: "Recent",
          startedAt: threeDaysAgo.toISOString(),
          exercises: [
            {
              id: "we-3",
              exerciseId: "bench-press",
              targetSets: 1,
              targetReps: "8",
              restSeconds: 90,
              sets: [{ id: "s-1", reps: 10, weight: 100, completed: true }],
            },
          ],
        },
        {
          id: "w-old",
          name: "Old",
          startedAt: tenDaysAgo.toISOString(),
          exercises: [
            {
              id: "we-4",
              exerciseId: "bench-press",
              targetSets: 1,
              targetReps: "8",
              restSeconds: 90,
              sets: [{ id: "s-2", reps: 10, weight: 100, completed: true }],
            },
          ],
        },
      ];

      expect(getWeeklyVolume(workouts)).toBe(1000); // only w-recent counts
    });
  });

  describe("estimateOneRepMax", () => {
    it("should return 0 if weight or reps is 0", () => {
      expect(estimateOneRepMax(0, 5)).toBe(0);
      expect(estimateOneRepMax(100, 0)).toBe(0);
    });

    it("should estimate correctly for normal ranges using Brzycki formula", () => {
      expect(estimateOneRepMax(100, 10)).toBe(133);
    });

    it("should return weight if reps are excessively high (>=37)", () => {
      expect(estimateOneRepMax(100, 40)).toBe(100);
    });
  });

  describe("getCurrentStreak", () => {
    it("should calculate streak with consecutive workouts within 3 days gap", () => {
      const workouts: Workout[] = [
        {
          id: "w1",
          name: "W1",
          planId: "plan-1",
          startedAt: "2026-05-25T10:00:00Z",
          completedAt: "2026-05-25T11:00:00Z",
          exercises: [{ id: "we-5", exerciseId: "bp", targetSets: 1, targetReps: "1", restSeconds: 90, sets: [{ id: "s1", reps: 1, weight: 10, completed: true }] }],
        },
        {
          id: "w2",
          name: "W2",
          planId: "plan-1",
          startedAt: "2026-05-27T10:00:00Z",
          completedAt: "2026-05-27T11:00:00Z",
          exercises: [{ id: "we-6", exerciseId: "bp", targetSets: 1, targetReps: "1", restSeconds: 90, sets: [{ id: "s2", reps: 1, weight: 10, completed: true }] }],
        },
        {
          id: "w3",
          name: "W3",
          planId: "plan-1",
          startedAt: "2026-05-30T10:00:00Z",
          completedAt: "2026-05-30T11:00:00Z",
          exercises: [{ id: "we-7", exerciseId: "bp", targetSets: 1, targetReps: "1", restSeconds: 90, sets: [{ id: "s3", reps: 1, weight: 10, completed: true }] }],
        },
      ];

      const now = new Date();
      const day1 = new Date(now);
      day1.setDate(now.getDate() - 4);
      const day2 = new Date(now);
      day2.setDate(now.getDate() - 2);
      const day3 = new Date(now);
      day3.setDate(now.getDate());

      workouts[0].startedAt = day1.toISOString();
      workouts[0].completedAt = day1.toISOString();
      workouts[1].startedAt = day2.toISOString();
      workouts[1].completedAt = day2.toISOString();
      workouts[2].startedAt = day3.toISOString();
      workouts[2].completedAt = day3.toISOString();

      expect(getCurrentStreak(workouts, "plan-1")).toBe(3);
    });

    it("should break streak and reset to 1 if gap is more than 3 days", () => {
      const now = new Date();
      const day1 = new Date(now);
      day1.setDate(now.getDate() - 6);
      const day2 = new Date(now);
      day2.setDate(now.getDate());

      const workouts: Workout[] = [
        {
          id: "w1",
          name: "W1",
          planId: "plan-1",
          startedAt: day1.toISOString(),
          completedAt: day1.toISOString(),
          exercises: [{ id: "we-8", exerciseId: "bp", targetSets: 1, targetReps: "1", restSeconds: 90, sets: [{ id: "s1", reps: 1, weight: 10, completed: true }] }],
        },
        {
          id: "w2",
          name: "W2",
          planId: "plan-1",
          startedAt: day2.toISOString(),
          completedAt: day2.toISOString(),
          exercises: [{ id: "we-9", exerciseId: "bp", targetSets: 1, targetReps: "1", restSeconds: 90, sets: [{ id: "s2", reps: 1, weight: 10, completed: true }] }],
        },
      ];

      expect(getCurrentStreak(workouts, "plan-1")).toBe(1);
    });
  });

  describe("getTrainingConsistency", () => {
    it("should return correct percentage score of target workouts completed", () => {
      const now = new Date();
      const workouts: Workout[] = Array.from({ length: 6 }).map((_, idx) => {
        const d = new Date(now);
        d.setDate(now.getDate() - idx * 2);
        return {
          id: `w-${idx}`,
          name: `W-${idx}`,
          planId: "plan-1",
          startedAt: d.toISOString(),
          completedAt: d.toISOString(),
          exercises: [{ id: `we-${idx}`, exerciseId: "bp", targetSets: 1, targetReps: "1", restSeconds: 90, sets: [{ id: `s-${idx}`, reps: 1, weight: 10, completed: true }] }],
        };
      });

      expect(getTrainingConsistency(workouts, 3, "plan-1")).toBe(47);
    });
  });

  describe("getProgressionRecommendations", () => {
    it("should recommend reduce_volume if recovery score is low (<55)", () => {
      const workouts: Workout[] = [
        {
          id: "w-1",
          name: "Workout",
          startedAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          exercises: [
            {
              id: "we-1",
              exerciseId: "bench-press",
              targetSets: 3,
              targetReps: "8-10",
              restSeconds: 90,
              sets: [{ id: "s-1", reps: 10, weight: 135, completed: true, rir: 2 }],
            },
          ],
        },
      ];

      const recommendations = getProgressionRecommendations(workouts, 45);
      const rec = recommendations.find((r) => r.exerciseId === "bench-press");
      expect(rec?.action).toBe("reduce_volume");
      expect(rec?.suggestedVolumeDelta).toBe(-20);
    });

    it("should recommend deload if stalled", () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

      const workouts: Workout[] = [
        {
          id: "w-old",
          name: "Workout Old",
          startedAt: threeDaysAgo.toISOString(),
          completedAt: threeDaysAgo.toISOString(),
          exercises: [
            {
              id: "we-old",
              exerciseId: "bench-press",
              targetSets: 3,
              targetReps: "8-10",
              restSeconds: 90,
              sets: [
                { id: "s-1", reps: 8, weight: 150, completed: true, rir: 1 },
              ],
            },
          ],
        },
        {
          id: "w-recent",
          name: "Workout Recent",
          startedAt: yesterday.toISOString(),
          completedAt: yesterday.toISOString(),
          exercises: [
            {
              id: "we-recent",
              exerciseId: "bench-press",
              targetSets: 3,
              targetReps: "8-10",
              restSeconds: 90,
              sets: [
                { id: "s-2", reps: 8, weight: 150, completed: true, rir: 0 },
              ],
            },
          ],
        },
      ];

      const recommendations = getProgressionRecommendations(workouts, 80);
      const rec = recommendations.find((r) => r.exerciseId === "bench-press");
      expect(rec?.action).toBe("deload");
      expect(rec?.suggestedWeightDelta).toBe(-10);
    });

    it("should recommend increase_weight if all targets hit with low RIR", () => {
      const yesterday = new Date();
      const workouts: Workout[] = [
        {
          id: "w-recent",
          name: "Workout Recent",
          startedAt: yesterday.toISOString(),
          completedAt: yesterday.toISOString(),
          exercises: [
            {
              id: "we-recent",
              exerciseId: "bench-press",
              targetSets: 2,
              targetReps: "8-10",
              restSeconds: 90,
              sets: [
                { id: "s-1", reps: 10, weight: 150, completed: true, rir: 1 },
                { id: "s-2", reps: 10, weight: 150, completed: true, rir: 0 },
              ],
            },
          ],
        },
      ];

      const recommendations = getProgressionRecommendations(workouts, 80);
      const rec = recommendations.find((r) => r.exerciseId === "bench-press");
      expect(rec?.action).toBe("increase_weight");
      expect(rec?.suggestedWeightDelta).toBe(2.5);
    });
  });

  describe("getFatigueLabel", () => {
    it("should return Fresh for score >= 78", () => {
      expect(getFatigueLabel(80)).toEqual({ label: "Fresh", tone: "good" });
    });

    it("should return Manageable for score 60-77", () => {
      expect(getFatigueLabel(65)).toEqual({ label: "Manageable", tone: "warn" });
    });

    it("should return High fatigue for score < 60", () => {
      expect(getFatigueLabel(50)).toEqual({ label: "High fatigue", tone: "bad" });
    });
  });
});
