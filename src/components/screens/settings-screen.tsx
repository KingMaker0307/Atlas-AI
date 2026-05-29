"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  Bell,
  Bot,
  CheckCircle2,
  Database,
  Download,
  LinkIcon,
  Palette,
  PlugZap,
  RefreshCcw,
  Save,
  Upload,
  Pencil,
  Server,
  Info,
  Eye,
  EyeOff,
  Cpu,
  User,
  Shield,
  ShieldAlert,
  Sparkles,
  Lock,
  Dumbbell,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { AiProviderSettings, HeightUnit, ThemeMode, WeightUnit, UserProfile, Physique } from "@/types/domain";
import { getProviderAdapter } from "@/providers";
import { decryptString } from "@/lib/security/crypto";

const providerTypes: AiProviderSettings["type"][] = [
  "openai",
  "anthropic",
  "gemini",
  "grok",
  "deepseek",
  "openrouter",
  "ollama",
  "lmstudio",
  "custom",
];

const physiqueOptions: Physique[] = ["lean", "athletic", "bulky", "shredded", "toned"];

const providerHints: Record<string, string> = {
  label: "A nickname for this provider, like 'OpenAI (GPT-4)'.",
  type: "The type of AI provider you are using.",
  baseUrl: "The web address of the AI provider's service. Only editable for custom providers.",
  model: "The specific AI model to use from the selected provider.",
  apiKey: "Your API key for the selected provider.",
  temperature: "Controls the creativity of the AI's responses. Higher is more creative.",
  context: "The 'memory' of the AI, in words or 'tokens'.",
  streaming: "Determines if the AI's response appears all at once or word-by-word.",
  active: "Sets this provider as the default for all AI-powered features.",
  save: "Save the current provider settings.",
  test: "Test the connection to the provider with the current settings.",
};

const defaultBaseUrls: Record<AiProviderSettings["type"], string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  grok: "https://api.x.ai/v1",
  deepseek: "https://api.deepseek.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234/v1",
  custom: "",
};

const providerConfig: Record<AiProviderSettings["type"], { label: string; gradient: string; text: string }> = {
  openai: { label: "OpenAI", gradient: "from-green-500/10 to-emerald-500/5 border-green-500/20", text: "text-green-600 dark:text-green-300" },
  anthropic: { label: "Anthropic", gradient: "from-orange-500/10 to-amber-500/5 border-orange-500/20", text: "text-orange-600 dark:text-orange-300" },
  gemini: { label: "Gemini", gradient: "from-blue-500/10 to-indigo-500/5 border-blue-500/20", text: "text-blue-600 dark:text-blue-300" },
  grok: { label: "Grok", gradient: "from-zinc-500/10 to-zinc-700/5 border-zinc-500/20", text: "text-zinc-600 dark:text-zinc-300" },
  deepseek: { label: "DeepSeek", gradient: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20", text: "text-cyan-600 dark:text-cyan-300" },
  openrouter: { label: "OpenRouter", gradient: "from-purple-500/10 to-pink-500/5 border-purple-500/20", text: "text-purple-600 dark:text-purple-300" },
  ollama: { label: "Ollama", gradient: "from-teal-500/10 to-cyan-500/5 border-teal-500/20", text: "text-teal-600 dark:text-teal-300" },
  lmstudio: { label: "LM Studio", gradient: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20", text: "text-indigo-600 dark:text-indigo-300" },
  custom: { label: "Custom API", gradient: "from-yellow-500/10 to-amber-500/5 border-yellow-500/20", text: "text-amber-600 dark:text-amber-300" },
};

const defaultDraftForType = (type: AiProviderSettings["type"]): AiProviderSettings => ({
  id: createId("provider"),
  type,
  label: providerConfig[type]?.label || "Custom API",
  baseUrl: defaultBaseUrls[type] || "",
  model:
    type === "openai" ? "gpt-4o" :
      type === "anthropic" ? "claude-3-5-sonnet-20241022" :
        type === "gemini" ? "gemini-1.5-pro" :
          type === "deepseek" ? "deepseek-chat" :
            type === "grok" ? "grok-beta" :
              type === "openrouter" ? "meta-llama/llama-3.1-70b-instruct" :
                type === "ollama" ? "llama3" :
                  type === "lmstudio" ? "model" : "model",
  temperature: 0.7,
  contextLength: 8000,
  streaming: true,
  enabled: false,
});

function getProviderInstructions(provider: string) {
  switch (provider) {
    case "openai":
      return {
        title: "OpenAI Configuration",
        steps: [
          "Sign in to your account at platform.openai.com.",
          "Go to API Keys on the left sidebar navigation.",
          "Click '+ Create new secret key' and select permissions.",
          "Copy the key (starts with 'sk-') and paste it below."
        ],
        url: "https://platform.openai.com/api-keys"
      };
    case "anthropic":
      return {
        title: "Anthropic Configuration",
        steps: [
          "Log in to the console at console.anthropic.com.",
          "Click on 'API Keys' in your dashboard.",
          "Generate a new secret key, naming it appropriately.",
          "Copy the key (starts with 'sk-ant-') and paste it below."
        ],
        url: "https://console.anthropic.com/"
      };
    case "gemini":
      return {
        title: "Google Gemini Configuration",
        steps: [
          "Navigate to Google AI Studio at aistudio.google.com.",
          "Sign in with your Google account.",
          "Click on the 'Get API key' button in the upper left.",
          "Click 'Create API key' (either in a new or existing project) and copy it."
        ],
        url: "https://aistudio.google.com/"
      };
    case "grok":
      return {
        title: "xAI Grok Configuration",
        steps: [
          "Go to the xAI Console at console.x.ai.",
          "Select API Keys from the sidebar navigation.",
          "Click 'Create API Key' and copy it."
        ],
        url: "https://console.x.ai/"
      };
    case "deepseek":
      return {
        title: "DeepSeek Configuration",
        steps: [
          "Sign in to platform.deepseek.com.",
          "Navigate to 'API Keys' in the menu sidebar.",
          "Click 'Create new API key', choose a name, and copy it."
        ],
        url: "https://platform.deepseek.com/"
      };
    case "openrouter":
      return {
        title: "OpenRouter Configuration",
        steps: [
          "Go to openrouter.ai and log in.",
          "Select 'Keys' and click 'Create Key'.",
          "Copy the generated key (starts with 'sk-or-') and paste it below."
        ],
        url: "https://openrouter.ai/keys"
      };
    case "ollama":
      return {
        title: "Ollama Local Configuration",
        steps: [
          "Ensure Ollama is downloaded and running on your local machine.",
          "Ensure you have pulled a model (e.g., run 'ollama run llama3' in terminal).",
          "The default local server address is http://localhost:11434.",
          "No API Key is required. You can leave the API key field blank."
        ],
        url: "https://ollama.com"
      };
    case "lmstudio":
      return {
        title: "LM Studio Local Configuration",
        steps: [
          "Open LM Studio on your local machine.",
          "Go to the Local Server tab (double-headed arrow icon).",
          "Select and load a GGUF model in the top dropdown.",
          "Click 'Start Server' (it defaults to port 1234).",
          "No API Key is required. You can leave the API key field blank."
        ],
        url: "https://lmstudio.ai"
      };
    default:
      return null;
  }
}

export function SettingsScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const theme = useAtlasStore((state) => state.theme);
  const weightUnit = useAtlasStore((state) => state.weightUnit);
  const heightUnit = useAtlasStore((state) => state.heightUnit);
  const providers = useAtlasStore((state) => state.aiProviders);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const setTheme = useAtlasStore((state) => state.setTheme);
  const setWeightUnit = useAtlasStore((state) => state.setWeightUnit);
  const setHeightUnit = useAtlasStore((state) => state.setHeightUnit);
  const saveProvider = useAtlasStore((state) => state.saveProvider);
  const setActiveProvider = useAtlasStore((state) => state.setActiveProvider);
  const markProviderKeyStatus = useAtlasStore((state) => state.markProviderKeyStatus);
  const testProvider = useAtlasStore((state) => state.testProvider);
  const exportEncryptedProfile = useAtlasStore((state) => state.exportEncryptedProfile);
  const importEncryptedProfile = useAtlasStore((state) => state.importEncryptedProfile);
  const resetLocalData = useAtlasStore((state) => state.resetLocalData);
  const providerBusy = useAtlasStore((state) => state.providerBusy);
  const updateProfile = useAtlasStore((state) => state.updateProfile);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);
  const workouts = useAtlasStore((state) => state.workouts);
  const recoveryLogs = useAtlasStore((state) => state.recoveryLogs);
  const aiMessages = useAtlasStore((state) => state.aiMessages);
  const workoutPlans = useAtlasStore((state) => state.workoutPlans);
  const guidedMode = useAtlasStore((state) => state.guidedMode);
  const setGuidedMode = useAtlasStore((state) => state.setGuidedMode);
  const apiCallCount = useAtlasStore((state) => state.apiCallCount);
  const tokenCount = useAtlasStore((state) => state.tokenCount);

  // High-density preferences active tab state (Backups and System are unified)
  const activeSettingsTab = useAtlasStore((state) => state.activeSettingsTab);
  const setActiveSettingsTab = useAtlasStore((state) => state.setActiveSettingsTab);

  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile>>({});
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  const [profileError, setProfileError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  const [saveIndicator, setSaveIndicator] = useState<"saved" | "saving" | "error" | null>("saved");
  const [showApiKey, setShowApiKey] = useState(false);
  const [showExportPassphrase, setShowExportPassphrase] = useState(false);
  const [showImportPassphrase, setShowImportPassphrase] = useState(false);
  const [showBmiGuidance, setShowBmiGuidance] = useState(false);

  const [initialized, setInitialized] = useState(false);
  const [selectedType, setSelectedType] = useState<AiProviderSettings["type"]>("openai");
  const [draft, setDraft] = useState<AiProviderSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("Not enabled");
  const [showDbStats, setShowDbStats] = useState(false);

  const [prevDraftId, setPrevDraftId] = useState<string | null>(null);
  useEffect(() => {
    if (draft && draft.id !== prevDraftId) {
      setPrevDraftId(draft.id);
      setApiKey(draft.apiKey ? "••••••••••••••••" : "");
    }
  }, [draft, prevDraftId]);

  // Initialize selected type and draft based on active provider
  useEffect(() => {
    if (providers.length > 0 && !initialized) {
      const active = providers.find((p) => p.id === activeProviderId) || providers[0];
      if (active) {
        setSelectedType(active.type);
        setDraft({ ...active });
        setInitialized(true);
      }
    }
  }, [providers, activeProviderId, initialized]);

  // Keep draft updated if the store copy changes (e.g., tested status updates)
  const activeSavedProviderOfSelectedType = useMemo(() => {
    return providers.find((p) => p.type === selectedType);
  }, [providers, selectedType]);

  useEffect(() => {
    if (activeSavedProviderOfSelectedType && draft && draft.id === activeSavedProviderOfSelectedType.id) {
      setDraft((d) => {
        if (!d) return null;
        return {
          ...d,
          lastStatus: activeSavedProviderOfSelectedType.lastStatus,
          lastError: activeSavedProviderOfSelectedType.lastError,
          lastTestedAt: activeSavedProviderOfSelectedType.lastTestedAt,
          apiKey: activeSavedProviderOfSelectedType.apiKey,
        };
      });
    }
  }, [activeSavedProviderOfSelectedType]);

  useEffect(() => {
    if (profile) {
      setDraftProfile(profile);
    }
  }, [profile]);

  useEffect(() => {
    if (draft && draft.type !== "custom" && !draft.baseUrl) {
      setDraft((d) => ({ ...d!, baseUrl: defaultBaseUrls[d!.type] }));
    }
  }, [draft?.type, draft?.baseUrl]);

  useEffect(() => {
    async function fetchModels() {
      if (!draft) return;
      if (!apiKey && draft.type !== "ollama" && draft.type !== "lmstudio") {
        setModelsError("Enter API key to load models");
        setModels([]);
        return;
      }

      // Short-circuit: if using the saved (masked) key that we've already confirmed
      // is invalid, show the cached error without hitting the API again. This prevents
      // an infinite loop: markProviderKeyStatus → providers update → draft update → re-fetch.
      if (apiKey === "••••••••••••••••") {
        const savedProvider = useAtlasStore.getState().aiProviders.find((p) => p.id === draft.id);
        if (savedProvider?.lastStatus === "error") {
          setModelsError(savedProvider.lastError ?? "API key is invalid");
          setModels([]);
          return;
        }
      }

      setModelsLoading(true);
      setModelsError(null);
      try {
        const adapter = getProviderAdapter(draft.type);
        let actualApiKey = apiKey;
        if (apiKey === "••••••••••••••••" && draft.apiKey) {
          try {
            actualApiKey = await decryptString(draft.apiKey);
          } catch (decErr) {
            console.error("Failed to decrypt API key:", decErr);
            actualApiKey = "";
          }
        }
        const modelList = await adapter.listModels(draft, actualApiKey);
        setModels(modelList.map((m) => m.id));
        // Key is valid — clear any error status on the saved provider
        const savedProvider = useAtlasStore.getState().aiProviders.find((p) => p.id === draft.id);
        if (savedProvider && savedProvider.lastStatus === "error") {
          await markProviderKeyStatus(savedProvider.id, "ok");
        }
      } catch (error: any) {
        console.error("Failed to fetch models:", error);
        setModelsError(error.message || "Failed to load models");
        setModels([]);
        // Mark the saved provider as invalid if the error looks like an auth failure
        const savedProvider = useAtlasStore.getState().aiProviders.find((p) => p.id === draft.id);
        const isAuthError = error?.status === 401 || error?.status === 403 ||
          /invalid.*key|incorrect.*key|api key|unauthorized|forbidden/i.test(error?.message ?? "");
        if (savedProvider && isAuthError && savedProvider.lastStatus !== "error") {
          await markProviderKeyStatus(savedProvider.id, "error", error.message || "Invalid API key");
        }
      } finally {
        setModelsLoading(false);
      }
    }
    void fetchModels();
  }, [draft, apiKey]);

  const handleWeightUnitChange = async (unit: WeightUnit) => {
    const currentUnit = draftProfile.weightUnit ?? weightUnit;
    if (currentUnit !== unit) {
      let newWeight = draftProfile.weight;
      if (newWeight) {
        if (unit === "lbs") {
          newWeight = Math.round(newWeight * 2.20462 * 10) / 10;
        } else {
          newWeight = Math.round((newWeight / 2.20462) * 10) / 10;
        }
      }
      const updated = { ...draftProfile, weight: newWeight, weightUnit: unit };
      setDraftProfile(updated);
      await setWeightUnit(unit);
      await updateProfile(updated);
    }
  };

  const handleHeightUnitChange = async (unit: HeightUnit) => {
    const currentUnit = draftProfile.heightUnit ?? heightUnit;
    if (currentUnit !== unit) {
      let newHeight = draftProfile.height;
      if (newHeight) {
        if (unit === "in") {
          newHeight = Math.round(newHeight / 2.54);
        } else {
          newHeight = Math.round(newHeight * 2.54);
        }
      }
      const updated = { ...draftProfile, height: newHeight, heightUnit: unit };
      setDraftProfile(updated);
      await setHeightUnit(unit);
      await updateProfile(updated);
    }
  };

  // Debounced auto-save for profile biometrics
  useEffect(() => {
    if (!draftProfile || Object.keys(draftProfile).length === 0) return;

    const isDifferent = Object.keys(draftProfile).some(
      (key) => (draftProfile as any)[key] !== (profile as any)[key]
    );
    if (!isDifferent) return;

    setSaveIndicator("saving");
    const timer = setTimeout(async () => {
      const age = Number(draftProfile.age);
      const weight = Number(draftProfile.weight);
      const height = Number(draftProfile.height);
      const diet = draftProfile.dietaryPreferences || "";
      const injuries = draftProfile.injuries || "";
      const duration = Number(draftProfile.workoutDuration);

      const name = draftProfile.name || "";
      const daysPerWeek = Number(draftProfile.daysPerWeek);
      const goal = draftProfile.goal || "";

      if (
        (draftProfile.name !== undefined && (name.trim().length === 0 || name.length > 30)) ||
        isNaN(age) || age < 13 || age > 120 ||
        isNaN(weight) || weight < 20 || weight > 1000 ||
        isNaN(height) || height < 20 || height > 300 ||
        (draftProfile.workoutDuration !== undefined && (isNaN(duration) || duration < 15 || duration > 180)) ||
        (draftProfile.daysPerWeek !== undefined && (isNaN(daysPerWeek) || daysPerWeek < 1 || daysPerWeek > 7)) ||
        diet.length > 200 || injuries.length > 100 ||
        goal.length > 200
      ) {
        setSaveIndicator("error");
        setProfileError("Invalid profile values.");
        return;
      }

      try {
        setProfileError(null);
        await updateProfile(draftProfile);
        setSaveIndicator("saved");
      } catch (err) {
        setSaveIndicator("error");
        setProfileError("Failed to auto-save profile.");
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [draftProfile, profile, updateProfile]);

  const handleSelectType = (type: AiProviderSettings["type"]) => {
    setSelectedType(type);
    const existing = providers.find((p) => p.type === type);
    if (existing) {
      setDraft({ ...existing });
      // Reset apiKey immediately so fetchModels never sees the previous provider's
      // decrypted key while the new draft is being applied (avoids cross-provider
      // key contamination, e.g. sending a Gemini key to an OpenAI endpoint).
      setApiKey(existing.apiKey ? "••••••••••••••••" : "");
    } else {
      setDraft(defaultDraftForType(type));
      setApiKey("");
    }
    setAiError(null);
  };

  async function handleExport() {
    if (!exportPassphrase) return;
    const text = await exportEncryptedProfile(exportPassphrase);
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `atlas-ai-coach-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport() {
    if (!importFile || !importPassphrase) return;
    const text = await importFile.text();
    await importEncryptedProfile(text, importPassphrase);
    setImportFile(null);
    setImportPassphrase("");
  }

  const handleProfileChange = (field: keyof UserProfile, value: any) => {
    setDraftProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveProvider = async () => {
    if (!draft) return;

    if (draft.label.length === 0 || draft.label.length > 30) {
      setAiError("Label must be between 1 and 30 characters.");
      return;
    }
    if (draft.baseUrl && draft.baseUrl.length > 200) {
      setAiError("Base URL must be 200 characters or less.");
      return;
    }
    if (draft.model && draft.model.length > 100) {
      setAiError("Model name must be 100 characters or less.");
      return;
    }
    if (apiKey && apiKey.length > 500) {
      setAiError("API key must be 500 characters or less.");
      return;
    }

    setAiError(null);
    const updatedDraft = {
      ...draft,
      temperature: 0.7,
      contextLength: 8000,
      streaming: true,
    };
    const keyToPass = apiKey === "••••••••••••••••" ? undefined : apiKey;
    await saveProvider(updatedDraft, keyToPass);
    await setActiveProvider(updatedDraft.id);
    setDraft(updatedDraft);
    if (apiKey !== "") {
      setApiKey("••••••••••••••••");
    }
  };

  const handleTestProvider = async () => {
    if (!draft) return;

    if (draft.label.length === 0 || draft.label.length > 30) {
      setAiError("Label must be between 1 and 30 characters.");
      return;
    }
    if (draft.baseUrl && draft.baseUrl.length > 200) {
      setAiError("Base URL must be 200 characters or less.");
      return;
    }
    if (draft.model && draft.model.length > 100) {
      setAiError("Model name must be 100 characters or less.");
      return;
    }
    if (apiKey && apiKey.length > 500) {
      setAiError("API key must be 500 characters or less.");
      return;
    }

    setAiError(null);
    const updatedDraft = {
      ...draft,
      temperature: 0.7,
      contextLength: 8000,
      streaming: true,
    };
    const keyToPass = apiKey === "••••••••••••••••" ? undefined : apiKey;
    await saveProvider(updatedDraft, keyToPass);
    setDraft(updatedDraft);
    if (apiKey !== "") {
      setApiKey("••••••••••••••••");
    }
    await testProvider(updatedDraft.id);
  };

  const handleExportWithValidation = async () => {
    if (!exportPassphrase) return;
    if (exportPassphrase.length > 64) {
      setBackupError("Passphrase must be 64 characters or less.");
      return;
    }
    setBackupError(null);
    await handleExport();
  };

  const handleImportWithValidation = async () => {
    if (!importFile || !importPassphrase) return;
    if (importPassphrase.length > 64) {
      setBackupError("Passphrase must be 64 characters or less.");
      return;
    }
    if (activeWorkout) {
      const confirmImport = window.confirm(
        "You have a workout session in progress. Importing a profile will replace your entire database, which will discard your current active workout. Do you want to continue?"
      );
      if (!confirmImport) return;
    }
    setBackupError(null);
    try {
      await handleImport();
    } catch (e: any) {
      setBackupError(e.message || "Failed to import profile.");
    }
  };

  // Helper flags
  const isSaved = useMemo(() => {
    return draft ? providers.some((p) => p.id === draft.id) : false;
  }, [providers, draft]);

  const isActive = useMemo(() => {
    return draft ? activeProviderId === draft.id : false;
  }, [activeProviderId, draft]);

  // Dynamic Anthropometrics Computations
  const calculatedBmi = useMemo(() => {
    const w = draftProfile.weight;
    const h = draftProfile.height;
    if (!w || !h) return null;

    const unit = draftProfile.weightUnit ?? weightUnit;
    const hUnit = draftProfile.heightUnit ?? heightUnit;

    const weightInKg = unit === "lbs" ? w / 2.20462 : w;
    const heightInMeters = hUnit === "in" ? (h * 2.54) / 100 : h / 100;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);

    let classification = "Normal";
    let color = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    if (bmiValue < 18.5) {
      classification = "Underweight";
      color = "text-yellow-400 border-yellow-500/20 bg-yellow-500/5";
    } else if (bmiValue < 25) {
      classification = "Normal Range";
      color = "text-emerald-400 border-emerald-500/20 bg-emerald-500/5";
    } else if (bmiValue < 30) {
      classification = "Overweight";
      color = "text-orange-400 border-orange-500/20 bg-orange-500/5";
    } else {
      classification = "Obese Range";
      color = "text-red-400 border-red-500/20 bg-red-500/5";
    }

    return {
      value: bmiValue.toFixed(1),
      classification,
      color,
    };
  }, [draftProfile.weight, draftProfile.height, draftProfile.heightUnit, draftProfile.weightUnit, heightUnit, weightUnit]);

  // Expandable Physiological Improvement Advisor
  const bmiAdvice = useMemo(() => {
    const w = draftProfile.weight;
    const h = draftProfile.height;
    if (!w || !h) return null;

    const unit = draftProfile.weightUnit ?? weightUnit;
    const hUnit = draftProfile.heightUnit ?? heightUnit;

    const weightInKg = unit === "lbs" ? w / 2.20462 : w;
    const heightInMeters = hUnit === "in" ? (h * 2.54) / 100 : h / 100;
    const bmiValue = weightInKg / (heightInMeters * heightInMeters);

    if (bmiValue < 18.5) {
      return {
        title: "Anabolic Recovery Strategy",
        tips: [
          "Caloric Hypertrophy: Maintain a structured daily caloric surplus (+300 to +500 kcal/day) focusing on high-quality nutrient-dense foods (avocados, eggs, nuts, whole grains, and lean meats).",
          "Progressive Overload: Focus on fundamental compound strength movements (squats, chest press, deadlifts) with longer rest intervals (2-3 mins) to stimulate myofibrillar growth.",
          "Restrict Excess Cardio: Limit high-intensity conditioning or long cardio blocks to minimize unnecessary metabolic burn and preserve energy for muscle synthesis.",
          "Sleep & Recovery: Prioritize 8-9 hours of consistent, quality sleep to optimize natural hormone levels and deep tissue cell repair."
        ],
        badge: "Underweight Insight",
        color: "border-amber-500/15 dark:border-amber-500/20 bg-amber-500/5 dark:bg-amber-950/20",
        titleColor: "text-amber-800 dark:text-amber-300",
        badgeColor: "bg-amber-500/10 dark:bg-white/10 text-amber-700 dark:text-zinc-300"
      };
    } else if (bmiValue < 25) {
      return {
        title: "Composition Preservation Strategy",
        tips: [
          "Sustain Progressive Loading: Your cellular composition is optimal. Continue gradual progressive overload (intensity/volume) to advance muscle density.",
          "Optimal Protein Target: Fuel active cell repair with 0.8g to 1.2g of protein per lb of bodyweight to maintain and build lean body mass.",
          "Active Rest Modalities: Include brief mobility flows, stretching, or light Zone 1/2 cardio on rest days to enhance circulation and lower cumulative fatigue."
        ],
        badge: "Optimal Range",
        color: "border-emerald-500/15 dark:border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-950/20",
        titleColor: "text-emerald-800 dark:text-emerald-400",
        badgeColor: "bg-emerald-500/10 dark:bg-white/10 text-emerald-700 dark:text-zinc-300"
      };
    } else if (bmiValue < 30) {
      return {
        title: "Body Recomposition & LISS Strategy",
        tips: [
          "Targeted Caloric Deficit: Maintain a moderate, sustainable caloric deficit (-250 to -400 kcal/day) while keeping protein intake elevated to safeguard active lean tissues.",
          "Aerobic Conditioning: Incorporate 3 weekly LISS blocks (walking, stationary cycling, elliptical) in Zone 2 (60-70% max HR) to maximize fat oxidation.",
          "Joint Integrity Protection: Target moderate lifting loads with clean, controlled tempos, minimizing heavy spinal axial loading if experiencing joint friction."
        ],
        badge: "Recomposition Guide",
        color: "border-orange-500/15 dark:border-orange-500/20 bg-orange-500/5 dark:bg-orange-950/20",
        titleColor: "text-orange-800 dark:text-orange-400",
        badgeColor: "bg-orange-500/10 dark:bg-white/10 text-orange-700 dark:text-zinc-300"
      };
    } else {
      return {
        title: "CNS Load & Joint Preservation Strategy",
        tips: [
          "Guided Load Isolation: Prioritize machine-based compound exercises and seated lifts to isolate muscle groups while avoiding excessive spinal or joint pressure.",
          "Non-Impact Cardio: Utilize swimming, rowing, or low-resistance stationary cycling to build aerobic capacity with zero lower-body joint impact.",
          "Consistent Hydration & CNS Rest: Drink 3L+ of water daily and ensure at least 48 hours of spacing between heavy training sessions to promote recovery."
        ],
        badge: "Joint Safety Protocol",
        color: "border-rose-500/15 dark:border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/20",
        titleColor: "text-rose-800 dark:text-rose-400",
        badgeColor: "bg-rose-500/10 dark:bg-white/10 text-rose-700 dark:text-zinc-300"
      };
    }
  }, [draftProfile.weight, draftProfile.height, draftProfile.heightUnit, draftProfile.weightUnit, heightUnit, weightUnit]);

  const calculatedProtein = useMemo(() => {
    const w = draftProfile.weight;
    if (!w) return null;

    const unit = draftProfile.weightUnit ?? weightUnit;
    const weightInLbs = unit === "lbs" ? w : w * 2.20462;
    const physique = draftProfile.targetPhysique || "athletic";

    let multiplier = 1.0;
    if (physique === "shredded") multiplier = 1.2;
    else if (physique === "lean") multiplier = 1.1;
    else if (physique === "athletic") multiplier = 1.0;
    else if (physique === "toned") multiplier = 0.9;
    else if (physique === "bulky") multiplier = 1.0;

    const proteinTarget = weightInLbs * multiplier;
    return {
      value: Math.round(proteinTarget),
      multiplier: multiplier.toFixed(1),
    };
  }, [draftProfile.weight, draftProfile.targetPhysique, draftProfile.weightUnit, weightUnit]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto max-w-5xl space-y-4 sm:space-y-5 pb-28 pt-2 flex flex-col"
    >
      {/* ─── HEADER TITLE PANEL ─── */}
      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-3 select-none">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">Settings</h1>
          <p className="text-xs sm:text-xs text-zinc-400 font-medium">Profile, AI engine, storage &amp; preferences</p>
        </div>
      </section>

      {/* ─── HORIZONTAL TAB BAR (Mobile) / SIDE PANEL (Desktop) ─── */}

      {/* Mobile horizontal tabs */}
      <div className="flex md:hidden bg-surface border border-surface-border p-1 rounded-2xl select-none gap-1">
        {[
          { id: "profile", label: "Profile", icon: <User size={14} /> },
          { id: "ai", label: "AI Engine", icon: <Cpu size={14} /> },
          { id: "system", label: "System", icon: <Server size={14} /> },
        ].map((tab) => {
          const active = activeSettingsTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all whitespace-nowrap ${active
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-4 md:gap-6 items-start">
        {/* Desktop Sidebar Panel (hidden on mobile) */}
        <aside className="hidden md:flex w-56 shrink-0 md:sticky md:top-24 flex-col bg-surface border border-surface-border p-1.5 rounded-2xl select-none gap-1.5">
          {[
            { id: "profile", label: "Profile & Goals", icon: <User size={16} /> },
            { id: "ai", label: "AI Engine", icon: <Cpu size={16} /> },
            { id: "system", label: "System & Backup", icon: <Server size={16} /> },
          ].map((tab) => {
            const active = activeSettingsTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSettingsTab(tab.id as any)}
                className={`flex flex-row items-center gap-3 px-4 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all w-full justify-start whitespace-nowrap ${active
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                  }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </aside>

        {/* Right Main Settings Panel */}
        <div className="flex-1 w-full space-y-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSettingsTab}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="space-y-5"
            >
              {/* ─── PROFILE & BIOMETRICS TAB ─── */}
              {activeSettingsTab === "profile" && (
                <div className="space-y-5">
                  {/* Profile Card Summary */}
                  <Card className="relative overflow-hidden p-5 flex items-center gap-4 select-none">
                    <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
                    <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_8px_20px_rgba(16,185,129,0.2)] shrink-0">
                      <User size={26} className="text-zinc-950" />
                      <span className="absolute -bottom-1 -right-1 flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                      </span>
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-zinc-900 dark:text-white">{profile?.name ?? "Athlete"}</h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">{profile?.goal || "Goal not set"}</p>
                    </div>
                  </Card>

                  {/* Physical Biometrics Panel */}
                  <Card className="p-5 shadow-2xl space-y-5">
                    <div className="flex items-center justify-between border-b border-zinc-200 dark:border-white/5 pb-3">
                      <div className="flex items-center gap-2.5">
                        <Palette className="text-emerald-500 dark:text-emerald-400" size={18} />
                        <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">Biometric Inputs</h2>
                      </div>
                      <div className="flex items-center gap-1.5 select-none">
                        {saveIndicator === "saving" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-extrabold uppercase font-mono text-amber-600 dark:text-amber-300 border border-amber-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400 animate-pulse" />
                            Pending Save
                          </span>
                        )}
                        {saveIndicator === "saved" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-extrabold uppercase font-mono text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 animate-fade-in">
                            Saved
                          </span>
                        )}
                        {saveIndicator === "error" && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-xs font-extrabold uppercase font-mono text-rose-600 dark:text-rose-300 border border-rose-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-500 dark:bg-rose-400" />
                            Error
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                      <div className="sm:col-span-2">
                        <Field label="Full Name">
                          <Input
                            type="text"
                            maxLength={30}
                            value={draftProfile.name ?? ""}
                            onChange={(e) => handleProfileChange("name", e.target.value)}
                            className="text-xs font-medium"
                            placeholder="e.g. Jordan"
                          />
                        </Field>
                      </div>

                      <Field label="Age">
                        <Input
                          type="number"
                          min={13}
                          max={120}
                          value={draftProfile.age ?? ""}
                          onChange={(e) => handleProfileChange("age", Number(e.target.value))}
                          className="text-xs font-mono font-bold"
                        />
                      </Field>
                      <Field label="Target Physique">
                        <Select
                          value={draftProfile.targetPhysique ?? ""}
                          onChange={(e) => handleProfileChange("targetPhysique", e.target.value)}
                          className="text-xs font-bold"
                        >
                          {physiqueOptions.map(option => (
                            <option key={option} value={option}>{option.charAt(0).toUpperCase() + option.slice(1)}</option>
                          ))}
                        </Select>
                      </Field>

                      <Field label={`Weight (${weightUnit})`}>
                        <Input
                          type="number"
                          min={20}
                          max={1000}
                          value={draftProfile.weight ?? ""}
                          onChange={(e) => handleProfileChange("weight", Number(e.target.value))}
                          className="text-xs font-mono font-bold"
                        />
                      </Field>
                      <SegmentedSetting<WeightUnit>
                        label="Weight System"
                        value={draftProfile.weightUnit ?? weightUnit}
                        values={["lbs", "kg"]}
                        onChange={(value) => void handleWeightUnitChange(value)}
                      />

                      <Field label={`Height (${heightUnit === "in" ? "ft & in" : "cm"})`}>
                        {heightUnit === "in" ? (
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Feet</Label>
                              <Input
                                type="number"
                                min={2}
                                max={8}
                                value={draftProfile.height ? Math.floor(draftProfile.height / 12) : ""}
                                onChange={(e) => {
                                  const feet = Number(e.target.value);
                                  const inches = (draftProfile.height ?? 0) % 12;
                                  handleProfileChange("height", feet * 12 + inches);
                                }}
                                className="text-xs font-mono font-bold"
                              />
                            </div>
                            <div>
                              <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">Inches</Label>
                              <Input
                                type="number"
                                min={0}
                                max={11}
                                value={draftProfile.height ? Math.round(draftProfile.height % 12) : ""}
                                onChange={(e) => {
                                  const inches = Number(e.target.value);
                                  const feet = Math.floor((draftProfile.height ?? 0) / 12) || 5;
                                  handleProfileChange("height", feet * 12 + inches);
                                }}
                                className="text-xs font-mono font-bold"
                              />
                            </div>
                          </div>
                        ) : (
                          <Input
                            type="number"
                            min={20}
                            max={300}
                            value={draftProfile.height ?? ""}
                            onChange={(e) => handleProfileChange("height", Number(e.target.value))}
                            className="text-xs font-mono font-bold"
                          />
                        )}
                      </Field>
                      <SegmentedSetting<HeightUnit>
                        label="Height System"
                        value={draftProfile.heightUnit ?? heightUnit}
                        values={["in", "cm"]}
                        onChange={(value) => void handleHeightUnitChange(value)}
                      />
                    </div>

                    <div className="space-y-4 pt-1">
                      <Field label="Dietary Preferences">
                        <Input
                          value={draftProfile.dietaryPreferences ?? ""}
                          maxLength={200}
                          onChange={(e) => handleProfileChange("dietaryPreferences", e.target.value)}
                          placeholder="e.g. Vegetarian, Gluten-free, no peanuts"
                          className="text-xs font-medium"
                        />
                      </Field>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Field label="Injuries / Limitations">
                          <Input
                            value={draftProfile.injuries ?? ""}
                            maxLength={100}
                            onChange={(e) => handleProfileChange("injuries", e.target.value)}
                            placeholder="e.g. Lower back pain, bad knees"
                            className="text-xs font-medium"
                          />
                        </Field>
                        <Field label="Workout Duration (min)">
                          <Input
                            type="number"
                            min={15}
                            max={180}
                            value={draftProfile.workoutDuration ?? ""}
                            onChange={(e) => handleProfileChange("workoutDuration", e.target.value ? Number(e.target.value) : undefined)}
                            placeholder="e.g. 60"
                            className="text-xs font-mono font-bold"
                          />
                        </Field>
                      </div>
                    </div>
                    {profileError && <p className="text-xs text-rose-400 font-medium font-mono">{profileError}</p>}
                  </Card>

                  {/* Training Configuration Card */}
                  <Card className="p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-card-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <Dumbbell className="text-emerald-500 dark:text-emerald-400" size={18} />
                        <h2 className="text-base font-bold text-foreground tracking-tight">Training Configuration</h2>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Field label="Workout Goal" hint="Custom focus target used by the AI coach to generate and adapt your routine">
                        <Input
                          value={draftProfile.goal ?? draftProfile.customGoal ?? ""}
                          maxLength={120}
                          onChange={(e) => {
                            handleProfileChange("goal", e.target.value);
                            handleProfileChange("customGoal", e.target.value);
                          }}
                          placeholder="e.g. Build muscle size, increase bench press, run twice a week"
                          className="text-xs font-medium"
                        />
                      </Field>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Field label="Training Methodology">
                          <Select
                            value={draftProfile.trainingStyle ?? "general"}
                            onChange={(e) => handleProfileChange("trainingStyle", e.target.value)}
                            className="text-xs font-bold font-sans"
                          >
                            <option value="general">General Fitness</option>
                            <option value="strength">Strength Focus</option>
                            <option value="hypertrophy">Hypertrophy (Size)</option>
                            <option value="powerbuilding">Powerbuilding</option>
                            <option value="endurance">Endurance</option>
                          </Select>
                        </Field>

                        <Field label="Weekly Frequency (Days/Week)">
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            value={draftProfile.daysPerWeek ?? ""}
                            onChange={(e) => handleProfileChange("daysPerWeek", e.target.value ? Number(e.target.value) : undefined)}
                            className="text-xs font-mono font-bold"
                          />
                        </Field>

                        <Field label="Equipment Available">
                          <Select
                            value={draftProfile.equipment ?? "full gym"}
                            onChange={(e) => handleProfileChange("equipment", e.target.value)}
                            className="text-xs font-bold font-sans"
                          >
                            <option value="full gym">Full Gym</option>
                            <option value="home gym">Home Gym</option>
                            <option value="bodyweight">Bodyweight Only</option>
                          </Select>
                        </Field>

                        <Field label="Lifting Experience">
                          <Select
                            value={draftProfile.experience ?? "intermediate"}
                            onChange={(e) => handleProfileChange("experience", e.target.value)}
                            className="text-xs font-bold font-sans"
                          >
                            <option value="beginner">Beginner (Under 1 yr)</option>
                            <option value="intermediate">Intermediate (1-3 yrs)</option>
                            <option value="advanced">Advanced (3+ yrs)</option>
                          </Select>
                        </Field>

                        <Field label="Body Type">
                          <Select
                            value={draftProfile.bodyType ?? "mesomorph"}
                            onChange={(e) => handleProfileChange("bodyType", e.target.value)}
                            className="text-xs font-bold font-sans"
                          >
                            <option value="ectomorph">Ectomorph (Naturally lean/narrow)</option>
                            <option value="mesomorph">Mesomorph (Naturally athletic/muscular)</option>
                            <option value="endomorph">Endomorph (Broad/sturdy frame)</option>
                          </Select>
                        </Field>
                      </div>
                    </div>
                  </Card>

                  {/* Dynamic Health Widgets Panel */}
                  {(calculatedBmi || calculatedProtein) && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
                        <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Physique Metrics</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {calculatedBmi && (
                          <div className="p-4 rounded-2xl border border-surface-border bg-surface space-y-2 select-none shadow-xl flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-extrabold uppercase font-mono tracking-widest text-zinc-500">Live Telemetry</span>
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-1 leading-none">Body Mass Index (BMI)</h4>
                            </div>

                            <div className="py-2 flex items-baseline gap-2">
                              <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono leading-none">{calculatedBmi.value}</span>
                              <span className={`text-xs font-extrabold uppercase px-2 py-0.5 rounded border ${calculatedBmi.color}`}>
                                {calculatedBmi.classification}
                              </span>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                              Estimated tissue mass calculations. Values between 18.5 and 24.9 reflect standard health ranges.
                            </p>

                            {/* BMI Improvement Action Guide Toggle Button */}
                            {bmiAdvice && (
                              <div className="pt-1.5 border-t border-white/5 mt-2">
                                <button
                                  type="button"
                                  onClick={() => setShowBmiGuidance(!showBmiGuidance)}
                                  className="w-full flex items-center justify-between text-xs font-bold text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 bg-surface border border-surface-border px-2.5 py-1.5 rounded-xl transition duration-200"
                                >
                                  <span>{showBmiGuidance ? "Hide Strategy Details" : `How to Improve (${calculatedBmi.classification} Strategy)`}</span>
                                  <Info size={14} className="text-zinc-500" />
                                </button>

                                <AnimatePresence>
                                  {showBmiGuidance && (
                                    <motion.div
                                      initial={{ opacity: 0, height: 0 }}
                                      animate={{ opacity: 1, height: "auto" }}
                                      exit={{ opacity: 0, height: 0 }}
                                      className="overflow-hidden pt-2"
                                    >
                                      <div className={`p-3 rounded-xl border ${bmiAdvice.color} text-xs leading-relaxed space-y-1.5`}>
                                        <div className="flex justify-between items-center select-none mb-1">
                                          <span className={`font-extrabold uppercase tracking-wide ${bmiAdvice.titleColor}`}>{bmiAdvice.title}</span>
                                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded uppercase font-mono ${bmiAdvice.badgeColor}`}>
                                            {bmiAdvice.badge}
                                          </span>
                                        </div>
                                        <ul className="list-disc pl-3.5 space-y-1 text-zinc-700 dark:text-zinc-300 font-medium">
                                          {bmiAdvice.tips.map((tip, idx) => (
                                            <li key={idx} className="leading-snug">{tip}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )}
                          </div>
                        )}

                        {calculatedProtein && (
                          <div className="p-4 rounded-2xl border border-surface-border bg-surface space-y-2 select-none shadow-xl flex flex-col justify-between">
                            <div>
                              <span className="text-xs font-extrabold uppercase font-mono tracking-widest text-zinc-500">Optimal Fueling</span>
                              <h4 className="text-sm font-bold text-zinc-900 dark:text-white mt-1 leading-none">Daily Protein Target</h4>
                            </div>

                            <div className="py-2.5 flex items-baseline gap-1.5">
                              <span className="text-3xl font-black text-zinc-900 dark:text-white font-mono leading-none">{calculatedProtein.value}</span>
                              <span className="text-xs font-extrabold text-zinc-500 dark:text-zinc-400 font-mono">g / day</span>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                              Calculated at <span className="text-zinc-900 dark:text-white font-extrabold font-mono">{calculatedProtein.multiplier}g</span> per lb of bodyweight to promote active muscle cell restoration for a <span className="text-zinc-900 dark:text-white font-bold">{draftProfile.targetPhysique || "athletic"}</span> profile.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ─── AI INTELLIGENCE TAB ─── */}
              {activeSettingsTab === "ai" && (
                <div className="space-y-5">
                  <Card className="p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-card-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <Cpu className="text-purple-600 dark:text-purple-400" size={18} />
                        <h2 className="text-base font-bold text-foreground tracking-tight">AI Adapter Cloud Grid</h2>
                      </div>
                    </div>

                    {/* API brand cards grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 select-none">
                      {providerTypes.map((type) => {
                        const config = providerConfig[type] || providerConfig.custom;
                        const active = selectedType === type;
                        const savedProvider = providers.find((p) => p.type === type);
                        const isDefaultActive = savedProvider && activeProviderId === savedProvider.id;
                        return (
                          <button
                            type="button"
                            className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all duration-300 hover:scale-[1.02] ${active
                                ? `bg-gradient-to-br ${config.gradient} shadow-lg`
                                : "border-surface-border bg-surface text-zinc-650 hover:text-zinc-955 dark:text-zinc-400 dark:hover:text-zinc-100"
                              }`}
                            key={type}
                            onClick={() => handleSelectType(type)}
                          >
                            {isDefaultActive && (
                              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-400 shadow-[0_0_8px_#c084fc] animate-pulse" />
                            )}
                            <div className={`text-xs font-black tracking-tight leading-none ${active ? config.text : "text-zinc-700 dark:text-zinc-300"}`}>
                              {config.label}
                            </div>
                            <div className="text-xs text-zinc-500 mt-1.5 uppercase tracking-wider font-mono leading-none">
                              {type}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {draft && (
                      <div className="space-y-4 pt-1">
                        {/* Setup Guides */}
                        {(() => {
                          const helper = getProviderInstructions(draft.type);
                          if (!helper) return null;
                          return (
                            <Surface className="p-3.5 bg-purple-500/5 dark:bg-purple-950/10 border border-purple-500/10 dark:border-purple-500/20 text-zinc-700 dark:text-zinc-300 rounded-2xl space-y-2">
                              <div className="flex items-center gap-2">
                                <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/10 dark:bg-purple-500/15 text-purple-700 dark:text-purple-400">
                                  <Sparkles size={11} className="stroke-[2.5]" />
                                </div>
                                <span className="text-xs font-extrabold uppercase tracking-widest text-purple-700 dark:text-purple-400 font-mono">
                                  {helper.title} Steps
                                </span>
                              </div>
                              <ol className="list-decimal pl-4 text-xs text-zinc-600 dark:text-zinc-400 space-y-1 font-medium">
                                {helper.steps.map((st, i) => (
                                  <li key={i} className="leading-relaxed">{st}</li>
                                ))}
                              </ol>
                              {helper.url && (
                                <a
                                  href={helper.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-block text-xs font-bold text-purple-655 hover:text-purple-750 dark:text-purple-400 dark:hover:text-purple-300 underline underline-offset-2 transition"
                                >
                                  Go to Console Website →
                                </a>
                              )}
                            </Surface>
                          );
                        })()}

                        {/* Endpoint config form */}
                        {(draft.type === "custom" || draft.type === "ollama" || draft.type === "lmstudio") && (
                          <Field label="Base URL" hint={providerHints.baseUrl}>
                            <Input
                              maxLength={200}
                              value={draft.baseUrl ?? ""}
                              onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
                              placeholder="e.g. http://localhost:11434"
                              className="text-xs font-mono font-bold"
                            />
                          </Field>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                          <Field label="Model" hint={providerHints.model}>
                            <Select
                              value={draft.model}
                              onChange={(event) => setDraft({ ...draft, model: event.target.value })}
                              disabled={modelsLoading || !!modelsError || models.length === 0}
                              className="text-xs font-bold"
                            >
                              {modelsLoading && <option>Loading models...</option>}
                              {modelsError && <option>{modelsError}</option>}
                              {!modelsLoading && !modelsError && models.length === 0 && <option>No models found</option>}
                              {models.length > 0 && models.map((model) => (
                                <option value={model} key={model}>
                                  {model}
                                </option>
                              ))}
                            </Select>
                          </Field>

                          {draft.type !== "ollama" && draft.type !== "lmstudio" && (
                            <Field label="API Key" hint={providerHints.apiKey}>
                              <div className="relative">
                                <Input
                                  type={showApiKey ? "text" : "password"}
                                  maxLength={500}
                                  value={apiKey}
                                  onChange={(event) => setApiKey(event.target.value)}
                                  placeholder={draft.apiKey ? "Stored securely" : "Paste key"}
                                  className="text-xs font-mono pr-10"
                                />
                                <button
                                  type="button"
                                  onClick={() => setShowApiKey(!showApiKey)}
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                >
                                  {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                                </button>
                              </div>
                            </Field>
                          )}
                        </div>

                        {aiError && <p className="text-xs text-rose-400 font-medium font-mono">{aiError}</p>}

                        {/* Terminals Console Log */}
                        {draft.lastStatus ? (
                          <div className="rounded-2xl border border-zinc-800 bg-black/50 p-4 font-mono text-xs shadow-inner relative overflow-hidden backdrop-blur-md keep-dark">
                            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500/20 to-transparent" />

                            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2 select-none">
                              <div className="flex items-center gap-1.5">
                                <span className={`h-2 w-2 rounded-full ${draft.lastStatus === "ok" ? "bg-emerald-500 shadow-[0_0_8px_#10b981] animate-pulse" : "bg-rose-500 shadow-[0_0_8px_#f43f5e]"
                                  }`} />
                                <span className="text-zinc-500 uppercase font-black text-xs tracking-widest font-mono">system.adapter.diagnostics</span>
                              </div>
                              <span className="text-zinc-600 text-xs font-bold">
                                {draft.lastTestedAt ? new Date(draft.lastTestedAt).toLocaleTimeString() : ""}
                              </span>
                            </div>

                            <div className="space-y-1.5 text-zinc-300">
                              <p className="flex items-center gap-1">
                                <span className="text-purple-400 font-bold">$</span>
                                <span>ping -c 1 {draft.baseUrl || defaultBaseUrls[draft.type]}</span>
                              </p>
                              <p className="pl-3.5 text-zinc-600">PING {draft.baseUrl || defaultBaseUrls[draft.type]} (56 bytes)...</p>

                              <p className="flex items-center gap-1 mt-1">
                                <span className="text-purple-400 font-bold">$</span>
                                <span>curl -X POST -H "Authorization: Bearer ****" -d "validate"</span>
                              </p>

                              {draft.lastError ? (
                                <div className="pl-3.5 mt-1 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                                  <p className="text-rose-400 font-bold leading-normal">[ERROR] Connection Failure</p>
                                  <p className="text-zinc-400 text-xs mt-0.5 leading-relaxed">{draft.lastError}</p>
                                </div>
                              ) : (
                                <div className="pl-3.5 space-y-0.5">
                                  <p className="text-emerald-400 font-bold">[SUCCESS] Adapter channel online.</p>
                                  <p className="text-zinc-400 text-xs">
                                    &gt; Model target: <span className="text-zinc-200 font-bold">{draft.model}</span>
                                  </p>
                                  <p className="text-zinc-400 text-xs">
                                    &gt; Handshake validation verified successfully.
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        ) : null}

                        {/* Connection controller buttons */}
                        <div className="flex flex-wrap gap-2 border-t border-white/5 pt-3 select-none">
                          <Button
                            variant={isActive ? "secondary" : "primary"}
                            icon={<Save size={15} />}
                            onClick={handleSaveProvider}
                            title={providerHints.save}
                            className="h-10 sm:h-8 text-xs sm:text-xs font-bold uppercase"
                          >
                            {isSaved ? (isActive ? "Update Provider" : "Update & Activate") : "Save & Activate"}
                          </Button>
                          <Button
                            icon={<LinkIcon size={15} />}
                            disabled={providerBusy}
                            onClick={handleTestProvider}
                            title={providerHints.test}
                            className="h-10 sm:h-8 text-xs sm:text-xs font-bold uppercase"
                          >
                            Test Connection
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {/* ─── SYSTEM, STORAGE & BACKUPS TAB (Unified Panel) ─── */}
              {activeSettingsTab === "system" && (
                <div className="space-y-5">
                  {/* Preferences and Database Statistics */}
                  <Card className="p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-card-border pb-3">
                      <div className="flex items-center gap-2.5">
                        <Server className="text-orange-500 dark:text-orange-400" size={18} />
                        <h2 className="text-base font-bold text-foreground tracking-tight">App Preferences &amp; Storage Telemetry</h2>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-3 border-b border-white/5 select-none">
                      <SegmentedSetting<ThemeMode>
                        label="App Display Theme"
                        value={theme}
                        values={["dark", "light", "system"]}
                        onChange={(value) => void setTheme(value)}
                      />
                      <SegmentedSetting<string>
                        label="Experience Mode"
                        value={guidedMode ? "guided" : "advanced"}
                        values={["guided", "advanced"]}
                        onChange={(value) => void setGuidedMode(value === "guided")}
                      />
                    </div>

                    {/* Local Storage database statistics engine */}
                    <div className="rounded-2xl border border-card-border bg-surface p-4 shadow-xl space-y-3">
                      <button
                        type="button"
                        onClick={() => setShowDbStats(!showDbStats)}
                        className="w-full flex items-center justify-between border-b border-white/5 pb-2 select-none text-left"
                      >
                        <div className="flex items-center gap-2">
                          <Database className="text-orange-400" size={15} />
                          <span className="text-xs font-black uppercase tracking-widest font-mono text-zinc-400">System &amp; Database Diagnostic Logs</span>
                        </div>
                        <span className="text-xs text-zinc-500 font-bold">{showDbStats ? "Hide" : "Show"}</span>
                      </button>

                      <AnimatePresence>
                        {showDbStats && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 text-xs leading-normal select-none pt-2">
                              <div className="bg-surface p-3 rounded-xl border border-surface-border">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono leading-none">Logged Sessions</span>
                                <span className="text-base font-black text-zinc-900 dark:text-white font-mono mt-1.5 block leading-none">{workouts.length}</span>
                              </div>
                              <div className="bg-surface p-3 rounded-xl border border-surface-border">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono leading-none">Completed Sets</span>
                                <span className="text-base font-black text-zinc-900 dark:text-white font-mono mt-1.5 block leading-none">
                                  {workouts.reduce((sum, w) => sum + w.exercises.reduce((es, e) => es + e.sets.filter(s => s.completed).length, 0), 0)}
                                </span>
                              </div>
                              <div className="bg-surface p-3 rounded-xl border border-surface-border">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono leading-none">Subjective CNS logs</span>
                                <span className="text-base font-black text-zinc-900 dark:text-white font-mono mt-1.5 block leading-none">{recoveryLogs.length}</span>
                              </div>
                              <div className="bg-surface p-3 rounded-xl border border-surface-border">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono leading-none">AI Threads logged</span>
                                <span className="text-base font-black text-zinc-900 dark:text-white font-mono mt-1.5 block leading-none">{aiMessages.length}</span>
                              </div>
                              <div className="bg-surface p-3 rounded-xl border border-surface-border">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono leading-none">AI Coach Queries</span>
                                <span className="text-base font-black text-zinc-900 dark:text-white font-mono mt-1.5 block leading-none">
                                  {apiCallCount || 0}
                                </span>
                              </div>
                              <div className="bg-surface p-3 rounded-xl border border-surface-border">
                                <span className="block text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono leading-none">AI Tokens Used</span>
                                <span className="text-base font-black text-zinc-900 dark:text-white font-mono mt-1.5 block leading-none">
                                  {(tokenCount || 0).toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 pt-1 select-none">
                      {/* Notifications permission */}
                      <Surface className="flex items-center justify-between gap-4 p-3.5 shadow">
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white text-xs">App Notifications</p>
                          <p className="text-xs text-zinc-500 mt-1 font-medium">State: <span className="font-mono text-zinc-600 dark:text-zinc-400 font-bold uppercase">{notificationStatus}</span></p>
                        </div>
                        <Button
                          size="icon"
                          variant="secondary"
                          aria-label="Enable notifications"
                          className="rounded-xl h-10 w-10 sm:h-8 sm:w-8 p-0"
                          onClick={async () => {
                            if (!("Notification" in window)) {
                              setNotificationStatus("Unsupported");
                              return;
                            }
                            const permission = await Notification.requestPermission();
                            setNotificationStatus(permission);
                          }}
                        >
                          <Bell size={15} />
                        </Button>
                      </Surface>

                      {/* Hard factory reset alert block */}
                      <Surface className="flex items-center justify-between gap-4 border border-rose-500/20 bg-rose-500/5 p-3.5 rounded-2xl shadow-xl">
                        <div>
                          <p className="font-bold text-rose-400 text-xs">Hard Factory Reset</p>
                          <p className="text-xs text-rose-500/70 mt-1 font-semibold">Irreversible local database loss</p>
                        </div>
                        <Button
                          size="icon"
                          variant="danger"
                          aria-label="Reset local data"
                          className="rounded-xl h-10 w-10 sm:h-8 sm:w-8"
                          onClick={() => {
                            const warningMsg = activeWorkout
                              ? "You have a workout session in progress. Performing a factory reset will discard your active workout and permanently delete all custom workouts, body metrics, and messages. Are you sure you want to proceed?"
                              : "Are you sure you want to restore original seeded data? All custom workouts, body metrics, and messages will be permanently deleted.";
                            if (window.confirm(warningMsg)) {
                              void resetLocalData();
                            }
                          }}
                        >
                          <RefreshCcw size={15} />
                        </Button>
                      </Surface>
                    </div>
                  </Card>

                  {/* Backup Vault Panel */}
                  <Card className="p-5 space-y-5">
                    <div className="flex items-center justify-between border-b border-card-border pb-3 select-none">
                      <div className="flex items-center gap-2.5">
                        <Shield className="text-blue-500 dark:text-blue-400" size={18} />
                        <h2 className="text-base font-bold text-foreground tracking-tight">Encrypted Profile Backups</h2>
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      {/* Export Box */}
                      <Surface className="flex flex-col justify-between p-4 rounded-2xl select-none">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest font-sans">Export training database</Label>
                          <div className="relative">
                            <Input
                              type={showExportPassphrase ? "text" : "password"}
                              maxLength={64}
                              value={exportPassphrase}
                              onChange={(event) => setExportPassphrase(event.target.value)}
                              placeholder="Set encryption passphrase"
                              className="text-xs font-medium pr-10 font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => setShowExportPassphrase(!showExportPassphrase)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showExportPassphrase ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                        <Button
                          className="mt-4 w-full h-11 sm:h-9 text-sm sm:text-xs font-bold uppercase font-sans"
                          variant="primary"
                          icon={<Download size={15} />}
                          disabled={!exportPassphrase}
                          onClick={handleExportWithValidation}
                        >
                          Export Encrypted JSON
                        </Button>
                      </Surface>

                      {/* Import Box */}
                      <Surface className="flex flex-col justify-between p-4 rounded-2xl">
                        <div className="space-y-3">
                          <Label className="text-xs font-bold text-zinc-500 uppercase tracking-widest select-none font-sans">Import Backup File</Label>
                          <div className="relative">
                            <input
                              type="file"
                              id="import-file-uploader"
                              accept="application/json"
                              onChange={(event: ChangeEvent<HTMLInputElement>) => setImportFile(event.target.files?.[0] ?? null)}
                              className="hidden"
                            />
                            <label
                              htmlFor="import-file-uploader"
                              className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-input-border hover:border-emerald-500/50 hover:bg-input-focus-bg rounded-xl bg-input py-3.5 px-3 text-xs font-bold uppercase tracking-wider text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition duration-205 cursor-pointer w-full text-center font-sans"
                            >
                              <Upload size={18} className="text-blue-400" />
                              <span className="truncate max-w-[180px] normal-case font-sans">{importFile ? importFile.name : "Select backup.json"}</span>
                            </label>
                          </div>

                          <div className="relative">
                            <Input
                              type={showImportPassphrase ? "text" : "password"}
                              maxLength={64}
                              value={importPassphrase}
                              onChange={(event) => setImportPassphrase(event.target.value)}
                              placeholder="Enter decrypt passphrase"
                              className="text-xs font-medium pr-10 font-sans"
                            />
                            <button
                              type="button"
                              onClick={() => setShowImportPassphrase(!showImportPassphrase)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              {showImportPassphrase ? <EyeOff size={15} /> : <Eye size={15} />}
                            </button>
                          </div>
                        </div>
                        <Button
                          className="w-full mt-4 h-11 sm:h-9 text-sm sm:text-xs font-bold uppercase font-sans"
                          icon={<Upload size={15} />}
                          disabled={!importFile || !importPassphrase}
                          onClick={handleImportWithValidation}
                        >
                          Import Decrypted profile
                        </Button>
                      </Surface>
                    </div>
                    {backupError && <p className="text-xs text-rose-400 font-medium font-mono">{backupError}</p>}
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5 select-none">
        <Label className="mb-0 text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</Label>
        {hint && (
          <span title={hint} className="cursor-help text-zinc-500 hover:text-zinc-300 transition-colors">
            <Info size={14} />
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function SegmentedSetting<T extends string>({
  label,
  value,
  values,
  onChange,
}: {
  label: string;
  value: T;
  values: T[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 mb-0">{label}</Label>
      <div className="relative grid gap-1 rounded-xl border border-surface-border bg-surface p-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((item) => {
          const active = item === value;
          return (
            <button
              type="button"
              className={`relative z-10 rounded-lg py-1.5 text-xs font-bold capitalize transition-colors duration-200 ${active ? "text-white-keep" : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              key={item}
              onClick={() => onChange(item)}
            >
              {active && (
                <motion.span
                  layoutId={`active-segmented-${label}`}
                  className="absolute inset-0 rounded-lg bg-emerald-500"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <span className="relative z-20">{item === "in" ? "ft & in" : item}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}