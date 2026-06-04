/**
 * stimulus-advisory.ts
 * ──────────────────────────────────────────────────────────────
 * Pure-function core engine for generating specific, actionable
 * stimulus advice based on Reps in Reserve (RIR), the category
 * of exercise, and set context (first set, middle sets, last set).
 */

export interface StimulusAdvisoryInput {
  rir: number;         // 0 to 4
  setNumber: number;   // 1-indexed (e.g. 1, 2, 3)
  totalSets: number;   // Total sets in the exercise
  category: string;    // 'compound' | 'isolation' | 'cardio' | 'mobility' etc.
  exerciseName: string;
}

export interface StimulusAdvisoryResult {
  message: string;
  level: "warning" | "success" | "info";
}

export function getStimulusAdvisory(input: StimulusAdvisoryInput): StimulusAdvisoryResult {
  // Normalize and clamp RIR input to [0, 4]
  const rir = Math.min(4, Math.max(0, Math.round(input.rir)));
  const setNumber = Math.max(1, input.setNumber);
  const totalSets = Math.max(1, input.totalSets);
  const category = (input.category || "other").toLowerCase().trim();

  const isFirstSet = setNumber === 1;
  const isFinalSet = setNumber >= totalSets;
  const isMiddleSet = !isFirstSet && !isFinalSet;

  // 1. Compound Movements (Squat, Deadlift, Bench Press, etc.)
  if (category === "compound") {
    if (rir === 0) {
      if (isFirstSet) {
        return {
          message: "Absolute failure on set 1 of a compound lift is highly fatigue-inducing and increases injury risk. Drop load by 5% next set to maintain reps safely.",
          level: "warning",
        };
      }
      if (isMiddleSet) {
        return {
          message: "Pushing compound lifts to failure accumulates high fatigue. Pay close attention to form on your remaining sets.",
          level: "warning",
        };
      }
      // isFinalSet
      return {
        message: "Absolute failure reached on the final set. Excellent effort finishing strong! Focus on safe execution next time.",
        level: "success",
      };
    }

    if (rir === 1 || rir === 2) {
      return {
        message: "Optimal intensity zone. 1-2 Reps in Reserve balances muscle growth with manageable fatigue. Perfect for progressive overload!",
        level: "success",
      };
    }

    if (rir === 3) {
      return {
        message: "Moderate stimulus. Good for volume or recovery, but consider adding 1-2 reps or slightly increasing weight to maximize growth.",
        level: "info",
      };
    }

    // rir === 4
    if (isFirstSet) {
      return {
        message: "First set was low intensity. If this is a working set, consider increasing the load by 2.5% to 5% to reach the hypertrophy zone.",
        level: "info",
      };
    }
    if (isFinalSet) {
      return {
        message: "Finished your last set with RIR 4. You had plenty left in the tank. Increase the load or reps next session to keep progressing.",
        level: "info",
      };
    }
    return {
      message: "Low stimulus. Increase the load or target more reps to keep the intensity high enough for muscle adaptation.",
      level: "info",
    };
  }

  // 2. Isolation Movements (Bicep Curl, Lateral Raise, etc.)
  if (category === "isolation") {
    if (rir === 0 || rir === 1) {
      return {
        message: "Absolute failure on isolation movements is safe and highly effective for full muscle fiber recruitment. Great work pushing hard!",
        level: "success",
      };
    }

    if (rir === 2) {
      if (isFinalSet) {
        return {
          message: "Good work, but consider pushing closer to failure (RIR 0-1) on your final set to maximize muscle growth.",
          level: "info",
        };
      }
      return {
        message: "Solid working set. Focus on high mind-muscle connection and control.",
        level: "success",
      };
    }

    // rir === 3 or 4
    return {
      message: "Under-stimulated. Isolation movements need high intensity to stimulate hypertrophy. Increase load or reps on the next set.",
      level: "info",
    };
  }

  // 3. Cardio, steady-state, mobility, or other categories
  if (rir === 0 || rir === 1) {
    return {
      message: "High exertion. Ensure you maintain steady breathing, proper posture, and cardiovascular control.",
      level: "info",
    };
  }
  return {
    message: "Excellent pacing. Perfect for aerobic conditioning, recovery flow, or joint mobility.",
    level: "success",
  };
}
