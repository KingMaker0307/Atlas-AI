import type { UserProfile, NutritionEntry, WaterLogEntry } from "@/types/domain";
import { calculateNutritionTargets } from "@/lib/calculators";

export interface SmartNutritionTip {
  title: string;
  desc: string;
  type: "info" | "warning" | "success" | "tip";
}

export function getSmartNutritionTips(
  profile: UserProfile | null,
  nutritionEntries: NutritionEntry[],
  waterLogs: WaterLogEntry[],
  targetDateString: string
): SmartNutritionTip[] {
  const tips: SmartNutritionTip[] = [];

  // Filter food logs for the selected date
  const activeEntries = nutritionEntries.filter(
    (e) => e.timestamp.slice(0, 10) === targetDateString
  );

  const activeWaterLogs = waterLogs.filter(
    (w) => w.timestamp.slice(0, 10) === targetDateString
  );

  // 1. Empty logs state check
  if (activeEntries.length === 0 && activeWaterLogs.length === 0) {
    tips.push({
      title: "No Nutrition Logs",
      desc: "Log your meals or hydration for today to unlock personalized dietary analysis and macro feedback.",
      type: "info",
    });
    // Add a basic diet-based tip
    const diet = (profile?.dietaryPreferences || "non-vegetarian").toLowerCase();
    if (diet === "vegan") {
      tips.push({
        title: "Vegan Nutrition Focus",
        desc: "Make sure you log your meals regularly to ensure you hit your daily protein targets and key micronutrients (like iron and calcium).",
        type: "tip",
      });
    } else if (diet === "vegetarian") {
      tips.push({
        title: "Vegetarian Macro Focus",
        desc: "Regular logging helps track protein distribution. Focus on dairy, eggs, and legume sources throughout the day.",
        type: "tip",
      });
    } else {
      tips.push({
        title: "Balanced Intake Cues",
        desc: "Aim to hit a balance of complete proteins, complex carbohydrates, and essential fats to fuel your daily training.",
        type: "tip",
      });
    }
    return tips;
  }

  // Calculate targets
  const targets = calculateNutritionTargets(profile);

  // Calculate totals
  const totals = activeEntries.reduce(
    (acc, e) => ({
      calories: acc.calories + e.calories,
      protein: acc.protein + e.protein,
      carbs: acc.carbs + e.carbs,
      fat: acc.fat + e.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const totalWater = activeWaterLogs.reduce((sum, w) => sum + w.amount, 0);

  // 2. Caloric analysis (Only if we have food logged)
  if (activeEntries.length > 0) {
    if (totals.calories < targets.calories * 0.8) {
      tips.push({
        title: "Energy Deficit Alert",
        desc: `Your intake is below 80% of your target (${totals.calories.toLocaleString()} kcal). Consuming adequate calories is vital to prevent muscle wasting and maintain metabolic rate.`,
        type: "warning",
      });
    } else if (totals.calories > targets.calories * 1.15) {
      tips.push({
        title: "Caloric Intake Exceeded",
        desc: `You've exceeded your daily calorie target by 15%. Focus on volume-dense, low-calorie foods if your goal is weight management.`,
        type: "warning",
      });
    } else {
      tips.push({
        title: "Caloric Target Maintained",
        desc: "Excellent energy balance today! You are pacing well toward your goal.",
        type: "success",
      });
    }
  }

  // 3. Protein analysis
  if (activeEntries.length > 0) {
    if (totals.protein < targets.protein * 0.8) {
      tips.push({
        title: "Protein Intake Lagging",
        desc: `Protein is currently at ${totals.protein.toFixed(0)}g (target: ${targets.protein}g). Protein provides essential amino acids for repairing muscle micro-tears from training.`,
        type: "warning",
      });
    } else {
      tips.push({
        title: "Protein Goal Achieved",
        desc: `Awesome! You have secured enough protein (${totals.protein.toFixed(0)}g) today to sustain muscle protein synthesis.`,
        type: "success",
      });
    }
  }

  // 4. Hydration check
  if (totalWater < 2000) {
    tips.push({
      title: "Hydration Focus Required",
      desc: `You've logged ${totalWater}ml of water today. Aim for at least 2,000ml to support nutrient transportation, joint lubrication, and cognitive performance.`,
      type: "info",
    });
  }

  // 5. Diet-specific nutritional tips
  const dietPreference = (profile?.dietaryPreferences || "non-vegetarian").toLowerCase();
  if (dietPreference === "vegan") {
    tips.push({
      title: "Complete Proteins for Vegans",
      desc: "Since plant proteins have varying amino acid profiles, combine grains (e.g. rice, oats) with legumes (e.g. beans, lentils) to form complete proteins.",
      type: "tip",
    });
  } else if (dietPreference === "vegetarian") {
    tips.push({
      title: "Iron Absorption Tip",
      desc: "Vegetarians should pair non-heme iron sources (spinach, lentils) with Vitamin C (citrus, bell peppers) to boost absorption rate by up to 300%.",
      type: "tip",
    });
  } else {
    tips.push({
      title: "Unsaturated Omega-3 Fats",
      desc: "Balance saturated animal fats with unsaturated omega-3 fatty acids (fatty fish, chia seeds, flax seeds) to support cardiovascular health.",
      type: "tip",
    });
  }

  return tips.slice(0, 3); // Return top 3 prioritized tips
}
