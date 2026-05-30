import type { UserProfile } from "@/types/domain";

export interface NutritionTargets {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  sodium: number;
  potassium: number;
  vitaminC: number;
  calcium: number;
  iron: number;
  goalType: "maintain" | "lose" | "gain";
  calorieAdjustment: number;
  tdee: number;
  bmr: number;
}

export const DEFAULT_TARGETS: NutritionTargets = {
  calories: 2200,
  protein: 140,
  carbs: 250,
  fat: 70,
  fiber: 30,
  sugar: 50,
  sodium: 2300,
  potassium: 4700,
  vitaminC: 90,
  calcium: 1000,
  iron: 8,
  goalType: "maintain",
  calorieAdjustment: 0,
  tdee: 2200,
  bmr: 1420,
};

/**
 * Calculates dynamic daily BMR, TDEE, Calories, and Macros based on user profile.
 * Implements standard Mifflin-St Jeor BMR and activity multiplier of 1.55.
 */
export function calculateNutritionTargets(profile: UserProfile | null): NutritionTargets {
  if (!profile || !profile.weight || !profile.age) {
    return DEFAULT_TARGETS;
  }

  // Convert weight to kg and height to cm
  const w = profile.weightUnit === "lbs" ? profile.weight * 0.453592 : profile.weight;
  const h = profile.heightUnit === "in" ? (profile.height || 70) * 2.54 : profile.height || 170;

  // Mifflin-St Jeor formula for BMR
  const isFemale = profile.gender 
    ? profile.gender === "female" 
    : (profile.goal || "").toLowerCase().includes("female");
  const bmr = Math.round(10 * w + 6.25 * h - 5 * profile.age + (isFemale ? -161 : 5));

  // Determine TDEE activity factor
  let activityMultiplier = 1.55; // Default moderate
  if (profile.activityLevel) {
    switch (profile.activityLevel) {
      case "sedentary":
        activityMultiplier = 1.2;
        break;
      case "lightly_active":
        activityMultiplier = 1.375;
        break;
      case "moderately_active":
        activityMultiplier = 1.55;
        break;
      case "very_active":
        activityMultiplier = 1.725;
        break;
      case "extra_active":
        activityMultiplier = 1.9;
        break;
    }
  }
  const tdee = Math.round(bmr * activityMultiplier);

  // Goal adjustment
  const goalText = (profile.customGoal || profile.goal || "").toLowerCase();
  let calorieAdjustment = 0;
  let goalType: "maintain" | "lose" | "gain" = "maintain";

  if (
    goalText.includes("lose") ||
    goalText.includes("cut") ||
    goalText.includes("shred") ||
    goalText.includes("deficit") ||
    goalText.includes("lean")
  ) {
    calorieAdjustment = -500;
    goalType = "lose";
  } else if (
    goalText.includes("gain") ||
    goalText.includes("bulk") ||
    goalText.includes("build") ||
    goalText.includes("mass") ||
    goalText.includes("surplus")
  ) {
    calorieAdjustment = 300;
    goalType = "gain";
  }

  const calorieTarget = tdee + calorieAdjustment;

  // Macros:
  // Protein: 2.2g per kg (or 2.4g if cutting, 2.0g if gaining)
  const proteinTarget = Math.round(w * (goalType === "lose" ? 2.4 : 2.0));
  // Fat: 25% of total calories
  const fatTarget = Math.round((calorieTarget * 0.25) / 9);
  // Carbs: remainder
  const carbsTarget = Math.round((calorieTarget - (proteinTarget * 4 + fatTarget * 9)) / 4);

  return {
    calories: calorieTarget,
    protein: proteinTarget,
    carbs: carbsTarget,
    fat: fatTarget,
    fiber: 30,
    sugar: 50,
    sodium: 2300,
    potassium: 4700,
    vitaminC: 90,
    calcium: 1000,
    iron: 8,
    goalType,
    calorieAdjustment,
    tdee,
    bmr,
  };
}
