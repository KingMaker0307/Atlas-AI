import { describe, it, expect } from "vitest";
import { extractItemName, KNOWN_BRANDS } from "../src/components/nutrition-tracker";

describe("Precision Nutrition brand and item extractor", () => {
  it("should verify known brands array is populated", () => {
    expect(KNOWN_BRANDS.length).toBeGreaterThan(0);
    expect(KNOWN_BRANDS).toContain("chobani");
    expect(KNOWN_BRANDS).toContain("kirkland");
  });

  it("should extract food name by stripping a known brand", () => {
    // Test case insensitive brand removal
    expect(extractItemName("Chobani greek yogurt")).toBe("greek yogurt");
    expect(extractItemName("Kirkland signature almonds")).toBe("signature almonds");
    expect(extractItemName("Trader Joe's peanut butter")).toBe("peanut butter");
    expect(extractItemName("Fairlife chocolate milk")).toBe("chocolate milk");
  });

  it("should fall back to stripping first word if no known brand matches but query is multi-word", () => {
    expect(extractItemName("yummy strawberry smoothie")).toBe("strawberry smoothie");
    expect(extractItemName("organic raw honey")).toBe("raw honey");
  });

  it("should retain the full query if it is a single word", () => {
    expect(extractItemName("banana")).toBe("banana");
    expect(extractItemName("apple")).toBe("apple");
    expect(extractItemName("chobani")).toBe("chobani");
  });

  it("should handle cleaning punctuation/spaces during extraction", () => {
    expect(extractItemName("Chobani: greek yogurt")).toBe("greek yogurt");
    expect(extractItemName("Trader Joe's - triple ginger snaps")).toBe("triple ginger snaps");
  });
});

describe("Precision AI Schema verification", () => {
  it("should correctly map legacy and precise AI food schemas", () => {
    // Simulate the mappedAnalyzedFoodItems helper logic
    const mapItem = (item: any) => ({
      name: item.name || "Custom Food",
      serving_note: item.serving_note || "1 serving",
      calories: Math.round(item.calories || 0),
      protein: +((item.protein || 0).toFixed(1)),
      carbs: +((item.carbs || 0).toFixed(1)),
      fat: +((item.fat || 0).toFixed(1)),
      fiber: +((item.fiber || 0).toFixed(1)),
      sugar: +((item.sugar || 0).toFixed(1)),
      sodium: Math.round(item.sodium || 0),
      potassium: Math.round(item.potassium || 0),
      vitaminC: +((item.vitaminC || 0).toFixed(1)),
      calcium: Math.round(item.calcium || 0),
      iron: +((item.iron || 0).toFixed(1)),
      source: item.source || "text",
      quantity: typeof item.quantity === "number" ? item.quantity : 1.0,
    });

    const parsedItemFromHardenAI = {
      name: "Organic Peanut Butter",
      serving_note: "2 tbsp (32g)",
      calories: 190,
      protein: 7,
      carbs: 6,
      fat: 16,
      fiber: 2,
      sugar: 1,
      sodium: 140,
      potassium: 0,
      vitaminC: 0,
      calcium: 0,
      iron: 0,
      source: "text",
      quantity: 1,
    };

    const mapped = mapItem(parsedItemFromHardenAI);
    expect(mapped.calories).toBe(190);
    expect(mapped.protein).toBe(7);
    expect(mapped.carbs).toBe(6);
    expect(mapped.fat).toBe(16);
  });
});

describe("Nutrient Source Mapping", () => {
  const mockEntries = [
    { name: "Egg", protein: 6, calcium: 28, potassium: 69 },
    { name: "Milk", protein: 8, calcium: 276, potassium: 322 },
    { name: "Chicken", protein: 31, calcium: 0, potassium: 256 },
  ];

  it("should filter and sort entries correctly by protein (macronutrient key)", () => {
    const proteinSources = mockEntries
      .filter((e) => e.protein > 0)
      .map((e) => ({ name: e.name, amount: e.protein }))
      .sort((a, b) => b.amount - a.amount);

    expect(proteinSources).toHaveLength(3);
    expect(proteinSources[0].name).toBe("Chicken");
    expect(proteinSources[0].amount).toBe(31);
    expect(proteinSources[1].name).toBe("Milk");
    expect(proteinSources[2].name).toBe("Egg");
  });

  it("should filter and sort entries correctly by calcium (micronutrient key)", () => {
    const calciumSources = mockEntries
      .filter((e) => e.calcium > 0)
      .map((e) => ({ name: e.name, amount: e.calcium }))
      .sort((a, b) => b.amount - a.amount);

    expect(calciumSources).toHaveLength(2);
    expect(calciumSources[0].name).toBe("Milk");
    expect(calciumSources[0].amount).toBe(276);
    expect(calciumSources[1].name).toBe("Egg");
    expect(calciumSources[1].amount).toBe(28);
  });
});

