import type {
  AiMessage,
  AiProviderSettings,
  BodyMetric,
  RecoveryLog,
  UserProfile,
  Workout,
} from "@/types/domain";
import { sampleRoutines } from "@/data/routines";

export const defaultProfile: UserProfile = {
  id: "user_local",
  name: "Athlete",
  goal: "Build strength while staying recovered",
  experience: "intermediate",
  trainingStyle: "powerbuilding",
  daysPerWeek: 4,
  units: "imperial",
  createdAt: new Date().toISOString(),
  age: 30,
  height: 70,
  weight: 180,
  targetPhysique: "lean and athletic",
  dietaryPreferences: "high protein, moderate carb",
};

export const defaultProviders: AiProviderSettings[] = [
  {
    id: "openai-default",
    type: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    model: "gpt-4.1-mini",
    temperature: 0.6,
    contextLength: 24000,
    streaming: true,
    enabled: false,
  },
  {
    id: "anthropic-default",
    type: "anthropic",
    label: "Claude",
    baseUrl: "https://api.anthropic.com/v1",
    model: "claude-3-5-sonnet-latest",
    temperature: 0.5,
    contextLength: 20000,
    streaming: true,
    enabled: false,
  },
  {
    id: "gemini-default",
    type: "gemini",
    label: "Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    model: "gemini-1.5-flash",
    temperature: 0.6,
    contextLength: 32000,
    streaming: false,
    enabled: false,
  },
  {
    id: "openrouter-default",
    type: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    model: "openai/gpt-4o-mini",
    temperature: 0.6,
    contextLength: 24000,
    streaming: true,
    enabled: false,
  },
  {
    id: "ollama-local",
    type: "ollama",
    label: "Ollama Local",
    baseUrl: "http://localhost:11434",
    model: "llama3.1",
    temperature: 0.6,
    contextLength: 8000,
    streaming: true,
    enabled: false,
  },
  {
    id: "lmstudio-local",
    type: "lmstudio",
    label: "LM Studio",
    baseUrl: "http://localhost:1234/v1",
    model: "local-model",
    temperature: 0.6,
    contextLength: 8000,
    streaming: true,
    enabled: false,
  },
];

export const sampleWorkouts: Workout[] = [
  {
    id: "sample_workout_1",
    name: "Upper Strength",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2 + 58 * 60000).toISOString(),
    durationMinutes: 58,
    fatigueRating: 6,
    exercises: [
      {
        id: "sample_we_1",
        exerciseId: "bench-press",
        targetSets: 4,
        targetReps: "4-6",
        restSeconds: 180,
        sets: [
          { id: "s1", reps: 6, weight: 185, rir: 1, rpe: 9, completed: true },
          { id: "s2", reps: 6, weight: 185, rir: 1, rpe: 9, completed: true },
          { id: "s3", reps: 5, weight: 185, rir: 1, rpe: 9, completed: true },
          { id: "s4", reps: 5, weight: 185, rir: 0, rpe: 10, completed: true },
        ],
      },
      {
        id: "sample_we_2",
        exerciseId: "pull-up",
        targetSets: 4,
        targetReps: "5-8",
        restSeconds: 150,
        sets: [
          { id: "s5", reps: 8, weight: 0, rir: 2, completed: true },
          { id: "s6", reps: 7, weight: 0, rir: 1, completed: true },
          { id: "s7", reps: 7, weight: 0, rir: 1, completed: true },
        ],
      },
    ],
  },
  {
    id: "sample_workout_2",
    name: "Lower Powerbuild",
    startedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5 + 62 * 60000).toISOString(),
    durationMinutes: 62,
    fatigueRating: 7,
    exercises: [
      {
        id: "sample_we_3",
        exerciseId: "barbell-back-squat",
        targetSets: 4,
        targetReps: "4-6",
        restSeconds: 180,
        sets: [
          { id: "s8", reps: 6, weight: 245, rir: 1, completed: true },
          { id: "s9", reps: 6, weight: 245, rir: 1, completed: true },
          { id: "s10", reps: 5, weight: 245, rir: 1, completed: true },
        ],
      },
      {
        id: "sample_we_4",
        exerciseId: "romanian-deadlift",
        targetSets: 3,
        targetReps: "6-10",
        restSeconds: 150,
        sets: [
          { id: "s11", reps: 10, weight: 205, rir: 2, completed: true },
          { id: "s12", reps: 9, weight: 205, rir: 2, completed: true },
          { id: "s13", reps: 8, weight: 205, rir: 2, completed: true },
        ],
      },
    ],
  },
];

export const sampleRecoveryLogs: RecoveryLog[] = [
  {
    id: "recovery_today",
    date: new Date().toISOString().slice(0, 10),
    sleepHours: 7.4,
    soreness: 4,
    stress: 3,
    readiness: 8,
    energy: 7,
    note: "Good baseline. Keep intensity high but cap grinders.",
  },
  {
    id: "recovery_yesterday",
    date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
    sleepHours: 6.8,
    soreness: 5,
    stress: 4,
    readiness: 7,
    energy: 6,
  },
];

export const sampleBodyMetrics: BodyMetric[] = [
  {
    id: "body_1",
    date: new Date(Date.now() - 86400000 * 21).toISOString().slice(0, 10),
    bodyweight: 181.4,
    waist: 33.8,
    bodyFat: 15.8,
  },
  {
    id: "body_2",
    date: new Date(Date.now() - 86400000 * 14).toISOString().slice(0, 10),
    bodyweight: 180.6,
    waist: 33.6,
    bodyFat: 15.5,
  },
  {
    id: "body_3",
    date: new Date(Date.now() - 86400000 * 7).toISOString().slice(0, 10),
    bodyweight: 180.1,
    waist: 33.4,
    bodyFat: 15.2,
  },
  {
    id: "body_4",
    date: new Date().toISOString().slice(0, 10),
    bodyweight: 179.8,
    waist: 33.3,
    bodyFat: 15.1,
  },
];

export const initialAiMessages: AiMessage[] = [
  {
    id: "welcome",
    role: "assistant",
    createdAt: new Date().toISOString(),
    content:
      "I’m ready. Today I’d keep the main lift heavy, avoid true maxes, and use your recovery score to decide whether accessories stay aggressive or become pump work.",
  },
];

export const defaultRoutines = sampleRoutines;