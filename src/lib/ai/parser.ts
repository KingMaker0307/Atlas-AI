import type { Exercise, WorkoutPlan } from "@/types/domain";

interface AiWorkoutPlan extends WorkoutPlan {
  exercises: Exercise[];
}

function cleanJsonString(str: string): string {
  return str
    // Remove single-line comments only if they are not preceded by ':' (to avoid stripping URLs)
    .replace(/(?<!:)\/\/.*$/gm, "")
    // Remove multi-line comments
    .replace(/\/\*[\s\S]*?\*\//g, "")
    // Remove trailing commas before closing braces/brackets
    .replace(/,\s*([\]}])/g, "$1");
}

export function parseAiWorkoutPlan(response: string): AiWorkoutPlan | null {
  try {
    // 1. Try to extract JSON blocks matching ```json ... ``` or ``` ... ```
    const regex = /```(?:json)?\s*([\s\S]*?)\s*```/gi;
    let match;
    while ((match = regex.exec(response)) !== null) {
      try {
        const cleanedStr = cleanJsonString(match[1].trim());
        const parsed = JSON.parse(cleanedStr);
        if (isAiWorkoutPlan(parsed)) {
          if (!parsed.id || typeof parsed.id !== "string") {
            parsed.id = "plan_" + Math.random().toString(36).substring(2, 9);
          }
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
        const cleanedStr = cleanJsonString(potentialJson.trim());
        const parsed = JSON.parse(cleanedStr);
        if (isAiWorkoutPlan(parsed)) {
          if (!parsed.id || typeof parsed.id !== "string") {
            parsed.id = "plan_" + Math.random().toString(36).substring(2, 9);
          }
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
    typeof data.name === "string" &&
    Array.isArray(data.routines)
  );
}