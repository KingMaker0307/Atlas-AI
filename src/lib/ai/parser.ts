import type { Exercise, WorkoutPlan } from "@/types/domain";

interface AiWorkoutPlan extends WorkoutPlan {
  exercises: Exercise[];
}

export function parseAiWorkoutPlan(response: string): AiWorkoutPlan | null {
  try {
    // 1. Try to extract JSON blocks matching ```json ... ``` or ``` ... ```
    const regex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let match;
    while ((match = regex.exec(response)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (isAiWorkoutPlan(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Continue to check other blocks if this one failed to parse
      }
    }

    // 2. If no valid markdown block succeeded, try to find any substring that starts with '{' and ends with '}'
    const firstBrace = response.indexOf("{");
    const lastBrace = response.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      try {
        const potentialJson = response.substring(firstBrace, lastBrace + 1);
        const parsed = JSON.parse(potentialJson.trim());
        if (isAiWorkoutPlan(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Fail-through
      }
    }

    return null;
  } catch (e) {
    return null;
  }
}

function isAiWorkoutPlan(data: any): data is AiWorkoutPlan {
  return (
    data &&
    typeof data === "object" &&
    typeof data.id === "string" &&
    typeof data.name === "string" &&
    Array.isArray(data.routines)
  );
}