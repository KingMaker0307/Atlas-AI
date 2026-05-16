"use client";

import { create } from "zustand";
import { exercises, getExerciseById } from "@/data/exercises";
import {
  defaultProfile,
  defaultProviders,
  defaultRoutines,
  initialAiMessages,
  sampleBodyMetrics,
  sampleRecoveryLogs,
  sampleWorkouts,
} from "@/data/seed";
import { buildCoachContext, mockCoachResponse } from "@/lib/coach/context";
import { createId, minutesBetween } from "@/lib/id";
import { getProgressionRecommendations } from "@/lib/progression/engine";
import { decryptExport, decryptString, encryptForExport, encryptString } from "@/lib/security/crypto";
import { loadSnapshot, saveSnapshot, writeLocalSetting } from "@/lib/storage/db";
import { getProviderAdapter } from "@/providers";
import type {
  AiMessage,
  AiProviderSettings,
  AtlasSnapshot,
  BodyMetric,
  RecoveryLog,
  Routine,
  ThemeMode,
  UnitSystem,
  UserProfile,
  Workout,
  WorkoutSet,
} from "@/types/domain";

export type AtlasTab = "dashboard" | "workout" | "coach" | "progress" | "settings";

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
  theme: ThemeMode;
  units: UnitSystem;
  hasOnboarded: boolean;
  coachBusy: boolean;
  providerBusy: boolean;
  setActiveTab: (tab: AtlasTab) => void;
  hydrate: () => Promise<void>;
  completeOnboarding: (profile: UserProfile) => Promise<void>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setUnits: (units: UnitSystem) => Promise<void>;
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
  sendCoachMessage: (content: string) => Promise<void>;
  exportEncryptedProfile: (passphrase: string) => Promise<string>;
  importEncryptedProfile: (fileText: string, passphrase: string) => Promise<void>;
  resetLocalData: () => Promise<void>;
}

function freshSnapshot(): AtlasSnapshot {
  return {
    profile: defaultProfile,
    workouts: sampleWorkouts,
    activeWorkout: null,
    recoveryLogs: sampleRecoveryLogs,
    bodyMetrics: sampleBodyMetrics,
    aiMessages: initialAiMessages,
    aiProviders: defaultProviders,
    activeProviderId: undefined,
    routines: defaultRoutines,
    theme: "dark",
    units: "imperial",
    hasOnboarded: false,
    updatedAt: new Date().toISOString(),
  };
}

function snapshotFromState(state: AtlasState): AtlasSnapshot {
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
    theme: state.theme,
    units: state.units,
    hasOnboarded: state.hasOnboarded,
    restTimerEndsAt: state.restTimerEndsAt,
    updatedAt: new Date().toISOString(),
  };
}

async function persistState(state: AtlasState): Promise<void> {
  await saveSnapshot(snapshotFromState(state));
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

function buildWorkoutFromRoutine(routine: Routine, workouts: Workout[]): Workout {
  return {
    id: createId("workout"),
    name: routine.name,
    startedAt: new Date().toISOString(),
    exercises: routine.exercises.map((exercise) => {
      const lastWeight = recentWeightForExercise(workouts, exercise.exerciseId);
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
  hydrated: false,
  activeTab: "dashboard",
  ...freshSnapshot(),
  activeWorkout: null,
  coachBusy: false,
  providerBusy: false,
  setActiveTab: (tab) => set({ activeTab: tab }),
  hydrate: async () => {
    const stored = await loadSnapshot();
    const snapshot = stored ?? freshSnapshot();
    set({
      ...snapshot,
      activeWorkout: snapshot.activeWorkout ?? null,
      hydrated: true,
      activeTab: "dashboard",
      coachBusy: false,
      providerBusy: false,
    });
  },
  completeOnboarding: async (profile) => {
    set({ profile, hasOnboarded: true, units: profile.units });
    await persistState(get());
  },
  updateProfile: async (profile) => {
    set({ profile, units: profile.units });
    await persistState(get());
  },
  setTheme: async (theme) => {
    set({ theme });
    writeLocalSetting("theme", theme);
    await persistState(get());
  },
  setUnits: async (units) => {
    const profile = get().profile;
    set({ units, profile: profile ? { ...profile, units } : profile });
    writeLocalSetting("units", units);
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
      activeWorkout: buildWorkoutFromRoutine(routine, get().workouts),
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
    const recoveryScore = get().recoveryLogs.at(-1)
      ? undefined
      : {
          id: createId("recovery"),
          date: new Date().toISOString().slice(0, 10),
          sleepHours: 7,
          soreness: fatigueRating,
          stress: 4,
          readiness: 7,
          energy: 7,
        };

    set({
      workouts: [...get().workouts, completedWorkout],
      activeWorkout: null,
      restTimerEndsAt: undefined,
      recoveryLogs: recoveryScore ? [...get().recoveryLogs, recoveryScore] : get().recoveryLogs,
      aiMessages: [
        ...get().aiMessages,
        {
          id: createId("assistant"),
          role: "assistant",
          createdAt: new Date().toISOString(),
          content: `Logged ${completedWorkout.name}. I updated progression recommendations for ${completedWorkout.exercises
            .map((exercise) => getExerciseById(exercise.exerciseId)?.name)
            .filter(Boolean)
            .slice(0, 2)
            .join(" and ")}.`,
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
        enabled: provider.id === providerId ? true : provider.enabled,
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
  sendCoachMessage: async (content) => {
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

    const context = buildCoachContext({
      profile: get().profile,
      workouts: get().workouts,
      recoveryLogs: get().recoveryLogs,
      bodyMetrics: get().bodyMetrics,
    });
    const activeProvider = get().aiProviders.find((provider) => provider.id === get().activeProviderId);

    try {
      let response = "";
      const apiKey = await decryptString(activeProvider?.apiKey);

      if (!activeProvider || (!apiKey && !["ollama", "lmstudio", "custom"].includes(activeProvider.type))) {
        response = mockCoachResponse(content, context, get().aiMessages);
      } else {
        const adapter = getProviderAdapter(activeProvider.type);
        response = await adapter.chat({
          provider: activeProvider,
          apiKey,
          messages: [...get().aiMessages.filter((message) => message.id !== assistantId)],
          systemContext: context,
          onToken: (token) => {
            set({
              aiMessages: get().aiMessages.map((message) =>
                message.id === assistantId
                  ? { ...message, content: `${message.content}${token}` }
                  : message,
              ),
            });
          },
        });
      }

      set({
        aiMessages: get().aiMessages.map((message) =>
          message.id === assistantId ? { ...message, content: response } : message,
        ),
        coachBusy: false,
      });
    } catch (error) {
      set({
        aiMessages: get().aiMessages.map((message) =>
          message.id === assistantId
            ? {
                ...message,
                content: `I could not reach that provider, so I stayed local. ${mockCoachResponse(
                  content,
                  context,
                  get().aiMessages,
                )}\n\nProvider error: ${error instanceof Error ? error.message : "Unknown error"}`,
              }
            : message,
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
    const snapshot = await decryptExport<AtlasSnapshot>(fileText, passphrase);
    set({
      ...snapshot,
      activeWorkout: snapshot.activeWorkout ?? null,
      hydrated: true,
      coachBusy: false,
      providerBusy: false,
    });
    await persistState(get());
  },
  resetLocalData: async () => {
    const snapshot = freshSnapshot();
    set({ ...snapshot, hydrated: true, coachBusy: false, providerBusy: false });
    await persistState(get());
  },
}));

export function useExerciseLookup() {
  return exercises;
}

export function useProgressionRecommendations() {
  const workouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
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
