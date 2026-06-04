import { describe, it, expect } from "vitest";
import { calculateNutritionTargets, DEFAULT_TARGETS } from "./calculators";
import type { UserProfile } from "@/types/domain";

describe("calculateNutritionTargets", () => {
  it("should return DEFAULT_TARGETS when profile is null or undefined", () => {
    expect(calculateNutritionTargets(null)).toEqual(DEFAULT_TARGETS);
  });

  it("should return DEFAULT_TARGETS when profile is missing age or weight", () => {
    const incompleteProfile: UserProfile = {
      id: "user-1",
      name: "John Doe",
      goal: "General fitness",
      experience: "intermediate",
      trainingStyle: "general",
      daysPerWeek: 3,
      weightUnit: "kg",
      heightUnit: "cm",
      createdAt: new Date().toISOString(),
    };
    expect(calculateNutritionTargets(incompleteProfile)).toEqual(DEFAULT_TARGETS);
  });

  it("should calculate correctly for male athlete (metric, maintenance)", () => {
    const profile: UserProfile = {
      id: "user-1",
      name: "John Metric",
      goal: "maintain weight",
      experience: "intermediate",
      trainingStyle: "general",
      daysPerWeek: 4,
      weightUnit: "kg",
      heightUnit: "cm",
      weight: 80,
      height: 180,
      age: 25,
      createdAt: new Date().toISOString(),
    };

    const targets = calculateNutritionTargets(profile);

    // BMR = 10 * 80 + 6.25 * 180 - 5 * 25 + 5 = 1805
    expect(targets.bmr).toBe(1805);
    // TDEE = 1805 * 1.55 = 2798 (rounded)
    expect(targets.tdee).toBe(2798);
    // Calories = TDEE + 0 = 2798
    expect(targets.calories).toBe(2798);
    // Protein = 80 * 2.0 = 160
    expect(targets.protein).toBe(160);
    // Fat = (2798 * 0.25) / 9 = 78 (rounded)
    expect(targets.fat).toBe(78);
    // Carbs = (2798 - (160 * 4 + 78 * 9)) / 4 = (2798 - 1342) / 4 = 1456 / 4 = 364
    expect(targets.carbs).toBe(364);
    expect(targets.goalType).toBe("maintain");
  });

  it("should calculate correctly for female athlete (imperial, lose/cut)", () => {
    const profile: UserProfile = {
      id: "user-2",
      name: "Jane Imperial",
      goal: "lose weight, shred fat (female)",
      experience: "advanced",
      trainingStyle: "hypertrophy",
      daysPerWeek: 5,
      weightUnit: "lbs",
      heightUnit: "in",
      weight: 150, // 150 * 0.453592 = 68.0388 kg
      height: 65,  // 65 * 2.54 = 165.1 cm
      age: 30,
      createdAt: new Date().toISOString(),
    };

    const targets = calculateNutritionTargets(profile);

    // w = 150 * 0.453592 = 68.0388
    // h = 65 * 2.54 = 165.1
    // BMR = Math.round(10 * 68.0388 + 6.25 * 165.1 - 5 * 30 - 161)
    //     = Math.round(680.388 + 1031.875 - 150 - 161)
    //     = Math.round(1401.263) = 1401
    expect(targets.bmr).toBe(1401);
    // TDEE = Math.round(1401 * 1.55) = 2172
    expect(targets.tdee).toBe(2172);
    // Calories = 2172 - 500 = 1672
    expect(targets.calories).toBe(1672);
    // Protein = Math.round(68.0388 * 2.4) = 163
    expect(targets.protein).toBe(163);
    // Fat = Math.round((1672 * 0.25) / 9) = Math.round(418 / 9) = 46
    expect(targets.fat).toBe(46);
    // Carbs = Math.round((1672 - (163 * 4 + 46 * 9)) / 4)
    //       = Math.round((1672 - (652 + 414)) / 4)
    //       = Math.round((1672 - 1066) / 4) = Math.round(606 / 4) = 152
    expect(targets.carbs).toBe(152);
    expect(targets.goalType).toBe("lose");
  });

  it("should calculate correctly with custom gender (male) and custom activityLevel (sedentary, 1.2)", () => {
    const profile: UserProfile = {
      id: "user-3",
      name: "Sedentary Mike",
      goal: "shred fat",
      experience: "beginner",
      trainingStyle: "general",
      daysPerWeek: 2,
      weightUnit: "kg",
      heightUnit: "cm",
      weight: 100,
      height: 180,
      age: 40,
      gender: "male",
      activityLevel: "sedentary",
      createdAt: new Date().toISOString(),
    };

    const targets = calculateNutritionTargets(profile);

    // BMR = 10 * 100 + 6.25 * 180 - 5 * 40 + 5 = 1000 + 1125 - 200 + 5 = 1930
    expect(targets.bmr).toBe(1930);
    // TDEE = 1930 * 1.2 = 2316
    expect(targets.tdee).toBe(2316);
    // Goal "shred fat" triggers lose (-500)
    // Calories = 2316 - 500 = 1816
    expect(targets.calories).toBe(1816);
  });

  it("should handle extreme and invalid inputs safely by applying calculation floors", () => {
    const extremeProfile: UserProfile = {
      id: "user-extreme",
      name: "Extreme User",
      goal: "lose weight",
      experience: "intermediate",
      trainingStyle: "general",
      daysPerWeek: 5,
      weightUnit: "kg",
      heightUnit: "cm",
      weight: 1, // extremely low weight
      height: 1, // extremely low height
      age: 200,   // extremely old age
      gender: "female",
      activityLevel: "sedentary",
      createdAt: new Date().toISOString(),
    };

    const targets = calculateNutritionTargets(extremeProfile);

    // BMR formula raw: 10 * 20 (clamped w) + 6.25 * 50 (clamped h) - 5 * 200 - 161
    // = 200 + 312.5 - 1000 - 161 = -648.5
    // Clamped BMR should be at least 500
    expect(targets.bmr).toBe(500);

    // TDEE = 500 * 1.2 = 600
    expect(targets.tdee).toBe(600);

    // Calories: TDEE - 500 = 100, but clamped to a floor of 1000 kcal
    expect(targets.calories).toBe(1000);

    // Protein target: 20kg (clamped weight) * 2.4 = 48g.
    // If it were below 40g, it would clamp to 40g. Here it is 48g.
    expect(targets.protein).toBe(48);

    // Fat: (1000 * 0.25) / 9 = 27.7g, clamped to a floor of 30g
    expect(targets.fat).toBe(30);

    // Carbs: (1000 - (48 * 4 + 30 * 9)) / 4 = (1000 - 462) / 4 = 134.5g (rounds to 135)
    // Clamped to floor of 50g. Here it is 135g.
    expect(targets.carbs).toBe(135);

    // Verify all targets are strictly positive and bounded
    expect(targets.calories).toBeGreaterThanOrEqual(1000);
    expect(targets.protein).toBeGreaterThanOrEqual(40);
    expect(targets.fat).toBeGreaterThanOrEqual(30);
    expect(targets.carbs).toBeGreaterThanOrEqual(50);
  });
});
