import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { registry, drainSyncQueue } from "@/lib/repositories/registry";
import { useAtlasStore } from "@/store/useAtlasStore";
import { getProviderAdapter } from "@/providers";
import { createId } from "@/lib/id";
import type { AiMessage } from "@/types/domain";

// Mock providers and crypto
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
    getDeviceSecretValue: vi.fn(() => "fake-secret"),
    setDeviceSecretValue: vi.fn(),
  };
});

// Mock browser global window & navigator for sync queue/theme resolution
Object.defineProperty(global, "window", {
  value: {},
  configurable: true,
  writable: true,
});

Object.defineProperty(global, "navigator", {
  value: {
    get onLine() {
      return true;
    },
  },
  configurable: true,
  writable: true,
});

// Mock Sync Queue
let syncQueue: any[] = [];
vi.mock("@/lib/storage/db", () => {
  return {
    enqueueSync: async (item: any) => {
      syncQueue.push({
        ...item,
        id: syncQueue.length + 1,
        retries: 0,
        createdAt: new Date().toISOString(),
      });
    },
    dequeueAll: async () => {
      return [...syncQueue];
    },
    removeFromQueue: async (id: number) => {
      syncQueue = syncQueue.filter((item) => item.id !== id);
    },
    incrementQueueRetry: async (id: number) => {
      const item = syncQueue.find((item) => item.id === id);
      if (item) item.retries += 1;
    },
    getDb: vi.fn(),
    getAll: vi.fn(),
    readLocalSetting: vi.fn(() => "system"),
    writeLocalSetting: vi.fn(),
  };
});

describe("Complete Persistence & AI Token Caching Integrations", () => {
  const userId = "test-user-persistence";
  let chatDb: Record<string, AiMessage[]> = {};
  let cacheDb: Record<string, any> = {};
  let profileUpdates: any[] = [];

  // Mocks
  const mockChatRepo = {
    getMessages: async (uid: string, date: string) => chatDb[date] || [],
    saveMessage: async (uid: string, date: string, msg: AiMessage) => {
      if (!chatDb[date]) chatDb[date] = [];
      chatDb[date].push(msg);
    },
    deleteMessagesForDate: async (uid: string, date: string) => {
      delete chatDb[date];
    },
  };

  const mockAiCacheRepo = {
    getCachedResponse: async (uid: string, category: string, queryKey: string) => {
      const compositeKey = `${category}:${queryKey}`;
      return cacheDb[compositeKey] || null;
    },
    saveResponse: async (uid: string, category: string, queryKey: string, payload: unknown) => {
      const compositeKey = `${category}:${queryKey}`;
      cacheDb[compositeKey] = payload;
    },
  };

  const mockUserRepo = {
    getProfile: async () => null,
    saveProfile: async (uid: string, profile: any) => {
      profileUpdates.push(profile);
    },
    deleteProfile: async () => {},
  };

  beforeEach(() => {
    chatDb = {};
    cacheDb = {};
    syncQueue = [];
    profileUpdates = [];
    vi.clearAllMocks();

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
          label: "OpenAI",
          type: "openai",
          enabled: true,
          apiKey: "fake-key",
          model: "gpt-4",
          temperature: 0.7,
          contextLength: 4000,
          streaming: true,
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
        theme: "system",
        guidedMode: true,
      },
      selectedDate: "2026-06-05",
      apiCallCount: 0,
      tokenCount: 0,
    });

    registry.set(userId, {
      user: mockUserRepo as any,
      workout: {} as any,
      plan: { savePlan: vi.fn() } as any,
      nutrition: {} as any,
      water: {} as any,
      body: {} as any,
      recovery: {} as any,
      aiProvider: {} as any,
      subscription: {} as any,
      chat: mockChatRepo as any,
      recentSearch: {} as any,
      aiCache: mockAiCacheRepo as any,
    });
  });

  afterEach(() => {
    registry.clear();
  });

  // ─── Chat Messages Persistence & Day Switcher ──────────────────────────────
  describe("Day-Based Chat History & Date Transitions", () => {
    it("should load empty history for a new day, and save new messages under the correct selectedDate", async () => {
      const mockAdapter = getProviderAdapter("openai");
      vi.mocked(mockAdapter.chat).mockResolvedValue({
        content: "Hello, I am your coach.",
        tokenCount: 20,
      });

      // Initially empty
      expect(useAtlasStore.getState().aiMessages).toHaveLength(0);

      // Send a coach message on 2026-06-05
      await useAtlasStore.getState().sendCoachMessage("Hi Coach");

      // Verify stored messages are persisted under 2026-06-05
      expect(chatDb["2026-06-05"]).toBeDefined();
      expect(chatDb["2026-06-05"]).toHaveLength(2); // user message + coach response
      expect(chatDb["2026-06-05"][0].content).toBe("Hi Coach");
      expect(chatDb["2026-06-05"][1].content).toBe("Hello, I am your coach.");

      // Verify active state reflects it
      expect(useAtlasStore.getState().aiMessages).toHaveLength(2);
      expect(useAtlasStore.getState().aiMessages[0].content).toBe("Hi Coach");

      // Now switch dates to 2026-06-06
      await useAtlasStore.getState().setSelectedDate("2026-06-06");

      // History should be empty on this new day
      expect(useAtlasStore.getState().aiMessages).toHaveLength(0);

      // Switch back to 2026-06-05
      await useAtlasStore.getState().setSelectedDate("2026-06-05");

      // History should be hydrated back to the state
      expect(useAtlasStore.getState().aiMessages).toHaveLength(2);
      expect(useAtlasStore.getState().aiMessages[0].content).toBe("Hi Coach");
    });
  });

  // ─── AI Token Caching ───────────────────────────────────────────────────────
  describe("AI Caching of Workout Generation", () => {
    it.skip("should hit cache, bypass LLM call and token consumption, and decrease apiCallCount by 1 on cache hit", async () => {
      const mockAdapter = getProviderAdapter("openai");
      vi.mocked(mockAdapter.chat).mockResolvedValue({
        content: `\`\`\`json\n{"id":"cached-plan-123","name":"Cached Upper Body","goal":"Strength","routines":[],"exercises":[]}\n\`\`\``,
        tokenCount: 150,
      });

      const promptText = "Generate plan for Hypertrophy 3 days";

      // 1. Initial generation - Cache Miss
      await useAtlasStore.getState().sendCoachMessage(promptText, { isRoutineGeneration: true });

      expect(mockAdapter.chat).toHaveBeenCalledTimes(1);
      expect(useAtlasStore.getState().workoutPlans).toHaveLength(1);
      expect(useAtlasStore.getState().workoutPlans[0].id).toBe("cached-plan-123");
      expect(useAtlasStore.getState().apiCallCount).toBe(1);

      // Verify it was saved to the AI cache
      const cachedPayload = cacheDb["workout_plan:" + promptText];
      expect(cachedPayload).toBeDefined();
      expect(cachedPayload).toContain("cached-plan-123");

      // Clear the plan state
      useAtlasStore.setState({ workoutPlans: [] });

      // 2. Second generation with identical prompt - Cache Hit!
      await useAtlasStore.getState().sendCoachMessage(promptText, { isRoutineGeneration: true });

      // Chat adapter should NOT have been called a second time
      expect(mockAdapter.chat).toHaveBeenCalledTimes(1);
      // Plan should still be loaded from the cache
      expect(useAtlasStore.getState().workoutPlans).toHaveLength(1);
      expect(useAtlasStore.getState().workoutPlans[0].id).toBe("cached-plan-123");
      // Api call count should remain 1 (since the 2nd was bypassed)
      expect(useAtlasStore.getState().apiCallCount).toBe(1);
    });
  });

  describe("AI Caching of Daily Insights", () => {
    it("should hit cache for daily insights on the same day and range", async () => {
      const cacheKey = "workout:2026-06-05:Last Week";
      await mockAiCacheRepo.saveResponse(userId, "daily_insight", cacheKey, "Cached workout tip details");

      const cached = await mockAiCacheRepo.getCachedResponse(userId, "daily_insight", cacheKey);
      expect(cached).toBe("Cached workout tip details");
    });
  });

  // ─── User Preferences Database Persistence ──────────────────────────────────
  describe("Syncing App Preferences (Theme & Guided Mode)", () => {
    it("should update user profile in repository when theme or guidedMode is set", async () => {
      expect(profileUpdates).toHaveLength(0);

      // Trigger Theme setting change
      await useAtlasStore.getState().setTheme("dark");

      // Profile repository should receive dark theme
      expect(profileUpdates).toHaveLength(1);
      expect(profileUpdates[0].theme).toBe("dark");

      // Trigger GuidedMode toggling
      await useAtlasStore.getState().setGuidedMode(false);

      // Profile repository should receive updated guidedMode
      expect(profileUpdates).toHaveLength(2);
      expect(profileUpdates[1].guidedMode).toBe(false);
    });
  });

  // ─── Offline Queue Syncing ──────────────────────────────────────────────────
  describe("Offline Sync Queue operations", () => {
    it("should correctly queue a chat message to sync queue, then drain it to the remote chat repository", async () => {
      expect(syncQueue).toHaveLength(0);

      // Manually queue a chat message
      const msgPayload = {
        date: "2026-06-05",
        message: {
          id: "msg-offline-1",
          role: "user" as const,
          content: "Logged while offline",
          createdAt: new Date().toISOString(),
        },
      };

      const { enqueueSync } = await import("@/lib/storage/db");
      await enqueueSync({
        userId,
        store: "chat_messages",
        operation: "upsert",
        recordId: "msg-offline-1",
        payload: msgPayload,
      });

      expect(syncQueue).toHaveLength(1);
      expect(syncQueue[0].store).toBe("chat_messages");
      expect(syncQueue[0].payload).toEqual(msgPayload);

      // Drain the queue
      await drainSyncQueue();

      // Verify sync queue cleared
      expect(syncQueue).toHaveLength(0);
      // Verify remote chatDb has the offline message
      expect(chatDb["2026-06-05"]).toBeDefined();
      expect(chatDb["2026-06-05"][0].id).toBe("msg-offline-1");
      expect(chatDb["2026-06-05"][0].content).toBe("Logged while offline");
    });
  });
});
