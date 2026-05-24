import { anthropicAdapter } from "./anthropic";
import { geminiAdapter } from "./gemini";
import { ollamaAdapter } from "./ollama";
import { openrouterAdapter } from "./openrouter";
import { openaiAdapter } from "./openai";
import type { AiProviderAdapter, ModelInfo } from "@/lib/ai/types";
import type { AiProviderSettings } from "@/types/domain";

const providerAdapters: Record<AiProviderSettings["type"], AiProviderAdapter> = {
  openai: openaiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  openrouter: openrouterAdapter,
  ollama: ollamaAdapter,
  lmstudio: openaiAdapter,
  grok: openaiAdapter,
  deepseek: openaiAdapter,
  custom: openaiAdapter,
};

export function getProviderAdapter(type: AiProviderSettings["type"]): AiProviderAdapter {
  return providerAdapters[type];
}

export async function findFirstSupportedModel(
  provider: AiProviderSettings,
  apiKey: string,
): Promise<string | undefined> {
  const adapter = getProviderAdapter(provider.type);
  try {
    const models = await adapter.listModels(provider, apiKey);
    return models.find((model) => model.supportsGenerateContent)?.id;
  } catch {
    return undefined;
  }
}