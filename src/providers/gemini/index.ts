import {
  AiProviderError,
  type AiProviderAdapter,
  type CoachChatRequest,
  type ModelInfo,
  toProviderMessages,
} from "@/lib/ai/types";
import type { AiProviderSettings } from "@/types/domain";

function baseUrl(settings: AiProviderSettings): string {
  return (settings.baseUrl || "https://generativelanguage.googleapis.com/v1beta").replace(
    /\/$/,
    "",
  );
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

export const geminiAdapter: AiProviderAdapter = {
  type: "gemini",
  async chat({ provider, apiKey, messages, systemContext, signal }: CoachChatRequest) {
    const response = await fetch(
      `${baseUrl(provider)}/models/${provider.model}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: `You are Atlas AI Coach. Use this local context:\n${systemContext}` }],
          },
          generationConfig: {
            temperature: provider.temperature,
          },
          contents: toProviderMessages(messages)
            .filter((message) => message.role !== "system")
            .map((message) => ({
              role: message.role === "assistant" ? "model" : "user",
              parts: [{ text: message.content }],
            })),
        }),
        signal,
      },
    );

    if (!response.ok) await parseError(response);
    const body = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };

    return body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
  },
  async listModels(settings: AiProviderSettings, apiKey: string): Promise<ModelInfo[]> {
    const response = await fetch(`${baseUrl(settings)}/models?key=${encodeURIComponent(apiKey)}`);
    if (!response.ok) await parseError(response);
    const body = (await response.json()) as { models?: Array<{ name: string; displayName?: string }> };
    return (body.models ?? []).map((model) => ({
      id: model.name.replace(/^models\//, ""),
      label: model.displayName,
    }));
  },
  async validate(settings: AiProviderSettings, apiKey: string): Promise<boolean> {
    await this.listModels(settings, apiKey);
    return true;
  },
};
