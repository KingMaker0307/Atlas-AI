import { describe, it, expect } from "vitest";
import { getSmartNutritionTips } from "./smart-nutrition-tips";
import type { UserProfile, NutritionEntry, WaterLogEntry } from "@/types/domain";

describe("smart-nutrition-tips.ts engine tests", () => {
  const mockProfile: UserProfile = {
    id: "user-1",
    name: "John Doe",
    goal: "Lose body fat and weight",
    experience: "intermediate",
    trainingStyle: "hypertrophy",
    daysPerWeek: 3,
    weightUnit: "kg",
    heightUnit: "cm",
    createdAt: "2026-06-01",
    weight: 80,
    dietaryPreferences: "vegan",
  };

  it("should return basic tips when logs are empty", () => {
    const tips = getSmartNutritionTips(mockProfile, [], [], "2026-06-03");
    expect(tips).toHaveLength(2);
    expect(tips[0].title).toBe("No Nutrition Logs");
    expect(tips[1].title).toBe("Vegan Nutrition Focus");
  });

  it("should detect calorie deficit and low protein intake", () => {
    const foods: NutritionEntry[] = [
      {
        id: "food-1",
        name: "Apple",
        calories: 95,
        protein: 0.5,
        carbs: 25,
        fat: 0.3,
        fiber: 4,
        sugar: 19,
        sodium: 2,
        potassium: 195,
        vitaminC: 8,
        calcium: 11,
        iron: 0.2,
        timestamp: "2026-06-03T08:00:00.000Z",
        meal: "breakfast",
        servingSize: 1,
        servingUnit: "item",
      },
    ];

    const tips = getSmartNutritionTips(mockProfile, foods, [], "2026-06-03");
    expect(tips.some((t) => t.title === "Energy Deficit Alert")).toBe(true);
    expect(tips.some((t) => t.title === "Protein Intake Lagging")).toBe(true);
  });

  it("should suggest hydration focus when water logs are low", () => {
    const foods: NutritionEntry[] = [
      {
        id: "food-2",
        name: "Lentil Pasta",
        calories: 2200,
        protein: 140,
        carbs: 300,
        fat: 40,
        fiber: 30,
        sugar: 10,
        sodium: 400,
        potassium: 1500,
        vitaminC: 10,
        calcium: 200,
        iron: 15,
        timestamp: "2026-06-03T12:00:00.000Z",
        meal: "lunch",
        servingSize: 1,
        servingUnit: "serving",
      },
    ];
    const water: WaterLogEntry[] = [
      {
        id: "w-1",
        amount: 500,
        timestamp: "2026-06-03T10:00:00.000Z",
      },
    ];

    const tips = getSmartNutritionTips(mockProfile, foods, water, "2026-06-03");
    expect(tips.some((t) => t.title === "Hydration Focus Required")).toBe(true);
  });
});
