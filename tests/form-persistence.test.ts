import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useAtlasStore } from "@/store/useAtlasStore";
import { registry } from "@/lib/repositories/registry";
import type { RecoveryLog, BodyMetric, WaterLog, NutritionEntry, Workout, UserProfile } from "@/types/domain";

describe("Form Persistence Integration", () => {
  const userId = "test-persistence-user";

  const mockRecoveryRepo = {
    getLogs: vi.fn(),
    addLog: vi.fn(async () => {}),
    deleteLog: vi.fn(async () => {}),
  };

  const mockBodyRepo = {
    getMetrics: vi.fn(),
    addMetric: vi.fn(async () => {}),
    deleteMetric: vi.fn(async () => {}),
  };

  const mockWaterRepo = {
    getLogs: vi.fn(),
    addLog: vi.fn(async () => {}),
    deleteLog: vi.fn(async () => {}),
  };

  const mockNutritionRepo = {
    getEntries: vi.fn(),
    addEntry: vi.fn(async () => {}),
    deleteEntry: vi.fn(async () => {}),
  };

  const mockWorkoutRepo = {
    getWorkouts: vi.fn(),
    saveWorkout: vi.fn(async () => {}),
    deleteWorkout: vi.fn(async () => {}),
  };

  const mockUserRepo = {
    getProfile: vi.fn(),
    saveProfile: vi.fn(async () => {}),
    deleteProfile: vi.fn(async () => {}),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    useAtlasStore.setState({
      user: { id: userId, email: "test@domain.com" },
      recoveryLogs: [],
      bodyMetrics: [],
      waterLogs: [],
      nutritionEntries: [],
      workouts: [],
      profile: null,
    });

    registry.set(userId, {
      user: mockUserRepo as any,
      workout: mockWorkoutRepo as any,
      plan: {} as any,
      nutrition: mockNutritionRepo as any,
      water: mockWaterRepo as any,
      body: mockBodyRepo as any,
      recovery: mockRecoveryRepo as any,
      aiProvider: {} as any,
      subscription: {} as any,
    });
  });

  afterEach(() => {
    registry.clear();
  });

  it("should save recovery log to the repository when logRecovery is called", async () => {
    const dummyLog: RecoveryLog = {
      id: "recovery-1",
      date: "2026-06-04",
      sleepHours: 8,
      energy: 8,
      soreness: 2,
      stress: 3,
      readiness: 8,
    };

    await useAtlasStore.getState().logRecovery(dummyLog);

    expect(useAtlasStore.getState().recoveryLogs).toContainEqual(dummyLog);
    expect(mockRecoveryRepo.addLog).toHaveBeenCalledTimes(1);
    expect(mockRecoveryRepo.addLog).toHaveBeenCalledWith(userId, dummyLog);
  });

  it("should save body metric to the repository when logBodyMetric is called", async () => {
    const dummyMetric: BodyMetric = {
      id: "body-1",
      date: "2026-06-04",
      bodyweight: 175,
      waist: 32,
      bodyFat: 15,
    };

    await useAtlasStore.getState().logBodyMetric(dummyMetric);

    expect(useAtlasStore.getState().bodyMetrics).toContainEqual(dummyMetric);
    expect(mockBodyRepo.addMetric).toHaveBeenCalledTimes(1);
    expect(mockBodyRepo.addMetric).toHaveBeenCalledWith(userId, dummyMetric);
  });

  it("should save water log to the repository when addWaterLog is called", async () => {
    const dummyLog: WaterLog = {
      id: "water-1",
      amountOz: 16,
      timestamp: new Date().toISOString(),
    };

    await useAtlasStore.getState().addWaterLog(dummyLog);

    expect(useAtlasStore.getState().waterLogs).toContainEqual(dummyLog);
    expect(mockWaterRepo.addLog).toHaveBeenCalledTimes(1);
    expect(mockWaterRepo.addLog).toHaveBeenCalledWith(userId, dummyLog);
  });

  it("should delete water log from the repository when deleteWaterLog is called", async () => {
    const dummyLog: WaterLog = {
      id: "water-1",
      amountOz: 16,
      timestamp: new Date().toISOString(),
    };
    useAtlasStore.setState({ waterLogs: [dummyLog] });

    await useAtlasStore.getState().deleteWaterLog(dummyLog.id);

    expect(useAtlasStore.getState().waterLogs).not.toContainEqual(dummyLog);
    expect(mockWaterRepo.deleteLog).toHaveBeenCalledTimes(1);
    expect(mockWaterRepo.deleteLog).toHaveBeenCalledWith(userId, dummyLog.id);
  });

  it("should save nutrition entry to the repository when addNutritionEntry is called", async () => {
    const dummyEntry: NutritionEntry = {
      id: "nutri-1",
      name: "Egg",
      calories: 70,
      protein: 6,
      carbs: 0,
      fat: 5,
      fiber: 0,
      sugar: 0,
      sodium: 70,
      potassium: 60,
      vitaminC: 0,
      calcium: 25,
      iron: 1,
      meal: "breakfast",
      servingSize: 1,
      servingUnit: "large",
      timestamp: new Date().toISOString(),
    };

    await useAtlasStore.getState().addNutritionEntry(dummyEntry);

    expect(useAtlasStore.getState().nutritionEntries).toContainEqual(dummyEntry);
    expect(mockNutritionRepo.addEntry).toHaveBeenCalledTimes(1);
    expect(mockNutritionRepo.addEntry).toHaveBeenCalledWith(userId, dummyEntry);
  });

  it("should delete nutrition entry from the repository when deleteNutritionEntry is called", async () => {
    const dummyEntry: NutritionEntry = {
      id: "nutri-1",
      name: "Egg",
      calories: 70,
      protein: 6,
      carbs: 0,
      fat: 5,
      fiber: 0,
      sugar: 0,
      sodium: 70,
      potassium: 60,
      vitaminC: 0,
      calcium: 25,
      iron: 1,
      meal: "breakfast",
      servingSize: 1,
      servingUnit: "large",
      timestamp: new Date().toISOString(),
    };
    useAtlasStore.setState({ nutritionEntries: [dummyEntry] });

    await useAtlasStore.getState().deleteNutritionEntry(dummyEntry.id);

    expect(useAtlasStore.getState().nutritionEntries).not.toContainEqual(dummyEntry);
    expect(mockNutritionRepo.deleteEntry).toHaveBeenCalledTimes(1);
    expect(mockNutritionRepo.deleteEntry).toHaveBeenCalledWith(userId, dummyEntry.id);
  });

  it("should save workout history to repository when finishWorkout is called", async () => {
    const dummyWorkout: Workout = {
      id: "workout-1",
      name: "Push Day",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      exercises: [],
    };
    useAtlasStore.setState({ activeWorkout: dummyWorkout });

    await useAtlasStore.getState().finishWorkout();

    expect(useAtlasStore.getState().activeWorkout).toBeNull();
    expect(useAtlasStore.getState().workouts).toContainEqual(expect.objectContaining({ id: "workout-1" }));
    expect(mockWorkoutRepo.saveWorkout).toHaveBeenCalledTimes(1);
    expect(mockWorkoutRepo.saveWorkout).toHaveBeenCalledWith(userId, expect.objectContaining({ id: "workout-1" }));
  });

  it("should save profile to the repository when updateProfile is called", async () => {
    const dummyProfile: UserProfile = {
      id: userId,
      name: "Jordan",
      goal: "General Fitness",
      customGoal: "General Fitness",
      experience: "beginner",
      trainingStyle: "general",
      daysPerWeek: 3,
      weightUnit: "lbs",
      heightUnit: "in",
      createdAt: new Date().toISOString(),
      age: 25,
      height: 70,
      weight: 160,
      targetPhysique: "athletic",
      bodyType: "mesomorph",
      equipment: "full gym",
      providerType: "none",
      workoutDuration: 45,
      gender: "male",
      activityLevel: "moderately_active",
    };
    useAtlasStore.setState({ profile: dummyProfile });

    const patch = { name: "Jordan Updated" };
    await useAtlasStore.getState().updateProfile(patch);

    expect(useAtlasStore.getState().profile?.name).toBe("Jordan Updated");
    expect(mockUserRepo.saveProfile).toHaveBeenCalledTimes(1);
    expect(mockUserRepo.saveProfile).toHaveBeenCalledWith(userId, expect.objectContaining({ name: "Jordan Updated" }));
  });
});
