import { StateCreator } from "zustand";
import type { AtlasStoreState, AtlasTab, SubScreen, StartupChoice } from "../useAtlasStore";
import type { ThemeMode } from "@/types/domain";
import { readLocalSetting, writeLocalSetting } from "@/lib/storage/db";


export interface UiSlice {
  hydrated: boolean;
  activeTab: AtlasTab;
  activeSubScreen: SubScreen;
  activeSettingsTab: "profile" | "ai" | "system" | "subscription";
  startupChoice: StartupChoice;
  blocked: boolean;
  theme: ThemeMode;
  guidedMode: boolean;
  homeSubTab: "today" | "analytics";
  globalAddFoodOpen: boolean;
  dashboardCardOrder: string[];
  hiddenDashboardCards: string[];
  lastCompletedWorkoutId: string | null;
  workoutExperienceMode: "beginner" | "advanced";

  setBlocked: (blocked: boolean) => void;
  setActiveSettingsTab: (tab: "profile" | "ai" | "system" | "subscription") => void;
  setStartupChoice: (choice: StartupChoice) => void;
  setActiveTab: (tab: AtlasTab) => void;
  setActiveSubScreen: (subScreen: SubScreen) => void;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setGuidedMode: (guidedMode: boolean) => Promise<void>;
  setHomeSubTab: (subTab: "today" | "analytics") => void;
  setGlobalAddFoodOpen: (open: boolean) => void;
  setDashboardCardOrder: (order: string[]) => void;
  toggleDashboardCardVisibility: (cardId: string) => void;
  setLastCompletedWorkoutId: (id: string | null) => void;
  setWorkoutExperienceMode: (mode: "beginner" | "advanced") => void;
}

export const createUiSlice: StateCreator<
  AtlasStoreState,
  [],
  [],
  UiSlice
> = (set, get) => ({
  hydrated: false,
  activeTab: "dashboard",
  activeSubScreen: null,
  activeSettingsTab: "profile",
  startupChoice: null,
  blocked: false,
  theme: typeof window !== "undefined" ? readLocalSetting<ThemeMode>("theme", "system") : "system",
  guidedMode: true,
  homeSubTab: "today",
  globalAddFoodOpen: false,
  dashboardCardOrder: typeof window !== "undefined"
    ? readLocalSetting<string[]>("dashboardCardOrder", ["insight_banner", "cns", "recovery", "stats", "consistency", "weight", "volume", "prs", "trophies"])
    : ["insight_banner", "cns", "recovery", "stats", "consistency", "weight", "volume", "prs", "trophies"],
  hiddenDashboardCards: typeof window !== "undefined"
    ? readLocalSetting<string[]>("hiddenDashboardCards", [])
    : [],
  lastCompletedWorkoutId: null,
  workoutExperienceMode: typeof window !== "undefined"
    ? readLocalSetting<"beginner" | "advanced">("workoutExperienceMode", "beginner")
    : "beginner",

  setBlocked: (blocked) => set({ blocked }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setStartupChoice: (choice) => set({ startupChoice: choice }),
  setActiveTab: (tab) => set({ activeTab: tab, activeSubScreen: null }),
  setActiveSubScreen: (subScreen) => set({ activeSubScreen: subScreen }),
  setTheme: async (theme) => {
    writeLocalSetting("theme", theme);
    set({ theme });
    if (get().profile) {
      await get().updateProfile({ theme });
    }
  },
  setGuidedMode: async (guidedMode) => {
    const mode = guidedMode ? "beginner" : "advanced";
    writeLocalSetting("workoutExperienceMode", mode);
    set({ guidedMode, workoutExperienceMode: mode });
    if (get().profile) {
      await get().updateProfile({ guidedMode });
    }
  },
  setHomeSubTab: (homeSubTab) => set({ homeSubTab }),
  setGlobalAddFoodOpen: (globalAddFoodOpen) => set({ globalAddFoodOpen }),
  setDashboardCardOrder: (order) => {
    writeLocalSetting("dashboardCardOrder", order);
    set({ dashboardCardOrder: order });
  },
  toggleDashboardCardVisibility: (cardId) => {
    const hidden = get().hiddenDashboardCards || [];
    const nextHidden = hidden.includes(cardId)
      ? hidden.filter((id) => id !== cardId)
      : [...hidden, cardId];
    writeLocalSetting("hiddenDashboardCards", nextHidden);
    set({ hiddenDashboardCards: nextHidden });
  },
  setLastCompletedWorkoutId: (id) => set({ lastCompletedWorkoutId: id }),
  setWorkoutExperienceMode: (mode) => {
    writeLocalSetting("workoutExperienceMode", mode);
    set({ workoutExperienceMode: mode, guidedMode: mode === "beginner" });
  },
});
