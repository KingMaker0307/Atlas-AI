import { exercises, getExerciseById } from "@/data/exercises";
import { clamp } from "@/lib/id";
import type {
  BodyMetric,
  ProgressionRecommendation,
  RecoveryLog,
  Workout,
  WorkoutExercise,
  WorkoutSet,
} from "@/types/domain";

export function calculateRecoveryScore(log?: RecoveryLog): number {
  if (!log) return 72;

  const sleep = clamp((log.sleepHours / 8) * 100, 35, 100);
  const soreness = 100 - log.soreness * 10;
  const stress = 100 - log.stress * 10;
  const readiness = log.readiness * 10;
  const energy = log.energy * 10;

  return Math.round(
    sleep * 0.3 + soreness * 0.18 + stress * 0.16 + readiness * 0.2 + energy * 0.16,
  );
}

export function calculateWorkoutVolume(workout: Workout): number {
  return workout.exercises.reduce((workoutTotal, exercise) => {
    return (
      workoutTotal +
      exercise.sets.reduce((setTotal, set) => {
        if (!set.completed) return setTotal;
        return setTotal + set.reps * set.weight;
      }, 0)
    );
  }, 0);
}

export function getWeeklyVolume(workouts: Workout[]): number {
  const weekAgo = Date.now() - 7 * 86400000;
  return workouts
    .filter((workout) => new Date(workout.startedAt).getTime() >= weekAgo)
    .reduce((total, workout) => total + calculateWorkoutVolume(workout), 0);
}

export function getVolumeSeries(workouts: Workout[]): Array<{ week: string; volume: number }> {
  const buckets = new Map<string, number>();

  workouts.forEach((workout) => {
    const date = new Date(workout.startedAt);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    const key = weekStart.toISOString().slice(5, 10);
    buckets.set(key, (buckets.get(key) ?? 0) + calculateWorkoutVolume(workout));
  });

  return Array.from(buckets.entries())
    .map(([week, volume]) => ({ week, volume: Math.round(volume) }))
    .slice(-8);
}

export function getBodyweightSeries(metrics: BodyMetric[]): Array<{ date: string; weight: number }> {
  return metrics
    .filter((metric) => typeof metric.bodyweight === "number")
    .slice(-12)
    .map((metric) => ({
      date: metric.date.slice(5),
      weight: Number(metric.bodyweight?.toFixed(1)),
    }));
}

export function estimateOneRepMax(weight: number, reps: number): number {
  if (!weight || !reps) return 0;
  return Math.round(weight * (1 + reps / 30));
}

export function getStrengthSeries(
  workouts: Workout[],
  exerciseId: string,
): Array<{ date: string; estimated1rm: number }> {
  return workouts
    .flatMap((workout) =>
      workout.exercises
        .filter((exercise) => exercise.exerciseId === exerciseId)
        .flatMap((exercise) =>
          exercise.sets
            .filter((set) => set.completed && set.weight > 0)
            .map((set) => ({
              date: workout.startedAt.slice(5, 10),
              estimated1rm: estimateOneRepMax(set.weight, set.reps),
            })),
        ),
    )
    .reduce<Array<{ date: string; estimated1rm: number }>>((bestByDate, point) => {
      const existing = bestByDate.find((item) => item.date === point.date);
      if (existing) {
        existing.estimated1rm = Math.max(existing.estimated1rm, point.estimated1rm);
      } else {
        bestByDate.push(point);
      }
      return bestByDate;
    }, [])
    .slice(-10);
}

export function getCurrentStreak(workouts: Workout[]): number {
  const completedDates = new Set(
    workouts
      .filter((workout) => workout.completedAt)
      .map((workout) => workout.startedAt.slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();

  for (let i = 0; i < 30; i += 1) {
    const key = cursor.toISOString().slice(0, 10);
    if (completedDates.has(key)) {
      streak += 1;
    } else if (i > 0) {
      break;
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

export function getRecentPrs(workouts: Workout[]): Array<{
  exerciseName: string;
  value: string;
  date: string;
}> {
  const best = new Map<string, { estimated1rm: number; date: string }>();

  workouts.forEach((workout) => {
    workout.exercises.forEach((exercise) => {
      exercise.sets.forEach((set) => {
        if (!set.completed || set.weight <= 0) return;
        const estimated1rm = estimateOneRepMax(set.weight, set.reps);
        const previous = best.get(exercise.exerciseId);
        if (!previous || estimated1rm > previous.estimated1rm) {
          best.set(exercise.exerciseId, {
            estimated1rm,
            date: workout.startedAt.slice(0, 10),
          });
        }
      });
    });
  });

  return Array.from(best.entries())
    .map(([exerciseId, value]) => ({
      exerciseName: getExerciseById(exerciseId)?.name ?? "Exercise",
      value: `${value.estimated1rm} est. 1RM`,
      date: value.date,
    }))
    .slice(0, 4);
}

function parseTopTargetReps(targetReps: string): number {
  const matches = targetReps.match(/\d+/g);
  if (!matches?.length) return 8;
  return Number(matches[matches.length - 1]);
}

function exerciseReadiness(exercise: WorkoutExercise): {
  allTargetsHit: boolean;
  lowRir: boolean;
  avgRir: number;
} {
  const completed = exercise.sets.filter((set) => set.completed);
  const topTarget = parseTopTargetReps(exercise.targetReps);
  const allTargetsHit =
    completed.length >= exercise.targetSets &&
    completed.every((set) => set.reps >= topTarget);
  const rirValues = completed
    .map((set) => set.rir)
    .filter((rir): rir is number => typeof rir === "number");
  const avgRir = rirValues.length
    ? rirValues.reduce((total, rir) => total + rir, 0) / rirValues.length
    : 2;

  return {
    allTargetsHit,
    lowRir: avgRir <= 1,
    avgRir,
  };
}

function lastTwoForExercise(workouts: Workout[], exerciseId: string): WorkoutExercise[] {
  return workouts
    .filter((workout) => workout.completedAt)
    .flatMap((workout) => workout.exercises)
    .filter((exercise) => exercise.exerciseId === exerciseId)
    .slice(-2);
}

function hasStalled(workouts: Workout[], exerciseId: string): boolean {
  const [previous, current] = lastTwoForExercise(workouts, exerciseId);
  if (!previous || !current) return false;

  const previousBest = bestSet(previous.sets);
  const currentBest = bestSet(current.sets);
  if (!previousBest || !currentBest) return false;

  return (
    currentBest.weight <= previousBest.weight &&
    currentBest.reps <= previousBest.reps &&
    (currentBest.rir ?? 2) <= 1
  );
}

function bestSet(sets: WorkoutSet[]): WorkoutSet | undefined {
  return sets
    .filter((set) => set.completed)
    .sort((a, b) => estimateOneRepMax(b.weight, b.reps) - estimateOneRepMax(a.weight, a.reps))[0];
}

export function getProgressionRecommendations(
  workouts: Workout[],
  recoveryScore: number,
): ProgressionRecommendation[] {
  const recentExercises = workouts
    .filter((workout) => workout.completedAt)
    .slice(-3)
    .flatMap((workout) => workout.exercises);

  const uniqueIds = Array.from(new Set(recentExercises.map((exercise) => exercise.exerciseId)));

  return uniqueIds.slice(0, 5).map((exerciseId) => {
    const exercise = [...recentExercises]
      .reverse()
      .find((item) => item.exerciseId === exerciseId);
    const exerciseName = getExerciseById(exerciseId)?.name ?? "Exercise";

    if (recoveryScore < 55) {
      return {
        exerciseId,
        exerciseName,
        action: "reduce_volume",
        suggestedVolumeDelta: -20,
        reason: "Recovery is low, so cap volume and avoid hard failure today.",
      };
    }

    if (hasStalled(workouts, exerciseId)) {
      return {
        exerciseId,
        exerciseName,
        action: "deload",
        suggestedWeightDelta: -10,
        reason: "Two recent sessions show stalled reps under high effort.",
      };
    }

    if (exercise) {
      const readiness = exerciseReadiness(exercise);
      if (readiness.allTargetsHit && readiness.lowRir) {
        return {
          exerciseId,
          exerciseName,
          action: "increase_weight",
          suggestedWeightDelta: exerciseName.includes("Press") ? 2.5 : 5,
          reason: "Target reps were achieved with 1 RIR or less.",
        };
      }
    }

    return {
      exerciseId,
      exerciseName,
      action: "hold",
      reason: "Keep load steady and improve rep quality before increasing.",
    };
  });
}

export function getFatigueLabel(score: number): {
  label: string;
  tone: "good" | "warn" | "bad";
} {
  if (score >= 78) return { label: "Fresh", tone: "good" };
  if (score >= 60) return { label: "Manageable", tone: "warn" };
  return { label: "High fatigue", tone: "bad" };
}

export function topExercisesForAnalytics(): Array<{ id: string; name: string }> {
  return exercises
    .filter((exercise) => exercise.category === "compound")
    .slice(0, 5)
    .map((exercise) => ({ id: exercise.id, name: exercise.name }));
}
