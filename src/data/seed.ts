import type { AiMessage, BodyMetric, RecoveryLog, UserProfile, Workout, AiProviderSettings } from "@/types/domain";
import { createId } from "@/lib/id";

export const defaultProfile: UserProfile = {
  id: "default-user",
  name: "Athlete",
  goal: "Get stronger and build muscle",
  experience: "intermediate",
  trainingStyle: "powerbuilding",
  daysPerWeek: 4,
  weightUnit: "lbs",
  heightUnit: "in",
  createdAt: new Date().toISOString(),
  gender: "male",
  activityLevel: "moderately_active",
};

export const sampleWorkouts: Workout[] = [];
export const sampleRecoveryLogs: RecoveryLog[] = [];
export const sampleBodyMetrics: BodyMetric[] = [];

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