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
import { registry, createProductionContainer, drainSyncQueue, nullContainer } from "@/lib/repositories/registry";
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

export type AtlasTab = "today" | "dashboard" | "workout" | "nutrition" | "coach" | "progress" | "settings";
export type StartupChoice = "google-drive" | "local" | "local-offline" | "backup" | null;
export type SubScreen = "routine-builder" | "workout-plan-builder" | "workout-plan-detail" | "active-workout" | "exercise-database" | "nutrition-analytics" | null;

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
    
    // Quick session resolution
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // 1. STALE-WHILE-REVALIDATE: Load local IndexedDB state instantly first to bypass slow network
      const { 
        IndexedDbUserRepository, 
        IndexedDbWorkoutRepository, 
        IndexedDbWorkoutPlanRepository,
        IndexedDbNutritionRepository, 
        IndexedDbWaterRepository, 
        IndexedDbBodyMetricRepository,
        IndexedDbRecoveryRepository 
      } = await import("@/adapters/indexeddb/index");

      const local = {
        user: new IndexedDbUserRepository(),
        workout: new IndexedDbWorkoutRepository(),
        plan: new IndexedDbWorkoutPlanRepository(),
        nutrition: new IndexedDbNutritionRepository(),
        water: new IndexedDbWaterRepository(),
        body: new IndexedDbBodyMetricRepository(),
        recovery: new IndexedDbRecoveryRepository(),
      };

      // Set temporary local container in registry for immediate local operations
      const localContainer = {
        ...nullContainer,
        user: local.user,
        workout: local.workout,
        plan: local.plan,
        nutrition: local.nutrition,
        water: local.water,
        body: local.body,
        recovery: local.recovery,
      } as any;
      registry.set(user.id, localContainer);

      // Fetch from local IndexedDB cache instantly
      const [workouts, plans, nutrition, water, bodyMetrics, recovery, profile] =
        await Promise.all([
          local.workout.getWorkouts(user.id),
          local.plan.getPlans(user.id),
          local.nutrition.getEntries(user.id),
          local.water.getLogs(user.id),
          local.body.getMetrics(user.id),
          local.recovery.getLogs(user.id),
          local.user.getProfile(user.id),
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

      // Restore the device secret from the persisted profile so that API keys
      // encrypted on another device/browser can be decrypted immediately.
      const cloudSecret = (enrichedProfile as any)?.deviceSecret;
      if (cloudSecret && typeof window !== "undefined") {
        setDeviceSecretValue(cloudSecret);
      }

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

          // Write to local repository (which points directly to IndexedDB)
          await local.user.saveProfile(user.id, migratedProfile as any);

          const guestWorkouts = await db.getAll("workouts");
          for (const w of guestWorkouts) {
            if (w._userId === guestId) {
              const migratedWorkout = { ...w, id: w.id };
              delete (migratedWorkout as any)._userId;
              await local.workout.saveWorkout(user.id, migratedWorkout);
            }
          }

          const guestPlans = await db.getAll("workout_plans");
          for (const p of guestPlans) {
            if (p._userId === guestId) {
              const migratedPlan = { ...p, id: p.id };
              delete (migratedPlan as any)._userId;
              await local.plan.savePlan(user.id, migratedPlan);
            }
          }

          const guestNutrition = await db.getAll("nutrition_entries");
          for (const n of guestNutrition) {
            if (n._userId === guestId) {
              const migratedNutrition = { ...n, id: n.id };
              delete (migratedNutrition as any)._userId;
              await local.nutrition.addEntry(user.id, migratedNutrition);
            }
          }

          const guestWater = await db.getAll("water_logs");
          for (const wl of guestWater) {
            if (wl._userId === guestId) {
              const migratedWater = { ...wl, id: wl.id };
              delete (migratedWater as any)._userId;
              await local.water.addLog(user.id, migratedWater);
            }
          }

          const guestMetrics = await db.getAll("body_metrics");
          for (const bm of guestMetrics) {
            if (bm._userId === guestId) {
              const migratedMetric = { ...bm, id: bm.id };
              delete (migratedMetric as any)._userId;
              await local.body.addMetric(user.id, migratedMetric);
            }
          }

          const guestRecovery = await db.getAll("recovery_logs");
          for (const rl of guestRecovery) {
            if (rl._userId === guestId) {
              const migratedRecovery = { ...rl, id: rl.id };
              delete (migratedRecovery as any)._userId;
              await local.recovery.addLog(user.id, migratedRecovery);
            }
          }

          await db.delete("profiles", guestId);

          // Clean up guest sync queue
          try {
            const allQueueItems = await db.getAll("sync_queue");
            for (const item of allQueueItems) {
              if (item.userId === guestId) {
                await db.delete("sync_queue", item.id!);
              }
            }
          } catch (queueErr) {
            console.warn("[Migration] Non-fatal: Failed to clean up guest sync_queue:", queueErr);
          }

          const [newWorkouts, newPlans, newNutrition, newWater, newBodyMetrics, newRecovery, newProfile] =
            await Promise.all([
              local.workout.getWorkouts(user.id),
              local.plan.getPlans(user.id),
              local.nutrition.getEntries(user.id),
              local.water.getLogs(user.id),
              local.body.getMetrics(user.id),
              local.recovery.getLogs(user.id),
              local.user.getProfile(user.id),
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
            heightUnit: newProfile?.heightUnit ?? (migratedProfile?.heightUnit ?? get().heightUnit),
            weightUnit: newProfile?.weightUnit ?? (migratedProfile?.weightUnit ?? get().weightUnit),
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

          // 2. Setup composite container & trigger remote sync in background
          const container = await createProductionContainer(supabase, user.id);
          registry.set(user.id, container);

          void (async () => {
            await drainSyncQueue();
            await get().pullCloudUpdate();
          })().catch((err) => console.warn("[Sync] Background migration sync error:", err));
          return;
        } catch (migErr) {
          console.error("[Migration] Local guest data migration failed:", migErr);
        }
      }

      // Populate Zustand state with local data instantly
      set({
        workouts: workouts ?? freshSnap.workouts,
        workoutPlans: migratedPlans.length > 0 ? migratedPlans : freshSnap.workoutPlans,
        nutritionEntries: nutrition ?? freshSnap.nutritionEntries,
        waterLogs: water ?? freshSnap.waterLogs,
        bodyMetrics: bodyMetrics ?? freshSnap.bodyMetrics,
        recoveryLogs: recovery ?? freshSnap.recoveryLogs,
        profile: enrichedProfile || (freshSnap.profile ?? defaultProfile),
        heightUnit: enrichedProfile?.heightUnit ?? (freshSnap.profile?.heightUnit ?? get().heightUnit),
        weightUnit: enrichedProfile?.weightUnit ?? (freshSnap.profile?.weightUnit ?? get().weightUnit),
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

      // 2. Setup composite container & trigger remote sync in background
      const container = await createProductionContainer(supabase, user.id);
      registry.set(user.id, container);

      void (async () => {
        await drainSyncQueue();
        await get().pullCloudUpdate();
      })().catch((err) => console.warn("[Sync] Background startup sync error:", err));

      if (typeof window !== "undefined") {
        window.addEventListener("online", () => {
          void drainSyncQueue().catch((err) => console.warn("[Sync] Online drain error:", err));
        }, { once: false });
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
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;
    try {
      if (!registry.isAuthenticated) return false;

      // Pull latest datasets in parallel
      const [workouts, plans, nutrition, water, bodyMetrics, recovery, profile, dbProviders] =
        await Promise.all([
          registry.load((r, uid) => r.workout.getWorkouts(uid, 30)),
          registry.load((r, uid) => r.plan.getPlans(uid)),
          registry.load((r, uid) => r.nutrition.getEntries(uid)),
          registry.load((r, uid) => r.water.getLogs(uid)),
          registry.load((r, uid) => r.body.getMetrics(uid)),
          registry.load((r, uid) => r.recovery.getLogs(uid)),
          registry.load((r, uid) => r.user.getProfile(uid)),
          registry.load((r, uid) => r.aiProvider.getProviders(uid)),
        ]);

      // Migrate plans structure if needed
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

      // Enrich and migrate profile
      const providerType = user.app_metadata?.provider || (user.identities?.[0]?.provider) || "email";
      const capturedProvider = providerType === "google" ? "google" : "email";
      const enrichedProfile = profile ? {
        ...migrateProfile(profile as any),
        email: user.email ?? "",
        emailVerified: true,
        capturedProvider,
      } : null;

      // Restore the device secret so that API keys can be decrypted cross-device.
      const cloudSecret = (enrichedProfile as any)?.deviceSecret;
      if (cloudSecret && typeof window !== "undefined") {
        setDeviceSecretValue(cloudSecret);
      }

      // Merge into state
      set({
        workouts: workouts ?? get().workouts,
        workoutPlans: migratedPlans.length > 0 ? migratedPlans : get().workoutPlans,
        nutritionEntries: nutrition ?? get().nutritionEntries,
        waterLogs: water ?? get().waterLogs,
        bodyMetrics: bodyMetrics ?? get().bodyMetrics,
        recoveryLogs: recovery ?? get().recoveryLogs,
        profile: enrichedProfile ?? get().profile,
        heightUnit: enrichedProfile?.heightUnit ?? get().heightUnit,
        weightUnit: enrichedProfile?.weightUnit ?? get().weightUnit,
        aiProviders: (dbProviders && dbProviders.length > 0) ? dbProviders : get().aiProviders,
        activeProviderId: (dbProviders && dbProviders.length > 0) ? (dbProviders.find((p: any) => p.enabled)?.id || dbProviders[0]?.id) : get().activeProviderId,
        lastSyncedAt: new Date().toISOString(),
      } as any);

      console.log("[Sync Pull] Successfully synced latest data from cloud.");
      return true;
    } catch (err) {
      console.error("[Sync Pull] Error fetching remote cloud updates:", err);
      return false;
    }
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
        openai: "gpt-4o-mini",
        anthropic: "claude-sonnet-4-5",
        gemini: "gemini-2.0-flash",
        grok: "grok-3",
        deepseek: "deepseek-chat",
        openrouter: "google/gemini-2.0-flash-001",
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
        enabled: true,
      };
      set({ aiProviders: [newProvider], activeProviderId: providerId });

      // Persist the provider (with encrypted key) to IDB + Supabase.
      // Without this, the provider only lives in Zustand memory and is lost on reload.
      registry.save((r, uid) => r.aiProvider.saveProvider(uid, newProvider));
      registry.save((r, uid) => r.aiProvider.setActiveProvider(uid, providerId));
    }

    const finalProfile = {
      ...profile,
      goal: customGoal ?? profile.goal,
      // Always attach the current device secret so it's persisted to Supabase
      // and can be restored on any other device.
      deviceSecret: getDeviceSecretValue(),
    };
    set({ 
      profile: finalProfile, 
      weightUnit: profile.weightUnit ?? get().weightUnit,
      heightUnit: profile.heightUnit ?? get().heightUnit,
      hasOnboarded: true, 
      guidedMode: profile.experience === "beginner" ? true : false,
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
    const updatedProfile = {
      ...profile,
      ...safePatch,
      // Carry the current device secret forward so it's never cleared by a profile update
      deviceSecret: (profile as any).deviceSecret ?? getDeviceSecretValue(),
    };
    set({ 
      profile: updatedProfile,
      heightUnit: updatedProfile.heightUnit ?? get().heightUnit,
      weightUnit: updatedProfile.weightUnit ?? get().weightUnit,
    });
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

if (typeof window !== "undefined") {
  let currentTheme = useAtlasStore.getState().theme;
  useAtlasStore.subscribe((state) => {
    if (state.theme !== currentTheme) {
      currentTheme = state.theme;
      void import("@/lib/storage/db").then(({ writeLocalSetting }) => {
        writeLocalSetting("theme", currentTheme);
      });
    }
  });
}

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