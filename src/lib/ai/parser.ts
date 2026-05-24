import type { Exercise, Routine } from "@/types/domain";

export interface AiWorkoutPlan {
  routines: Routine[];
  exercises: Exercise[];
}

export function parseAiWorkoutPlan(jsonString: string): AiWorkoutPlan | null {
  try {
    // Clean the string: remove Markdown code blocks and find the JSON object
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return null;
    }
    const cleanedJson = jsonMatch[0];
    const parsed = JSON.parse(cleanedJson) as AiWorkoutPlan;

    if (
      !parsed ||
      !Array.isArray(parsed.routines) ||
      !Array.isArray(parsed.exercises)
    ) {
      return null;
    }

    // Basic validation of the structure
    for (const routine of parsed.routines) {
      if (
        typeof routine.id !== "string" ||
        typeof routine.name !== "string" ||
        !Array.isArray(routine.exercises)
      ) {
        return null;
      }
    }

    for (const exercise of parsed.exercises) {
      if (typeof exercise.id !== "string" || typeof exercise.name !== "string") {
        return null;
      }
    }

    return parsed;
  } catch (error) {
    console.error("Failed to parse AI workout plan:", error);
    return null;
  }
}