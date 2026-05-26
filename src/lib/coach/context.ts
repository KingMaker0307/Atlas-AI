import { getExerciseById as getStaticExerciseById } from "@/data/exercises";
import { useAtlasStore } from "@/store/useAtlasStore";

function getExerciseById(id: string) {
  try {
    const storeExercises = useAtlasStore.getState().exercises;
    return storeExercises.find((e) => e.id === id) || getStaticExerciseById(id);
  } catch (e) {
    return getStaticExerciseById(id);
  }
}
import {
  calculateRecoveryScore,
  getProgressionRecommendations,
  getRecentPrs,
  getWeeklyVolume,
} from "@/lib/progression/engine";
import type {
  AiMessage,
  BodyMetric,
  RecoveryLog,
  UserProfile,
  Workout,
} from "@/types/domain";

export function buildCoachContext(input: {
  profile: UserProfile | null;
  workouts: Workout[];
  recoveryLogs: RecoveryLog[];
  bodyMetrics: BodyMetric[];
}): string {
  const latestRecovery = input.recoveryLogs.at(-1);
  const recoveryScore = calculateRecoveryScore(latestRecovery);
  const recommendations = getProgressionRecommendations(input.workouts, recoveryScore);
  const recentWorkouts = input.workouts.slice(-5).map((workout) => ({
    name: workout.name,
    date: workout.startedAt.slice(0, 10),
    durationMinutes: workout.durationMinutes,
    fatigueRating: workout.fatigueRating,
    exercises: workout.exercises.map((exercise) => ({
      name: getExerciseById(exercise.exerciseId)?.name ?? exercise.exerciseId,
      target: `${exercise.targetSets}x${exercise.targetReps}`,
      sets: exercise.sets.map((set) => ({
        reps: set.reps,
        weight: set.weight,
        rir: set.rir,
        rpe: set.rpe,
      })),
    })),
  }));

  return JSON.stringify(
    {
      athlete: input.profile,
      recovery: {
        latest: latestRecovery,
        score: recoveryScore,
      },
      recentWorkouts,
      latestBodyMetric: input.bodyMetrics.at(-1),
      weeklyVolume: getWeeklyVolume(input.workouts),
      recentPrs: getRecentPrs(input.workouts),
      progressionRecommendations: recommendations,
      coachingRules: [
        "Use RIR/RPE to adjust load before changing the plan.",
        "Increase load when target reps are achieved at 1 RIR or easier.",
        "Recommend deloads after repeated stalls or low recovery.",
        "Keep advice concise, specific, and grounded in the user's local data.",
      ],
    },
    null,
    2,
  );
}

export function mockCoachResponse(
  userMessage: string,
  context: string,
  history: AiMessage[],
): string {
  const lowered = userMessage.toLowerCase();
  const parsed = JSON.parse(context) as {
    recovery?: { score?: number };
    progressionRecommendations?: Array<{ exerciseName: string; action: string; reason: string }>;
    weeklyVolume?: number;
  };
  const recovery = parsed.recovery?.score ?? 72;
  const topRecommendation = parsed.progressionRecommendations?.[0];
  const volume = Math.round(parsed.weeklyVolume ?? 0);
  const previousTopic = history.at(-2)?.content.slice(0, 90);

  if (lowered.includes("nutrition") || lowered.includes("protein")) {
    return `Based on your current training load, I’d keep nutrition simple today: hit protein, place most carbs around training, and keep hydration deliberate. Recovery is ${recovery}/100, so this is a good day to support performance rather than cut aggressively.`;
  }

  if (lowered.includes("tired") || lowered.includes("fatigue") || recovery < 60) {
    return `Your recovery score is ${recovery}/100, so I’d reduce hard sets by about 20% and keep 2 RIR on compounds. Keep the movement pattern, but make today about clean reps and leaving the gym better than you entered.`;
  }

  if (lowered.includes("progress") || lowered.includes("increase") || lowered.includes("weight")) {
    return topRecommendation
      ? `${topRecommendation.exerciseName}: ${topRecommendation.reason} My call is ${topRecommendation.action.replace("_", " ")} next time, then reassess bar speed and RIR before adding more volume.`
      : "I’d hold load steady for one more exposure and chase cleaner reps before increasing. Your next jump should come from repeatable performance, not one heroic top set.";
  }

  return `Here’s the coach read: recovery is ${recovery}/100, weekly volume is ${volume.toLocaleString()}, and the next session should prioritize quality on your first compound lift. ${topRecommendation ? `${topRecommendation.exerciseName}: ${topRecommendation.reason}` : "Keep accessories controlled and stop sets when rep speed changes."}${previousTopic ? ` I’m also carrying forward your last topic: ${previousTopic}` : ""}`;
}
