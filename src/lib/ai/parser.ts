import type { Exercise, WorkoutPlan } from "@/types/domain";

interface AiWorkoutPlan extends WorkoutPlan {
  exercises: Exercise[];
}

export function parseAiWorkoutPlan(response: string): AiWorkoutPlan | null {
  try {
    const jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch && jsonMatch[1]) {
      const parsed = JSON.parse(jsonMatch[1]);
      if (isAiWorkoutPlan(parsed)) {
        return parsed;
      }
    }

    // If no markdown block is found, try to parse the whole string
    if (response.trim().startsWith("{")) {
      const parsed = JSON.parse(response);
      if (isAiWorkoutPlan(parsed)) {
        return parsed;
      }
    }

    return null;
  } catch (e) {
    // This is expected if the message is not a workout plan.
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