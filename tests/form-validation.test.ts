import { describe, it, expect } from "vitest";
import { bodySchema } from "@/components/daily-body-metric-modal";
import { recoverySchema } from "@/components/daily-recovery-modal";

describe("Form Validation Logic", () => {
  describe("Routine Builder Validation Logic", () => {
    const validateRoutine = (name: string, exercisesCount: number) => {
      return name.trim() !== "" && exercisesCount > 0;
    };

    it("should be invalid if name is empty", () => {
      expect(validateRoutine("", 1)).toBe(false);
      expect(validateRoutine("   ", 1)).toBe(false);
    });

    it("should be invalid if exercise count is zero", () => {
      expect(validateRoutine("My Routine", 0)).toBe(false);
    });

    it("should be valid if name is non-empty and has exercises", () => {
      expect(validateRoutine("My Routine", 1)).toBe(true);
    });
  });

  describe("Workout Plan Builder Validation Logic", () => {
    const validatePlan = (name: string) => {
      return name.trim() !== "";
    };

    it("should be invalid if name is empty", () => {
      expect(validatePlan("")).toBe(false);
      expect(validatePlan("   ")).toBe(false);
    });

    it("should be valid if name is non-empty", () => {
      expect(validatePlan("Custom Strength Split")).toBe(true);
    });
  });

  describe("Daily Body Metric Zod Schema", () => {
    it("should validate a correct body metric object", () => {
      const result = bodySchema.safeParse({
        bodyweight: 180,
        waist: 32.5,
        bodyFat: 14.5,
      });
      expect(result.success).toBe(true);
    });

    it("should fail validation if bodyweight is below 20 or above 1000", () => {
      const lowResult = bodySchema.safeParse({
        bodyweight: 15,
        waist: 32,
        bodyFat: 14,
      });
      expect(lowResult.success).toBe(false);

      const highResult = bodySchema.safeParse({
        bodyweight: 1001,
        waist: 32,
        bodyFat: 14,
      });
      expect(highResult.success).toBe(false);
    });

    it("should fail validation if waist is below 5 or above 200", () => {
      const lowResult = bodySchema.safeParse({
        bodyweight: 150,
        waist: 4,
        bodyFat: 14,
      });
      expect(lowResult.success).toBe(false);

      const highResult = bodySchema.safeParse({
        bodyweight: 150,
        waist: 201,
        bodyFat: 14,
      });
      expect(highResult.success).toBe(false);
    });

    it("should fail validation if bodyFat is below 1 or above 70", () => {
      const lowResult = bodySchema.safeParse({
        bodyweight: 150,
        waist: 32,
        bodyFat: 0.5,
      });
      expect(lowResult.success).toBe(false);

      const highResult = bodySchema.safeParse({
        bodyweight: 150,
        waist: 32,
        bodyFat: 71,
      });
      expect(highResult.success).toBe(false);
    });
  });

  describe("Daily Recovery Zod Schema", () => {
    it("should validate a correct recovery log object", () => {
      const result = recoverySchema.safeParse({
        sleepHours: 7.5,
        soreness: 4,
        stress: 3,
        energy: 7,
        note: "Felt strong today",
      });
      expect(result.success).toBe(true);
    });

    it("should allow optional note or empty note", () => {
      const resultNoNote = recoverySchema.safeParse({
        sleepHours: 7.5,
        soreness: 4,
        stress: 3,
        energy: 7,
      });
      expect(resultNoNote.success).toBe(true);
    });

    it("should fail validation if sleepHours is negative or exceeds 24", () => {
      const negativeResult = recoverySchema.safeParse({
        sleepHours: -1,
        soreness: 4,
        stress: 3,
        energy: 7,
      });
      expect(negativeResult.success).toBe(false);

      const excessResult = recoverySchema.safeParse({
        sleepHours: 24.5,
        soreness: 4,
        stress: 3,
        energy: 7,
      });
      expect(excessResult.success).toBe(false);
    });

    it("should fail validation if soreness/stress/energy is outside 1-10 range", () => {
      const lowResult = recoverySchema.safeParse({
        sleepHours: 8,
        soreness: 0,
        stress: 3,
        energy: 7,
      });
      expect(lowResult.success).toBe(false);

      const highResult = recoverySchema.safeParse({
        sleepHours: 8,
        soreness: 4,
        stress: 11,
        energy: 7,
      });
      expect(highResult.success).toBe(false);
    });

    it("should fail validation if note exceeds 250 characters", () => {
      const longNote = "a".repeat(251);
      const result = recoverySchema.safeParse({
        sleepHours: 8,
        soreness: 4,
        stress: 3,
        energy: 7,
        note: longNote,
      });
      expect(result.success).toBe(false);
    });
  });
});
