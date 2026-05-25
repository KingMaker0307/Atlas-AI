"use client";

import { motion } from "framer-motion";
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
  Cloud,
  Server,
  Info,
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

export function SettingsScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const theme = useAtlasStore((state) => state.theme);
  const weightUnit = useAtlasStore((state) => state.weightUnit);
  const heightUnit = useAtlasStore((state) => state.heightUnit);
  const providers = useAtlasStore((state) => state.aiProviders);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const themeMode = useAtlasStore((state) => state.theme); // Wait, make sure theme matches
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
  const lastSyncedAt = useAtlasStore((state) => state.lastSyncedAt);

  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleManualSync = async () => {
    if (!profile?.id) return;
    setSyncing(true);
    setSyncStatus("Syncing...");
    try {
      const state = useAtlasStore.getState();
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: profile.id,
          snapshot: {
            profile: state.profile,
            workouts: state.workouts,
            activeWorkout: state.activeWorkout,
            recoveryLogs: state.recoveryLogs,
            bodyMetrics: state.bodyMetrics,
            aiMessages: state.aiMessages,
            aiProviders: state.aiProviders,
            activeProviderId: state.activeProviderId,
            workoutPlans: state.workoutPlans,
            theme: state.theme,
            weightUnit: state.weightUnit,
            heightUnit: state.heightUnit,
            hasOnboarded: state.hasOnboarded,
            restTimerEndsAt: state.restTimerEndsAt,
          }
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.blocked) {
          useAtlasStore.setState({ blocked: true });
        } else {
          useAtlasStore.setState({ lastSyncedAt: new Date().toISOString() });
          setSyncStatus(`Sync successful! (${data.mode === "mock" ? "Mock Mode" : "Google Drive Mode"})`);
        }
      } else {
        setSyncStatus(`Sync failed: ${await res.text()}`);
      }
    } catch (e: any) {
      setSyncStatus(`Error: ${e.message}`);
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncStatus(null), 5000);
    }
  };

  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile>>({});
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  
  const [profileError, setProfileError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [backupError, setBackupError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDraftProfile(profile);
    }
  }, [profile]);

  const [syncMode, setSyncMode] = useState<"loading" | "drive" | "mock">("loading");

  useEffect(() => {
    if (!profile?.id) return;
    fetch(`/api/profile?userId=${profile.id}`)
      .then(res => res.json())
      .then(data => {
        if (data.mode) setSyncMode(data.mode);
      })
      .catch(() => setSyncMode("mock"));
  }, [profile?.id]);

  const [selectedProviderId, setSelectedProviderId] = useState(providers[0]?.id ?? "");
  const selectedProvider = useMemo(
    () => providers.find((provider) => provider.id === selectedProviderId),
    [providers, selectedProviderId],
  );
  const [draft, setDraft] = useState<AiProviderSettings | null>(selectedProvider ?? null);
  const [apiKey, setApiKey] = useState("");
  const [exportPassphrase, setExportPassphrase] = useState("");
  const [importPassphrase, setImportPassphrase] = useState("");
  const [importFile, setImportFile] = useState<File | null>(null);
  const [notificationStatus, setNotificationStatus] = useState("Not enabled");

  useEffect(() => {
    if (selectedProvider) {
      setDraft({ ...selectedProvider });
      setApiKey(""); // Clear API key when switching providers
    }
  }, [selectedProvider]);

  useEffect(() => {
    if (draft && draft.type !== 'custom' && !draft.baseUrl) {
      setDraft(d => ({ ...d!, baseUrl: defaultBaseUrls[d!.type] }));
    }
  }, [draft?.type, draft?.baseUrl]);

  useEffect(() => {
    async function fetchModels() {
      if (!draft) return;

      if (!apiKey && draft.type !== 'ollama') { // Ollama doesn't always require an API key
        setModelsError("Enter API key to load models");
        setModels([]);
        return;
      }

      setModelsLoading(true);
      setModelsError(null);
      try {
        const adapter = getProviderAdapter(draft.type);
        const modelList = await adapter.listModels(draft, apiKey);
        setModels(modelList.map(m => m.id));
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

  const saveProfileSettings = async () => {
    const age = Number(draftProfile.age);
    const weight = Number(draftProfile.weight);
    const height = Number(draftProfile.height);
    const diet = draftProfile.dietaryPreferences || "";
    const injuries = draftProfile.injuries || "";
    const duration = Number(draftProfile.workoutDuration);

    if (isNaN(age) || age < 13 || age > 120) {
      setProfileError("Age must be between 13 and 120.");
      return;
    }
    if (isNaN(weight) || weight < 20 || weight > 1000) {
      setProfileError("Weight must be between 20 and 1000.");
      return;
    }
    if (isNaN(height) || height < 20 || height > 300) {
      setProfileError("Height must be between 20 and 300.");
      return;
    }
    if (diet.length > 200) {
      setProfileError("Dietary preferences must be 200 characters or less.");
      return;
    }
    if (injuries.length > 100) {
      setProfileError("Injuries description must be 100 characters or less.");
      return;
    }
    if (draftProfile.workoutDuration !== undefined && (isNaN(duration) || duration < 15 || duration > 180)) {
      setProfileError("Workout duration must be between 15 and 180 minutes.");
      return;
    }

    setProfileError(null);
    await updateProfile(draftProfile);
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
    if (draft.temperature < 0 || draft.temperature > 2 || isNaN(draft.temperature)) {
      setAiError("Temperature must be between 0 and 2.");
      return;
    }
    if (draft.contextLength < 1024 || draft.contextLength > 1000000 || isNaN(draft.contextLength)) {
      setAiError("Context Length must be between 1024 and 1,000,000.");
      return;
    }

    setAiError(null);
    await saveProvider(draft, apiKey);
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
    if (draft.temperature < 0 || draft.temperature > 2 || isNaN(draft.temperature)) {
      setAiError("Temperature must be between 0 and 2.");
      return;
    }
    if (draft.contextLength < 1024 || draft.contextLength > 1000000 || isNaN(draft.contextLength)) {
      setAiError("Context Length must be between 1024 and 1,000,000.");
      return;
    }

    setAiError(null);
    await saveProvider(draft, apiKey);
    await testProvider(draft.id);
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
    setBackupError(null);
    try {
      await handleImport();
    } catch (e: any) {
      setBackupError(e.message || "Failed to import profile.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="space-y-4 pb-28"
    >
      <section>
        <p className="text-sm text-zinc-400">Local keys, backups, theme</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-normal text-white">Settings</h1>
      </section>

      <Card className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-300 text-zinc-950">
            <Palette size={22} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">{profile?.name ?? "Athlete"}</h2>
            <p className="text-sm text-zinc-500">{profile?.goal}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-3">
          <SegmentedSetting<ThemeMode>
            label="Theme"
            value={theme}
            values={["dark", "light", "system"]}
            onChange={(value) => void setTheme(value)}
          />
          <SegmentedSetting<WeightUnit>
            label="Weight"
            value={weightUnit}
            values={["lbs", "kg"]}
            onChange={(value) => void setWeightUnit(value)}
          />
          <SegmentedSetting<HeightUnit>
            label="Height"
            value={heightUnit}
            values={["in", "cm"]}
            onChange={(value) => void setHeightUnit(value)}
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Your Biometrics</h2>
          <Button variant="ghost" size="icon" onClick={saveProfileSettings}>
            <Save size={16} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age">
            <Input
              type="number"
              min={13}
              max={120}
              value={draftProfile.age ?? ""}
              onChange={(e) => handleProfileChange("age", Number(e.target.value))}
            />
          </Field>
          <Field label="Weight">
            <Input
              type="number"
              min={20}
              max={1000}
              value={draftProfile.weight ?? ""}
              onChange={(e) => handleProfileChange("weight", Number(e.target.value))}
            />
          </Field>
          <Field label="Height">
            <Input
              type="number"
              min={20}
              max={300}
              value={draftProfile.height ?? ""}
              onChange={(e) => handleProfileChange("height", Number(e.target.value))}
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
        </div>
        <div className="mt-3">
          <Field label="Dietary Preferences">
            <Input
              value={draftProfile.dietaryPreferences ?? ""}
              maxLength={200}
              onChange={(e) => handleProfileChange("dietaryPreferences", e.target.value)}
              placeholder="e.g. Vegetarian, Gluten-free, no peanuts"
            />
          </Field>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
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
        {profileError && <p className="mt-3 text-xs text-rose-300">{profileError}</p>}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">AI providers</h2>
            <p className="text-sm text-zinc-500">OpenAI-compatible, cloud, and localhost models</p>
          </div>
          <Bot className="text-zinc-500" size={18} />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {providers.map((provider) => (
            <button
              className={`min-w-fit rounded-full border px-3 py-2 text-sm transition ${
                selectedProviderId === provider.id
                  ? "border-emerald-300/50 bg-emerald-300/15 text-emerald-100"
                  : "border-white/10 bg-white/[0.055] text-zinc-300"
              }`}
              key={provider.id}
              onClick={() => setSelectedProviderId(provider.id)}
            >
              {provider.label}
            </button>
          ))}
          <button
            className="min-w-fit rounded-full border border-white/10 bg-white/[0.055] px-3 py-2 text-sm text-zinc-300"
            onClick={() => {
              const custom: AiProviderSettings = {
                id: createId("provider"),
                type: "custom",
                label: "Custom",
                baseUrl: "http://localhost:1234/v1",
                model: "local-model",
                temperature: 0.6,
                contextLength: 8000,
                streaming: true,
                enabled: false,
              };
              setDraft(custom);
              setSelectedProviderId(custom.id);
            }}
          >
            + Custom
          </button>
        </div>

        {draft ? (
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Label" hint={providerHints.label}>
                <Input maxLength={30} value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
              </Field>
              <Field label="Type" hint={providerHints.type}>
                <Select
                  value={draft.type}
                  onChange={(event) =>
                    setDraft({ ...draft, type: event.target.value as AiProviderSettings["type"] })
                  }
                >
                  {providerTypes.map((type) => (
                    <option value={type} key={type}>
                      {type}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Base URL" hint={providerHints.baseUrl}>
              <div className="flex items-center gap-2">
                <Input
                  maxLength={200}
                  value={draft.baseUrl ?? ""}
                  onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
                  placeholder="e.g. https://api.openai.com/v1"
                  readOnly={draft.type !== 'custom'}
                />
              </div>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Model" hint={providerHints.model}>
                <Select
                  value={draft.model}
                  onChange={(event) => setDraft({ ...draft, model: event.target.value })}
                  disabled={modelsLoading || !!modelsError || models.length === 0}
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
              <Field label="API key" hint={providerHints.apiKey}>
                <Input
                  type="password"
                  maxLength={500}
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={draft.apiKey ? "Stored locally" : "Paste key"}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Temperature" hint={providerHints.temperature}>
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={draft.temperature}
                  onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })}
                />
              </Field>
              <Field label="Context" hint={providerHints.context}>
                <Input
                  type="number"
                  min={1024}
                  max={1000000}
                  step={1024}
                  value={draft.contextLength}
                  onChange={(event) => setDraft({ ...draft, contextLength: Number(event.target.value) })}
                />
              </Field>
            </div>
            
            {aiError && <p className="text-xs text-rose-300">{aiError}</p>}

            <div className="flex flex-wrap gap-2">
              <Button
                variant={draft.streaming ? "primary" : "secondary"}
                icon={<PlugZap size={16} />}
                onClick={() => setDraft({ ...draft, streaming: !draft.streaming })}
                title={providerHints.streaming}
              >
                Streaming
              </Button>
              <Button
                variant={activeProviderId === draft.id ? "primary" : "secondary"}
                icon={<CheckCircle2 size={16} />}
                onClick={() => void setActiveProvider(draft.id)}
                 title={providerHints.active}
              >
                Active
              </Button>
              <Button
                icon={<Save size={16} />}
                onClick={handleSaveProvider}
                title={providerHints.save}
              >
                Save
              </Button>
              <Button
                icon={<LinkIcon size={16} />}
                disabled={providerBusy}
                onClick={handleTestProvider}
                title={providerHints.test}
              >
                Test
              </Button>
            </div>
            {draft.lastStatus ? (
              <Surface className="p-3 text-sm text-zinc-300">
                Status: {draft.lastStatus}
                {draft.lastError ? ` · ${draft.lastError}` : ""}
              </Surface>
            ) : null}
          </div>
        ) : null}
      </Card>

      <Card className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Google Drive Silent Sync</h2>
            <p className="text-sm text-zinc-500 font-normal">Automatically syncs all user details, photos, and workouts.</p>
          </div>
          <Cloud className="text-emerald-400" size={20} />
        </div>

        <Surface className="p-3 text-sm space-y-2 bg-black/20 border border-white/5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500 font-medium">Sync Mode:</span>
            <span className={`font-semibold uppercase tracking-wider ${
              syncMode === "drive" ? "text-emerald-400" : syncMode === "mock" ? "text-amber-400" : "text-zinc-400"
            }`}>
              {syncMode === "drive" ? "Service Account Connected" : syncMode === "mock" ? "Local Mock Mode" : "Loading..."}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span className="text-zinc-500 font-medium">Last Silent Sync:</span>
            <span className="text-zinc-300 font-mono">
              {lastSyncedAt ? new Date(lastSyncedAt).toLocaleTimeString() + " " + new Date(lastSyncedAt).toLocaleDateString() : "Never"}
            </span>
          </div>

          {syncMode === "mock" && (
            <p className="text-[10px] text-zinc-500 italic leading-relaxed pt-1 border-t border-white/5">
              Service account credentials not found in env. Synchronizing locally to <code className="text-zinc-400 font-mono">src/data/drive_mocks/</code> for testing. Set <code className="text-zinc-400 font-mono">blocked: true</code> in the file to block the user.
            </p>
          )}
        </Surface>

        <Button
          className="w-full"
          variant="secondary"
          disabled={syncing || !profile?.id}
          onClick={handleManualSync}
        >
          {syncing ? "Synchronising..." : "Sync Now"}
        </Button>
        {syncStatus && (
          <p className="text-center text-xs text-emerald-300 font-medium animate-pulse">{syncStatus}</p>
        )}
      </Card>

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Encrypted profile backup</h2>
            <p className="text-sm text-zinc-500">Export and import JSON with a passphrase</p>
          </div>
          <Database className="text-zinc-500" size={18} />
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Surface>
            <Label>Export passphrase</Label>
            <Input
              type="password"
              maxLength={64}
              value={exportPassphrase}
              onChange={(event) => setExportPassphrase(event.target.value)}
            />
            <Button
              className="mt-3 w-full"
              variant="primary"
              icon={<Download size={16} />}
              disabled={!exportPassphrase}
              onClick={handleExportWithValidation}
            >
              Export JSON
            </Button>
          </Surface>
          <Surface>
            <Label>Import file</Label>
            <Input
              type="file"
              accept="application/json"
              onChange={(event: ChangeEvent<HTMLInputElement>) => setImportFile(event.target.files?.[0] ?? null)}
            />
            <Label className="mt-3">Import passphrase</Label>
            <Input
              type="password"
              maxLength={64}
              value={importPassphrase}
              onChange={(event) => setImportPassphrase(event.target.value)}
            />
            <Button
              className="w-full mt-3"
              icon={<Upload size={16} />}
              disabled={!importFile || !importPassphrase}
              onClick={handleImportWithValidation}
            >
              Import profile
            </Button>
          </Surface>
        </div>
        {backupError && <p className="mt-3 text-xs text-rose-300">{backupError}</p>}
      </Card>

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Native options</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Surface className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">Notifications</p>
              <p className="text-sm text-zinc-500">{notificationStatus}</p>
            </div>
            <Button
              size="icon"
              variant="secondary"
              aria-label="Enable notifications"
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
          <Surface className="flex items-center justify-between gap-3">
            <div>
              <p className="font-medium text-white">Local reset</p>
              <p className="text-sm text-zinc-500">Restore seeded local data</p>
            </div>
            <Button size="icon" variant="danger" aria-label="Reset local data" onClick={() => void resetLocalData()}>
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
      <div className="flex items-center gap-2">
        <Label>{label}</Label>
        {hint && (
          <span title={hint}>
            <Info size={14} className="text-zinc-500" />
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
    <div>
      <Label>{label}</Label>
      <div className="grid gap-1 rounded-xl border border-white/10 bg-black/25 p-1" style={{ gridTemplateColumns: `repeat(${values.length}, minmax(0, 1fr))` }}>
        {values.map((item) => (
          <button
            type="button"
            className={`rounded-lg px-2 py-2 text-xs font-semibold capitalize transition ${
              item === value ? "bg-white text-zinc-950" : "text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}
            key={item}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
}