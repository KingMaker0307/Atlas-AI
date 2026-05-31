"use client";

import { create } from "zustand";
import { exercises as staticExercises, getExerciseById as getStaticExerciseById } from "@/data/exercises";
import {
  defaultProfile,
  defaultProviders,
  initialAiMessages,
  sampleBodyMetrics,
  sampleRecoveryLogs,
  sampleWorkouts,
} from "@/data/seed";
import { parseAiWorkoutPlan, cleanJsonString } from "@/lib/ai/parser";
import { buildCoachContext } from "@/lib/coach/context";
import { createId, minutesBetween } from "@/lib/id";
import { getProgressionRecommendations } from "@/lib/progression/engine";
import { decryptExport, decryptString, encryptForExport, encryptString, getDeviceSecretValue, setDeviceSecretValue } from "@/lib/security/crypto";
import { loadSnapshot, saveSnapshot } from "@/lib/storage/db";
import { findFirstSupportedModel, getProviderAdapter } from "@/providers";
import { checkBlockedStatus, syncProfile, restoreProfileByEmail } from "@/lib/sync";
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
  WorkoutExercise,
  WorkoutPlan,
  EncryptedSecret,
} from "@/types/domain";

export type AtlasTab = "dashboard" | "workout" | "coach" | "progress" | "settings";
export type StartupChoice = "google-drive" | "local" | "local-offline" | "backup" | null;
export type SubScreen = "routine-builder" | "workout-plan-builder" | "workout-plan-detail" | "active-workout" | null;

interface OnboardingData extends UserProfile {
  apiKey?: string;
  providerType?: AiProviderSettings["type"] | "none";
  customGoal?: string;
}

interface SendCoachMessageOptions {
  isRoutineGeneration?: boolean;
  displayedContent?: string;
  startDay?: string;
}

function migrateProfile(profile: UserProfile | null): UserProfile | null {
  if (!profile) return profile;
  const newProfile = { ...profile };

  if (!newProfile.gender) {
    newProfile.gender = (newProfile.goal || "").toLowerCase().includes("female") ? "female" : "male";
  }
  if (!newProfile.activityLevel) {
    newProfile.activityLevel = "moderately_active";
  }
  
  return newProfile;
}

interface AtlasState {
  hydrated: boolean;
  activeTab: AtlasTab;
  activeSubScreen: SubScreen;
  activeSettingsTab: "profile" | "ai" | "system";
  editingWorkoutPlanId: string | null;
  editingRoutineId: string | null;
  routineBuilderDefaultDay: string | null;
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
  guidedMode: boolean;
  coachBusy: boolean;
  providerBusy: boolean;
  apiCallCount: number; // New state for API call count
  tokenCount: number; // New state for token count
  startupChoice: StartupChoice;
  activeWorkoutPlanId: string | null;
   blocked: boolean;
  lastSyncedAt: string | null;
  workoutTab: "plans" | "nutrition";
  setBlocked: (blocked: boolean) => void;
  setStartupChoice: (choice: StartupChoice) => void;
  setActiveWorkoutPlanId: (id: string | null) => Promise<void>;
  checkAndAutoStopActiveWorkout: () => Promise<void>;
  setActiveTab: (tab: AtlasTab) => void;
  setActiveSubScreen: (subScreen: SubScreen) => void;
  setActiveSettingsTab: (tab: "profile" | "ai" | "system") => void;
  setEditingWorkoutPlanId: (id: string | null) => void;
  setEditingRoutineId: (id: string | null) => void;
  setRoutineBuilderDefaultDay: (day: string | null) => void;
  setWorkoutTab: (tab: "plans" | "nutrition") => void;
  hydrate: () => Promise<void>;
  pullCloudUpdate: () => Promise<void>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  finalizeRestore: (choice: StartupChoice) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setWeightUnit: (unit: WeightUnit) => Promise<void>;
  setHeightUnit: (unit: HeightUnit) => Promise<void>;
  setGuidedMode: (guidedMode: boolean) => Promise<void>;
  logRecovery: (log: RecoveryLog) => Promise<void>;
  logBodyMetric: (metric: BodyMetric) => Promise<void>;
  startWorkout: (routine: Routine) => Promise<void>;
  addSet: (workoutExerciseId: string) => Promise<void>;
  updateSet: (
    workoutExerciseId: string,
    setId: string,
    patch: Partial<WorkoutSet>,
  ) => Promise<void>;
  deleteSet: (workoutExerciseId: string, setId: string) => Promise<void>;
  updateExerciseUnit: (workoutExerciseId: string, unit: WeightUnit) => Promise<void>;
  finishWorkout: (fatigueRating?: number, notes?: string) => Promise<void>;
  discardWorkout: () => Promise<void>;
  swapWorkoutExercise: (workoutExerciseId: string, newExerciseId: string) => Promise<void>;
  skipWorkoutExercise: (workoutExerciseId: string) => Promise<void>;
  startRestTimer: (seconds: number) => Promise<void>;
  stopRestTimer: () => Promise<void>; // New action
  adjustRestTimer: (seconds: number) => Promise<void>; // New action
  saveProvider: (provider: AiProviderSettings, apiKeyPlain?: string) => Promise<void>;
  setActiveProvider: (providerId: string) => Promise<void>;
  markProviderKeyStatus: (providerId: string, status: "ok" | "error", errorMessage?: string) => Promise<void>;
  testProvider: (providerId: string) => Promise<void>;
  sendCoachMessage: (content: string, options?: SendCoachMessageOptions) => Promise<void>;
  exportEncryptedProfile: (passphrase: string) => Promise<string>;
  importEncryptedProfile: (fileText: string, passphrase: string) => Promise<void>;
  importRawSnapshot: (snapshot: any) => Promise<void>;
  resetLocalData: () => Promise<void>;
  getExerciseById: (id: string) => Exercise | undefined;
  generateGlobalExercise: (name: string) => Promise<Exercise | null>;
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
  blocked: boolean;
  lastSyncedAt: string | null;
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
    guidedMode: true,
    updatedAt: new Date().toISOString(),
    startupChoice: null,
    activeSubScreen: null,
    editingWorkoutPlanId: null,
    editingRoutineId: null,
    apiCallCount: 0, // Initialize API call count
    tokenCount: 0, // Initialize token count
    activeWorkoutPlanId: null,
    blocked: false,
    lastSyncedAt: null,
    deviceSecret: getDeviceSecretValue(),
  };
}

function isValidSnapshot(data: any): data is StoredSnapshot {
  return (
    data &&
    typeof data === "object" &&
    "profile" in data
  );
}

function snapshotFromState(state: AtlasState): StoredSnapshot {
  // API keys are already AES-256-GCM encrypted with a device-local secret (localStorage),
  // so it is safe to persist them in IndexedDB. Persisting them prevents users from having
  // to re-enter their key after every page reload or new deployment.
  return {
    profile: state.profile,
    workouts: state.workouts,
    activeWorkout: state.activeWorkout,
    recoveryLogs: state.recoveryLogs,
    bodyMetrics: state.bodyMetrics,
    aiMessages: state.aiMessages,
    aiProviders: state.aiProviders, // Persist encrypted API keys — safe because they are AES-GCM encrypted
    activeProviderId: state.activeProviderId,
    workoutPlans: state.workoutPlans,
    exercises: state.exercises,
    theme: state.theme,
    weightUnit: state.weightUnit,
    heightUnit: state.heightUnit,
    hasOnboarded: state.hasOnboarded,
    guidedMode: state.guidedMode,
    restTimerEndsAt: state.restTimerEndsAt,
    updatedAt: new Date().toISOString(),
    startupChoice: state.startupChoice,
    activeSubScreen: state.activeSubScreen,
    editingWorkoutPlanId: state.editingWorkoutPlanId,
    editingRoutineId: state.editingRoutineId,
    apiCallCount: state.apiCallCount, // Include in snapshot
    tokenCount: state.tokenCount, // Include in snapshot
    activeWorkoutPlanId: state.activeWorkoutPlanId,
    blocked: state.blocked,
    lastSyncedAt: state.lastSyncedAt,
    deviceSecret: getDeviceSecretValue(),
  };
}

async function persistState(state: AtlasState): Promise<void> {
  console.log("persistState: Starting...");
  const snapshot = snapshotFromState(state);
  try {
    await saveSnapshot(snapshot);
    console.log("persistState: saveSnapshot successful.");
    // Silently sync to Google Drive
    if (typeof window !== "undefined" && navigator.onLine && state.profile?.id) {
      void syncProfileToDrive(state);
    }
  } catch (error) {
    console.error("persistState: saveSnapshot failed:", error);
    throw error;
  }
  console.log("persistState: Finished.");
}

// Global sync state lock variables to prevent concurrent race conditions or duplicated calls
let isSyncingToDrive = false;
let pendingSyncToDrive = false;

async function syncProfileToDrive(state: AtlasState): Promise<void> {
  const profile = state.profile;
  if (!profile || !profile.id || profile.id === "default-user") return;
  
  if (isSyncingToDrive) {
    pendingSyncToDrive = true;
    return;
  }

  isSyncingToDrive = true;
  pendingSyncToDrive = false;

  try {
    const res = await syncProfile(profile.id, snapshotFromState(state));
    if (res.blocked) {
      useAtlasStore.setState({ blocked: true });
    } else if (res.success) {
      const newSyncTime = new Date().toISOString();
      useAtlasStore.setState({ lastSyncedAt: newSyncTime });
      // Guarantee the updated sync timestamp is written back to IndexedDB local database immediately!
      await saveSnapshot(snapshotFromState(useAtlasStore.getState()));
    }
  } catch (error) {
    console.error("Failed to execute Google Drive silent sync:", error);
  } finally {
    isSyncingToDrive = false;
    // If state changed while a sync was active, trigger a follow-up sync
    if (pendingSyncToDrive) {
      const latestState = useAtlasStore.getState();
      void syncProfileToDrive(latestState);
    }
  }
}

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function getDaysSequence(startDay: string): string[] {
  const idx = DAYS_OF_WEEK.indexOf(startDay);
  if (idx === -1) return DAYS_OF_WEEK;
  return [...DAYS_OF_WEEK.slice(idx), ...DAYS_OF_WEEK.slice(0, idx)];
}

export function assignRoutinesToDays(routines: Routine[], startDay: string): Routine[] {
  const sequence = getDaysSequence(startDay);
  const N = routines.length;
  
  let trainingIndices = [0];
  if (N === 2) trainingIndices = [0, 3];
  else if (N === 3) trainingIndices = [0, 2, 4];
  else if (N === 4) trainingIndices = [0, 1, 3, 4];
  else if (N === 5) trainingIndices = [0, 1, 2, 4, 5];
  else if (N === 6) trainingIndices = [0, 1, 2, 3, 4, 5];
  else if (N === 7) trainingIndices = [0, 1, 2, 3, 4, 5, 6];
  else if (N > 7) {
    trainingIndices = Array.from({ length: Math.min(N, 7) }, (_, i) => i);
  }
  
  return routines.slice(0, 7).map((routine, idx) => {
    const dayIdx = trainingIndices[idx] ?? idx;
    return {
      ...routine,
      day: sequence[dayIdx],
    };
  });
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

// Define AtlasGetState type manually
type AtlasGetState = () => AtlasState;

function buildWorkoutFromRoutine(get: AtlasGetState, routine: Routine, parentPlanId?: string | null): Workout {
  const state = get(); // Get the current state inside the function
  const newWorkout: Workout = {
    id: createId("workout"),
    name: routine.name,
    startedAt: new Date().toISOString(),
    planId: parentPlanId || state.activeWorkoutPlanId,
    exercises: routine.exercises.map((exercise) => {
      const exerciseData = get().getExerciseById(exercise.exerciseId); // Corrected call
      const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
      const lastWeight = recentWeightForExercise(state.workouts, exercise.exerciseId);
      const targetReps = Number(exercise.targetReps.match(/\d+/)?.[0] ?? 8);

      // For steady-state cardio, default to 1 session; for interval cardio, keep targetSets
      const numSets = isCardio && exerciseData?.category === "steady-state" ? 1 : exercise.targetSets;

      return {
        id: createId("workout_exercise"),
        exerciseId: exercise.exerciseId,
        targetSets: exercise.targetSets,
        targetReps: exercise.targetReps,
        restSeconds: exercise.restSeconds,
        sets: Array.from({ length: numSets }).map(() => isCardio ? ({
          id: createId("set"),
          reps: 0,
          weight: 0,
          completed: false,
          durationSeconds: 1800, // Default 30 min
          distance: 0,
          incline: 0,
          resistance: 0,
          calories: 0,
        }) : ({
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
  guidedMode: true,
  hydrated: false,
  activeTab: "dashboard",
  activeSubScreen: null,
  activeSettingsTab: "profile",
  editingWorkoutPlanId: null,
  editingRoutineId: null,
  routineBuilderDefaultDay: null,
  coachBusy: false,
  providerBusy: false,
  apiCallCount: 0, // Initialize in store
  tokenCount: 0, // Initialize in store
  blocked: false,
  lastSyncedAt: null,
  workoutTab: "plans",
  setBlocked: (blocked) => set({ blocked }),
  setWorkoutTab: (tab) => set({ workoutTab: tab }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  getExerciseById: (id: string) => {
    const normId = id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return (
      get().exercises.find((exercise) => {
        const exerciseNormId = exercise.id.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
        return (
          exercise.id === id ||
          exerciseNormId === normId ||
          exercise.name.trim().toLowerCase() === id.trim().toLowerCase()
        );
      }) || getStaticExerciseById(id)
    );
  },
  generateGlobalExercise: async (name: string) => {
    const activeProvider = get().aiProviders.find((p) => p.id === get().activeProviderId);
    if (!activeProvider) {
      throw new Error("No active AI provider found. Please configure one in Settings to unlock global exercise database search.");
    }
    const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
    if (!isLocal && !activeProvider.apiKey) {
      throw new Error("API key is missing. Please set your key in Settings to search the global exercise database.");
    }

    set({ coachBusy: true, apiCallCount: get().apiCallCount + 1 });

    try {
      const apiKey = isLocal ? "" : await decryptString(activeProvider.apiKey!);
      const adapter = getProviderAdapter(activeProvider.type);

      const systemContext = `You are Atlas Biomechanics Coach, a clinical-grade sports physiotherapist and strength coach.
Generate a comprehensive, scientifically accurate exercise profile for the requested exercise name.
Your response MUST be a single, valid JSON object matching this TypeScript interface exactly:
interface Exercise {
  id: string; // URL-safe, kebab-case id based on exercise name (e.g., 'lat-pulldown')
  name: string; // The capitalization and clean name (e.g., 'Lat Pulldown')
  category: "compound" | "isolation" | "cardio" | "steady-state" | "mobility";
  muscles: ("chest" | "back" | "shoulders" | "biceps" | "triceps" | "quads" | "hamstrings" | "glutes" | "calves" | "core" | "full body")[];
  equipment: ("barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "kettlebell" | "band" | "cardio" | "treadmill" | "elliptical" | "stationary-bike" | "stairclimber" | "other")[];
  difficulty: "beginner" | "intermediate" | "advanced";
  setup: string[]; // 2-4 detailed setup cues
  instructions: string[]; // 2-4 primary cues
  execution: string[]; // 2-4 precise drive/locking cues
  breathing: string; // exactly how to breathe (e.g. Inhale on eccentric...)
  tempo: string; // tempo description (e.g., 3-0-1-0)
  commonMistakes: string[]; // 2-4 standard biomechanical errors
  safetyTips: string[]; // 2-4 safety check-offs
  progressionTips: string[]; // 2-4 progressive overload cues
}

Do NOT wrap the response in any markdown code block or include any explanatory text. Return ONLY the raw JSON object.`;

      const userPrompt = `Generate the exercise profile for: "${name}"`;

      const { content, tokenCount: responseTokenCount } = await adapter.chat({
        provider: activeProvider,
        apiKey,
        messages: [{ id: createId("user"), role: "user", content: userPrompt, createdAt: new Date().toISOString() }],
        systemContext,
      });

      // Clean JSON string in case the model wrapped it anyway
      let cleanContent = content.trim();
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.replace(/^```json/, "").replace(/```$/, "").trim();
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.replace(/^```/, "").replace(/```$/, "").trim();
      }

      const parsedExercise = JSON.parse(cleanContent) as Exercise;
      if (!parsedExercise.id || !parsedExercise.name) {
        throw new Error("Invalid exercise structure returned.");
      }

      // Save it in our store's exercises database
      const existing = get().exercises;
      if (!existing.some((ex) => ex.id === parsedExercise.id)) {
        set({
          exercises: [...existing, parsedExercise],
          coachBusy: false,
          tokenCount: get().tokenCount + (responseTokenCount ?? 0)
        });
        await persistState(get());
      } else {
        set({ 
          coachBusy: false,
          tokenCount: get().tokenCount + (responseTokenCount ?? 0)
        });
      }

      return parsedExercise;
    } catch (error) {
      set({ coachBusy: false });
      console.error("Failed to generate exercise profile:", error);
      throw error;
    }
  },
  setStartupChoice: (choice) => {
    set({ startupChoice: choice });
    void persistState(get());
  },
  setActiveTab: (tab) => set({ activeTab: tab, activeSubScreen: null }),
  setActiveSubScreen: (subScreen) => set({ activeSubScreen: subScreen }),
  setEditingWorkoutPlanId: (id) => set({ editingWorkoutPlanId: id }),
  setEditingRoutineId: (id) => set({ editingRoutineId: id }),
  setRoutineBuilderDefaultDay: (day) => set({ routineBuilderDefaultDay: day }),
  checkAndAutoStopActiveWorkout: async () => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    const elapsedMs = Date.now() - new Date(activeWorkout.startedAt).getTime();
    const maxMs = 3 * 60 * 60 * 1000; // 3 hours
    if (elapsedMs >= maxMs) {
      const forceStoppedAt = new Date(new Date(activeWorkout.startedAt).getTime() + maxMs).toISOString();
      const completedWorkout = {
        ...activeWorkout,
        notes: "Force stopped: Session exceeded maximum limit of 3 hours.",
        fatigueRating: 5,
        completedAt: forceStoppedAt,
        durationMinutes: 180,
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
            content: `The active workout "${activeWorkout.name}" was automatically stopped because it exceeded the 3-hour limit.`,
          },
        ],
        activeSubScreen: null,
      });
      await persistState(get());
    }
  },
  hydrate: async () => {
    const localData = await loadSnapshot();
    const snapshot = isValidSnapshot(localData) ? localData : freshSnapshot();

    // Migrate user profile for gender and activityLevel
    if (snapshot.profile) {
      snapshot.profile = migrateProfile(snapshot.profile);
    }
    
    // Restore device secret to localStorage if it's found in IndexedDB
    if (snapshot.deviceSecret && typeof window !== "undefined") {
      setDeviceSecretValue(snapshot.deviceSecret);
    }

    // Migrate workout plans to ensure they have creatorType, startDay, and standard week day names
    const migratedPlans = (snapshot.workoutPlans || []).map(plan => {
      const creatorType = plan.creatorType || "manual";
      const startDay = plan.startDay || "Monday";
      const routines = (plan.routines || []).map((routine, i) => {
        let day = routine.day;
        if (!day || day.startsWith("Day ")) {
          const sequence = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
          day = sequence[i % 7];
        }
        return { ...routine, day };
      });
      return { ...plan, creatorType, startDay, routines };
    });
    snapshot.workoutPlans = migratedPlans;

    let activeWorkout = snapshot.activeWorkout;
    let workouts = snapshot.workouts;
    let aiMessages = snapshot.aiMessages;
    let activeSubScreen = snapshot.activeSubScreen;
    
    if (activeWorkout) {
      const elapsedMs = Date.now() - new Date(activeWorkout.startedAt).getTime();
      const maxMs = 3 * 60 * 60 * 1000;
      if (elapsedMs >= maxMs) {
        const forceStoppedAt = new Date(new Date(activeWorkout.startedAt).getTime() + maxMs).toISOString();
        const completedWorkout = {
          ...activeWorkout,
          notes: "Force stopped: Session exceeded maximum limit of 3 hours.",
          fatigueRating: 5,
          completedAt: forceStoppedAt,
          durationMinutes: 180,
        };
        workouts = [...workouts, completedWorkout];
        activeWorkout = null;
        activeSubScreen = null;
        aiMessages = [
          ...aiMessages,
          {
            id: createId("assistant"),
            role: "assistant",
            createdAt: new Date().toISOString(),
            content: `The active workout "${completedWorkout.name}" was automatically stopped because it exceeded the 3-hour limit.`,
          },
        ];
      }
    }
    
    const activeWorkoutPlanId = snapshot.activeWorkoutPlanId || snapshot.workoutPlans[0]?.id || null;
    const startupChoice = snapshot.startupChoice || (snapshot.hasOnboarded ? "local" : null);
    set({
      ...snapshot,
      workouts,
      activeWorkout,
      activeSubScreen,
      aiMessages,
      activeWorkoutPlanId,
      startupChoice,
      guidedMode: snapshot.guidedMode !== undefined ? snapshot.guidedMode : true,
      hydrated: true,
      activeTab: "dashboard",
      activeSettingsTab: "profile",
      coachBusy: false,
      providerBusy: false,
    });
    
    if (snapshot.activeWorkout && !activeWorkout) {
      await persistState(get());
    }

    void get().pullCloudUpdate();

    // Check blocked status if online and onboarded
    if (typeof window !== "undefined" && navigator.onLine && snapshot.profile?.id) {
      try {
        const isBlocked = await checkBlockedStatus(snapshot.profile.id);
        if (isBlocked) {
          set({ blocked: true });
        }
      } catch (error) {
        console.error("Failed to check blocked status:", error);
      }
    }
  },
  pullCloudUpdate: async () => {
    const email = get().profile?.email;
    if (!email || typeof window === "undefined" || !navigator.onLine) return;

    try {
      console.log("[Cloud Sync] Checking for newer snapshot in Google Drive...");
      const res = await restoreProfileByEmail(email);
      if (res.success && res.snapshot) {
        const cloudUpdatedAt = res.snapshot.updatedAt;
        const localLastSyncedAt = get().lastSyncedAt;
        
        // If the cloud snapshot is newer, restore it!
        if (!localLastSyncedAt || (cloudUpdatedAt && new Date(cloudUpdatedAt).getTime() > new Date(localLastSyncedAt).getTime())) {
          console.log("[Cloud Sync] Found newer cloud snapshot. Restoring silently...");
          const activeStartupChoice = get().startupChoice || "local";
          const restoredSnapshot = { ...res.snapshot };
          if (restoredSnapshot.profile) {
            restoredSnapshot.profile = migrateProfile(restoredSnapshot.profile);
          }
          set({
            ...freshSnapshot(),
            ...restoredSnapshot,
            hasOnboarded: true,
            startupChoice: activeStartupChoice,
            hydrated: true,
            coachBusy: false,
            providerBusy: false,
          });
          // Save locally to IndexedDB
          await saveSnapshot(snapshotFromState(get()));
        }
      }
    } catch (e) {
      console.error("[Cloud Sync] Background pull failed:", e);
    }
  },
  setActiveWorkoutPlanId: async (id) => {
    const activeWorkout = get().activeWorkout;
    let nextActiveWorkout = activeWorkout;
    let nextRestTimer = get().restTimerEndsAt;
    let nextSubScreen = get().activeSubScreen;
    if (activeWorkout) {
      nextActiveWorkout = null;
      nextRestTimer = undefined;
      if (get().activeSubScreen === "active-workout") {
        nextSubScreen = null;
      }
    }
    set({
      activeWorkoutPlanId: id,
      activeWorkout: nextActiveWorkout,
      restTimerEndsAt: nextRestTimer,
      activeSubScreen: nextSubScreen,
    });
    await persistState(get());
  },
  saveWorkoutPlan: async (plan: WorkoutPlan) => {
    const plans = get().workoutPlans;
    const existing = plans.find(p => p.id === plan.id);
    const nextPlans = existing
      ? plans.map(p => p.id === plan.id ? plan : p)
      : [...plans, plan];

    let activeId = get().activeWorkoutPlanId;
    if (!activeId || nextPlans.length === 1 || !nextPlans.some(p => p.id === activeId)) {
      activeId = nextPlans[0]?.id ?? null;
    }

    set({ workoutPlans: nextPlans, activeWorkoutPlanId: activeId });
    await persistState(get());
  },
  deleteWorkoutPlan: async (planId: string) => {
    const nextPlans = get().workoutPlans.filter(p => p.id !== planId);
    let activeId = get().activeWorkoutPlanId;
    if (activeId === planId || !activeId || nextPlans.length === 1 || !nextPlans.some(p => p.id === activeId)) {
      activeId = nextPlans[0]?.id ?? null;
    }

    // Check if the current active workout belongs to the deleted plan
    const activeWorkout = get().activeWorkout;
    let nextActiveWorkout = activeWorkout;
    let nextRestTimer = get().restTimerEndsAt;
    let nextSubScreen = get().activeSubScreen;
    if (activeWorkout && activeWorkout.planId === planId) {
      nextActiveWorkout = null;
      nextRestTimer = undefined;
      if (get().activeSubScreen === "active-workout") {
        nextSubScreen = null;
      }
    }

    set({
      workoutPlans: nextPlans,
      activeWorkoutPlanId: activeId,
      activeWorkout: nextActiveWorkout,
      restTimerEndsAt: nextRestTimer,
      activeSubScreen: nextSubScreen,
    });
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
  finalizeRestore: async (choice) => {
    set({ hasOnboarded: true, startupChoice: choice });
    await persistState(get());
  },
  completeOnboarding: async (data) => {
    const { apiKey, providerType, customGoal, ...profile } = data;
    
    if (providerType && providerType !== "none") {
      const providerId = createId("provider");
      
      let defaultBaseUrl: string | undefined = undefined;
      if (providerType === "ollama") {
        defaultBaseUrl = "http://localhost:11434";
      } else if (providerType === "lmstudio") {
        defaultBaseUrl = "http://localhost:1234/v1";
      }

      const isLocalProvider = providerType === "ollama" || providerType === "lmstudio";

      const defaultModelForType: Record<string, string> = {
        openai: "gpt-4o",
        anthropic: "claude-3-5-sonnet-20241022",
        gemini: "gemini-1.5-pro",
        grok: "grok-beta",
        deepseek: "deepseek-chat",
        openrouter: "meta-llama/llama-3.1-70b-instruct",
        ollama: "llama3",
        lmstudio: "model",
        custom: "model"
      };

      const defaultBaseUrls: Record<string, string> = {
        openai: "https://api.openai.com/v1",
        anthropic: "https://api.anthropic.com/v1",
        gemini: "https://generativelanguage.googleapis.com/v1beta",
        grok: "https://api.x.ai/v1",
        deepseek: "https://api.deepseek.com/v1",
        openrouter: "https://openrouter.ai/api/v1",
        ollama: "http://localhost:11434",
        lmstudio: "http://localhost:1234/v1",
        custom: ""
      };

      const tempProvider: AiProviderSettings = {
        id: providerId,
        type: providerType,
        label: providerType.charAt(0).toUpperCase() + providerType.slice(1),
        model: defaultModelForType[providerType] || "model",
        temperature: 0.7,
        contextLength: 8000,
        streaming: true,
        enabled: true,
        baseUrl: defaultBaseUrl || defaultBaseUrls[providerType] || "",
      };
      
      let finalModel = tempProvider.model;
      let encryptedKey: EncryptedSecret | undefined = undefined;

      if (apiKey) {
        encryptedKey = await encryptString(apiKey);
        try {
          const fetchedModel = await findFirstSupportedModel(tempProvider, apiKey);
          if (fetchedModel) {
            finalModel = fetchedModel;
          }
        } catch (e) {
          console.warn("Failed to validate API key during onboarding. Saving anyway.", e);
        }
      } else if (isLocalProvider) {
        try {
          const fetchedModel = await findFirstSupportedModel(tempProvider, "local-key");
          if (fetchedModel) {
            finalModel = fetchedModel;
          }
        } catch (e) {
          console.warn("Failed to find local models during onboarding. Saving anyway.", e);
        }
      }

      const newProvider: AiProviderSettings = {
        ...tempProvider,
        model: finalModel,
        apiKey: encryptedKey,
      };
      set({ aiProviders: [newProvider], activeProviderId: providerId });
    }

    set({ 
      profile: { ...profile, goal: customGoal ?? profile.goal }, 
      weightUnit: profile.weightUnit ?? get().weightUnit,
      heightUnit: profile.heightUnit ?? get().heightUnit,
      hasOnboarded: true, 
      activeTab: "dashboard" 
    });
    await persistState(get());
  },
  updateProfile: async (patch) => {
    const profile = get().profile;
    if (!profile) return;
    // Protect email immutability: once email is set in profile, prevent updates to email or emailVerified
    // EXCEPT when changing capturedProvider (e.g. upgrading/linking to Google)
    const safePatch = { ...patch };
    if (!patch.capturedProvider || patch.capturedProvider === profile.capturedProvider) {
      delete safePatch.email;
      delete safePatch.emailVerified;
    }
    const finalPatch = profile.email ? safePatch : patch;
    const updatedProfile = { ...profile, ...finalPatch };
    set({ profile: updatedProfile });
    await persistState(get());
  },
  setTheme: async (theme) => {
    set({ theme });
    await persistState(get());
  },
  setWeightUnit: async (unit) => {
    const currentUnit = get().weightUnit;
    if (currentUnit !== unit && get().profile) {
      const profile = get().profile!;
      let newWeight = profile.weight;
      if (profile.weight) {
        if (unit === "lbs") {
          newWeight = Math.round(profile.weight * 2.20462 * 10) / 10;
        } else {
          newWeight = Math.round((profile.weight / 2.20462) * 10) / 10;
        }
      }
      set({ 
        weightUnit: unit,
        profile: { ...profile, weight: newWeight, weightUnit: unit }
      });
    } else {
      set({ weightUnit: unit });
      if (get().profile) {
        set({ profile: { ...get().profile!, weightUnit: unit } });
      }
    }
    await persistState(get());
  },
  setHeightUnit: async (unit) => {
    const currentUnit = get().heightUnit;
    if (currentUnit !== unit && get().profile) {
      const profile = get().profile!;
      let newHeight = profile.height;
      if (profile.height) {
        if (unit === "in") {
          newHeight = Math.round(profile.height / 2.54);
        } else {
          newHeight = Math.round(profile.height * 2.54);
        }
      }
      set({ 
        heightUnit: unit,
        profile: { ...profile, height: newHeight, heightUnit: unit }
      });
    } else {
      set({ heightUnit: unit });
      if (get().profile) {
        set({ profile: { ...get().profile!, heightUnit: unit } });
      }
    }
    await persistState(get());
  },
  setGuidedMode: async (guidedMode) => {
    set({ guidedMode });
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
    const workoutsToday = workouts.filter(
      (w) =>
        getLocalDateString(w.startedAt) === todayStr &&
        w.exercises.some((ex) => ex.sets.some((s) => s.completed))
    );

    if (workoutsToday.length >= 3) {
      console.warn("startWorkout: Daily workout limit reached (max 3). Cannot start a new session.");
      if (typeof window !== "undefined") {
        window.alert("Daily Limit Reached: You have already logged 3 workouts today. To prevent overtraining and ensure safe recovery, you cannot start another session today.");
      }
      return;
    }

    const currentActiveWorkout = get().activeWorkout;
    console.log("startWorkout: activeWorkout BEFORE update:", currentActiveWorkout);

    // Find the plan that contains this routine
    const plans = get().workoutPlans;
    const parentPlan = plans.find((p) => p.routines.some((r) => r.id === routine.id));
    const parentPlanId = parentPlan ? parentPlan.id : get().activeWorkoutPlanId;

    const newWorkout = buildWorkoutFromRoutine(get, routine, parentPlanId); // Corrected call
    
    set({
      activeWorkout: newWorkout,
      activeWorkoutPlanId: parentPlanId, // Automatically activate starting plan
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
          const exerciseData = get().getExerciseById(exercise.exerciseId);
          const isCardio = exerciseData?.category === "cardio" || exerciseData?.category === "steady-state";
          return {
            ...exercise,
            sets: [
              ...exercise.sets,
              isCardio
                ? {
                    id: createId("set"),
                    reps: 0,
                    weight: 0,
                    completed: false,
                    durationSeconds: last?.durationSeconds ?? 1800,
                    distance: last?.distance ?? 0,
                    incline: last?.incline ?? 0,
                    resistance: last?.resistance ?? 0,
                    calories: last?.calories ?? 0,
                  }
                : {
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
  deleteSet: async (workoutExerciseId, setId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          return {
            ...exercise,
            sets: exercise.sets.filter((s) => s.id !== setId),
          };
        }),
      },
    });
    await persistState(get());
  },
  updateExerciseUnit: async (workoutExerciseId, unit) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;
    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map((exercise) => {
          if (exercise.id !== workoutExerciseId) return exercise;
          return { ...exercise, weightUnit: unit };
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
  swapWorkoutExercise: async (workoutExerciseId, newExerciseId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;

    const exerciseToSwap = activeWorkout.exercises.find((ex) => ex.id === workoutExerciseId);
    if (!exerciseToSwap) return;

    const oldExerciseId = exerciseToSwap.exerciseId;

    // Update active workout exercises
    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === workoutExerciseId) {
        return { ...ex, exerciseId: newExerciseId };
      }
      return ex;
    });

    const nextActiveWorkout = {
      ...activeWorkout,
      exercises: updatedExercises,
    };

    // Update the parent plan's routine
    let nextWorkoutPlans = get().workoutPlans;
    if (activeWorkout.planId) {
      nextWorkoutPlans = get().workoutPlans.map((plan) => {
        if (plan.id !== activeWorkout.planId) return plan;

        const updatedRoutines = plan.routines.map((routine) => {
          if (routine.name !== activeWorkout.name) return routine;

          const updatedExs = routine.exercises.map((re) => {
            if (re.exerciseId === oldExerciseId) {
              return { ...re, exerciseId: newExerciseId };
            }
            return re;
          });

          return { ...routine, exercises: updatedExs };
        });

        return { ...plan, routines: updatedRoutines };
      });
    }

    set({
      activeWorkout: nextActiveWorkout,
      workoutPlans: nextWorkoutPlans,
    });

    await persistState(get());
  },
  skipWorkoutExercise: async (workoutExerciseId) => {
    const activeWorkout = get().activeWorkout;
    if (!activeWorkout) return;

    const updatedExercises = activeWorkout.exercises.map((ex) => {
      if (ex.id === workoutExerciseId) {
        const nextSkipped = !ex.skipped;
        return {
          ...ex,
          skipped: nextSkipped,
          sets: ex.sets.map((s) => ({ ...s, completed: false })),
        };
      }
      return ex;
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercises: updatedExercises,
      },
    });

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
  markProviderKeyStatus: async (providerId, status, errorMessage) => {
    set({
      aiProviders: get().aiProviders.map((item) =>
        item.id === providerId
          ? {
              ...item,
              lastStatus: status,
              lastError: status === "error" ? (errorMessage ?? "Key validation failed") : undefined,
              lastTestedAt: new Date().toISOString(),
            }
          : item,
      ),
    });
    await persistState(get());
  },
  testProvider: async (providerId) => {
    const provider = get().aiProviders.find((item) => item.id === providerId);
    if (!provider) return;
    set({ providerBusy: true });
    try {
      const isLocal = provider.type === "ollama" || provider.type === "lmstudio";
      if (!isLocal && !provider.apiKey) throw new Error("API key is missing.");
      const apiKey = isLocal ? "" : await decryptString(provider.apiKey!);
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
      const isLocal = activeProvider.type === "ollama" || activeProvider.type === "lmstudio";
      if (!isLocal && !activeProvider.apiKey) throw new Error("API key is missing or invalid.");
      const apiKey = isLocal ? "" : await decryptString(activeProvider.apiKey!);
      const adapter = getProviderAdapter(activeProvider.type);
      const { content: responseContent, tokenCount: responseTokenCount } = await adapter.chat({
        provider: activeProvider,
        apiKey,
        // Filter the placeholder AND any past empty-content messages (e.g. from prior failed calls)
        // to avoid sending empty model turns that cause provider errors (e.g. Gemini 400).
        messages: get().aiMessages.filter((m) => m.id !== assistantId && m.content.trim() !== ""),
        systemContext: context,
      });
      const plan = parseAiWorkoutPlan(responseContent);
      let hasMissing = false;
      let missingExerciseIds: string[] = [];

      if (plan) {
        const referencedExerciseIds = new Set<string>();
        const parsedRoutines = plan.routines || [];
        parsedRoutines.forEach((r) => {
          if (Array.isArray(r.exercises)) {
            r.exercises.forEach((ex) => {
              if (ex.exerciseId) {
                referencedExerciseIds.add(ex.exerciseId);
              }
            });
          }
        });

        const planExercises = plan.exercises || [];
        missingExerciseIds = Array.from(referencedExerciseIds).filter((id) => {
          const inStatic = staticExercises.some((e) => e.id === id);
          const inStore = get().exercises.some((e) => e.id === id);
          const inPlan = planExercises.some((e) => e.id === id);
          return !inStatic && !inStore && !inPlan;
        });
        hasMissing = missingExerciseIds.length > 0;
      }

      const finalMessage = { ...assistantMessage, content: responseContent };
      set({
        aiMessages: get().aiMessages.map((m) => (m.id === assistantId ? finalMessage : m)),
        coachBusy: hasMissing,
        tokenCount: get().tokenCount + (responseTokenCount ?? 0), // Accumulate token count
      });

      if (plan) {
        const existingExercises = new Map(get().exercises.map(e => [e.id, e]));
        if (Array.isArray(plan.exercises)) {
          plan.exercises.forEach(e => existingExercises.set(e.id, e));
        }

        const activeWorkout = get().activeWorkout;
        let nextActiveWorkout = activeWorkout;
        let nextRestTimer = get().restTimerEndsAt;
        let nextSubScreen = get().activeSubScreen;
        if (activeWorkout) {
          nextActiveWorkout = null;
          nextRestTimer = undefined;
          if (get().activeSubScreen === "active-workout") {
            nextSubScreen = null;
          }
        }

        // Assign routines to days of the week starting from selected startDay
        const selectedStartDay = options?.startDay || "Monday";
        const parsedRoutines = plan.routines || [];
        const assignedRoutines = assignRoutinesToDays(parsedRoutines, selectedStartDay);

        const fullyConfiguredPlan = {
          ...plan,
          creatorType: "ai" as const,
          startDay: selectedStartDay as any,
          routines: assignedRoutines,
        };

        if (!hasMissing) {
          // If no exercise profiles are missing, finalize and activate the plan immediately
          const existingPlans = get().workoutPlans;
          const exists = existingPlans.some(p => p.id === fullyConfiguredPlan.id);
          const nextPlans = exists
            ? existingPlans.map(p => p.id === fullyConfiguredPlan.id ? fullyConfiguredPlan : p)
            : [...existingPlans, fullyConfiguredPlan];

          const storeUpdate: Partial<AtlasState> = {
            workoutPlans: nextPlans,
            exercises: Array.from(existingExercises.values()),
            activeWorkoutPlanId: plan.id,
            activeWorkout: nextActiveWorkout,
            restTimerEndsAt: nextRestTimer,
            activeSubScreen: nextSubScreen,
          };

          if (options?.isRoutineGeneration) {
            storeUpdate.activeTab = "workout";
            storeUpdate.editingWorkoutPlanId = plan.id;
            storeUpdate.activeSubScreen = "workout-plan-detail";
          }

          set(storeUpdate);
          await persistState(get());
        } else {
          // Incomplete plan: trigger background follow-up, do NOT make the plan accessible yet
          setTimeout(async () => {
            const gapMessageContent = responseContent + `\n\n**System Note:** The generated plan contains routines that reference exercise IDs (\`${missingExerciseIds.join(", ")}\`) that do not exist in the database.\nI am automatically executing a follow-up background call to fetch the complete biomechanical profiles for these exercises...`;
            
            set({
              aiMessages: get().aiMessages.map((m) =>
                m.id === assistantId ? { ...m, content: gapMessageContent } : m
              ),
            });

            try {
              const followUpSystemContext = `You are Atlas Biomechanics Coach.\nThe user has generated a plan, but some exercise profiles are missing from the configuration.\nProvide the complete biomechanical definitions for these specific exercise IDs: ${missingExerciseIds.join(", ")}.\nYour response MUST be a single, valid JSON array of Exercise objects matching this TypeScript interface exactly:\ninterface Exercise {\n  id: string; // must match the exact id requested (e.g. 'lat-pulldown')\n  name: string; // The capitalization and clean name (e.g., 'Lat Pulldown')\n  category: "compound" | "isolation" | "cardio" | "steady-state" | "mobility";\n  muscles: ("chest" | "back" | "shoulders" | "biceps" | "triceps" | "quads" | "hamstrings" | "glutes" | "calves" | "core" | "full body")[];\n  equipment: ("barbell" | "dumbbell" | "machine" | "cable" | "bodyweight" | "kettlebell" | "band" | "cardio" | "treadmill" | "elliptical" | "stationary-bike" | "stairclimber" | "other")[];\n  difficulty: "beginner" | "intermediate" | "advanced";\n  setup: string[]; // 2-4 detailed setup cues\n  instructions: string[]; // 2-4 primary cues\n  execution: string[]; // 2-4 precise drive/locking cues\n  breathing: string; // exactly how to breathe\n  tempo: string; // tempo description (e.g., 3-0-1-0)\n  commonMistakes: string[]; // 2-4 standard biomechanical errors\n  safetyTips: string[]; // 2-4 safety check-offs\n  progressionTips: string[]; // 2-4 progressive overload cues\n}\n\nDo NOT wrap the response in any markdown code block or include any explanatory text. Return ONLY the raw JSON array.`;
          
              const followUpUserPrompt = `Generate the Exercise profile details for the following IDs: ${missingExerciseIds.map(id => `"${id}"`).join(", ")}`;
              
              const { content: followUpResponseContent } = await adapter.chat({
                provider: activeProvider,
                apiKey,
                messages: [{ id: createId("user"), role: "user", content: followUpUserPrompt, createdAt: new Date().toISOString() }],
                systemContext: followUpSystemContext,
              });

              let cleanFollowUp = followUpResponseContent.trim();
              if (cleanFollowUp.startsWith("```json")) {
                cleanFollowUp = cleanFollowUp.replace(/^```json/, "").replace(/```$/, "").trim();
              } else if (cleanFollowUp.startsWith("```")) {
                cleanFollowUp = cleanFollowUp.replace(/^```/, "").replace(/```$/, "").trim();
              }

              const parsedFollowUp = JSON.parse(cleanJsonString(cleanFollowUp));
              if (Array.isArray(parsedFollowUp)) {
                parsedFollowUp.forEach((e: any) => {
                  if (e && typeof e === "object" && typeof e.id === "string") {
                    existingExercises.set(e.id, e);
                  }
                });
                
                const successMessageContent = gapMessageContent + `\n\n**System Update:** Successfully fetched biomechanical profiles for: \`${missingExerciseIds.join(", ")}\`. The workout plan has been successfully finalized!`;
                
                const existingPlans = get().workoutPlans;
                const exists = existingPlans.some(p => p.id === fullyConfiguredPlan.id);
                const nextPlans = exists
                  ? existingPlans.map(p => p.id === fullyConfiguredPlan.id ? fullyConfiguredPlan : p)
                  : [...existingPlans, fullyConfiguredPlan];

                const storeUpdate: Partial<AtlasState> = {
                  exercises: Array.from(existingExercises.values()),
                  workoutPlans: nextPlans,
                  activeWorkoutPlanId: plan.id,
                  activeWorkout: nextActiveWorkout,
                  restTimerEndsAt: nextRestTimer,
                  activeSubScreen: nextSubScreen,
                  aiMessages: get().aiMessages.map((m) =>
                    m.id === assistantId ? { ...m, content: successMessageContent } : m
                  ),
                  coachBusy: false,
                };

                if (options?.isRoutineGeneration) {
                  storeUpdate.activeTab = "workout";
                  storeUpdate.editingWorkoutPlanId = plan.id;
                  storeUpdate.activeSubScreen = "workout-plan-detail";
                }

                set(storeUpdate);
              } else {
                throw new Error("Invalid response format from follow-up query.");
              }
            } catch (followUpErr) {
              console.error("Follow-up correction failed:", followUpErr);
              const failMessageContent = gapMessageContent + `\n\n**System Warning:** Failed to fetch the missing exercise profiles in the background. You can manually edit the plan or check your connection.`;
              
              const existingPlans = get().workoutPlans;
              const exists = existingPlans.some(p => p.id === fullyConfiguredPlan.id);
              const nextPlans = exists
                ? existingPlans.map(p => p.id === fullyConfiguredPlan.id ? fullyConfiguredPlan : p)
                : [...existingPlans, fullyConfiguredPlan];

              const storeUpdate: Partial<AtlasState> = {
                workoutPlans: nextPlans,
                activeWorkoutPlanId: plan.id,
                activeWorkout: nextActiveWorkout,
                restTimerEndsAt: nextRestTimer,
                activeSubScreen: nextSubScreen,
                aiMessages: get().aiMessages.map((m) =>
                  m.id === assistantId ? { ...m, content: failMessageContent } : m
                ),
                coachBusy: false,
              };

              if (options?.isRoutineGeneration) {
                storeUpdate.activeTab = "workout";
                storeUpdate.editingWorkoutPlanId = plan.id;
                storeUpdate.activeSubScreen = "workout-plan-detail";
              }

              set(storeUpdate);
            }
            await persistState(get());
          }, 50);
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
      const mergedSnapshot = {
        ...freshSnapshot(),
        ...snapshot,
        hasOnboarded: true,
        startupChoice: "local" as StartupChoice,
      };
      if (mergedSnapshot.profile) {
        mergedSnapshot.profile = migrateProfile(mergedSnapshot.profile);
      }
      if (mergedSnapshot.deviceSecret && typeof window !== "undefined") {
        setDeviceSecretValue(mergedSnapshot.deviceSecret);
      }
      set({ ...mergedSnapshot, hydrated: true, coachBusy: false, providerBusy: false });
      await persistState(get());
    }
  },
  importRawSnapshot: async (snapshot) => {
    if (isValidSnapshot(snapshot)) {
      const mergedSnapshot = {
        ...freshSnapshot(),
        ...snapshot,
        hasOnboarded: true,
        startupChoice: "local" as StartupChoice,
      };
      if (mergedSnapshot.profile) {
        mergedSnapshot.profile = migrateProfile(mergedSnapshot.profile);
      }
      if (mergedSnapshot.deviceSecret && typeof window !== "undefined") {
        setDeviceSecretValue(mergedSnapshot.deviceSecret);
      }
      set({ ...mergedSnapshot, hydrated: true, coachBusy: false, providerBusy: false });
      await persistState(get());
    } else {
      throw new Error("Invalid snapshot structure. Unable to restore.");
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