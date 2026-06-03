import { describe, it, expect } from "vitest";
import { getSmartTips } from "./smart-tips";
import type { UserProfile, Workout, RecoveryLog } from "@/types/domain";

describe("smart-tips.ts local tip engine", () => {
  const mockProfile: UserProfile = {
    id: "user-1",
    name: "John Doe",
    goal: "muscle",
    experience: "intermediate",
    trainingStyle: "hypertrophy",
    daysPerWeek: 3,
    weightUnit: "kg",
    heightUnit: "cm",
    createdAt: "2026-06-01",
    weight: 75,
  };

  it("should return start journey tip when no workouts are logged", () => {
    const tips = getSmartTips(mockProfile, [], [], true);
    expect(tips).toHaveLength(2);
    expect(tips[0].title).toBe("Start Your Journey");
    expect(tips[1].title).toBe("Beginner Tip: Focus on Habit");
  });

  it("should detect streak and return success tip", () => {
    const now = new Date();
    const w1: Workout = {
      id: "w1",
      name: "Upper A",
      startedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      exercises: [
        {
          id: "we1",
          exerciseId: "bench-press",
          targetSets: 1,
          targetReps: "10",
          restSeconds: 90,
          sets: [{ id: "s1", reps: 10, weight: 60, completed: true }],
        },
      ],
    };
    const w2: Workout = {
      id: "w2",
      name: "Lower A",
      startedAt: now.toISOString(),
      exercises: [
        {
          id: "we2",
          exerciseId: "bench-press",
          targetSets: 1,
          targetReps: "10",
          restSeconds: 90,
          sets: [{ id: "s2", reps: 10, weight: 60, completed: true }],
        },
      ],
    };

    // Low streak or consistency tip
    const tips = getSmartTips(mockProfile, [w1, w2], [], true);
    expect(tips.some(t => t.title.includes("Consistency"))).toBe(true);
  });
});
