import type { AiMessage, BodyMetric, RecoveryLog, UserProfile, Workout, AiProviderSettings } from "@/types/domain";
import { createId } from "@/lib/id";

export const defaultProfile: UserProfile = {
  id: "default-user",
  name: "Athlete",
  goal: "Build bench press strength and hypertrophy",
  experience: "intermediate",
  trainingStyle: "hypertrophy",
  daysPerWeek: 4,
  weightUnit: "lbs",
  heightUnit: "in",
  createdAt: new Date().toISOString(),
  gender: "male",
  activityLevel: "moderately_active",
};

// Generate historical dates relative to June 2, 2026
const getDateAgo = (daysAgo: number): string => {
  const d = new Date("2026-06-02T12:00:00Z");
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split("T")[0];
};

export const sampleWorkouts: Workout[] = [
  {
    id: "w-1",
    name: "Push Day A",
    startedAt: getDateAgo(12) + "T10:00:00Z",
    completedAt: getDateAgo(12) + "T11:00:00Z",
    durationMinutes: 60,
    planId: "plan-1",
    exercises: [
      {
        id: "we-1",
        exerciseId: "bench-press",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 90,
        sets: [
          { id: "s-1-1", reps: 8, weight: 185, rir: 2, completed: true },
          { id: "s-1-2", reps: 8, weight: 185, rir: 2, completed: true },
          { id: "s-1-3", reps: 8, weight: 185, rir: 1, completed: true },
        ],
      },
      {
        id: "we-2",
        exerciseId: "overhead-press",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 90,
        sets: [
          { id: "s-2-1", reps: 10, weight: 115, rir: 2, completed: true },
          { id: "s-2-2", reps: 9, weight: 115, rir: 1, completed: true },
          { id: "s-2-3", reps: 8, weight: 115, rir: 0, completed: true },
        ],
      },
    ],
  },
  {
    id: "w-2",
    name: "Squat Day A",
    startedAt: getDateAgo(10) + "T10:00:00Z",
    completedAt: getDateAgo(10) + "T11:05:00Z",
    durationMinutes: 65,
    planId: "plan-1",
    exercises: [
      {
        id: "we-3",
        exerciseId: "barbell-back-squat",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 120,
        sets: [
          { id: "s-3-1", reps: 8, weight: 225, rir: 2, completed: true },
          { id: "s-3-2", reps: 8, weight: 225, rir: 2, completed: true },
          { id: "s-3-3", reps: 8, weight: 225, rir: 1, completed: true },
        ],
      },
    ],
  },
  {
    id: "w-3",
    name: "Push Day B",
    startedAt: getDateAgo(8) + "T10:00:00Z",
    completedAt: getDateAgo(8) + "T11:00:00Z",
    durationMinutes: 60,
    planId: "plan-1",
    exercises: [
      {
        id: "we-4",
        exerciseId: "bench-press",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 90,
        sets: [
          { id: "s-4-1", reps: 10, weight: 185, rir: 1, completed: true },
          { id: "s-4-2", reps: 9, weight: 185, rir: 1, completed: true },
          { id: "s-4-3", reps: 8, weight: 185, rir: 0, completed: true },
        ],
      },
      {
        id: "we-5",
        exerciseId: "overhead-press",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 90,
        sets: [
          { id: "s-5-1", reps: 10, weight: 115, rir: 2, completed: true },
          { id: "s-5-2", reps: 10, weight: 115, rir: 1, completed: true },
          { id: "s-5-3", reps: 10, weight: 115, rir: 0, completed: true },
        ],
      },
    ],
  },
  {
    id: "w-4",
    name: "Squat Day B",
    startedAt: getDateAgo(5) + "T10:00:00Z",
    completedAt: getDateAgo(5) + "T11:05:00Z",
    durationMinutes: 65,
    planId: "plan-1",
    exercises: [
      {
        id: "we-6",
        exerciseId: "barbell-back-squat",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 120,
        sets: [
          { id: "s-6-1", reps: 10, weight: 225, rir: 1, completed: true },
          { id: "s-6-2", reps: 9, weight: 225, rir: 0, completed: true },
          { id: "s-6-3", reps: 8, weight: 225, rir: 0, completed: true },
        ],
      },
    ],
  },
  {
    id: "w-5",
    name: "Push Day C",
    startedAt: getDateAgo(2) + "T10:00:00Z",
    completedAt: getDateAgo(2) + "T11:00:00Z",
    durationMinutes: 60,
    planId: "plan-1",
    exercises: [
      {
        id: "we-7",
        exerciseId: "bench-press",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 90,
        sets: [
          { id: "s-7-1", reps: 8, weight: 190, rir: 2, completed: true },
          { id: "s-7-2", reps: 8, weight: 190, rir: 1, completed: true },
          { id: "s-7-3", reps: 8, weight: 190, rir: 0, completed: true },
        ],
      },
      {
        id: "we-8",
        exerciseId: "overhead-press",
        targetSets: 3,
        targetReps: "8-10",
        restSeconds: 90,
        sets: [
          { id: "s-8-1", reps: 8, weight: 120, rir: 2, completed: true },
          { id: "s-8-2", reps: 8, weight: 120, rir: 1, completed: true },
          { id: "s-8-3", reps: 7, weight: 120, rir: 0, completed: true },
        ],
      },
    ],
  },
];

export const sampleRecoveryLogs: RecoveryLog[] = [
  { id: "r-1", date: getDateAgo(12), sleepHours: 8, soreness: 2, stress: 3, readiness: 8, energy: 7 },
  { id: "r-2", date: getDateAgo(11), sleepHours: 7.5, soreness: 3, stress: 2, readiness: 7, energy: 7 },
  { id: "r-3", date: getDateAgo(10), sleepHours: 8.5, soreness: 1, stress: 2, readiness: 9, energy: 9 },
  { id: "r-4", date: getDateAgo(9), sleepHours: 7, soreness: 3, stress: 4, readiness: 6, energy: 6 },
  { id: "r-5", date: getDateAgo(8), sleepHours: 8.2, soreness: 2, stress: 2, readiness: 8, energy: 8 },
  { id: "r-6", date: getDateAgo(7), sleepHours: 6.5, soreness: 2, stress: 3, readiness: 6, energy: 6 },
  { id: "r-7", date: getDateAgo(6), sleepHours: 7.8, soreness: 4, stress: 2, readiness: 7, energy: 7 },
  { id: "r-8", date: getDateAgo(5), sleepHours: 8.5, soreness: 1, stress: 1, readiness: 9, energy: 9 },
  { id: "r-9", date: getDateAgo(4), sleepHours: 8, soreness: 2, stress: 2, readiness: 8, energy: 8 },
  { id: "r-10", date: getDateAgo(3), sleepHours: 7.2, soreness: 3, stress: 3, readiness: 7, energy: 6 },
  { id: "r-11", date: getDateAgo(2), sleepHours: 8.6, soreness: 1, stress: 1, readiness: 9, energy: 9 },
  { id: "r-12", date: getDateAgo(1), sleepHours: 7.5, soreness: 2, stress: 2, readiness: 8, energy: 7 },
  { id: "r-13", date: getDateAgo(0), sleepHours: 8.2, soreness: 2, stress: 2, readiness: 9, energy: 8 },
];

export const sampleBodyMetrics: BodyMetric[] = [
  { id: "bm-1", date: getDateAgo(12), bodyweight: 175.5 },
  { id: "bm-2", date: getDateAgo(10), bodyweight: 175.2 },
  { id: "bm-3", date: getDateAgo(8), bodyweight: 174.9 },
  { id: "bm-4", date: getDateAgo(5), bodyweight: 174.5 },
  { id: "bm-5", date: getDateAgo(2), bodyweight: 174.1 },
  { id: "bm-6", date: getDateAgo(0), bodyweight: 173.8 },
];

export const initialAiMessages: AiMessage[] = [
  {
    id: createId("assistant"),
    role: "assistant",
    content: "Welcome to Atlas AI Coach! I'm here to help you achieve your fitness goals. To get started, I can generate a personalized workout plan for you. Just let me know what you're looking for.",
    createdAt: new Date().toISOString(),
  },
];

export const defaultProviders: AiProviderSettings[] = [
  {
    id: "openai-gpt-4o",
    type: "openai",
    label: "OpenAI",
    model: "gpt-4o",
    temperature: 0.7,
    contextLength: 8000,
    streaming: true,
    enabled: true,
  },
];