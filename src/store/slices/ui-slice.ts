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

  setBlocked: (blocked: boolean) => void;
  setActiveSettingsTab: (tab: "profile" | "ai" | "system" | "subscription") => void;
  setStartupChoice: (choice: StartupChoice) => void;
  setActiveTab: (tab: AtlasTab) => void;
  setActiveSubScreen: (subScreen: SubScreen) => void;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setGuidedMode: (guidedMode: boolean) => Promise<void>;
  setHomeSubTab: (subTab: "today" | "analytics") => void;
}

export const createUiSlice: StateCreator<
  AtlasStoreState,
  [],
  [],
  UiSlice
> = (set) => ({
  hydrated: false,
  activeTab: "dashboard",
  activeSubScreen: null,
  activeSettingsTab: "profile",
  startupChoice: null,
  blocked: false,
  theme: typeof window !== "undefined" ? readLocalSetting<ThemeMode>("theme", "system") : "system",
  guidedMode: true,
  homeSubTab: "today",

  setBlocked: (blocked) => set({ blocked }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setStartupChoice: (choice) => set({ startupChoice: choice }),
  setActiveTab: (tab) => set({ activeTab: tab, activeSubScreen: null }),
  setActiveSubScreen: (subScreen) => set({ activeSubScreen: subScreen }),
  setTheme: async (theme) => {
    writeLocalSetting("theme", theme);
    set({ theme });
  },
  setGuidedMode: async (guidedMode) => set({ guidedMode }),
  setHomeSubTab: (homeSubTab) => set({ homeSubTab }),
});
