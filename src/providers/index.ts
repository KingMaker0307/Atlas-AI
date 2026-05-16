import { anthropicAdapter } from "@/providers/anthropic";
import { geminiAdapter } from "@/providers/gemini";
import { ollamaAdapter } from "@/providers/ollama";
import { createOpenAiCompatibleAdapter, openAiAdapter } from "@/providers/openai";
import { openRouterAdapter } from "@/providers/openrouter";
import type { AiProviderAdapter } from "@/lib/ai/types";
import type { AiProviderSettings } from "@/types/domain";

const deepSeekAdapter = createOpenAiCompatibleAdapter("deepseek", "https://api.deepseek.com/v1");
const grokAdapter = createOpenAiCompatibleAdapter("grok", "https://api.x.ai/v1");
const lmStudioAdapter = createOpenAiCompatibleAdapter("lmstudio", "http://localhost:1234/v1");
const customAdapter = createOpenAiCompatibleAdapter("custom", "http://localhost:1234/v1");

const adapters: Record<AiProviderSettings["type"], AiProviderAdapter> = {
  openai: openAiAdapter,
  anthropic: anthropicAdapter,
  gemini: geminiAdapter,
  grok: grokAdapter,
  deepseek: deepSeekAdapter,
  ollama: ollamaAdapter,
  lmstudio: lmStudioAdapter,
  openrouter: openRouterAdapter,
  custom: customAdapter,
};

export function getProviderAdapter(type: AiProviderSettings["type"]): AiProviderAdapter {
  return adapters[type] ?? customAdapter;
}
