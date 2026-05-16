import {
  AiProviderError,
  type AiProviderAdapter,
  type CoachChatRequest,
  type ModelInfo,
  toProviderMessages,
} from "@/lib/ai/types";
import type { AiProviderSettings } from "@/types/domain";

function baseUrl(settings: AiProviderSettings): string {
  return (settings.baseUrl || "http://localhost:11434").replace(/\/$/, "");
}

async function parseError(response: Response): Promise<never> {
  throw new AiProviderError(`${response.status} ${response.statusText}`, response.status);
}

export const ollamaAdapter: AiProviderAdapter = {
  type: "ollama",
  async chat({ provider, messages, systemContext, signal }: CoachChatRequest) {
    const response = await fetch(`${baseUrl(provider)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: provider.model,
        stream: false,
        options: {
          temperature: provider.temperature,
          num_ctx: provider.contextLength,
        },
        messages: [
          {
            role: "system",
            content: `You are Atlas AI Coach. Use this local user context:\n${systemContext}`,
          },
          ...toProviderMessages(messages).filter((message) => message.role !== "system"),
        ],
      }),
      signal,
    });

    if (!response.ok) await parseError(response);
    const body = (await response.json()) as { message?: { content?: string } };
    return body.message?.content ?? "";
  },
  async listModels(settings: AiProviderSettings): Promise<ModelInfo[]> {
    const response = await fetch(`${baseUrl(settings)}/api/tags`);
    if (!response.ok) await parseError(response);
    const body = (await response.json()) as { models?: Array<{ name: string }> };
    return (body.models ?? []).map((model) => ({ id: model.name }));
  },
  async validate(settings: AiProviderSettings): Promise<boolean> {
    await this.listModels(settings, "");
    return true;
  },
};
