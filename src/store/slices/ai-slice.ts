import { StateCreator } from "zustand";
import type { AtlasStoreState } from "../useAtlasStore";
import type {
  AiMessage,
  AiProviderSettings,
  Exercise,
  Routine,
  EncryptedSecret,
} from "@/types/domain";
import { createId } from "@/lib/id";
import { decryptString, encryptString } from "@/lib/security/crypto";
import { findFirstSupportedModel, getProviderAdapter } from "@/providers";
import { registry } from "@/lib/repositories/registry";
import { parseAiWorkoutPlan, cleanJsonString } from "@/lib/ai/parser";
import { buildCoachContext } from "@/lib/coach/context";
import { exercises as staticExercises } from "@/data/exercises";
import { defaultProviders, initialAiMessages } from "@/data/seed";

export interface SendCoachMessageOptions {
  isRoutineGeneration?: boolean;
  displayedContent?: string;
  startDay?: string;
}

export interface AiSlice {
  aiMessages: AiMessage[];
  aiProviders: AiProviderSettings[];
  activeProviderId?: string;
  coachBusy: boolean;
  providerBusy: boolean;
  apiCallCount: number;
  tokenCount: number;
  aiWorkoutTipsCache: Record<string, string>;
  aiNutritionTipsCache: Record<string, string>;

  saveProvider: (provider: AiProviderSettings, apiKeyPlain?: string) => Promise<void>;
  setActiveProvider: (providerId: string) => Promise<void>;
  markProviderKeyStatus: (providerId: string, status: "ok" | "error", errorMessage?: string) => Promise<void>;
  testProvider: (providerId: string) => Promise<void>;
  sendCoachMessage: (content: string, options?: SendCoachMessageOptions) => Promise<void>;
  generateGlobalExercise: (name: string) => Promise<Exercise | null>;
  setAiWorkoutTipCache: (range: string, tip: string) => void;
  setAiNutritionTipCache: (range: string, tip: string) => void;
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

export function createPlaceholderExercise(id: string): Exercise {
  const cleanName = id
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");

  return {
    id,
    name: cleanName,
    category: "compound",
    muscles: ["full body"],
    equipment: ["bodyweight"],
    difficulty: "beginner",
    setup: ["Prepare space and equipment."],
    instructions: [`Perform the ${cleanName} exercise with proper form.`],
    execution: ["Execute the movement under control through a full range of motion."],
    breathing: "Exhale on exertion, inhale on release.",
    tempo: "Controlled tempo.",
    commonMistakes: ["Using momentum or poor posture."],
    safetyTips: ["Stop if you feel any sharp pain."],
    progressionTips: ["Gradually increase weight or repetitions as you get stronger."]
  };
}


export const createAiSlice: StateCreator<
  AtlasStoreState,
  [],
  [],
  AiSlice
> = (set, get) => ({
  aiMessages: initialAiMessages,
  aiProviders: defaultProviders,
  activeProviderId: undefined,
  coachBusy: false,
  providerBusy: false,
  apiCallCount: 0,
  tokenCount: 0,
  aiWorkoutTipsCache: {},
  aiNutritionTipsCache: {},

  saveProvider: async (provider, apiKeyPlain) => {
    let finalApiKey = provider.apiKey;
    if (apiKeyPlain !== undefined) {
      if (apiKeyPlain === "") {
        finalApiKey = undefined;
      } else {
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

    const user = get().user;
    if (user) {
      // Use persist() (not load/save) so Supabase failures throw and reach the UI.
      // Previously registry.load() silently swallowed these errors, causing the key
      // to appear saved in memory but never actually reach the cloud.
      await registry.persist((r, uid) => r.aiProvider.saveProvider(uid, nextProvider));
    }
  },

  setActiveProvider: async (providerId) => {
    set({
      activeProviderId: providerId,
      aiProviders: get().aiProviders.map((provider) => ({
        ...provider,
        enabled: provider.id === providerId,
      })),
    });

    const user = get().user;
    if (user) {
      await registry.load((r, uid) => r.aiProvider.setActiveProvider(uid, providerId));
    }
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

      const existing = get().exercises;
      if (!existing.some((ex) => ex.id === parsedExercise.id)) {
        set({
          exercises: [...existing, parsedExercise],
          coachBusy: false,
          tokenCount: get().tokenCount + (responseTokenCount ?? 0)
        });
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
      apiCallCount: get().apiCallCount + 1,
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

        // 1. Identify missing exercise IDs (needs background fetch).
        missingExerciseIds = Array.from(referencedExerciseIds).filter((id) => {
          const inStatic = staticExercises.some((e) => e.id === id);
          const inStore = get().exercises.some((e) => e.id === id);
          return !inStatic && !inStore;
        });
        hasMissing = missingExerciseIds.length > 0;

        // 2. Generate placeholder exercises immediately for referenced IDs that don't exist in static, store, or plan.exercises.
        const planExercises = plan.exercises || [];
        referencedExerciseIds.forEach((id) => {
          const inStatic = staticExercises.some((e) => e.id === id);
          const inStore = get().exercises.some((e) => e.id === id);
          const inPlan = planExercises.some((e) => e.id === id);
          if (!inStatic && !inStore && !inPlan) {
            planExercises.push(createPlaceholderExercise(id));
          }
        });
        plan.exercises = planExercises;
      }

      const finalMessage = { ...assistantMessage, content: responseContent };
      set({
        aiMessages: get().aiMessages.map((m) => (m.id === assistantId ? finalMessage : m)),
        coachBusy: hasMissing,
        tokenCount: get().tokenCount + (responseTokenCount ?? 0),
      });

      if (plan) {
        const existingExercises = new Map(get().exercises.map(e => [e.id, e]));
        if (Array.isArray(plan.exercises)) {
          plan.exercises.forEach(e => existingExercises.set(e.id, e));
        }

        const activeWorkout = get().activeWorkout;
        let nextActiveWorkout = activeWorkout;
        let nextRestTimer = get().restTimerEndsAt;
        let nextRestingSetId = get().restingSetId;
        let nextSubScreen = get().activeSubScreen;
        if (activeWorkout) {
          nextActiveWorkout = null;
          nextRestTimer = undefined;
          nextRestingSetId = null;
          if (get().activeSubScreen === "active-workout") {
            nextSubScreen = null;
          }
        }

        const selectedStartDay = options?.startDay || "Monday";
        const parsedRoutines = plan.routines || [];
        const assignedRoutines = assignRoutinesToDays(parsedRoutines, selectedStartDay);

        const fullyConfiguredPlan = {
          ...plan,
          creatorType: "ai" as const,
          startDay: selectedStartDay as any,
          routines: assignedRoutines,
          customExercises: Array.from(existingExercises.values()).filter(
            (e) => !staticExercises.some((s) => s.id === e.id)
          ),
        };

        // Immediately update state and save plan
        const existingPlans = get().workoutPlans;
        const exists = existingPlans.some(p => p.id === fullyConfiguredPlan.id);
        const nextPlans = exists
          ? existingPlans.map(p => p.id === fullyConfiguredPlan.id ? fullyConfiguredPlan : p)
          : [...existingPlans, fullyConfiguredPlan];

        const storeUpdate: Partial<AtlasStoreState> = {
          workoutPlans: nextPlans,
          exercises: Array.from(existingExercises.values()),
          activeWorkoutPlanId: plan.id,
          activeWorkout: nextActiveWorkout,
          restTimerEndsAt: nextRestTimer,
          restingSetId: nextRestingSetId,
          activeSubScreen: nextSubScreen,
        };

        if (options?.isRoutineGeneration) {
          storeUpdate.activeTab = "workout";
          storeUpdate.editingWorkoutPlanId = plan.id;
          storeUpdate.activeSubScreen = "workout-plan-detail";
        }

        set(storeUpdate);

        // Persist the AI-generated plan immediately (non-blocking)
        const saveImmediate = async () => {
          const { registry: immediateRegistry } = await import("@/lib/repositories/registry");
          immediateRegistry.save((r, uid) => r.plan.savePlan(uid, fullyConfiguredPlan));
        };
        void saveImmediate();

        // If there were missing exercise profiles, execute the background fetch
        if (hasMissing) {
          setTimeout(async () => {
            const gapMessageContent = responseContent + `\n\n**System Note:** Fetching complete biomechanical profiles for missing exercises: \`${missingExerciseIds.join(", ")}\`...`;
            
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

                // Update plan.exercises with the resolved exercises
                const updatedPlanExercises = plan.exercises.map((pEx) => {
                  const resolved = parsedFollowUp.find((e: any) => e.id === pEx.id);
                  return resolved || pEx;
                });
                plan.exercises = updatedPlanExercises;
                
                const successMessageContent = gapMessageContent + `\n\n**System Update:** Successfully fetched biomechanical profiles for: \`${missingExerciseIds.join(", ")}\`. The workout plan has been successfully finalized!`;
                
                const updatedConfiguredPlan = {
                  ...fullyConfiguredPlan,
                  exercises: updatedPlanExercises,
                  customExercises: Array.from(existingExercises.values()).filter(
                    (e) => !staticExercises.some((s) => s.id === e.id)
                  ),
                };

                const currentPlans = get().workoutPlans;
                const nextPlans = currentPlans.map(p => p.id === updatedConfiguredPlan.id ? updatedConfiguredPlan : p);

                set({
                  exercises: Array.from(existingExercises.values()),
                  workoutPlans: nextPlans,
                  aiMessages: get().aiMessages.map((m) =>
                    m.id === assistantId ? { ...m, content: successMessageContent } : m
                  ),
                  coachBusy: false,
                });

                // Save follow-up resolved plan to IndexedDB + Supabase.
                const { registry: followUpRegistry } = await import("@/lib/repositories/registry");
                followUpRegistry.save((r, uid) => r.plan.savePlan(uid, updatedConfiguredPlan));
              } else {
                throw new Error("Invalid response format from follow-up query.");
              }
            } catch (followUpErr) {
              console.error("Follow-up correction failed:", followUpErr);
              const failMessageContent = gapMessageContent + `\n\n**System Warning:** Failed to fetch the missing exercise profiles in the background. You can manually edit the plan or check your connection.`;
              
              set({
                aiMessages: get().aiMessages.map((m) =>
                  m.id === assistantId ? { ...m, content: failMessageContent } : m
                ),
                coachBusy: false,
              });
            }
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
  },

  setAiWorkoutTipCache: (range, tip) => {
    set({
      aiWorkoutTipsCache: {
        ...get().aiWorkoutTipsCache,
        [range]: tip,
      },
    });
  },

  setAiNutritionTipCache: (range, tip) => {
    set({
      aiNutritionTipsCache: {
        ...get().aiNutritionTipsCache,
        [range]: tip,
      },
    });
  },
});
