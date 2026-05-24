"use client";

import { create } from "zustand";
import { exercises as staticExercises } from "@/data/exercises";
import {
  defaultProfile,
  defaultProviders,
  initialAiMessages,
  sampleBodyMetrics,
  sampleRecoveryLogs,
  sampleWorkouts,
} from "@/data/seed";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import { buildCoachContext } from "@/lib/coach/context";
import { createId, minutesBetween } from "@/lib/id";
import { getProgressionRecommendations } from "@/lib/progression/engine";
import { decryptExport, decryptString, encryptForExport, encryptString } from "@/lib/security/crypto";
import { loadSnapshot, saveSnapshot } from "@/lib/storage/db";
import { findFirstSupportedModel, getProviderAdapter } from "@/providers";
import type {
  AiMessage,
  AiProviderSettings,
  AtlasSnapshot,
  BodyMetric,
  Exercise,
  HeightUnit,
  RecoveryLog,
  Routine,
  ThemeMode,
  UserProfile,
  WeightUnit,
  Workout,
  WorkoutSet,
} from "@/types/domain";

export type AtlasTab = "dashboard" | "workout" | "coach" | "progress" | "settings";

interface OnboardingData extends UserProfile {
  apiKey?: string;
  providerType?: AiProviderSettings["type"];
}

interface AtlasState {
  hydrated: boolean;
  activeTab: AtlasTab;
  profile: UserProfile | null;
  workouts: Workout[];
  activeWorkout: Workout | null;
  restTimerEndsAt?: string;
  recoveryLogs: RecoveryLog[];
  bodyMetrics: BodyMetric[];
  aiMessages: AiMessage[];
  aiProviders: AiProviderSettings[];
  activeProviderId?: string;
  routines: Routine[];
  exercises: Exercise[];
  theme: ThemeMode;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  hasOnboarded: boolean;
  coachBusy: boolean;
  providerBusy: boolean;
  setActiveTab: (tab: AtlasTab) => void;
  hydrate: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setWeightUnit: (unit: WeightUnit) => Promise<void>;
  setHeightUnit: (unit: HeightUnit) => Promise<void>;
  logRecovery: (log: RecoveryLog) => Promise<void>;
  logBodyMetric: (metric: BodyMetric) => Promise<void>;
  startWorkout: (routine: Routine) => Promise<void>;
  addSet: (workoutExerciseId: string) => Promise<void>;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<WorkoutSet>,
  ) => Promise<void>;
  finishWorkout: (fatigueRating?: number, notes?: string) => Promise<void>;
  discardWorkout: () => Promise<void>;
  startRestTimer: (seconds: number) => Promise<void>;
  saveProvider: (provider: AiProviderSettings, apiKeyPlain?: string) => Promise<void>;
  setActiveProvider: (providerId: string) => Promise<void>;
  testProvider: (providerId: string) => Promise<void>;
  sendCoachMessage: (content: string, isRoutineGeneration?: boolean) => Promise<void>;
  exportEncryptedProfile: (passphrase: string) => Promise<string>;
  importEncryptedProfile: (fileText: string, passphrase: string) => Promise<void>;
  resetLocalData: () => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  saveRoutines: (routines: Routine[]) => Promise<void>;
}

type StoredSnapshot = AtlasSnapshot & { exercises: Exercise[] };

function freshSnapshot(): StoredSnapshot {
  return {
    profile: defaultProfile,
    workouts: sampleWorkouts,
    activeWorkout: null,
    recoveryLogs: sampleRecoveryLogs,
    bodyMetrics: sampleBodyMetrics,
    aiMessages: initialAiMessages,
    aiProviders: defaultProviders,
    activeProviderId: undefined,
    routines: [],
    exercises: staticExercises,
    theme: "system",
    weightUnit: "lbs",
    heightUnit: "in",
    hasOnboarded: false,
    updatedAt: new Date().toISOString(),
  };
}

function isValidSnapshot(data: any): data is StoredSnapshot {
  return (
    data &&
    typeof data === "object" &&
    "profile" in data &&
    "routines" in data &&
    "exercises" in data &&
    "workouts" in data
  );
}

function snapshotFromState(state: AtlasState): StoredSnapshot {
  return {
    profile: state.profile,
    workouts: state.workouts,
    activeWorkout: state.activeWorkout,
    recoveryLogs: state.recoveryLogs,
    bodyMetrics: state.bodyMetrics,
    aiMessages: state.aiMessages,
    aiProviders: state.aiProviders,
    activeProviderId: state.activeProviderId,
    routines: state.routines,
    exercises: state.exercises,
    theme: state.theme,
    weightUnit: state.weightUnit,
    heightUnit: state.heightUnit,
    hasOnboarded: state.hasOnboarded,
    restTimerEndsAt: state.restTimerEndsAt,
    updatedAt: new Date().toISOString(),
  };
}

async function persistState(state: AtlasState): Promise<void> {
  const snapshot = snapshotFromState(state);
  await saveSnapshot(snapshot);
}

function recentWeightForExercise(workouts: Workout[], exerciseId: string): number {
  const last = [...workouts]
    .reverse()
    .flatMap((workout) => workout.exercises)
    .find((exercise) => exercise.exerciseId === exerciseId);
  const best = last?.sets
    .filter((set) => set.completed)
    .sort((a, b) => b.weight * b.reps - a.weight * a.reps)[0];
  return best?.weight ?? 0;
}

function buildWorkoutFromRoutine(state: AtlasState, routine: Routine): Workout {
  return {
    id: createId("workout"),
    name: routine.name,
    startedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise) => {
      const lastWeight = recentWeightForExercise(state.workouts, exercise.exerciseId);
      const targetReps = Number(exercise.targetReps.match(/\d+/)?.[0] ?? 8);
      return {
        id: createId("workout_exercise"),
        exerciseId: exercise.exerciseId,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        sets: Array.from({ length: exercise.targetSets }).map(() => ({
          id: createId("set"),
          reps: targetReps,
          weight: lastWeight,
          rir: 2,
          completed: false,
        })),
      };
    }),
  };
}

export const useAtlasStore = create<AtlasState>((set, get) => ({
  ...freshSnapshot(),
  hydrated: false,
  activeTab: "dashboard",
  coachBusy: false,
  providerBusy: false,
  getExerciseById: (id: string) => {
    return get().exercises.find((exercise) => exercise.id === id);
  },
  setActiveTab: (tab) => set({ activeTab: tab }),
  hydrate: async () => {
    const localData = await loadSnapshot();
    const snapshot = isValidSnapshot(localData) ? localData : freshSnapshot();
    set({
      ...snapshot,
      hydrated: true,
      activeTab: "dashboard",
      coachBusy: false,
      providerBusy: false,
    });
  },
  saveRoutines: async (routines: Routine[]) => {
    set({ routines });
    await persistState(get());
  },
  completeOnboarding: async (data) => {
    const { apiKey, providerType, ...profile } = data;
    
    if (apiKey && providerType) {
      const providerId = createId("provider");
      const tempProvider: AiProviderSettings = {
        id: providerId,
        type: providerType,
        label: providerType,
        model: "temp",
        temperature: 0.7,
        contextLength: 8000,
        streaming: false,
        enabled: true,
      };
      const model = await findFirstSupportedModel(tempProvider, apiKey);
      if (!model) {
        throw new Error("No supported models found for this provider.");
      }
      const newProvider: AiProviderSettings = {
        ...tempProvider,
        model,
        apiKey: await encryptString(apiKey),
      };
      set({ aiProviders: [newProvider], activeProviderId: providerId });
    }

    set({ profile, hasOnboarded: true });
    await persistState(get());
  },
  updateProfile: async (patch) => {
    const profile = get().profile;
    if (!profile) return;
    const updatedProfile = { ...profile, ...patch };
    set({ profile: updatedProfile });
    await persistState(get());
  },
  setTheme: async (theme) => {
    set({ theme });
    await persistState(get());
  },
  setWeightUnit: async (unit) => {
    set({ weightUnit: unit });
    await persistState(get());
  },
  setHeightUnit: async (unit) => {
    set({ heightUnit: unit });
    await persistState(get());
  },
  logRecovery: async (log) => {
    const filtered = get().recoveryLogs.filter((item) => item.date !== log.date);
    set({ recoveryLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) });
    await persistState(get());
  },
  logBodyMetric: async (metric) => {
    const filtered = get().bodyMetrics.filter((item) => item.date !== metric.date);
    set({ bodyMetrics: [...filtered, metric].sort((a, b) => a.date.localeCompare(b.date)) });
    await persistState(get());
  },
  startWorkout: async (routine) => {
    set({
      activeWorkout: buildWorkoutFromRoutine(get(), routine),
      activeTab: "workout",
    });
    await persistState(get());
  },
  addSet: async (workoutExerciseId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          const last = exercise.sets.at(-1);
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              {
                id: createId("set"),
                reps: last?.reps ?? 8,
                weight: last?.weight ?? 0,
                rir: last?.rir ?? 2,
                completed: false,
              },
            ],
          };
        }),
      },
    });
    await persistState(get());
  },
  updateSet: async (workoutExerciseId, setId, patch) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.map((workoutSet) =>
              workoutSet.id === setId ? { ...workoutSet, ...patch } : workoutSet,
            ),
          };
        }),
      },
    });
    await persistState(get());
  },
  finishWorkout: async (fatigueRating = 6, notes) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    const completedAt = new Date().toISOString();
    const completedWorkout: Workout = {
      ...activeWorkout,
      notes,
      fatigueRating,
      completedAt,
      durationMinutes: minutesBetween(activeWorkout.startedAt, completedAt),
    };
    set({
      workouts: [...get().workouts, completedWorkout],
      activeWorkout: null,
      restTimerEndsAt: undefined,
      aiMessages: [
        ...get().aiMessages,
        {
          id: createId("assistant"),
          role: "assistant",
          createdAt: new Date().toISOString(),
          content: `Logged ${completedWorkout.name}.`,
        },
      ],
      activeTab: "dashboard",
    });
    await persistState(get());
  },
  discardWorkout: async () => {
    set({ activeWorkout: null, restTimerEndsAt: undefined });
    await persistState(get());
  },
  startRestTimer: async (seconds) => {
    set({ restTimerEndsAt: new Date(Date.now() + seconds * 1000).toISOString() });
    await persistState(get());
  },
  saveProvider: async (provider, apiKeyPlain) => {
    const encrypted = apiKeyPlain ? await encryptString(apiKeyPlain) : provider.apiKey;
    const nextProvider = { ...provider, apiKey: encrypted };
    const providers = get().aiProviders.some((item) => item.id === provider.id)
      ? get().aiProviders.map((item) => (item.id === provider.id ? nextProvider : item))
      : [...get().aiProviders, nextProvider];
    set({
      aiProviders: providers,
      activeProviderId: provider.enabled ? provider.id : get().activeProviderId,
    });
    await persistState(get());
  },
  setActiveProvider: async (providerId) => {
    set({
      activeProviderId: providerId,
      aiProviders: get().aiProviders.map((provider) => ({
        ...provider,
        enabled: provider.id === providerId,
      })),
    });
    await persistState(get());
  },
  testProvider: async (providerId) => {
    const provider = get().aiProviders.find((item) => item.id === providerId);
    if (!provider) return;
    set({ providerBusy: true });
    try {
      const apiKey = await decryptString(provider.apiKey);
      const adapter = getProviderAdapter(provider.type);
      await adapter.validate(provider, apiKey);
      set({
        aiProviders: get().aiProviders.map((item) =>
          item.id === providerId
            ? {
                ...item,
                lastStatus: "ok",
                lastError: undefined,
                lastTestedAt: new Date().toISOString(),
              }
            : item,
        ),
        providerBusy: false,
      });
    } catch (error) {
      set({
        aiProviders: get().aiProviders.map((item) =>
          item.id === providerId
            ? {
                ...item,
                lastStatus: "error",
                lastError: error instanceof Error ? error.message : "Connection failed",
                lastTestedAt: new Date().toISOString(),
              }
            : item,
        ),
        providerBusy: false,
      });
    }
    await persistState(get());
  },
  sendCoachMessage: async (content, isRoutineGeneration = false) => {
    const userMessage: AiMessage = {
      id: createId("user"),
      role: "user",
      content,
      createdAt: new Date().toISOString(),
    };
    const assistantId = createId("assistant");
    const assistantMessage: AiMessage = {
      id: assistantId,
      role: "assistant",
      content: "",
      createdAt: new Date().toISOString(),
    };
    set({
      aiMessages: [...get().aiMessages, userMessage, assistantMessage],
      coachBusy: true,
    });
    const context = buildCoachContext(get());
    const activeProvider = get().aiProviders.find((provider) => provider.id === get().activeProviderId);
    try {
      if (!activeProvider) throw new Error("No active AI provider found.");
      const apiKey = await decryptString(activeProvider.apiKey);
      if (!apiKey) throw new Error("API key is missing or invalid.");
      const adapter = getProviderAdapter(activeProvider.type);
      const response = await adapter.chat({
        provider: activeProvider,
        apiKey,
        messages: get().aiMessages.filter((m) => m.id !== assistantId),
        systemContext: context,
      });
      const finalMessage = { ...assistantMessage, content: response };
      set({
        aiMessages: get().aiMessages.map((m) => (m.id === assistantId ? finalMessage : m)),
        coachBusy: false,
      });
      if (isRoutineGeneration) {
        const plan = parseAiWorkoutPlan(response);
        if (plan) {
          set({ routines: plan.routines, exercises: [...staticExercises, ...plan.exercises], activeTab: "dashboard" });
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      set({
        aiMessages: get().aiMessages.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: `I couldn't connect to the AI provider. Please check your API key and network connection in Settings.\n\n**Error:** ${errorMessage}`,
              }
            : m,
        ),
        coachBusy: false,
      });
    }
    await persistState(get());
  },
  exportEncryptedProfile: async (passphrase) => {
    return encryptForExport(snapshotFromState(get()), passphrase);
  },
  importEncryptedProfile: async (fileText, passphrase) => {
    const snapshot = await decryptExport<any>(fileText, passphrase);
    if (isValidSnapshot(snapshot)) {
      set({ ...snapshot, hydrated: true, coachBusy: false, providerBusy: false });
    }
  },
  resetLocalData: async () => {
    set({ ...freshSnapshot(), hydrated: true });
    await persistState(get());
  },
}));

export function useProgressionRecommendations() {
  const { workouts, recoveryLogs } = useAtlasStore();
  const latestRecovery = recoveryLogs.at(-1);
  const score = latestRecovery
    ? Math.round(
        (latestRecovery.sleepHours / 8) * 30 +
          (10 - latestRecovery.soreness) * 1.8 +
          (10 - latestRecovery.stress) * 1.6 +
          latestRecovery.readiness * 2 +
          latestRecovery.energy * 1.6,
      )
    : 72;
  return getProgressionRecommendations(workouts, score);
}