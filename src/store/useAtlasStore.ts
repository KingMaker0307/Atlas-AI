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
import { createId } from "@/lib/id";
import { decryptExport, encryptForExport, encryptString, getDeviceSecretValue, setDeviceSecretValue } from "@/lib/security/crypto";
import { findFirstSupportedModel } from "@/providers";
import { registry, createProductionContainer, drainSyncQueue } from "@/lib/repositories/registry";
import { getProgressionRecommendations } from "@/lib/progression/engine";
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
  EncryptedSecret,
  NutritionEntry,
  WaterLogEntry,
  CommonFoodItem,
} from "@/types/domain";

import { createUiSlice, UiSlice } from "./slices/ui-slice";
import { createWorkoutSlice, WorkoutSlice } from "./slices/workout-slice";
import { createNutritionSlice, NutritionSlice } from "./slices/nutrition-slice";
import { createAiSlice, AiSlice } from "./slices/ai-slice";

export { assignRoutinesToDays, getDaysSequence } from "./slices/ai-slice";
export type { SendCoachMessageOptions } from "./slices/ai-slice";

export type AtlasTab = "dashboard" | "workout" | "coach" | "progress" | "settings";
export type StartupChoice = "google-drive" | "local" | "local-offline" | "backup" | null;
export type SubScreen = "routine-builder" | "workout-plan-builder" | "workout-plan-detail" | "active-workout" | null;

interface OnboardingData extends UserProfile {
  apiKey?: string;
  providerType?: AiProviderSettings["type"] | "none";
  customGoal?: string;
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

export interface RootState {
  user: { id: string; email: string; name?: string } | null;
  profile: UserProfile | null;
  hasOnboarded: boolean;
  lastSyncedAt: string | null;
  workoutTab: "plans" | "nutrition";

  setWorkoutTab: (tab: "plans" | "nutrition") => void;
  hydrate: () => Promise<void>;
  pullCloudUpdate: () => Promise<boolean>;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  finalizeRestore: (choice: StartupChoice) => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
  exportEncryptedProfile: (passphrase: string) => Promise<string>;
  importEncryptedProfile: (fileText: string, passphrase: string) => Promise<void>;
  importRawSnapshot: (snapshot: any) => Promise<void>;
  resetLocalData: () => Promise<void>;
  loadAllHistory: () => Promise<void>;
}

export type AtlasStoreState = UiSlice & WorkoutSlice & NutritionSlice & AiSlice & RootState;

type StoredSnapshot = AtlasSnapshot & { 
  exercises: Exercise[]; 
  nutritionEntries: NutritionEntry[];
  waterLogs: WaterLogEntry[];
  recentFoodSearches: CommonFoodItem[];
  startupChoice: StartupChoice; 
  activeSubScreen: SubScreen; 
  editingWorkoutPlanId: string | null; 
  editingRoutineId: string | null;
  apiCallCount: number;
  tokenCount: number;
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
    nutritionEntries: [],
    waterLogs: [],
    recentFoodSearches: [],
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
    apiCallCount: 0,
    tokenCount: 0,
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

function snapshotFromState(state: AtlasStoreState): StoredSnapshot {
  return {
    profile: state.profile,
    workouts: state.workouts,
    activeWorkout: state.activeWorkout,
    recoveryLogs: state.recoveryLogs,
    bodyMetrics: state.bodyMetrics,
    aiMessages: state.aiMessages,
    aiProviders: state.aiProviders,
    activeProviderId: state.activeProviderId,
    workoutPlans: state.workoutPlans,
    exercises: state.exercises,
    nutritionEntries: state.nutritionEntries || [],
    waterLogs: state.waterLogs || [],
    recentFoodSearches: state.recentFoodSearches || [],
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
    apiCallCount: state.apiCallCount,
    tokenCount: state.tokenCount,
    activeWorkoutPlanId: state.activeWorkoutPlanId,
    blocked: state.blocked,
    lastSyncedAt: state.lastSyncedAt,
    deviceSecret: getDeviceSecretValue(),
  };
}

let syncChannel: BroadcastChannel | null = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  syncChannel = new BroadcastChannel("atlas-sync-channel");
  syncChannel.onmessage = (event) => {
    const remoteSnapshot = event.data;
    if (remoteSnapshot && remoteSnapshot.profile?.id) {
      console.log("[Broadcast Sync] Received state update from other tab. Applying...");
      const activeStartupChoice = useAtlasStore.getState().startupChoice || "local";
      const restoredSnapshot = { ...remoteSnapshot };
      if (restoredSnapshot.profile) {
        restoredSnapshot.profile = migrateProfile(restoredSnapshot.profile);
      }
      
      useAtlasStore.setState({
        ...freshSnapshot(),
        ...restoredSnapshot,
        hasOnboarded: true,
        startupChoice: activeStartupChoice,
        hydrated: true,
        coachBusy: false,
        providerBusy: false,
      });
    }
  };
}

function notifyOtherTabs(snapshot: AtlasSnapshot): void {
  if (syncChannel) {
    syncChannel.postMessage(snapshot);
  }
}

export const useAtlasStore = create<AtlasStoreState>()((set, get, store) => ({
  ...createUiSlice(set, get, store),
  ...createWorkoutSlice(set, get, store),
  ...createNutritionSlice(set, get, store),
  ...createAiSlice(set, get, store),

  // Root State Properties
  user: null,
  profile: null,
  hasOnboarded: false,
  lastSyncedAt: null,
  workoutTab: "plans",

  setWorkoutTab: (tab) => set({ workoutTab: tab }),

  hydrate: async () => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      const container = await createProductionContainer(supabase, user.id);
      registry.set(user.id, container);

      // INCREMENTAL LOAD: 30-day baseline for workouts limit=30
      const [workouts, plans, nutrition, water, bodyMetrics, recovery, profile] =
        await Promise.all([
          registry.load((r, uid) => r.workout.getWorkouts(uid, 30)),
          registry.load((r, uid) => r.plan.getPlans(uid)),
          registry.load((r, uid) => r.nutrition.getEntries(uid)),
          registry.load((r, uid) => r.water.getLogs(uid)),
          registry.load((r, uid) => r.body.getMetrics(uid)),
          registry.load((r, uid) => r.recovery.getLogs(uid)),
          registry.load((r, uid) => r.user.getProfile(uid)),
        ]);

      const migratedPlans = ((plans ?? []) as any[]).map((plan: any) => ({
        ...plan,
        creatorType: plan.creatorType || "manual",
        startDay: plan.startDay || "Monday",
        routines: (plan.routines || []).map((r: any, i: number) => ({
          ...r,
          day: (!r.day || r.day.startsWith("Day "))
            ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][i % 7]
            : r.day,
        })),
      }));

      const freshSnap = freshSnapshot();
      let activeWorkout = freshSnap.activeWorkout;
      const activeWorkoutPlanId = migratedPlans[0]?.id ?? null;

      const providerType = user.app_metadata?.provider || (user.identities?.[0]?.provider) || "email";
      const capturedProvider = providerType === "google" ? "google" : "email";
      const enrichedProfile = profile ? {
        ...migrateProfile(profile as any),
        email: user.email ?? "",
        emailVerified: true,
        capturedProvider,
      } : null;

      let guestProfileRecord = null;
      try {
        const { getDb } = await import("@/lib/storage/db");
        const db = await getDb();
        const allProfiles = await db.getAll("profiles");
        guestProfileRecord = allProfiles.find((p) => p.id !== user.id);
      } catch (migErr) {
        console.error("[Migration] Failed to query local profiles:", migErr);
      }

      if (guestProfileRecord) {
        try {
          const { getDb } = await import("@/lib/storage/db");
          const db = await getDb();
          const guestId = guestProfileRecord.id;
            console.log(`[Migration] Found old local user profile (id: ${guestId}). Migrating data to user: ${user.id}...`);

            const migratedProfile = {
              ...guestProfileRecord,
              id: user.id,
              email: user.email ?? "",
              emailVerified: true,
              capturedProvider,
              hasOnboarded: true,
            };
            delete (migratedProfile as any)._userId;

            await registry.save((r, uid) => r.user.saveProfile(uid, migratedProfile as any));

            const guestWorkouts = await db.getAll("workouts");
            for (const w of guestWorkouts) {
              if (w._userId === guestId) {
                const migratedWorkout = { ...w, id: w.id };
                delete (migratedWorkout as any)._userId;
                await registry.save((r, uid) => r.workout.saveWorkout(uid, migratedWorkout));
              }
            }

            const guestPlans = await db.getAll("workout_plans");
            for (const p of guestPlans) {
              if (p._userId === guestId) {
                const migratedPlan = { ...p, id: p.id };
                delete (migratedPlan as any)._userId;
                await registry.save((r, uid) => r.plan.savePlan(uid, migratedPlan));
              }
            }

            const guestNutrition = await db.getAll("nutrition_entries");
            for (const n of guestNutrition) {
              if (n._userId === guestId) {
                const migratedNutrition = { ...n, id: n.id };
                delete (migratedNutrition as any)._userId;
                await registry.save((r, uid) => r.nutrition.addEntry(uid, migratedNutrition));
              }
            }

            const guestWater = await db.getAll("water_logs");
            for (const wl of guestWater) {
              if (wl._userId === guestId) {
                const migratedWater = { ...wl, id: wl.id };
                delete (migratedWater as any)._userId;
                await registry.save((r, uid) => r.water.addLog(uid, migratedWater));
              }
            }

            const guestMetrics = await db.getAll("body_metrics");
            for (const bm of guestMetrics) {
              if (bm._userId === guestId) {
                const migratedMetric = { ...bm, id: bm.id };
                delete (migratedMetric as any)._userId;
                await registry.save((r, uid) => r.body.addMetric(uid, migratedMetric));
              }
            }

            const guestRecovery = await db.getAll("recovery_logs");
            for (const rl of guestRecovery) {
              if (rl._userId === guestId) {
                const migratedRecovery = { ...rl, id: rl.id };
                delete (migratedRecovery as any)._userId;
                await registry.save((r, uid) => r.recovery.addLog(uid, migratedRecovery));
              }
            }

            await db.delete("profiles", guestId);

            const [newWorkouts, newPlans, newNutrition, newWater, newBodyMetrics, newRecovery, newProfile] =
              await Promise.all([
                registry.load((r, uid) => r.workout.getWorkouts(uid, 30)),
                registry.load((r, uid) => r.plan.getPlans(uid)),
                registry.load((r, uid) => r.nutrition.getEntries(uid)),
                registry.load((r, uid) => r.water.getLogs(uid)),
                registry.load((r, uid) => r.body.getMetrics(uid)),
                registry.load((r, uid) => r.recovery.getLogs(uid)),
                registry.load((r, uid) => r.user.getProfile(uid)),
              ]);

            const newMigratedPlans = ((newPlans ?? []) as any[]).map((plan: any, i: number) => ({
              ...plan,
              creatorType: plan.creatorType || "manual",
              startDay: plan.startDay || "Monday",
              routines: (plan.routines || []).map((r: any, idx: number) => ({
                ...r,
                day: (!r.day || r.day.startsWith("Day "))
                  ? ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"][idx % 7]
                  : r.day,
              })),
            }));

            set({
              workouts: newWorkouts ?? [],
              workoutPlans: newMigratedPlans.length > 0 ? newMigratedPlans : freshSnap.workoutPlans,
              nutritionEntries: newNutrition ?? [],
              waterLogs: newWater ?? [],
              bodyMetrics: newBodyMetrics ?? [],
              recoveryLogs: newRecovery ?? [],
              profile: newProfile ? migrateProfile(newProfile as any) : (migratedProfile as any),
              hasOnboarded: true,
              activeWorkoutPlanId: newMigratedPlans[0]?.id ?? null,
              activeWorkout,
              hydrated: true,
              startupChoice: "cloud",
              activeTab: "dashboard",
              activeSettingsTab: "profile",
              coachBusy: false,
              providerBusy: false,
              user: { 
                id: user.id, 
                email: user.email ?? "", 
                name: user.user_metadata?.full_name || user.user_metadata?.name || "" 
              },
            } as any);

            console.log(`[Migration] Successful guest-to-user migration complete for user ${user.id}!`);
            void drainSyncQueue();
            return;
        } catch (migErr) {
          console.error("[Migration] Local guest data migration failed:", migErr);
        }
      }

      set({
        workouts: workouts ?? freshSnap.workouts,
        workoutPlans: migratedPlans.length > 0 ? migratedPlans : freshSnap.workoutPlans,
        nutritionEntries: nutrition ?? freshSnap.nutritionEntries,
        waterLogs: water ?? freshSnap.waterLogs,
        bodyMetrics: bodyMetrics ?? freshSnap.bodyMetrics,
        recoveryLogs: recovery ?? freshSnap.recoveryLogs,
        profile: enrichedProfile || (freshSnap.profile ?? defaultProfile),
        hasOnboarded: !!profile,
        activeWorkoutPlanId,
        activeWorkout,
        hydrated: true,
        startupChoice: "cloud",
        activeTab: "dashboard",
        activeSettingsTab: "profile",
        coachBusy: false,
        providerBusy: false,
        user: { 
          id: user.id, 
          email: user.email ?? "", 
          name: user.user_metadata?.full_name || user.user_metadata?.name || "" 
        },
      } as any);

      void drainSyncQueue();

      if (typeof window !== "undefined") {
        window.addEventListener("online", () => { void drainSyncQueue(); }, { once: false });
      }
    } else {
      set({ hydrated: true, coachBusy: false, providerBusy: false });
    }
  },

  loadAllHistory: async () => {
    const user = get().user;
    if (!user) return;
    const [workouts, nutrition, water] = await Promise.all([
      registry.load((r, uid) => r.workout.getWorkouts(uid)),
      registry.load((r, uid) => r.nutrition.getEntries(uid)),
      registry.load((r, uid) => r.water.getLogs(uid)),
    ]);
    set({
      workouts: workouts ?? get().workouts,
      nutritionEntries: nutrition ?? get().nutritionEntries,
      waterLogs: water ?? get().waterLogs,
    });
  },

  pullCloudUpdate: async (): Promise<boolean> => {
    return false;
  },

  finalizeRestore: async (choice) => {
    set({ hasOnboarded: true, startupChoice: choice });
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

    const finalProfile = { ...profile, goal: customGoal ?? profile.goal };
    set({ 
      profile: finalProfile, 
      weightUnit: profile.weightUnit ?? get().weightUnit,
      heightUnit: profile.heightUnit ?? get().heightUnit,
      hasOnboarded: true, 
      activeTab: "dashboard" 
    });
    registry.save((r, uid) => r.user.saveProfile(uid, finalProfile));
  },

  updateProfile: async (patch) => {
    const profile = get().profile;
    if (!profile) return;
    const safePatch = { ...patch };
    if (!patch.capturedProvider || patch.capturedProvider === profile.capturedProvider) {
      delete safePatch.email;
      delete safePatch.emailVerified;
    }
    const finalPatch = profile.email ? safePatch : patch;
    const updatedProfile = { ...profile, ...finalPatch };
    set({ profile: updatedProfile });
    registry.save((r, uid) => r.user.saveProfile(uid, updatedProfile));
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
    } else {
      throw new Error("Invalid snapshot structure. Unable to restore.");
    }
  },

  resetLocalData: async () => {
    set({ ...freshSnapshot(), hydrated: true });
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