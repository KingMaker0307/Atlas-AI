"use client";

import { motion } from "framer-motion";
import {
  Bell,
  Bot,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  LinkIcon,
  Palette,
  PlugZap,
  RefreshCcw,
  Save,
  Upload,
} from "lucide-react";
import { ChangeEvent, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { AiProviderSettings, ThemeMode, UnitSystem } from "@/types/domain";

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

export function SettingsScreen() {
  const profile = useAtlasStore((state) => state.profile);
  const theme = useAtlasStore((state) => state.theme);
  const units = useAtlasStore((state) => state.units);
  const providers = useAtlasStore((state) => state.aiProviders);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const setTheme = useAtlasStore((state) => state.setTheme);
  const setUnits = useAtlasStore((state) => state.setUnits);
  const saveProvider = useAtlasStore((state) => state.saveProvider);
  const setActiveProvider = useAtlasStore((state) => state.setActiveProvider);
  const testProvider = useAtlasStore((state) => state.testProvider);
  const exportEncryptedProfile = useAtlasStore((state) => state.exportEncryptedProfile);
  const importEncryptedProfile = useAtlasStore((state) => state.importEncryptedProfile);
  const resetLocalData = useAtlasStore((state) => state.resetLocalData);
  const providerBusy = useAtlasStore((state) => state.providerBusy);
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setDraft({ ...selectedProvider });
      setApiKey("");
    }
  }, [selectedProvider]);

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
        <div className="mt-4 grid grid-cols-2 gap-3">
          <SegmentedSetting<ThemeMode>
            label="Theme"
            value={theme}
            values={["dark", "light", "system"]}
            onChange={(value) => void setTheme(value)}
          />
          <SegmentedSetting<UnitSystem>
            label="Units"
            value={units}
            values={["imperial", "metric"]}
            onChange={(value) => void setUnits(value)}
          />
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
              <Field label="Label">
                <Input value={draft.label} onChange={(event) => setDraft({ ...draft, label: event.target.value })} />
              </Field>
              <Field label="Type">
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
            <Field label="Base URL">
              <Input
                value={draft.baseUrl ?? ""}
                onChange={(event) => setDraft({ ...draft, baseUrl: event.target.value })}
                placeholder="https://api.openai.com/v1"
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Model">
                <Input value={draft.model} onChange={(event) => setDraft({ ...draft, model: event.target.value })} />
              </Field>
              <Field label="API key">
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(event) => setApiKey(event.target.value)}
                  placeholder={draft.apiKey ? "Stored locally" : "Paste key"}
                />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Temperature">
                <Input
                  type="number"
                  min={0}
                  max={2}
                  step={0.1}
                  value={draft.temperature}
                  onChange={(event) => setDraft({ ...draft, temperature: Number(event.target.value) })}
                />
              </Field>
              <Field label="Context">
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
              >
                Streaming
              </Button>
              <Button
                variant={activeProviderId === draft.id ? "primary" : "secondary"}
                icon={<CheckCircle2 size={16} />}
                onClick={() => void setActiveProvider(draft.id)}
              >
                Active
              </Button>
              <Button
                icon={<Save size={16} />}
                onClick={() => void saveProvider(draft, apiKey || undefined)}
              >
                Save
              </Button>
              <Button
                icon={<LinkIcon size={16} />}
                disabled={providerBusy}
                onClick={async () => {
                  await saveProvider(draft, apiKey || undefined);
                  await testProvider(draft.id);
                }}
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
              className="mt-3 w-full"
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

      <Card className="p-4">
        <h2 className="text-lg font-semibold text-white">Future-ready hooks</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-2">
          {[
            "Apple Health",
            "Google Fit",
            "Wearables",
            "Voice logging",
            "AI routines",
            "Image analysis",
            "Barcode scanning",
            "Optional cloud sync",
          ].map((item) => (
            <Surface key={item} className="flex items-center gap-3 p-3">
              <Cloud className="text-zinc-500" size={16} />
              <span className="text-sm text-zinc-300">{item}</span>
            </Surface>
          ))}
        </div>
      </Card>
    </motion.div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
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
