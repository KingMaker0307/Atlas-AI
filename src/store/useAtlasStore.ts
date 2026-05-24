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
  WorkoutPlan,
} from "@/types/domain";
import { CoachChatResponse } from "@/lib/ai/types";

export type AtlasTab = "dashboard" | "workout" | "coach" | "progress" | "settings";
export type StartupChoice = "google-drive" | "local" | "backup" | null;
export type SubScreen = "routine-builder" | "workout-plan-builder" | "workout-plan-detail" | "active-workout" | null;

interface OnboardingData extends UserProfile {
  apiKey?: string;
  providerType?: AiProviderSettings["type"];
  customGoal?: string;
}

interface SendCoachMessageOptions {
  isRoutineGeneration?: boolean;
  displayedContent?: string;
}

interface AtlasState {
  hydrated: boolean;
  activeTab: AtlasTab;
  activeSubScreen: SubScreen;
  editingWorkoutPlanId: string | null;
  editingRoutineId: string | null;
  profile: UserProfile | null;
  workouts: Workout[];
  activeWorkout: Workout | null;
  restTimerEndsAt?: string;
  recoveryLogs: RecoveryLog[];
  bodyMetrics: BodyMetric[];
  aiMessages: AiMessage[];
  aiProviders: AiProviderSettings[];
  activeProviderId?: string;
  workoutPlans: WorkoutPlan[];
  exercises: Exercise[];
  theme: ThemeMode;
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;
  hasOnboarded: boolean;
  coachBusy: boolean;
  providerBusy: boolean;
  apiCallCount: number; // New state for API call count
  tokenCount: number; // New state for token count
  startupChoice: StartupChoice;
  activeWorkoutPlanId: string | null;
  setStartupChoice: (choice: StartupChoice) => void;
  setActiveWorkoutPlanId: (id: string | null) => Promise<void>;
  setActiveTab: (tab: AtlasTab) => void;
  setActiveSubScreen: (subScreen: SubScreen) => void;
  setEditingWorkoutPlanId: (id: string | null) => void;
  setEditingRoutineId: (id: string | null) => void;
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
  stopRestTimer: () => Promise<void>; // New action
  adjustRestTimer: (seconds: number) => Promise<void>; // New action
  saveProvider: (provider: AiProviderSettings, apiKeyPlain?: string) => Promise<void>;
  setActiveProvider: (providerId: string) => Promise<void>;
  testProvider: (providerId: string) => Promise<void>;
  sendCoachMessage: (content: string, options?: SendCoachMessageOptions) => Promise<void>;
  exportEncryptedProfile: (passphrase: string) => Promise<string>;
  importEncryptedProfile: (fileText: string, passphrase: string) => Promise<void>;
  resetLocalData: () => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  saveWorkoutPlan: (plan: WorkoutPlan) => Promise<void>;
  deleteWorkoutPlan: (planId: string) => Promise<void>;
  saveRoutine: (planId: string, routine: Routine) => Promise<void>;
  deleteRoutine: (planId: string, routineId: string) => Promise<void>;
}

type StoredSnapshot = AtlasSnapshot & { 
  exercises: Exercise[]; 
  startupChoice: StartupChoice; 
  activeSubScreen: SubScreen; 
  editingWorkoutPlanId: string | null; 
  editingRoutineId: string | null;
  apiCallCount: number; // Added to StoredSnapshot
  tokenCount: number; // Added to StoredSnapshot
  activeWorkoutPlanId: string | null;
};

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
    workoutPlans: [],
    exercises: staticExercises,
    theme: "system",
    weightUnit: "lbs",
    heightUnit: "in",
    hasOnboarded: false,
    updatedAt: new Date().toISOString(),
    startupChoice: null,
    activeSubScreen: null,
    editingWorkoutPlanId: null,
    editingRoutineId: null,
    apiCallCount: 0, // Initialize API call count
    tokenCount: 0, // Initialize token count
    activeWorkoutPlanId: null,
  };
}

function isValidSnapshot(data: any): data is StoredSnapshot {
  return (
    data &&
    typeof data === "object" &&
    "profile" in data &&
    "workoutPlans" in data &&
    "exercises" in data &&
    "workouts" in data
  );
}

function snapshotFromState(state: AtlasState): StoredSnapshot {
  const providersWithoutApiKey = state.aiProviders.map(p => {
    const { apiKey, ...rest } = p;
    return rest;
  });

  return {
    profile: state.profile,
    workouts: state.workouts,
    activeWorkout: state.activeWorkout,
    recoveryLogs: state.recoveryLogs,
    bodyMetrics: state.bodyMetrics,
    aiMessages: state.aiMessages,
    aiProviders: providersWithoutApiKey, // Use providers without API key
    activeProviderId: state.activeProviderId,
    workoutPlans: state.workoutPlans,
    exercises: state.exercises,
    theme: state.theme,
    weightUnit: state.weightUnit,
    heightUnit: state.heightUnit,
    hasOnboarded: state.hasOnboarded,
    restTimerEndsAt: state.restTimerEndsAt,
    updatedAt: new Date().toISOString(),
    startupChoice: state.startupChoice,
    activeSubScreen: state.activeSubScreen,
    editingWorkoutPlanId: state.editingWorkoutPlanId,
    editingRoutineId: state.editingRoutineId,
    apiCallCount: state.apiCallCount, // Include in snapshot
    tokenCount: state.tokenCount, // Include in snapshot
    activeWorkoutPlanId: state.activeWorkoutPlanId,
  };
}

async function persistState(state: AtlasState): Promise<void> {
  console.log("persistState: Starting...");
  const snapshot = snapshotFromState(state);
  try {
    await saveSnapshot(snapshot);
    console.log("persistState: saveSnapshot successful.");
  } catch (error) {
    console.error("persistState: saveSnapshot failed:", error);
    throw error;
  }
  console.log("persistState: Finished.");
}

function getLocalDateString(dateOrStr: Date | string): string {
  const d = typeof dateOrStr === "string" ? new Date(dateOrStr) : dateOrStr;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
  const newWorkout: Workout = {
    id: createId("workout"),
    name: routine.name,
    startedAt: new Date().toISOString(),
    planId: state.activeWorkoutPlanId,
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
  console.log("buildWorkoutFromRoutine: New workout created:", newWorkout);
  return newWorkout;
}

export const useAtlasStore = create<AtlasState>((set, get) => ({
  ...freshSnapshot(),
  hydrated: false,
  activeTab: "dashboard",
  activeSubScreen: null,
  editingWorkoutPlanId: null,
  editingRoutineId: null,
  coachBusy: false,
  providerBusy: false,
  apiCallCount: 0, // Initialize in store
  tokenCount: 0, // Initialize in store
  getExerciseById: (id: string) => {
    return get().exercises.find((exercise) => exercise.id === id);
  },
  setStartupChoice: (choice) => set({ startupChoice: choice }),
  setActiveTab: (tab) => set({ activeTab: tab, activeSubScreen: null }),
  setActiveSubScreen: (subScreen) => set({ activeSubScreen: subScreen }),
  setEditingWorkoutPlanId: (id) => set({ editingWorkoutPlanId: id }),
  setEditingRoutineId: (id) => set({ editingRoutineId: id }),
  hydrate: async () => {
    const localData = await loadSnapshot();
    const snapshot = isValidSnapshot(localData) ? localData : freshSnapshot();
    const activeWorkoutPlanId = snapshot.activeWorkoutPlanId || snapshot.workoutPlans[0]?.id || null;
    set({
      ...snapshot,
      activeWorkoutPlanId,
      hydrated: true,
      activeTab: "dashboard",
      coachBusy: false,
      providerBusy: false,
    });
  },
  setActiveWorkoutPlanId: async (id) => {
    set({ activeWorkoutPlanId: id });
    await persistState(get());
  },
  saveWorkoutPlan: async (plan: WorkoutPlan) => {
    const plans = get().workoutPlans;
    const existing = plans.find(p => p.id === plan.id);
    if (existing) {
      set({ workoutPlans: plans.map(p => p.id === plan.id ? plan : p) });
    } else {
      set({ workoutPlans: [...plans, plan] });
    }
    await persistState(get());
  },
  deleteWorkoutPlan: async (planId: string) => {
    set({ workoutPlans: get().workoutPlans.filter(p => p.id !== planId) });
    await persistState(get());
  },
  saveRoutine: async (planId: string, routine: Routine) => {
    const plans = get().workoutPlans;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    const existing = plan.routines.find(r => r.id === routine.id);
    if (existing) {
      plan.routines = plan.routines.map(r => r.id === routine.id ? routine : r);
    } else {
      plan.routines.push(routine);
    }
    set({ workoutPlans: plans.map(p => p.id === planId ? plan : p) });
    await persistState(get());
  },
  deleteRoutine: async (planId: string, routineId: string) => {
    const plans = get().workoutPlans;
    const plan = plans.find(p => p.id === planId);
    if (!plan) return;
    plan.routines = plan.routines.filter(r => r.id !== routineId);
    set({ workoutPlans: plans.map(p => p.id === planId ? plan : p) });
    await persistState(get());
  },
  completeOnboarding: async (data) => {
    const { apiKey, providerType, customGoal, ...profile } = data;
    
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
        apiKey: await encryptString(apiKey), // Store encrypted API key in memory
      };
      set({ aiProviders: [newProvider], activeProviderId: providerId });
    }

    set({ profile: { ...profile, goal: customGoal ?? profile.goal }, hasOnboarded: true });
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
    console.log("startWorkout: Function called.");
    console.log("startWorkout: Routine received:", routine);

    // Check if the user has reached the daily limit of 3 workouts
    const workouts = get().workouts;
    const todayStr = getLocalDateString(new Date());
    const workoutsToday = workouts.filter((w) => getLocalDateString(w.startedAt) === todayStr);

    if (workoutsToday.length >= 3) {
      console.warn("startWorkout: Daily workout limit reached (max 3). Cannot start a new session.");
      if (typeof window !== "undefined") {
        window.alert("Daily Limit Reached: You have already logged 3 workouts today. To prevent overtraining and ensure safe recovery, you cannot start another session today.");
      }
      return;
    }

    const currentActiveWorkout = get().activeWorkout;
    console.log("startWorkout: activeWorkout BEFORE update:", currentActiveWorkout);


    const newWorkout = buildWorkoutFromRoutine(get(), routine);
    
    set({
      activeWorkout: newWorkout,
      activeTab: "workout",
      activeSubScreen: "active-workout",
    });

    console.log("startWorkout: activeWorkout AFTER update (should be new workout):", get().activeWorkout);
    console.log("startWorkout: State updated, attempting to persist...");
    try {
      await persistState(get());
      console.log("startWorkout: Persist successful.");
    } catch (error) {
      console.error("startWorkout: Persist failed:", error);
      // Re-throw to ensure the error is visible if not handled elsewhere
      throw error;
    }
    console.log("startWorkout: Finished.");
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
      activeSubScreen: null,
    });
    await persistState(get());
  },
  discardWorkout: async () => {
    set({ activeWorkout: null, restTimerEndsAt: undefined, activeSubScreen: null });
    await persistState(get());
  },
  startRestTimer: async (seconds) => {
    set({ restTimerEndsAt: new Date(Date.now() + seconds * 1000).toISOString() });
    await persistState(get());
  },
  stopRestTimer: async () => {
    set({ restTimerEndsAt: undefined });
    await persistState(get());
  },
  adjustRestTimer: async (seconds) => {
    const currentEndsAt = get().restTimerEndsAt;
    if (currentEndsAt) {
      const newEndsAt = new Date(new Date(currentEndsAt).getTime() + seconds * 1000).toISOString();
      set({ restTimerEndsAt: newEndsAt });
    } else {
      // If no timer is active, start one for the given seconds
      set({ restTimerEndsAt: new Date(Date.now() + seconds * 1000).toISOString() });
    }
    await persistState(get());
  },
  saveProvider: async (provider, apiKeyPlain) => {
    let finalApiKey = provider.apiKey; // Start with existing encrypted key
    if (apiKeyPlain !== undefined) { // If apiKeyPlain was explicitly passed (even if empty string)
      if (apiKeyPlain === "") { // If it's an empty string, clear the key
        finalApiKey = undefined;
      } else { // Otherwise, encrypt the new key
        finalApiKey = await encryptString(apiKeyPlain);
      }
    }
    const nextProvider = { ...provider, apiKey: finalApiKey };
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
      if (!provider.apiKey) throw new Error("API key is missing.");
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
  sendCoachMessage: async (content, options) => {
    const userMessage: AiMessage = {
      id: createId("user"),
      role: "user",
      content: options?.displayedContent ?? content,
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
      apiCallCount: get().apiCallCount + 1, // Increment API call count
    });
    const context = buildCoachContext(get());
    const activeProvider = get().aiProviders.find((provider) => provider.id === get().activeProviderId);
    try {
      if (!activeProvider) throw new Error("No active AI provider found.");
      if (!activeProvider.apiKey) throw new Error("API key is missing or invalid.");
      const apiKey = await decryptString(activeProvider.apiKey);
      const adapter = getProviderAdapter(activeProvider.type);
      const { content: responseContent, tokenCount: responseTokenCount } = await adapter.chat({
        provider: activeProvider,
        apiKey,
        messages: get().aiMessages.filter((m) => m.id !== assistantId),
        systemContext: context,
      });
      const finalMessage = { ...assistantMessage, content: responseContent };
      set({
        aiMessages: get().aiMessages.map((m) => (m.id === assistantId ? finalMessage : m)),
        coachBusy: false,
        tokenCount: get().tokenCount + (responseTokenCount ?? 0), // Accumulate token count
      });
      if (options?.isRoutineGeneration) {
        const plan = parseAiWorkoutPlan(responseContent);
        if (plan) {
          const existingExercises = new Map(get().exercises.map(e => [e.id, e]));
          // Correctly populate existingExercises with full Exercise objects from plan.exercises
          plan.exercises.forEach(e => existingExercises.set(e.id, e));
          set({ workoutPlans: [plan], exercises: Array.from(existingExercises.values()), activeTab: "dashboard" });
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