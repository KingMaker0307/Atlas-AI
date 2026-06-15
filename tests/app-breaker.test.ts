import { describe, it, expect } from "vitest";
import { calculateNutritionTargets } from "@/lib/calculators";
import { estimateOneRepMax, calculateRecoveryScore } from "@/lib/progression/engine";
import { bodySchema } from "@/components/daily-body-metric-modal";
import { recoverySchema } from "@/components/daily-recovery-modal";

import { isValidSnapshot } from "@/store/useAtlasStore";

describe("App Breaker - Extreme Input Robustness Tests", () => {
  
  describe("calculateNutritionTargets Boundary & Type Attacks", () => {
    it("should handle null or undefined profile and return default targets", () => {
      expect(calculateNutritionTargets(null)).toBeDefined();
      expect(calculateNutritionTargets(null).calories).toBe(2200);
    });

    it("should handle profile with age = 0 or negative and fallback or prevent division by zero", () => {
      const negativeAgeProfile = {
        id: "user-1",
        name: "Test",
        goal: "Maintain",
        age: -25, // Malicious negative age
        weight: 70,
        height: 170,
        weightUnit: "kg" as const,
        heightUnit: "cm" as const,
        gender: "male" as const,
        activityLevel: "moderately_active" as const,
        createdAt: new Date().toISOString(),
      };
      
      const result = calculateNutritionTargets(negativeAgeProfile);
      expect(result).toBeDefined();
      expect(result.calories).toBeGreaterThan(0);
      expect(Number.isNaN(result.calories)).toBe(false);
    });

    it("should handle profile with weight = NaN, zero, or negative weight", () => {
      const badWeightProfile = {
        id: "user-1",
        name: "Test",
        goal: "Maintain",
        age: 25,
        weight: NaN, // NaN weight
        height: 170,
        weightUnit: "kg" as const,
        heightUnit: "cm" as const,
        gender: "male" as const,
        activityLevel: "moderately_active" as const,
        createdAt: new Date().toISOString(),
      };
      
      const result = calculateNutritionTargets(badWeightProfile);
      expect(result).toBeDefined();
      expect(Number.isNaN(result.calories)).toBe(false);
    });

    it("should handle profile with height = NaN, zero, or negative height", () => {
      const badHeightProfile = {
        id: "user-1",
        name: "Test",
        goal: "Maintain",
        age: 25,
        weight: 70,
        height: NaN, // NaN height
        weightUnit: "kg" as const,
        heightUnit: "cm" as const,
        gender: "male" as const,
        activityLevel: "moderately_active" as const,
        createdAt: new Date().toISOString(),
      };
      
      const result = calculateNutritionTargets(badHeightProfile);
      expect(result).toBeDefined();
      expect(Number.isNaN(result.calories)).toBe(false);
    });
  });

  describe("isValidSnapshot Store Hydration Vulnerabilities", () => {
    it("should fail validation on null or non-object snapshots", () => {
      expect(isValidSnapshot(null)).toBeFalsy();
      expect(isValidSnapshot("not-an-object")).toBeFalsy();
    });

    it("should reject snapshot if profile is null or missing id", () => {
      const laxSnapshot = {
        profile: null,
      };
      expect(isValidSnapshot(laxSnapshot)).toBe(false);

      const noIdSnapshot = {
        profile: {
          name: "Tester",
        }
      };
      expect(isValidSnapshot(noIdSnapshot)).toBe(false);
    });

    it("should reject corrupted/invalid data types inside profile", () => {
      const corruptedSnapshot = {
        profile: {
          id: "guest-id",
          name: "Test",
          age: "not-a-number", // should be valid number
          weight: -100, // negative weight
          height: NaN, // NaN height
        }
      };
      expect(isValidSnapshot(corruptedSnapshot)).toBe(false);
    });
  });

  describe("estimateOneRepMax Progression Formula Failures", () => {
    it("should return 0 for non-positive weights and reps", () => {
      expect(estimateOneRepMax(-100, 5)).toBe(0);
      expect(estimateOneRepMax(100, -5)).toBe(0);
      expect(estimateOneRepMax(0, 5)).toBe(0);
    });

    it("should handle extreme high reps (reps >= 37) and avoid divide-by-zero", () => {
      // reps = 37 causes (37 - 37) = 0 in denominator
      expect(estimateOneRepMax(100, 37)).toBe(100);
      expect(estimateOneRepMax(100, 50)).toBe(100);
    });
  });

  describe("calculateRecoveryScore Bounds", () => {
    it("should return 72 as default for undefined log", () => {
      expect(calculateRecoveryScore(undefined)).toBe(72);
    });

    it("should handle extreme high values (e.g. 50 hours of sleep, soreness = 100)", () => {
      const extremeLog = {
        id: "log-1",
        date: "2026-06-15",
        sleepHours: 50,
        soreness: 100,
        stress: 100,
        readiness: 100,
        energy: 100,
      };
      const score = calculateRecoveryScore(extremeLog);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });

    it("should handle negative inputs (e.g. negative sleep hours)", () => {
      const negativeLog = {
        id: "log-2",
        date: "2026-06-15",
        sleepHours: -5,
        soreness: -10,
        stress: -10,
        readiness: -10,
        energy: -10,
      };
      const score = calculateRecoveryScore(negativeLog);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe("Form Schema XSS Script Attacks", () => {
    it("should block body metric validations with extreme/malformed fields", () => {
      const xssInput = {
        bodyweight: 180,
        waist: 32,
        bodyFat: 15,
        note: "<script>alert('xss')</script>"
      };
      // Note is not in bodySchema so it gets ignored or parses safely
      const result = bodySchema.safeParse(xssInput);
      expect(result.success).toBe(true);
    });

    it("should validate and restrict recovery notes with length bounds", () => {
      const longNote = "a".repeat(300); // Max is 250
      const result = recoverySchema.safeParse({
        sleepHours: 8,
        soreness: 5,
        stress: 5,
        energy: 5,
        note: longNote
      });
      expect(result.success).toBe(false);
    });
  });
});
