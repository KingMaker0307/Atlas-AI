"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bot, X, Sparkles, Check, ExternalLink, ArrowRight, Eye, EyeOff, Lock, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useAtlasStore } from "@/store/useAtlasStore";
import { createId } from "@/lib/id";
import { encryptString } from "@/lib/security/crypto";
import { findFirstSupportedModel } from "@/providers";
import type { AiProviderSettings, EncryptedSecret } from "@/types/domain";

const PROVIDER_TYPES = [
  "openai",
  "anthropic",
  "gemini",
  "grok",
  "deepseek",
  "openrouter",
  "ollama",
  "lmstudio",
] as const;

const PROVIDER_CONFIG: Record<string, { label: string; gradient: string; text: string }> = {
  openai: { label: "OpenAI", gradient: "from-green-500/10 to-emerald-500/5 border-green-500/20", text: "text-green-600 dark:text-green-300" },
  anthropic: { label: "Anthropic", gradient: "from-orange-500/10 to-amber-500/5 border-orange-500/20", text: "text-orange-600 dark:text-orange-300" },
  gemini: { label: "Gemini", gradient: "from-blue-500/10 to-indigo-500/5 border-blue-500/20", text: "text-blue-600 dark:text-blue-300" },
  grok: { label: "Grok", gradient: "from-zinc-500/10 to-zinc-700/5 border-zinc-500/20", text: "text-zinc-600 dark:text-zinc-300" },
  deepseek: { label: "DeepSeek", gradient: "from-cyan-500/10 to-blue-500/5 border-cyan-500/20", text: "text-cyan-600 dark:text-cyan-300" },
  openrouter: { label: "OpenRouter", gradient: "from-purple-500/10 to-pink-500/5 border-purple-500/20", text: "text-purple-600 dark:text-purple-300" },
  ollama: { label: "Ollama", gradient: "from-teal-500/10 to-cyan-500/5 border-teal-500/20", text: "text-teal-600 dark:text-teal-300" },
  lmstudio: { label: "LM Studio", gradient: "from-indigo-500/10 to-purple-500/5 border-indigo-500/20", text: "text-indigo-600 dark:text-indigo-300" },
};

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

const DEFAULT_MODELS: Record<string, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-sonnet-4-5",
  gemini: "gemini-2.0-flash",
  grok: "grok-3",
  deepseek: "deepseek-chat",
  openrouter: "google/gemini-2.0-flash-001",
  ollama: "llama3",
  lmstudio: "model",
};

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  gemini: "https://generativelanguage.googleapis.com/v1beta",
  grok: "https://api.x.ai/v1",
  deepseek: "https://api.deepseek.com/v1",
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434",
  lmstudio: "http://localhost:1234/v1",
};

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

type SetupPhase = "intro" | "configure" | "done";

/**
 * One-time AI setup popup shown after onboarding is completed.
 * Allows first-time users to optionally configure an AI provider
 * or skip the setup entirely.
 */
export function AiSetupPopup() {
  const hasOnboarded = useAtlasStore((s) => s.hasOnboarded);
  const profile = useAtlasStore((s) => s.profile);
  const updateProfile = useAtlasStore((s) => s.updateProfile);
  const saveProvider = useAtlasStore((s) => s.saveProvider);
  const setActiveProvider = useAtlasStore((s) => s.setActiveProvider);

  const [phase, setPhase] = useState<SetupPhase>("intro");
  const [selectedProvider, setSelectedProvider] = useState("gemini");
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState(DEFAULT_BASE_URLS.gemini);
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODELS.gemini);
  const [customModel, setCustomModel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissedLocal, setDismissedLocal] = useState(false);

  useEffect(() => {
    if (profile?.id) {
      const isDismissed = localStorage.getItem(`atlas_ai_setup_dismissed_${profile.id}`) === "true";
      if (isDismissed) {
        setDismissedLocal(true);
      }
    }
  }, [profile?.id]);

  // Only show for onboarded users who haven't dismissed yet
  if (!hasOnboarded || profile?.aiSetupDismissed || dismissedLocal) return null;

  const isLocalProvider = selectedProvider === "ollama" || selectedProvider === "lmstudio";

  const handleSelectProvider = (provider: string) => {
    setSelectedProvider(provider);
    setApiKey("");
    setBaseUrl(DEFAULT_BASE_URLS[provider] || "");
    const defaultModel = DEFAULT_MODELS[provider] || "";
    setSelectedModel(defaultModel);
    setCustomModel("");
    setError(null);
  };

  const handleDismiss = async () => {
    if (profile?.id) {
      localStorage.setItem(`atlas_ai_setup_dismissed_${profile.id}`, "true");
    }
    setDismissedLocal(true);
    await updateProfile({ aiSetupDismissed: true });
  };

  const handleSetup = async () => {
    setSaving(true);
    setError(null);

    const modelToSave = (selectedModel === "custom" ? customModel.trim() : selectedModel) || DEFAULT_MODELS[selectedProvider];

    if (selectedModel === "custom" && !customModel.trim()) {
      setError("Please specify a custom model name.");
      setSaving(false);
      return;
    }

    try {
      const providerId = createId("provider");
      const providerConfig: AiProviderSettings = {
        id: providerId,
        type: selectedProvider as AiProviderSettings["type"],
        label: PROVIDER_CONFIG[selectedProvider]?.label || selectedProvider,
        model: modelToSave,
        temperature: 0.7,
        contextLength: 8000,
        streaming: true,
        enabled: true,
        baseUrl: baseUrl || DEFAULT_BASE_URLS[selectedProvider] || "",
      };

      let finalModel = providerConfig.model;
      let encryptedKey: EncryptedSecret | undefined;

      if (apiKey && !isLocalProvider) {
        encryptedKey = await encryptString(apiKey);
        try {
          const fetchedModel = await findFirstSupportedModel(providerConfig, apiKey);
          if (fetchedModel) finalModel = fetchedModel;
        } catch {
          // Validation failed but key might still work — save anyway
        }
      } else if (isLocalProvider) {
        try {
          const fetchedModel = await findFirstSupportedModel(providerConfig, "local-key");
          if (fetchedModel) finalModel = fetchedModel;
        } catch {
          // Local server might not be running right now — save anyway
        }
      }

      const finalProvider: AiProviderSettings = {
        ...providerConfig,
        model: finalModel,
        apiKey: encryptedKey,
        enabled: true,
      };

      if (profile?.id) {
        localStorage.setItem(`atlas_ai_setup_dismissed_${profile.id}`, "true");
      }
      setDismissedLocal(true);
      await saveProvider(finalProvider, apiKey || undefined);
      await setActiveProvider(providerId);
      await updateProfile({ aiSetupDismissed: true });
      setPhase("done");
    } catch (e: any) {
      setError(e.message || "Failed to save provider. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const displayModels = DEFAULT_MODELS_BY_PROVIDER[selectedProvider] || [];
  const isCustomModel = selectedModel === "custom";

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 16 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`w-full transition-all duration-300 ${phase === "configure" ? "max-w-xl" : "max-w-md"}`}
          >
            <Card className="relative overflow-hidden border border-card-border bg-card shadow-2xl p-0">
              {/* Decorative glow */}
              <div className="absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
              <div className="absolute -left-16 -bottom-16 h-32 w-32 rounded-full bg-teal-500/8 blur-3xl pointer-events-none" />

              {/* Close button */}
              <button
                type="button"
                onClick={handleDismiss}
                className="absolute top-4 right-4 z-10 flex h-8 w-8 items-center justify-center rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition cursor-pointer"
                aria-label="Close AI setup"
              >
                <X size={16} />
              </button>

              <div className="p-6 space-y-5">
                {phase === "intro" && (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-5"
                  >
                    {/* Hero icon */}
                    <div className="flex justify-center">
                      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-400 to-teal-500 text-zinc-950 shadow-[0_8px_24px_rgba(16,185,129,0.25)]">
                        <Bot size={32} />
                        <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-zinc-950">
                          <Sparkles size={11} />
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div className="text-center space-y-2">
                      <h2 className="text-xl font-extrabold tracking-tight text-foreground">
                        Supercharge with AI Coach
                      </h2>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xs mx-auto">
                        Connect an AI provider to unlock personalized workout coaching, 
                        intelligent nutrition tips, and auto-generated training plans.
                      </p>
                    </div>

                    {/* Feature list */}
                    <div className="space-y-2.5">
                      {[
                        "AI-generated workout plans tailored to your body",
                        "Smart nutrition coaching with allergy awareness",
                        "Real-time form tips and progression advice",
                      ].map((feature) => (
                        <div key={feature} className="flex items-start gap-2.5">
                          <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-emerald-500/15">
                            <Check size={10} className="text-emerald-500" />
                          </div>
                          <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">{feature}</p>
                        </div>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="space-y-2.5 pt-2">
                      <Button
                        type="button"
                        variant="primary"
                        className="w-full gap-2"
                        onClick={() => setPhase("configure")}
                        icon={<ArrowRight size={16} />}
                      >
                        Set Up AI Coach
                      </Button>
                      <button
                        type="button"
                        onClick={handleDismiss}
                        className="w-full py-2.5 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition cursor-pointer"
                      >
                        Skip for now — I'll set it up later in Settings
                      </button>
                    </div>
                  </motion.div>
                )}

                {phase === "configure" && (
                  <motion.div
                    key="configure"
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -8 }}
                    className="space-y-4"
                  >
                    <div>
                      <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Bot size={18} className="text-emerald-500" />
                        Configure Provider
                      </h2>
                      <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                        Select your AI provider and enter your details. Your keys are encrypted locally before storage.
                      </p>
                    </div>

                    {/* Provider selector grid */}
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400 select-none">AI Provider</Label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 select-none">
                        {PROVIDER_TYPES.map((type) => {
                          const config = PROVIDER_CONFIG[type];
                          const active = selectedProvider === type;
                          return (
                            <button
                              type="button"
                              className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl border text-center transition-all duration-300 hover:scale-[1.02] cursor-pointer ${active
                                  ? `bg-gradient-to-br ${config.gradient} shadow-lg border-emerald-500/20`
                                  : "border-card-border bg-zinc-900/40 text-zinc-400 hover:text-zinc-100"
                                }`}
                              key={type}
                              onClick={() => handleSelectProvider(type)}
                            >
                              <div className={`text-xs font-black tracking-tight leading-none ${active ? config.text : "text-zinc-300"}`}>
                                {config.label}
                              </div>
                              <div className="text-[10px] text-zinc-500 mt-1.5 uppercase tracking-wider font-mono leading-none">
                                {type}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Setup Guides */}
                    {(() => {
                      const helper = getProviderInstructions(selectedProvider);
                      if (!helper) return null;
                      return (
                        <div className="p-3.5 bg-emerald-500/5 border border-emerald-500/10 text-zinc-300 rounded-2xl space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/10 text-emerald-400">
                              <Sparkles size={11} className="stroke-[2.5]" />
                            </div>
                            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 font-mono">
                              {helper.title} Steps
                            </span>
                          </div>
                          <ol className="list-decimal pl-4 text-[11px] text-zinc-400 space-y-1 font-medium">
                            {helper.steps.map((st, i) => (
                              <li key={i} className="leading-relaxed">{st}</li>
                            ))}
                          </ol>
                          {helper.url && (
                            <a
                              href={helper.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-450 hover:text-emerald-300 underline underline-offset-2 transition"
                            >
                              Go to Console Website <ExternalLink size={10} />
                            </a>
                          )}
                        </div>
                      );
                    })()}

                    {/* Endpoint config form */}
                    {(selectedProvider === "ollama" || selectedProvider === "lmstudio") && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Base URL</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Server size={14} />
                          </span>
                          <Input
                            maxLength={200}
                            value={baseUrl}
                            onChange={(e) => setBaseUrl(e.target.value)}
                            placeholder="e.g. http://localhost:11434"
                            className="text-xs font-mono font-bold pl-9"
                          />
                        </div>
                      </div>
                    )}

                    {/* API Key input */}
                    {!isLocalProvider && (
                      <div className="space-y-1.5">
                        <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">API Key</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                            <Lock size={14} />
                          </span>
                          <Input
                            type={showApiKey ? "text" : "password"}
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder={`Paste your ${PROVIDER_CONFIG[selectedProvider]?.label || ""} API key`}
                            className="text-xs font-mono pl-9 pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowApiKey(!showApiKey)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-350 transition-colors cursor-pointer"
                          >
                            {showApiKey ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>
                        <p className="text-[10px] text-zinc-500 leading-relaxed">
                          🔒 Your key is encrypted with AES-255 before being stored. It never leaves your device unencrypted.
                        </p>
                      </div>
                    )}

                    {/* Model selection */}
                    <div className="space-y-1.5">
                      <Label className="text-xs font-bold uppercase tracking-wider text-zinc-400">Model</Label>
                      <Select
                        value={isCustomModel ? "custom" : selectedModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSelectedModel(val);
                          if (val === "custom") {
                            setCustomModel("");
                          }
                          setError(null);
                        }}
                      >
                        {displayModels.map((m) => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                        <option value="custom">Custom Model Name...</option>
                      </Select>

                      {isCustomModel && (
                        <div className="mt-2">
                          <Input
                            value={customModel}
                            onChange={(e) => setCustomModel(e.target.value)}
                            placeholder="Type custom model name (e.g. gpt-4-32k)"
                            className="text-xs font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>

                    {error && (
                      <div className="rounded-xl border border-rose-500/20 bg-rose-500/5 p-3 text-xs text-rose-500 font-medium">
                        {error}
                      </div>
                    )}

                    <div className="flex gap-2.5 pt-1">
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setPhase("intro")}
                      >
                        Back
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        className="flex-1 gap-2"
                        disabled={saving || (!isLocalProvider && !apiKey.trim())}
                        onClick={handleSetup}
                        icon={saving ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950 border-t-transparent" />
                        ) : (
                          <Sparkles size={16} />
                        )}
                      >
                        {saving ? "Connecting..." : "Save & Activate"}
                      </Button>
                    </div>

                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="w-full py-2 text-xs font-semibold text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition cursor-pointer"
                    >
                      Skip for now
                    </button>
                  </motion.div>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
