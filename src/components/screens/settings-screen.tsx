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
          "Sign in using your account credentials.",
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
          "Click on your profile or Keys in the top-right menu.",
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
  const testProvider = useAtlasStore((state) => state.testProvider);
  const exportEncryptedProfile = useAtlasStore((state) => state.exportEncryptedProfile);
  const importEncryptedProfile = useAtlasStore((state) => state.importEncryptedProfile);
  const resetLocalData = useAtlasStore((state) => state.resetLocalData);
  const providerBusy = useAtlasStore((state) => state.providerBusy);
  const updateProfile = useAtlasStore((state) => state.updateProfile);
  const activeWorkout = useAtlasStore((state) => state.activeWorkout);

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

  const [initialized, setInitialized] = useState(false);
  const [selectedType, setSelectedType] = useState<AiProviderSettings["type"]>("openai");
  const [draft, setDraft] = useState<AiProviderSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("Not enabled");

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
      // Synchronize statuses without overriding local edits
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

      // No key required for Ollama or LM Studio by default
      if (!apiKey && draft.type !== "ollama" && draft.type !== "lmstudio") {
        setModelsError("Enter API key to load models");
        setModels([]);
        return;
      }

      setModelsLoading(true);
      setModelsError(null);
      try {
        const adapter = getProviderAdapter(draft.type);
        const modelList = await adapter.listModels(draft, apiKey);
        setModels(modelList.map((m) => m.id));
      } catch (error: any) {
        console.error("Failed to fetch models:", error);
        setModelsError(error.message || "Failed to load models");
        setModels([]);
      } finally {
        setModelsLoading(false);
      }
    }
    void fetchModels();
  }, [draft, apiKey]);

  // Debounced auto-save for profile biometrics
  useEffect(() => {
    if (!draftProfile || Object.keys(draftProfile).length === 0) return;

    // Check if the draft profile differs from the active profile
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

      if (
        isNaN(age) || age < 13 || age > 120 ||
        isNaN(weight) || weight < 20 || weight > 1000 ||
        isNaN(height) || height < 20 || height > 300 ||
        (draftProfile.workoutDuration !== undefined && (isNaN(duration) || duration < 15 || duration > 180)) ||
        diet.length > 200 || injuries.length > 100
      ) {
        setSaveIndicator("error");
        setProfileError("Invalid biometrics values.");
        return;
      }

      try {
        setProfileError(null);
        await updateProfile(draftProfile);
        setSaveIndicator("saved");
      } catch (err) {
        setSaveIndicator("error");
        setProfileError("Failed to auto-save biometrics.");
      }
    }, 1000); // 1s debounce

    return () => clearTimeout(timer);
  }, [draftProfile, profile, updateProfile]);

  // Handle switching AI tabs
  const handleSelectType = (type: AiProviderSettings["type"]) => {
    setSelectedType(type);
    const existing = providers.find((p) => p.type === type);
    if (existing) {
      setDraft({ ...existing });
    } else {
      setDraft(defaultDraftForType(type));
    }
    setApiKey(""); // Reset plain API key input field
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
    await saveProvider(updatedDraft, apiKey);
    setDraft(updatedDraft);
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
    await saveProvider(updatedDraft, apiKey);
    setDraft(updatedDraft);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mx-auto max-w-xl space-y-6 pb-28 pt-2"
    >
      <section>
        <p className="text-sm text-zinc-500 uppercase tracking-widest font-semibold font-mono">Preferences</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Settings</h1>
      </section>

      {/* Header Card with profile metadata */}
      <Card className="relative overflow-hidden p-6 shadow-2xl">
        <div className="absolute -right-16 -top-16 h-36 w-36 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-zinc-950 shadow-lg shadow-emerald-500/10">
            <User size={26} className="text-zinc-950" />
            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-input border border-card-border">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
            </span>
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight text-foreground">{profile?.name ?? "Athlete"}</h2>
            <p className="text-sm text-zinc-400 font-medium mt-0.5">{profile?.goal || "Fitness Goal Not Configured"}</p>
          </div>
        </div>
      </Card>

      {/* Biometrics Card with debounced autosaving */}
      <Card className="p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-card-border pb-3">
          <div className="flex items-center gap-2.5">
            <Palette className="text-emerald-400" size={20} />
            <h2 className="text-lg font-bold text-foreground tracking-tight">Profile &amp; Biometrics</h2>
          </div>
          <div className="flex items-center gap-1.5">
            {saveIndicator === "saving" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                Saving...
              </span>
            )}
            {saveIndicator === "saved" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Autosaved
              </span>
            )}
            {saveIndicator === "error" && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold text-rose-300 border border-rose-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Validation Error
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 animate-fadeIn">
          <Field label="Age">
            <Input
              type="number"
              min={13}
              max={120}
              value={draftProfile.age ?? ""}
              onChange={(e) => handleProfileChange("age", Number(e.target.value))}
            />
          </Field>
          <Field label="Target Physique">
            <Select
              value={draftProfile.targetPhysique ?? ""}
              onChange={(e) => handleProfileChange("targetPhysique", e.target.value)}
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
            />
          </Field>
          <SegmentedSetting<WeightUnit>
            label="Weight System"
            value={weightUnit}
            values={["lbs", "kg"]}
            onChange={(value) => void setWeightUnit(value)}
          />

          <Field label={`Height (${heightUnit === "in" ? "ft & in" : "cm"})`}>
            {heightUnit === "in" ? (
              <div className="grid grid-cols-2 gap-2 animate-fadeIn">
                <div>
                  <Label className="text-[10px] text-zinc-500">Feet</Label>
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
                  />
                </div>
                <div>
                  <Label className="text-[10px] text-zinc-500">Inches</Label>
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
              />
            )}
          </Field>
          <SegmentedSetting<HeightUnit>
            label="Height System"
            value={heightUnit}
            values={["in", "cm"]}
            onChange={(value) => void setHeightUnit(value)}
          />
        </div>
        <div className="space-y-4">
          <Field label="Dietary Preferences">
            <Input
              value={draftProfile.dietaryPreferences ?? ""}
              maxLength={200}
              onChange={(e) => handleProfileChange("dietaryPreferences", e.target.value)}
              placeholder="e.g. Vegetarian, Gluten-free, no peanuts"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Injuries / Limitations">
              <Input
                value={draftProfile.injuries ?? ""}
                maxLength={100}
                onChange={(e) => handleProfileChange("injuries", e.target.value)}
                placeholder="e.g. Lower back pain, bad knees"
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
              />
            </Field>
          </div>
        </div>
        {profileError && <p className="text-xs text-rose-400 font-medium">{profileError}</p>}
      </Card>

      {/* AI Provider Config with Grid of selectable brands and code diagnostics */}
      <Card className="p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-card-border pb-3">
          <div className="flex items-center gap-2.5">
            <Cpu className="text-purple-400" size={20} />
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">AI Intelligence Engine</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Configure cloud endpoints and local hosts</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 pb-1">
          {providerTypes.map((type) => {
            const config = providerConfig[type] || providerConfig.custom;
            const active = selectedType === type;
            const savedProvider = providers.find((p) => p.type === type);
            const isDefaultActive = savedProvider && activeProviderId === savedProvider.id;
            return (
              <button
                type="button"
                className={`relative flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all duration-300 hover:scale-[1.02] ${
                  active
                    ? `bg-gradient-to-br ${config.gradient} text-white-keep shadow-lg`
                    : "border-card-border bg-surface text-zinc-500 dark:text-zinc-400 hover:bg-input hover:text-foreground"
                }`}
                key={type}
                onClick={() => handleSelectType(type)}
              >
                {isDefaultActive && (
                  <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-purple-400 shadow-md shadow-purple-500/50 animate-pulse" />
                )}
                <div className={`text-xs font-bold leading-tight ${active ? config.text : "text-zinc-300"}`}>
                  {config.label}
                </div>
                <div className="text-[9px] text-zinc-500 mt-1.5 uppercase tracking-wider font-mono">
                  {type}
                </div>
              </button>
            );
          })}
        </div>

        {draft ? (
          <div className="space-y-4 pt-2">
            {/* Provider Key Help Card */}
            {(() => {
              const helper = getProviderInstructions(draft.type);
              if (!helper) return null;
              return (
                <Surface className="p-3.5 bg-emerald-950/20 border border-emerald-500/10 text-zinc-300 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/15 text-emerald-400">
                      <Sparkles size={11} className="stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                      {helper.title} Steps
                    </span>
                  </div>
                  <ol className="list-decimal pl-4.5 text-[11px] text-zinc-400 space-y-1">
                    {helper.steps.map((st, i) => (
                      <li key={i} className="leading-relaxed">{st}</li>
                    ))}
                  </ol>
                  {helper.url && (
                    <a
                      href={helper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block text-[10px] font-bold text-emerald-400 hover:text-emerald-300 underline underline-offset-2 transition"
                    >
                      Go to Console Website →
                    </a>
                  )}
                </Surface>
              );
            })()}
            {/* Base URL: Only for Custom/Ollama/LMStudio */}
            {(draft.type === "custom" || draft.type === "ollama" || draft.type === "lmstudio") && (
              <Field label="Base URL" hint={providerHints.baseUrl}>
                <Input
                  maxLength={200}
                  value={draft.baseUrl ?? ""}
                  onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
                  placeholder="e.g. http://localhost:11434"
                  className="focus:ring-2 focus:ring-purple-400/10"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-4">
              {/* Model selection: Always visible */}
              <Field label="Model" hint={providerHints.model}>
                <Select
                  value={draft.model}
                  onChange={(event) => setDraft({ ...draft, model: event.target.value })}
                  disabled={modelsLoading || !!modelsError || models.length === 0}
                  className="focus:ring-2 focus:ring-purple-400/10"
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

              {/* API Key: Hidden for local offline hosts */}
              {draft.type !== "ollama" && draft.type !== "lmstudio" && (
                <Field label="API Key" hint={providerHints.apiKey}>
                  <div className="relative">
                    <Input
                      type={showApiKey ? "text" : "password"}
                      maxLength={500}
                      value={apiKey}
                      onChange={(event) => setApiKey(event.target.value)}
                      placeholder={draft.apiKey ? "Stored securely" : "Paste key"}
                      className="focus:ring-2 focus:ring-purple-400/10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </Field>
              )}
            </div>
            
            {aiError && <p className="text-xs text-rose-400 font-medium">{aiError}</p>}

            <div className="flex flex-wrap gap-2 border-t border-card-border pt-3">
              {isSaved && (
                <Button
                  variant={isActive ? "primary" : "secondary"}
                  icon={<CheckCircle2 size={16} />}
                  onClick={() => void setActiveProvider(draft.id)}
                  title={providerHints.active}
                  disabled={isActive}
                >
                  {isActive ? "Active Engine" : "Activate"}
                </Button>
              )}
              <Button
                icon={<Save size={16} />}
                onClick={handleSaveProvider}
                title={providerHints.save}
              >
                {isSaved ? "Update Provider" : "Save Credentials"}
              </Button>
              <Button
                icon={<LinkIcon size={16} />}
                disabled={providerBusy}
                onClick={handleTestProvider}
                title={providerHints.test}
              >
                Test Connection
              </Button>
            </div>

            {/* Diagnostic Console */}
            {draft.lastStatus ? (
              <div className="rounded-xl border border-card-border bg-input p-4 font-mono text-xs shadow-inner">
                <div className="flex items-center justify-between border-b border-card-border pb-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${
                      draft.lastStatus === "ok" ? "bg-emerald-500 animate-pulse" : "bg-rose-500"
                    }`} />
                    <span className="text-zinc-500 uppercase font-bold text-[9px] tracking-wider">Diagnostics Console</span>
                  </div>
                  <span className="text-zinc-600 text-[9px]">
                    {draft.lastTestedAt ? new Date(draft.lastTestedAt).toLocaleTimeString() : ""}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-zinc-400">&gt; Status: 
                    <span className={`font-bold ml-1.5 ${
                      draft.lastStatus === "ok" ? "text-emerald-400" : "text-rose-400"
                    }`}>
                      {draft.lastStatus === "ok" ? "ONLINE" : "OFFLINE"}
                    </span>
                  </p>
                  {draft.lastError && (
                    <p className="text-rose-400 leading-normal break-all mt-1 bg-rose-500/5 p-2 rounded-lg border border-rose-500/10">
                      &gt; Error: {draft.lastError}
                    </p>
                  )}
                  {draft.lastStatus === "ok" && (
                    <p className="text-emerald-400/80 leading-normal">
                      &gt; Model stream established. Connection active and response validated.
                    </p>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Card>

      {/* Security backups with double column input forms and file selectors */}
      <Card className="p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-card-border pb-3">
          <div className="flex items-center gap-2.5">
            <Shield className="text-blue-400" size={20} />
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">Security &amp; Backups</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Encrypt your profile logs and transfer files</p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Export Panel */}
          <Surface className="flex flex-col justify-between border border-surface-border bg-surface p-4 rounded-2xl">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Export Training Data</Label>
              <div className="relative">
                <Input
                  type={showExportPassphrase ? "text" : "password"}
                  maxLength={64}
                  value={exportPassphrase}
                  onChange={(event) => setExportPassphrase(event.target.value)}
                  placeholder="Set encryption passphrase"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowExportPassphrase(!showExportPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showExportPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button
              className="mt-4 w-full"
              variant="primary"
              icon={<Download size={16} />}
              disabled={!exportPassphrase}
              onClick={handleExportWithValidation}
            >
              Export JSON File
            </Button>
          </Surface>

          {/* Import Panel */}
          <Surface className="flex flex-col justify-between border border-surface-border bg-surface p-4 rounded-2xl">
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Import Backup File</Label>
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
                  className="flex items-center justify-center gap-2 border border-dashed border-card-border rounded-xl bg-input py-2.5 px-3 text-xs font-semibold text-zinc-400 hover:bg-input hover:text-foreground transition duration-200 cursor-pointer w-full text-center"
                >
                  <Upload size={14} />
                  {importFile ? importFile.name : "Select backup.json"}
                </label>
              </div>
              
              <div className="relative">
                <Input
                  type={showImportPassphrase ? "text" : "password"}
                  maxLength={64}
                  value={importPassphrase}
                  onChange={(event) => setImportPassphrase(event.target.value)}
                  placeholder="Enter decrypt passphrase"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowImportPassphrase(!showImportPassphrase)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  {showImportPassphrase ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <Button
              className="w-full mt-4"
              icon={<Upload size={16} />}
              disabled={!importFile || !importPassphrase}
              onClick={handleImportWithValidation}
            >
              Import profile
            </Button>
          </Surface>
        </div>
        {backupError && <p className="text-xs text-rose-400 font-medium">{backupError}</p>}
      </Card>


      {/* System card with database reset and PWA notifications */}
      <Card className="p-6 shadow-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-card-border pb-3">
          <div className="flex items-center gap-2.5">
            <Server className="text-orange-400" size={20} />
            <div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">System Preferences</h2>
              <p className="text-xs text-zinc-500 mt-0.5">Manage device options and local databases</p>
            </div>
          </div>
        </div>

        <div className="pb-4 border-b border-card-border mb-4">
          <SegmentedSetting<ThemeMode>
            label="App Display Theme"
            value={theme}
            values={["dark", "light", "system"]}
            onChange={(value) => void setTheme(value)}
          />
        </div>

        <div className="flex items-start gap-3 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 text-xs leading-normal text-rose-600 dark:text-rose-300">
          <ShieldAlert className="mt-0.5 shrink-0 text-rose-500 dark:text-rose-400" size={16} />
          <div>
            <span className="font-bold uppercase tracking-wider text-rose-500 dark:text-rose-400 block mb-1">Irreversible Data Loss Warning</span>
            Performing a Hard Factory Reset will instantly delete all of your custom routines, workout histories, biometrics, and progress logs. We **strongly advise** that you generate an encrypted JSON export above to save your backup first, or this data will be completely lost.
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Surface className="flex items-center justify-between gap-4 border border-surface-border bg-surface p-4 rounded-2xl">
            <div>
              <p className="font-semibold text-foreground text-sm">App Notifications</p>
              <p className="text-xs text-zinc-500 mt-0.5">Current state: <span className="font-mono text-zinc-500 dark:text-zinc-400 font-bold uppercase">{notificationStatus}</span></p>
            </div>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Enable notifications"
              className="rounded-xl"
              onClick={async () => {
                if (!("Notification" in window)) {
                  setNotificationStatus("Unsupported");
                  return;
                }
                const permission = await Notification.requestPermission();
                setNotificationStatus(permission);
              }}
            >
              <Bell size={18} />
            </Button>
          </Surface>
          <Surface className="flex items-center justify-between gap-4 border border-surface-border bg-surface p-4 rounded-2xl">
            <div>
              <p className="font-semibold text-foreground text-sm">Hard Factory Reset</p>
              <p className="text-xs text-zinc-500 mt-0.5">Restore all original seeded profiles</p>
            </div>
            <Button
              size="icon"
              variant="danger"
              aria-label="Reset local data"
              className="rounded-xl"
              onClick={() => {
                const warningMsg = activeWorkout
                  ? "You have a workout session in progress. Performing a factory reset will discard your active workout and permanently delete all custom workouts, body metrics, and messages. Are you sure you want to proceed?"
                  : "Are you sure you want to restore original seeded data? All custom workouts, body metrics, and messages will be permanently deleted.";
                if (window.confirm(warningMsg)) {
                  void resetLocalData();
                }
              }}
            >
              <RefreshCcw size={18} />
            </Button>
          </Surface>
        </div>
      </Card>
    </motion.div>
  );
}

function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <Label className="mb-0">{label}</Label>
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
      <Label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0">{label}</Label>
      <div className="relative grid gap-1 rounded-xl border border-card-border bg-input p-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((item) => {
          const active = item === value;
          return (
            <button
              type="button"
              className={`relative z-10 rounded-lg py-1.5 text-xs font-bold capitalize transition-colors duration-200 ${
                active ? "text-zinc-950" : "text-zinc-400 hover:text-zinc-200"
              }`}
              key={item}
              onClick={() => onChange(item)}
            >
              {active && (
                <motion.span
                  layoutId={`active-segmented-${label}`}
                  className="absolute inset-0 rounded-lg bg-emerald-300"
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