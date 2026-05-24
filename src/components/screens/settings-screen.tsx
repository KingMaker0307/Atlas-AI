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

  const [draftProfile, setDraftProfile] = useState<Partial<UserProfile>>({});
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setDraftProfile(profile);
    }
  }, [profile]);

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
          <Button variant="ghost" size="icon" onClick={() => updateProfile(draftProfile)}>
            <Save size={16} />
          </Button>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Field label="Age">
            <Input
              type="number"
              value={draftProfile.age ?? ""}
              onChange={(e) => handleProfileChange("age", Number(e.target.value))}
            />
          </Field>
          <Field label="Weight">
            <Input
              type="number"
              value={draftProfile.weight ?? ""}
              onChange={(e) => handleProfileChange("weight", Number(e.target.value))}
            />
          </Field>
          <Field label="Height">
            <Input
              type="number"
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
              onChange={(e) => handleProfileChange("dietaryPreferences", e.target.value)}
            />
          </Field>
        </div>
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
                <Input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
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
                  step={1024}
                  value={draft.contextLength}
                  onChange={(event) => setDraft({ ...draft, contextLength: Number(event.target.value) })}
                />
              </Field>
            </div>
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
                onClick={() => {
                  if (draft) {
                    void saveProvider(draft, apiKey);
                  }
                }}
                title={providerHints.save}
              >
                Save
              </Button>
              <Button
                icon={<LinkIcon size={16} />}
                disabled={providerBusy}
                onClick={async () => {
                  if (draft) {
                    await saveProvider(draft, apiKey); // Save provider settings (with API key)
                    await testProvider(draft.id); // Test with current API key
                  }
                }}
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

      <Card className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Cloud Sync</h2>
            <p className="text-sm text-zinc-500">Sync your data with a cloud provider</p>
          </div>
          <Cloud className="text-zinc-500" size={18} />
        </div>
        <Button className="w-full" variant="secondary">
          Sync with Google Drive
        </Button>
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
              value={exportPassphrase}
              onChange={(event) => setExportPassphrase(event.target.value)}
            />
            <Button
              className="mt-3 w-full"
              variant="primary"
              icon={<Download size={16} />}
              disabled={!exportPassphrase}
              onClick={() => void handleExport()}
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
              value={importPassphrase}
              onChange={(event) => setImportPassphrase(event.target.value)}
            />
            <Button
              className="w-full"
              icon={<Upload size={16} />}
              disabled={!importFile || !importPassphrase}
              onClick={() => void handleImport()}
            >
              Import profile
            </Button>
          </Surface>
        </div>
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