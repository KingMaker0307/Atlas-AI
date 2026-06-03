import { StateCreator } from "zustand";
import type { AtlasStoreState } from "../useAtlasStore";
import type {
  NutritionEntry,
  WaterLogEntry,
  CommonFoodItem,
  WeightUnit,
  HeightUnit,
  BodyMetric,
  RecoveryLog,
} from "@/types/domain";

export interface NutritionSlice {
  recoveryLogs: RecoveryLog[];
  bodyMetrics: BodyMetric[];
  nutritionEntries: NutritionEntry[];
  waterLogs: WaterLogEntry[];
  recentFoodSearches: CommonFoodItem[];
  weightUnit: WeightUnit;
  heightUnit: HeightUnit;

  setWeightUnit: (unit: WeightUnit) => Promise<void>;
  setHeightUnit: (unit: HeightUnit) => Promise<void>;
  logRecovery: (log: RecoveryLog) => Promise<void>;
  logBodyMetric: (metric: BodyMetric) => Promise<void>;
  addNutritionEntry: (entry: NutritionEntry) => Promise<void>;
  addNutritionEntries: (entries: NutritionEntry[]) => Promise<void>;
  deleteNutritionEntry: (id: string) => Promise<void>;
  addWaterLog: (log: WaterLogEntry) => Promise<void>;
  deleteWaterLog: (id: string) => Promise<void>;
  addRecentFoodSearch: (item: CommonFoodItem) => Promise<void>;
  clearRecentFoodSearches: () => Promise<void>;
  removeRecentFoodSearch: (item: CommonFoodItem) => Promise<void>;
}

export const createNutritionSlice: StateCreator<
  AtlasStoreState,
  [],
  [],
  NutritionSlice
> = (set, get) => ({
  recoveryLogs: [],
  bodyMetrics: [],
  nutritionEntries: [],
  waterLogs: [],
  recentFoodSearches: [],
  weightUnit: "lbs",
  heightUnit: "in",

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
  },

  logRecovery: async (log) => {
    const filtered = get().recoveryLogs.filter((item) => item.date !== log.date);
    set({ recoveryLogs: [...filtered, log].sort((a, b) => a.date.localeCompare(b.date)) });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.recovery.addLog(uid, log));
  },

  logBodyMetric: async (metric) => {
    const filtered = get().bodyMetrics.filter((item) => item.date !== metric.date);
    set({ bodyMetrics: [...filtered, metric].sort((a, b) => a.date.localeCompare(b.date)) });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.body.addMetric(uid, metric));
  },

  addNutritionEntry: async (entry) => {
    set({ nutritionEntries: [...(get().nutritionEntries || []), entry] });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.nutrition.addEntry(uid, entry));
  },

  addNutritionEntries: async (entries) => {
    set({ nutritionEntries: [...(get().nutritionEntries || []), ...entries] });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    for (const entry of entries) {
      registry.save((r, uid) => r.nutrition.addEntry(uid, entry));
    }
  },

  deleteNutritionEntry: async (id) => {
    set({ nutritionEntries: (get().nutritionEntries || []).filter((e) => e.id !== id) });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.nutrition.deleteEntry(uid, id));
  },

  addWaterLog: async (log) => {
    set({ waterLogs: [...(get().waterLogs || []), log] });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.water.addLog(uid, log));
  },

  deleteWaterLog: async (id) => {
    set({ waterLogs: (get().waterLogs || []).filter((w) => w.id !== id) });
    const registry = await import("@/lib/repositories/registry").then(m => m.registry);
    registry.save((r, uid) => r.water.deleteLog(uid, id));
  },

  addRecentFoodSearch: async (item) => {
    const prev = get().recentFoodSearches || [];
    const filtered = prev.filter(
      (p) => !(p.name.toLowerCase() === item.name.toLowerCase() && p.brand === item.brand)
    );
    const updated = [item, ...filtered].slice(0, 10);
    set({ recentFoodSearches: updated });
  },

  clearRecentFoodSearches: async () => {
    set({ recentFoodSearches: [] });
  },

  removeRecentFoodSearch: async (item) => {
    const prev = get().recentFoodSearches || [];
    const updated = prev.filter(
      (p) => !(p.name.toLowerCase() === item.name.toLowerCase() && p.brand === item.brand)
    );
    set({ recentFoodSearches: updated });
  },
});
