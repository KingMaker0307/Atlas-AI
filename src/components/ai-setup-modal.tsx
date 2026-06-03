"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import {
  Cpu,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  X,
  ShieldAlert,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, Surface } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { createId } from "@/lib/id";
import { useAtlasStore } from "@/store/useAtlasStore";
import type { AiProviderSettings } from "@/types/domain";
import { getProviderAdapter } from "@/providers";
import { decryptString } from "@/lib/security/crypto";

// Provider list and mappings matching SettingsScreen
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

const DEFAULT_MODELS_BY_PROVIDER: Record<string, string[]> = {
  openai: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo", "o1-mini", "o3-mini"],
  anthropic: [
    "claude-sonnet-4-5",
    "claude-sonnet-4-0",
    "claude-3-7-sonnet-latest",
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-opus-latest",
    "claude-3-haiku-20240307"
  ],
  gemini: [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-pro-preview-05-06",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
  ],
  grok: ["grok-3", "grok-3-mini", "grok-2", "grok-2-1212", "grok-beta"],
  deepseek: ["deepseek-chat", "deepseek-reasoner"],
  openrouter: [
    "google/gemini-2.0-flash-001",
    "google/gemini-2.5-flash-preview",
    "anthropic/claude-sonnet-4-5",
    "anthropic/claude-3.7-sonnet",
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini",
    "openai/gpt-4o",
    "meta-llama/llama-3.3-70b-instruct",
    "deepseek/deepseek-chat"
  ],
  ollama: ["llama3", "llama3.1", "llama3.2", "mistral", "phi4", "gemma2", "qwen2.5"],
  lmstudio: ["meta-llama-3-8b-instruct"],
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
    type === "openai" ? "gpt-4o-mini" :
      type === "anthropic" ? "claude-sonnet-4-5" :
        type === "gemini" ? "gemini-2.0-flash" :
          type === "deepseek" ? "deepseek-chat" :
            type === "grok" ? "grok-3" :
              type === "openrouter" ? "google/gemini-2.0-flash-001" :
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
        title: "OpenAI",
        steps: [
          "Sign in to your account at platform.openai.com.",
          "Click '+ Create new secret key' under API Keys.",
          "Copy the key (starts with 'sk-') and paste it below."
        ],
        url: "https://platform.openai.com/api-keys"
      };
    case "anthropic":
      return {
        title: "Anthropic",
        steps: [
          "Log in to the console at console.anthropic.com.",
          "Generate a new secret key under 'API Keys'.",
          "Copy the key (starts with 'sk-ant-') and paste it below."
        ],
        url: "https://console.anthropic.com/"
      };
    case "gemini":
      return {
        title: "Google Gemini",
        steps: [
          "Go to Google AI Studio at aistudio.google.com.",
          "Click 'Get API key' and copy the key."
        ],
        url: "https://aistudio.google.com/"
      };
    case "grok":
      return {
        title: "xAI Grok",
        steps: [
          "Go to the xAI Console at console.x.ai.",
          "Select API Keys and click 'Create API Key'."
        ],
        url: "https://console.x.ai/"
      };
    case "deepseek":
      return {
        title: "DeepSeek",
        steps: [
          "Sign in to platform.deepseek.com.",
          "Click 'Create new API key' under API Keys."
        ],
        url: "https://platform.deepseek.com/"
      };
    case "openrouter":
      return {
        title: "OpenRouter",
        steps: [
          "Go to openrouter.ai and log in.",
          "Select Keys and generate a new key."
        ],
        url: "https://openrouter.ai/keys"
      };
    case "ollama":
      return {
        title: "Ollama",
        steps: [
          "Ensure Ollama is running locally on port 11434.",
          "Ensure you have pulled a model (e.g. 'ollama run llama3')."
        ],
        url: "https://ollama.com"
      };
    case "lmstudio":
      return {
        title: "LM Studio",
        steps: [
          "Open LM Studio and start the Local Server on port 1234.",
          "Ensure a GGUF model is loaded in the top dropdown."
        ],
        url: "https://lmstudio.ai"
      };
    default:
      return null;
  }
}

export function AiSetupModal({ onClose }: { onClose: () => void }) {
  const providers = useAtlasStore((state) => state.aiProviders);
  const activeProviderId = useAtlasStore((state) => state.activeProviderId);
  const saveProvider = useAtlasStore((state) => state.saveProvider);
  const setActiveProvider = useAtlasStore((state) => state.setActiveProvider);
  const testProvider = useAtlasStore((state) => state.testProvider);
  const markProviderKeyStatus = useAtlasStore((state) => state.markProviderKeyStatus);
  const providerBusy = useAtlasStore((state) => state.providerBusy);

  const [selectedType, setSelectedType] = useState<AiProviderSettings["type"]>("openai");
  const [draft, setDraft] = useState<AiProviderSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [models, setModels] = useState<string[]>([]);
  const [modelsLoading, setModelsLoading] = useState(false);
  const [modelsError, setModelsError] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [initialized, setInitialized] = useState(false);
  const lastSyncedProviderIdRef = useRef<string | undefined>(undefined);

  // Sync draft and key with default active provider or fallback
  useEffect(() => {
    if (providers.length === 0) return;
    const active = providers.find((p) => p.id === activeProviderId) || providers[0];
    if (!active) return;

    const isFirstInit = !initialized;
    const activeProviderChanged = active.id !== lastSyncedProviderIdRef.current;

    if (isFirstInit || activeProviderChanged) {
      lastSyncedProviderIdRef.current = active.id;
      setSelectedType(active.type);
      setDraft({ ...active });
      setApiKey(active.apiKey ? "••••••••••••••••" : "");
      if (isFirstInit) setInitialized(true);
    }
  }, [providers, activeProviderId, initialized]);

  // Keep draft updated if tested status changes in store
  const activeSavedProviderOfSelectedType = useMemo(() => {
    return providers.find((p) => p.type === selectedType);
  }, [providers, selectedType]);

  useEffect(() => {
    if (activeSavedProviderOfSelectedType && draft && draft.id === activeSavedProviderOfSelectedType.id) {
      const prevHadKey = !!draft.apiKey;
      const nowHasKey = !!activeSavedProviderOfSelectedType.apiKey;

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

      if (nowHasKey && !prevHadKey) {
        setApiKey("••••••••••••••••");
      } else if (!nowHasKey && prevHadKey) {
        setApiKey("");
      }
    }
  }, [activeSavedProviderOfSelectedType]);

  useEffect(() => {
    if (draft && draft.type !== "custom" && !draft.baseUrl) {
      setDraft((d) => ({ ...d!, baseUrl: defaultBaseUrls[d!.type] }));
    }
  }, [draft?.type, draft?.baseUrl]);

  // Debounced API key input to load models
  const [debouncedApiKey, setDebouncedApiKey] = useState(apiKey);
  useEffect(() => {
    if (apiKey === "••••••••••••••••" || apiKey === "") {
      setDebouncedApiKey(apiKey);
      return;
    }
    const timer = setTimeout(() => setDebouncedApiKey(apiKey), 600);
    return () => clearTimeout(timer);
  }, [apiKey]);

  const draftId = draft?.id;
  const draftType = draft?.type;
  const draftBaseUrl = draft?.baseUrl;
  const draftModel = draft?.model;

  useEffect(() => {
    async function fetchModels() {
      if (!draft) return;
      if (!debouncedApiKey && draftType !== "ollama" && draftType !== "lmstudio") {
        setModelsError("Enter API key to load models");
        setModels([]);
        return;
      }

      if (debouncedApiKey === "••••••••••••••••") {
        const savedProvider = useAtlasStore.getState().aiProviders.find((p) => p.id === draftId);
        const isKnownBad = draft.lastStatus === "error" || savedProvider?.lastStatus === "error";
        if (isKnownBad) {
          setModelsError(draft.lastError ?? savedProvider?.lastError ?? "API key is invalid");
          setModels([]);
          return;
        }
      }

      setModelsLoading(true);
      setModelsError(null);
      try {
        const adapter = getProviderAdapter(draft.type);
        let actualApiKey = debouncedApiKey;
        if (debouncedApiKey === "••••••••••••••••" && draft.apiKey) {
          try {
            actualApiKey = await decryptString(draft.apiKey);
          } catch (decErr) {
            console.error("Failed to decrypt API key:", decErr);
            setModelsError("Failed to decrypt saved API key. Please re-enter.");
            setModels([]);
            setModelsLoading(false);
            return;
          }
        }
        const modelList = await adapter.listModels(draft, actualApiKey);
        setModels(modelList.map((m) => m.id));
        const savedProvider = useAtlasStore.getState().aiProviders.find((p) => p.id === draftId);
        if (savedProvider && savedProvider.lastStatus === "error") {
          await markProviderKeyStatus(savedProvider.id, "ok");
        }
      } catch (error: any) {
        setModelsError(error.message || "Failed to load models");
        setModels([]);
        const savedProvider = useAtlasStore.getState().aiProviders.find((p) => p.id === draftId);
        const isAuthError =
          error?.status === 401 ||
          error?.status === 403 ||
          /invalid.*key|incorrect.*key|api key|unauthorized|forbidden/i.test(error?.message ?? "");
        if (savedProvider && isAuthError && savedProvider.lastStatus !== "error") {
          await markProviderKeyStatus(savedProvider.id, "error", error.message || "Invalid API key");
        }
      } finally {
        setModelsLoading(false);
      }
    }
    void fetchModels();
  }, [draftId, draftType, draftBaseUrl, draftModel, debouncedApiKey]);

  const handleSelectType = (type: AiProviderSettings["type"]) => {
    setSelectedType(type);
    setModels([]);
    setModelsError(null);
    const existing = providers.find((p) => p.type === type);
    if (existing) {
      setDraft({ ...existing });
      setApiKey(existing.apiKey ? "••••••••••••••••" : "");
    } else {
      setDraft(defaultDraftForType(type));
      setApiKey("");
    }
    setAiError(null);
  };

  const handleSaveAndEnable = async () => {
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
      enabled: true,
    };
    const keyToPass = apiKey === "••••••••••••••••" ? undefined : apiKey;
    try {
      await saveProvider(updatedDraft, keyToPass);
      await setActiveProvider(updatedDraft.id);
      setDraft(updatedDraft);
      if (apiKey !== "") {
        setApiKey("••••••••••••••••");
      }
      await testProvider(updatedDraft.id);
      setSaveSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setAiError(err?.message || "Failed to save provider settings.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ y: 25, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 25, opacity: 0 }}
        className="w-full max-w-lg bg-background border border-card-border rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header bar */}
        <div className="px-5 py-4 border-b border-card-border flex items-center justify-between bg-header select-none">
          <div className="flex items-center gap-2">
            <Cpu className="text-purple-500" size={20} />
            <h2 className="text-base font-bold text-foreground tracking-tight">Configure AI Coach</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="h-8 w-8 rounded-lg flex items-center justify-center border border-surface-border bg-surface text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {saveSuccess ? (
            <div className="flex flex-col items-center justify-center py-10 text-center space-y-3 animate-fadeIn">
              <div className="h-16 w-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 size={36} />
              </div>
              <h3 className="text-base font-bold text-foreground">AI Coach Activated!</h3>
              <p className="text-xs text-zinc-500 max-w-xs leading-relaxed">
                Your AI provider credentials are saved and verified. Launching your personalized training plan helper.
              </p>
            </div>
          ) : (
            <>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Connect an AI engine (Gemini, OpenAI, Claude, or a local offline Ollama/LM Studio model) to enable workout builder options, coaching insights, and messages.
              </p>

              {/* Grid of Providers */}
              <div className="grid grid-cols-3 gap-1.5 select-none">
                {providerTypes.map((type) => {
                  const config = providerConfig[type] || providerConfig.custom;
                  const active = selectedType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => handleSelectType(type)}
                      className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl border text-center transition-all ${
                        active
                          ? `bg-gradient-to-br ${config.gradient} border-purple-500/40 shadow-sm`
                          : "border-surface-border bg-surface text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-150"
                      }`}
                    >
                      <span className={`text-[10px] font-extrabold ${active ? config.text : "text-zinc-700 dark:text-zinc-300"}`}>
                        {config.label}
                      </span>
                    </button>
                  );
                })}
              </div>

              {draft && (
                <div className="space-y-4 pt-1">
                  {/* Guide box */}
                  {(() => {
                    const helper = getProviderInstructions(draft.type);
                    if (!helper) return null;
                    return (
                      <Surface className="p-3 bg-purple-500/5 border border-purple-500/10 text-zinc-700 dark:text-zinc-300 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <Sparkles size={11} className="text-purple-500 shrink-0" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-purple-700 dark:text-purple-400 font-mono">
                            {helper.title} Setup
                          </span>
                        </div>
                        <ol className="list-decimal pl-4 text-[10px] text-zinc-500 dark:text-zinc-400 space-y-0.5 leading-normal">
                          {helper.steps.map((st, i) => (
                            <li key={i}>{st}</li>
                          ))}
                        </ol>
                        {helper.url && (
                          <a
                            href={helper.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[10px] font-bold text-purple-600 dark:text-purple-400 underline underline-offset-2"
                          >
                            Go to website →
                          </a>
                        )}
                      </Surface>
                    );
                  })()}

                  {/* Fields */}
                  {(draft.type === "custom" || draft.type === "ollama" || draft.type === "lmstudio") && (
                    <div className="space-y-1">
                      <Label htmlFor="modalBaseUrl" className="text-xs">Base URL</Label>
                      <Input
                        id="modalBaseUrl"
                        maxLength={200}
                        value={draft.baseUrl ?? ""}
                        onChange={(e) => setDraft({ ...draft, baseUrl: e.target.value })}
                        placeholder="e.g., http://localhost:11434"
                        className="text-xs font-mono"
                      />
                    </div>
                  )}

                  <div className={`grid gap-3 ${draft.type === "ollama" || draft.type === "lmstudio" ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"}`}>
                    {draft.type !== "ollama" && draft.type !== "lmstudio" && (
                      <div className="space-y-1">
                        <Label htmlFor="modalApiKey" className="text-xs">API Key</Label>
                        <div className="relative">
                          <Input
                            id="modalApiKey"
                            type={showApiKey ? "text" : "password"}
                            maxLength={500}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={draft.apiKey ? "Stored securely" : "Paste key"}
                            className="text-xs font-mono pr-8"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-350"
                          >
                            {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-1">
                      <Label htmlFor="modalModel" className="text-xs">Model Target</Label>
                      <div className="space-y-1.5">
                        {(() => {
                          const displayModels = models.length > 0 ? models : (DEFAULT_MODELS_BY_PROVIDER[draft.type] || []);
                          const isCustomModel = draft.model === "" || (draft.model && !displayModels.includes(draft.model));
                          return (
                            <>
                              <Select
                                id="modalModel"
                                value={isCustomModel ? "custom" : draft.model}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  if (val === "custom") {
                                    setDraft({ ...draft, model: "" });
                                  } else {
                                    setDraft({ ...draft, model: val });
                                  }
                                }}
                                disabled={modelsLoading}
                                className="text-xs font-bold"
                              >
                                {modelsLoading && <option value="">Loading models...</option>}
                                {displayModels.map((m) => (
                                  <option value={m} key={m}>{m}</option>
                                ))}
                                <option value="custom">+ Enter Custom Model...</option>
                              </Select>

                              {(isCustomModel || draft.model === "") && (
                                <Input
                                  type="text"
                                  placeholder="e.g. gpt-4-32k"
                                  value={draft.model}
                                  onChange={(e) => setDraft({ ...draft, model: e.target.value })}
                                  className="text-xs font-mono mt-1"
                                />
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>

                  {aiError && <p className="text-xs text-rose-500 font-medium font-mono">{aiError}</p>}
                  {modelsError && <p className="text-[10px] text-zinc-500 font-medium font-mono">{modelsError}</p>}

                  {/* Mini diagnostics log */}
                  {draft.lastStatus && (
                    <div className="rounded-xl border border-zinc-800 bg-black/60 p-3 font-mono text-[10px] space-y-1 keep-dark">
                      <div className="flex items-center gap-1.5 border-b border-white/5 pb-1 mb-1">
                        <span className={`h-1.5 w-1.5 rounded-full ${draft.lastStatus === "ok" ? "bg-emerald-500" : "bg-rose-500"}`} />
                        <span className="text-zinc-500 uppercase font-black tracking-wider">system.diagnostics</span>
                      </div>
                      {draft.lastError ? (
                        <p className="text-rose-400 break-words">Error: {draft.lastError}</p>
                      ) : (
                        <p className="text-emerald-400">Success: Model {draft.model} online & verified.</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer actions */}
        {!saveSuccess && (
          <div className="px-5 py-3 border-t border-card-border bg-nav flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
            >
              Skip / Setup Later
            </button>
            <Button
              variant="primary"
              onClick={handleSaveAndEnable}
              disabled={providerBusy}
              icon={providerBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save size={14} />}
            >
              {providerBusy ? "Verifying..." : "Save & Enable"}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
