import { StateCreator } from "zustand";
import type { AtlasStoreState, AtlasTab, SubScreen, StartupChoice } from "../useAtlasStore";
import type { ThemeMode } from "@/types/domain";

export interface UiSlice {
  hydrated: boolean;
  activeTab: AtlasTab;
  activeSubScreen: SubScreen;
  activeSettingsTab: "profile" | "ai" | "system" | "subscription";
  startupChoice: StartupChoice;
  blocked: boolean;
  theme: ThemeMode;
  guidedMode: boolean;

  setBlocked: (blocked: boolean) => void;
  setActiveSettingsTab: (tab: "profile" | "ai" | "system" | "subscription") => void;
  setStartupChoice: (choice: StartupChoice) => void;
  setActiveTab: (tab: AtlasTab) => void;
  setActiveSubScreen: (subScreen: SubScreen) => void;
  setTheme: (theme: ThemeMode) => Promise<void>;
  setGuidedMode: (guidedMode: boolean) => Promise<void>;
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
  theme: "system",
  guidedMode: true,

  setBlocked: (blocked) => set({ blocked }),
  setActiveSettingsTab: (tab) => set({ activeSettingsTab: tab }),
  setStartupChoice: (choice) => set({ startupChoice: choice }),
  setActiveTab: (tab) => set({ activeTab: tab, activeSubScreen: null }),
  setActiveSubScreen: (subScreen) => set({ activeSubScreen: subScreen }),
  setTheme: async (theme) => set({ theme }),
  setGuidedMode: async (guidedMode) => set({ guidedMode }),
});
