import {
  AiProviderError,
  type AiProviderAdapter,
  type CoachChatRequest,
  type CoachChatResponse,
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
  async chat({ provider, apiKey, messages, systemContext, signal }: CoachChatRequest): Promise<CoachChatResponse> {
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
          contents: (() => {
            // Gemini requires:
            // 1. All messages have non-empty content
            // 2. Conversation alternates user/model (no consecutive same-role)
            // 3. First message must be from the user
            const filtered = toProviderMessages(messages)
              .filter((m) => m.role !== "system" && m.content.trim() !== "")
              .map((m) => ({
                role: m.role === "assistant" ? "model" as const : "user" as const,
                parts: [{ text: m.content }],
              }));
            // Drop leading model turns (Gemini must start with user)
            while (filtered.length > 0 && filtered[0].role === "model") {
              filtered.shift();
            }
            return filtered;
          })(),
        }),
        signal,
      },
    );

    if (!response.ok) await parseError(response);
    const body = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const content = body.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";
    const tokenCount = body.usageMetadata?.totalTokenCount ??
                       ((body.usageMetadata?.promptTokenCount ?? 0) + (body.usageMetadata?.candidatesTokenCount ?? 0));

    if (!content.trim()) {
      // Gemini returned no usable text — surface a clear message instead of silently storing ""
      throw new AiProviderError(
        "The AI returned an empty response. This can happen when the model filters content or the conversation history contains empty messages. Please try rephrasing your request.",
      );
    }

    return { content, tokenCount };
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