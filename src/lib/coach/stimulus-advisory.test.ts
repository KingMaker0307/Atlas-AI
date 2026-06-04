import { describe, it, expect } from "vitest";
import { getStimulusAdvisory, type StimulusAdvisoryInput } from "./stimulus-advisory";

describe("stimulus-advisory — Stimulus Advisory Logic Matrix", () => {
  // ─── Group 1: Compound Lifts ─────────────────────────────────
  describe("Compound Lifts", () => {
    const defaultInput = {
      category: "compound",
      exerciseName: "Squat",
      totalSets: 3,
    };

    it("handles RIR 0 on First Set (Warning)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 0, setNumber: 1 });
      expect(res.level).toBe("warning");
      expect(res.message).toContain("Absolute failure on set 1");
    });

    it("handles RIR 0 on Middle Sets (Warning)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 0, setNumber: 2 });
      expect(res.level).toBe("warning");
      expect(res.message).toContain("Pushing compound lifts to failure");
    });

    it("handles RIR 0 on Final Set (Success)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 0, setNumber: 3 });
      expect(res.level).toBe("success");
      expect(res.message).toContain("final set. Excellent effort");
    });

    it("handles RIR 1 on any set (Success)", () => {
      const res1 = getStimulusAdvisory({ ...defaultInput, rir: 1, setNumber: 1 });
      const res2 = getStimulusAdvisory({ ...defaultInput, rir: 1, setNumber: 3 });
      expect(res1.level).toBe("success");
      expect(res1.message).toContain("Optimal intensity zone");
      expect(res2.level).toBe("success");
      expect(res2.message).toContain("Optimal intensity zone");
    });

    it("handles RIR 2 on any set (Success)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 2, setNumber: 2 });
      expect(res.level).toBe("success");
      expect(res.message).toContain("Optimal intensity zone");
    });

    it("handles RIR 3 on any set (Info)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 3, setNumber: 2 });
      expect(res.level).toBe("info");
      expect(res.message).toContain("Moderate stimulus");
    });

    it("handles RIR 4 on First Set (Info)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 4, setNumber: 1 });
      expect(res.level).toBe("info");
      expect(res.message).toContain("First set was low intensity");
    });

    it("handles RIR 4 on Middle Set (Info)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 4, setNumber: 2 });
      expect(res.level).toBe("info");
      expect(res.message).toContain("Low stimulus");
    });

    it("handles RIR 4 on Final Set (Info)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 4, setNumber: 3 });
      expect(res.level).toBe("info");
      expect(res.message).toContain("Finished your last set");
    });
  });

  // ─── Group 2: Isolation Lifts ────────────────────────────────
  describe("Isolation Lifts", () => {
    const defaultInput = {
      category: "isolation",
      exerciseName: "Bicep Curl",
      totalSets: 3,
    };

    it("handles RIR 0 on any set (Success)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 0, setNumber: 1 });
      expect(res.level).toBe("success");
      expect(res.message).toContain("Absolute failure on isolation movements");
    });

    it("handles RIR 1 on any set (Success)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 1, setNumber: 2 });
      expect(res.level).toBe("success");
      expect(res.message).toContain("Absolute failure on isolation movements");
    });

    it("handles RIR 2 on Middle Set (Success)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 2, setNumber: 2 });
      expect(res.level).toBe("success");
      expect(res.message).toContain("Solid working set");
    });

    it("handles RIR 2 on Final Set (Info / Push Closer)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 2, setNumber: 3 });
      expect(res.level).toBe("info");
      expect(res.message).toContain("pushing closer to failure");
    });

    it("handles RIR 3 or 4 on any set (Info / Under-stimulated)", () => {
      const res3 = getStimulusAdvisory({ ...defaultInput, rir: 3, setNumber: 1 });
      const res4 = getStimulusAdvisory({ ...defaultInput, rir: 4, setNumber: 3 });
      expect(res3.level).toBe("info");
      expect(res3.message).toContain("Under-stimulated");
      expect(res4.level).toBe("info");
      expect(res4.message).toContain("Under-stimulated");
    });
  });

  // ─── Group 3: Cardio / Mobility / Other ─────────────────────
  describe("Cardio / Mobility / Other", () => {
    const defaultInput = {
      category: "mobility",
      exerciseName: "Hip Opener",
      totalSets: 2,
    };

    it("handles high exertion RIR 0 or 1 (Info)", () => {
      const res = getStimulusAdvisory({ ...defaultInput, rir: 1, setNumber: 1 });
      expect(res.level).toBe("info");
      expect(res.message).toContain("High exertion");
    });

    it("handles perfect pacing RIR 2, 3, 4 (Success)", () => {
      const res2 = getStimulusAdvisory({ ...defaultInput, rir: 2, setNumber: 1 });
      const res4 = getStimulusAdvisory({ ...defaultInput, rir: 4, setNumber: 2 });
      expect(res2.level).toBe("success");
      expect(res2.message).toContain("Excellent pacing");
      expect(res4.level).toBe("success");
      expect(res4.message).toContain("Excellent pacing");
    });
  });

  // ─── Group 4: Extreme Inputs & Clamping ──────────────────────
  describe("Extreme Inputs & Clamping", () => {
    it("clamps RIR above 4 down to 4", () => {
      const res = getStimulusAdvisory({
        rir: 10,
        setNumber: 2,
        totalSets: 3,
        category: "compound",
        exerciseName: "Squat",
      });
      // RIR 10 is clamped to 4. For compound middle set, RIR 4 outputs "Low stimulus" (Info)
      expect(res.level).toBe("info");
      expect(res.message).toContain("Low stimulus");
    });

    it("clamps negative RIR up to 0", () => {
      const res = getStimulusAdvisory({
        rir: -2,
        setNumber: 3,
        totalSets: 3,
        category: "compound",
        exerciseName: "Squat",
      });
      // RIR -2 is clamped to 0. For compound final set, RIR 0 outputs "final set. Excellent effort" (Success)
      expect(res.level).toBe("success");
      expect(res.message).toContain("final set. Excellent effort");
    });

    it("handles float RIR values correctly by rounding", () => {
      const res = getStimulusAdvisory({
        rir: 1.7,
        setNumber: 1,
        totalSets: 3,
        category: "compound",
        exerciseName: "Squat",
      });
      // 1.7 rounds to RIR 2, which is "Optimal intensity zone" (Success)
      expect(res.level).toBe("success");
      expect(res.message).toContain("Optimal intensity zone");
    });

    it("handles setNumber greater than totalSets as final set", () => {
      const res = getStimulusAdvisory({
        rir: 0,
        setNumber: 5,
        totalSets: 3,
        category: "compound",
        exerciseName: "Squat",
      });
      // setNumber 5 >= totalSets 3 -> treated as final set -> Success
      expect(res.level).toBe("success");
      expect(res.message).toContain("final set. Excellent effort");
    });
  });
});
