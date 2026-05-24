import {
  AiProviderError,
  type AiProviderAdapter,
  type CoachChatRequest,
  type CoachChatResponse, // Import CoachChatResponse
  type ModelInfo,
  toProviderMessages,
} from "@/lib/ai/types";
import type { AiProviderSettings } from "@/types/domain";

function baseUrl(settings: AiProviderSettings): string {
  return (settings.baseUrl || "https://api.anthropic.com/v1").replace(/\/$/, "");
}

async function parseError(response: Response): Promise<never> {
  let message = `${response.status} ${response.statusText}`;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    message = body.error?.message ?? message;
  } catch {
    // Keep status text.
  }
  throw new AiProviderError(message, response.status);
}

export const anthropicAdapter: AiProviderAdapter = {
  type: "anthropic",
  async chat({ provider, apiKey, messages, systemContext, signal }: CoachChatRequest): Promise<CoachChatResponse> {
    const response = await fetch(`${baseUrl(provider)}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: provider.model,
        max_tokens: 1000,
        temperature: provider.temperature,
        system: `You are Atlas AI Coach, a precise fitness coach. Use this local user context:\n${systemContext}`,
        messages: toProviderMessages(messages)
          .filter((message) => message.role !== "system")
          .map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content,
          })),
      }),
      signal,
    });

    if (!response.ok) await parseError(response);
    const body = (await response.json()) as {
      content?: Array<{ type: string; text?: string }>;
      usage?: {
        input_tokens?: number;
        output_tokens?: number;
      };
    };

    const content = body.content?.map((part) => part.text ?? "").join("") ?? "";
    const tokenCount = (body.usage?.input_tokens ?? 0) + (body.usage?.output_tokens ?? 0);

    return { content, tokenCount };
  },
  async listModels(settings: AiProviderSettings, apiKey: string): Promise<ModelInfo[]> {
    const response = await fetch(`${baseUrl(settings)}/models`, {
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
    });
    if (!response.ok) await parseError(response);
    const body = (await response.json()) as { data?: Array<{ id: string; display_name?: string }> };
    return (body.data ?? []).map((model) => ({
      id: model.id,
      label: model.display_name,
    }));
  },
  async validate(settings: AiProviderSettings, apiKey: string): Promise<boolean> {
    await this.listModels(settings, apiKey);
    return true;
  },
};