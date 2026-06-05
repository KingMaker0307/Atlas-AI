import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { parseAiWorkoutPlan } from "@/lib/ai/parser";
import { useAtlasStore } from "@/store/useAtlasStore";
import { registry } from "@/lib/repositories/registry";
import { getProviderAdapter } from "@/providers";
import type { WorkoutPlan, Exercise } from "@/types/domain";

// Mock providers and crypto dependencies
vi.mock("@/providers", () => {
  const mockAdapter = {
    chat: vi.fn(),
  };
  return {
    getProviderAdapter: vi.fn(() => mockAdapter),
    findFirstSupportedModel: vi.fn(() => "mock-model"),
  };
});

vi.mock("@/lib/security/crypto", () => {
  return {
    decryptString: vi.fn(async (str) => str),
    encryptString: vi.fn(async (str) => str),
  };
});

// Mock repositories
const mockPlanRepo = {
  getPlans: vi.fn(async () => []),
  savePlan: vi.fn(async () => {}),
  deletePlan: vi.fn(async () => {}),
};

const userId = "test-user-mapping";

describe("AI Plan Mapping & Prompt Hardening", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    useAtlasStore.setState({
      user: { id: userId, email: "test@atlas.ai" },
      workoutPlans: [],
      exercises: [],
      activeWorkout: null,
      coachBusy: false,
      activeWorkoutPlanId: null,
      activeTab: "dashboard",
      aiMessages: [],
      aiProviders: [
        {
          id: "openai",
          name: "OpenAI",
          type: "openai",
          enabled: true,
          apiKey: "fake-key",
          defaultModel: "gpt-4",
        },
      ],
      activeProviderId: "openai",
      profile: {
        id: "profile-1",
        experience: "beginner",
        bodyType: "ectomorph",
        age: 25,
        height: 180,
        weight: 70,
        heightUnit: "cm",
        weightUnit: "kg",
        trainingStyle: "hypertrophy",
        daysPerWeek: 3,
        goal: "Build Muscle",
        workoutDuration: 45,
      },
    });

    registry.set(userId, {
      user: {} as any,
      workout: {} as any,
      plan: mockPlanRepo as any,
      nutrition: {} as any,
      water: {} as any,
      body: {} as any,
      recovery: {} as any,
      aiProvider: {} as any,
      subscription: {} as any,
      chat: { getMessages: vi.fn(async () => []), saveMessage: vi.fn(async () => {}), deleteMessagesForDate: vi.fn(async () => {}) } as any,
      recentSearch: { getRecentSearches: vi.fn(async () => []), addRecentSearch: vi.fn(async () => {}), clearRecentSearches: vi.fn(async () => {}) } as any,
      aiCache: { getCachedResponse: vi.fn(async () => null), saveResponse: vi.fn(async () => {}) } as any,
    });
  });

  afterEach(() => {
    registry.clear();
    vi.useRealTimers();
  });

  // ─── Scenarios 1: Parser Lenient Checks and Normalization ────────────────────

  describe("parseAiWorkoutPlan Lenience & Key Normalization", () => {
    it("should successfully parse a plan with 'title' instead of 'name'", () => {
      const response = `\`\`\`json
      {
        "id": "plan-title-01",
        "title": "Custom Hybrid Split",
        "goal": "Build functional size",
        "routines": []
      }
      \`\`\``;

      const plan = parseAiWorkoutPlan(response);
      expect(plan).not.toBeNull();
      expect(plan?.name).toBe("Custom Hybrid Split");
    });

    it("should successfully parse a plan with 'description' instead of 'goal'", () => {
      const response = `\`\`\`json
      {
        "id": "plan-desc-01",
        "name": "General PPL",
        "description": "Hypertrophy focus",
        "routines": []
      }
      \`\`\``;

      const plan = parseAiWorkoutPlan(response);
      expect(plan).not.toBeNull();
      expect(plan?.goal).toBe("Hypertrophy focus");
    });

    it("should successfully parse a plan with 'warning' instead of 'notes'", () => {
      const response = `\`\`\`json
      {
        "id": "plan-warning-01",
        "name": "Intense Powerlifting",
        "warning": "Extremely high intensity. Ensure target date is 8+ weeks out.",
        "routines": []
      }
      \`\`\``;

      const plan = parseAiWorkoutPlan(response);
      expect(plan).not.toBeNull();
      expect(plan?.notes).toBe("Extremely high intensity. Ensure target date is 8+ weeks out.");
    });

    it("should default routines and exercises to empty arrays if missing", () => {
      const response = `\`\`\`json
      {
        "id": "plan-empty-arrays",
        "name": "Empty Test Plan"
      }
      \`\`\``;

      const plan = parseAiWorkoutPlan(response);
      expect(plan).not.toBeNull();
      expect(plan?.routines).toEqual([]);
      expect(plan?.exercises).toEqual([]);
    });

    it("should fallback to extract JSON string from raw text if missing markdown braces", () => {
      const response = `Some introductory conversational text.
      {
        "name": "Raw Bracket Plan",
        "goal": "Test brackets",
        "routines": []
      }
      Trailing conversational text.`;

      const plan = parseAiWorkoutPlan(response);
      expect(plan).not.toBeNull();
      expect(plan?.name).toBe("Raw Bracket Plan");
    });
  });

  // ─── Scenarios 2: Exercise Mapping & Fallbacks ──────────────────────────────

  describe("sendCoachMessage with Missing Exercises", () => {
    it("should immediately create and map placeholder exercises if referenced IDs are missing", async () => {
      const generatedJson = {
        id: "plan-with-missing-exs",
        name: "AI Hypertrophy Plan",
        goal: "Muscle gain",
        routines: [
          {
            id: "routine-1",
            name: "Upper Day",
            focus: "Chest/Back",
            estimatedMinutes: 60,
            day: "Monday",
            exercises: [
              { exerciseId: "incline-dumbbell-bench", targetSets: 3, targetReps: "8-12", restSeconds: 90 },
              { exerciseId: "missing-pec-deck-fly", targetSets: 3, targetReps: "12-15", restSeconds: 60 }
            ]
          }
        ],
        exercises: [
          {
            id: "incline-dumbbell-bench",
            name: "Incline Dumbbell Bench",
            category: "compound",
            muscles: ["chest", "shoulders"],
            equipment: ["dumbbell"],
            difficulty: "intermediate",
            setup: ["Set incline to 30 degrees"],
            instructions: ["Press up"],
            execution: ["Squeeze at top"],
            breathing: "Inhale down",
            tempo: "2-0-2-0",
            commonMistakes: [],
            safetyTips: [],
            progressionTips: []
          }
          // "missing-pec-deck-fly" is missing from the exercises array
        ]
      };

      const mockAdapter = getProviderAdapter("openai");
      // Initial chat call
      vi.mocked(mockAdapter.chat).mockResolvedValueOnce({
        content: `\`\`\`json\n${JSON.stringify(generatedJson)}\n\`\`\``,
        tokenCount: 100,
      });
      // Follow-up chat call for missing exercises
      vi.mocked(mockAdapter.chat).mockResolvedValueOnce({
        content: `[]`,
        tokenCount: 10,
      });

      await useAtlasStore.getState().sendCoachMessage("Build my plan", { isRoutineGeneration: true });

      // Run any pending promises/timers
      await vi.runAllTimersAsync();

      // The plan should load immediately
      const plans = useAtlasStore.getState().workoutPlans;
      expect(plans).toHaveLength(1);
      expect(plans[0].id).toBe("plan-with-missing-exs");

      // Verify that "missing-pec-deck-fly" is mapped to a valid placeholder
      const exercises = useAtlasStore.getState().exercises;
      const placeholder = exercises.find(e => e.id === "missing-pec-deck-fly");
      expect(placeholder).toBeDefined();
      expect(placeholder?.name).toBe("Missing Pec Deck Fly");
      expect(placeholder?.category).toBe("compound");
      expect(placeholder?.muscles).toContain("full body");
      expect(placeholder?.instructions[0]).toContain("Perform the Missing Pec Deck Fly exercise");

      // Verify save (called once immediately, once on background completion)
      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(2);
      expect(mockPlanRepo.savePlan).toHaveBeenLastCalledWith(
        userId,
        expect.objectContaining({ id: "plan-with-missing-exs" })
      );
    });

    it("should successfully trigger background follow-up fetch and update placeholders once resolved", async () => {
      const generatedJson = {
        id: "plan-bg-fetch",
        name: "Plan Background Fetch",
        goal: "Back growth",
        routines: [
          {
            id: "routine-1",
            name: "Pull Day",
            focus: "Back",
            estimatedMinutes: 45,
            day: "Monday",
            exercises: [
              { exerciseId: "missing-hammer-row", targetSets: 3, targetReps: "10-12", restSeconds: 60 }
            ]
          }
        ]
      };

      const mockAdapter = getProviderAdapter("openai");
      // Initial chat call
      vi.mocked(mockAdapter.chat).mockResolvedValueOnce({
        content: `\`\`\`json\n${JSON.stringify(generatedJson)}\n\`\`\``,
        tokenCount: 100,
      });

      // Follow-up chat call resolving the biomechanics
      const resolvedExercises = [
        {
          id: "missing-hammer-row",
          name: "Hammer Row Machine",
          category: "isolation",
          muscles: ["back", "biceps"],
          equipment: ["machine"],
          difficulty: "beginner",
          setup: ["Set seat height"],
          instructions: ["Pull handles back"],
          execution: ["Squeeze shoulder blades"],
          breathing: "Exhale back",
          tempo: "3-0-1-0",
          commonMistakes: ["Using momentum"],
          safetyTips: ["Keep chest on pad"],
          progressionTips: ["Increase weight"]
        }
      ];

      vi.mocked(mockAdapter.chat).mockResolvedValueOnce({
        content: `\`\`\`json\n${JSON.stringify(resolvedExercises)}\n\`\`\``,
        tokenCount: 50,
      });

      await useAtlasStore.getState().sendCoachMessage("Build my back plan", { isRoutineGeneration: true });

      // Run follow-up setTimeout
      await vi.runAllTimersAsync();

      // Verify that the exercise was updated from placeholder to resolved biomechanical definition
      const exercises = useAtlasStore.getState().exercises;
      const exercise = exercises.find(e => e.id === "missing-hammer-row");
      expect(exercise).toBeDefined();
      expect(exercise?.name).toBe("Hammer Row Machine");
      expect(exercise?.category).toBe("isolation");
      expect(exercise?.muscles).toContain("back");

      // Verify plan got updated with the resolved exercise definition in the background
      const plans = useAtlasStore.getState().workoutPlans;
      expect(plans[0].exercises).toContainEqual(
        expect.objectContaining({ id: "missing-hammer-row", name: "Hammer Row Machine" })
      );

      // Verify save got called again for follow-up update
      expect(mockPlanRepo.savePlan).toHaveBeenCalledTimes(2);
    });
  });

  // ─── Scenarios 3: Active Tab Redirection ───────────────────────────────────

  describe("Active Tab Redirection", () => {
    it("should set activeTab to 'workout' when isRoutineGeneration is true in sendCoachMessage", async () => {
      const generatedJson = {
        id: "plan-tab-redirect",
        name: "Tab Redirect Plan",
        goal: "General fitness",
        routines: []
      };

      const mockAdapter = getProviderAdapter("openai");
      vi.mocked(mockAdapter.chat).mockResolvedValueOnce({
        content: `\`\`\`json\n${JSON.stringify(generatedJson)}\n\`\`\``,
        tokenCount: 100,
      });

      // Initially 'dashboard'
      expect(useAtlasStore.getState().activeTab).toBe("dashboard");

      await useAtlasStore.getState().sendCoachMessage("Build my general plan", { isRoutineGeneration: true });

      // Tab should be 'workout' after plan is successfully mapped
      expect(useAtlasStore.getState().activeTab).toBe("workout");
      expect(useAtlasStore.getState().activeSubScreen).toBe("workout-plan-detail");
    });
  });
});
