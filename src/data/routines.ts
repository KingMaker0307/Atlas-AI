import type { Routine } from "@/types/domain";

export const sampleRoutines: Routine[] = [
  {
    id: "upper-strength",
    name: "Upper Strength",
    focus: "Heavy presses, pulling strength, and controlled accessory volume.",
    estimatedMinutes: 58,
    day: "Monday",
    exercises: [
      {
        exerciseId: "bench-press",
        targetSets: 4,
        targetReps: "4-6",
        restSeconds: 180,
      },
      {
        exerciseId: "pull-up",
        targetSets: 4,
        targetReps: "5-8",
        restSeconds: 150,
      },
      {
        exerciseId: "overhead-press",
        targetSets: 3,
        targetReps: "5-7",
        restSeconds: 150,
      },
      {
        exerciseId: "dumbbell-row",
        targetSets: 3,
        targetReps: "8-12",
        restSeconds: 90,
      },
    ],
  },
  {
    id: "lower-powerbuild",
    name: "Lower Powerbuild",
    focus: "Squat priority with posterior-chain support and core work.",
    estimatedMinutes: 64,
    day: "Tuesday",
    exercises: [
      {
        exerciseId: "barbell-back-squat",
        targetSets: 4,
        targetReps: "4-6",
        restSeconds: 180,
      },
      {
        exerciseId: "romanian-deadlift",
        targetSets: 3,
        targetReps: "6-10",
        restSeconds: 150,
      },
      {
        exerciseId: "deadlift",
        targetSets: 2,
        targetReps: "3-5",
        restSeconds: 210,
      },
      {
        exerciseId: "plank",
        targetSets: 3,
        targetReps: "45-75 sec",
        restSeconds: 60,
      },
    ],
  },
  {
    id: "full-body-base",
    name: "Full Body Base",
    focus: "Efficient full-body training for three-day consistency.",
    estimatedMinutes: 46,
    day: "Wednesday",
    exercises: [
      {
        exerciseId: "barbell-back-squat",
        targetSets: 3,
        targetReps: "6-8",
        restSeconds: 150,
      },
      {
        exerciseId: "bench-press",
        targetSets: 3,
        targetReps: "6-8",
        restSeconds: 150,
      },
      {
        exerciseId: "dumbbell-row",
        targetSets: 3,
        targetReps: "8-12",
        restSeconds: 90,
      },
      {
        exerciseId: "plank",
        targetSets: 2,
        targetReps: "45-60 sec",
        restSeconds: 45,
      },
    ],
  },
];