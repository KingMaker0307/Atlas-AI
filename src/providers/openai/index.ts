import {
  AiProviderError,
  type AiProviderAdapter,
  type CoachChatRequest,
  type ModelInfo,
  toProviderMessages,
} from "@/lib/ai/types";
import type { AiProviderSettings } from "@/types/domain";

function normalizeBaseUrl(baseUrl?: string): string {
  return (baseUrl || "https://api.openai.com/v1").replace(/\/$/, "");
}

async function parseOpenAiError(response: Response): Promise<never> {
  let message = `${response.status} ${response.statusText}`;
  try {
    const body = (await response.json()) as { error?: { message?: string } };
    message = body.error?.message ?? message;
  } catch (e) {
    // Keep the status message, but also log the parsing error
    console.error("Failed to parse OpenAI error response:", e);
  }
  throw new AiProviderError(message, response.status);
}

async function readOpenAiStream(
  response: Response,
  onToken?: (token: string) => void,
): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.replace(/^data:\s*/, "");
      if (data === "[DONE]") return full;
      try {
        const parsed = JSON.parse(data) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const token = parsed.choices?.[0]?.delta?.content ?? "";
        if (token) {
          full += token;
          onToken?.(token);
        }
      } catch {
        // Ignore keepalive or provider-specific stream frames.
      }
    }
  }

  return full;
}

export function createOpenAiCompatibleAdapter(
  type: AiProviderSettings["type"],
  defaultBaseUrl: string,
): AiProviderAdapter {
  return {
    type,
    async chat({
      provider,
      apiKey,
      messages,
      systemContext,
      signal,
      onToken,
    }: CoachChatRequest) {
      try {
        const response = await fetch(`${normalizeBaseUrl(provider.baseUrl ?? defaultBaseUrl)}/chat/completions`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
            "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "https://localhost",
            "X-Title": "Atlas AI Coach",
          },
          body: JSON.stringify({
            model: provider.model,
            temperature: provider.temperature,
            stream: provider.streaming,
            messages: [
              {
                role: "system",
                content:
                  "You are Atlas AI Coach, a precise, supportive fitness coach. Use only the supplied user context and avoid medical diagnosis.",
              },
              { role: "system", content: systemContext },
              ...toProviderMessages(messages).filter((message) => message.role !== "system"),
            ],
          }),
          signal,
        });

        if (!response.ok) await parseOpenAiError(response);

        if (provider.streaming) {
          return readOpenAiStream(response, onToken);
        }

        const body = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        return body.choices?.[0]?.message?.content ?? "";
      } catch (e) {
        if (e instanceof AiProviderError) throw e;
        throw new AiProviderError(e instanceof Error ? e.message : "Load failed");
      }
    },
    async listModels(settings: AiProviderSettings, apiKey: string): Promise<ModelInfo[]> {
      const response = await fetch(`${normalizeBaseUrl(settings.baseUrl ?? defaultBaseUrl)}/models`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      });
      if (!response.ok) await parseOpenAiError(response);
      const body = (await response.json()) as { data?: Array<{ id: string }> };
      return (body.data ?? []).map((model) => ({ id: model.id }));
    },
    async validate(settings: AiProviderSettings, apiKey: string): Promise<boolean> {
      const models = await this.listModels(settings, apiKey);
      return models.length >= 0;
    },
  };
}

export const openAiAdapter = createOpenAiCompatibleAdapter("openai", "https://api.openai.com/v1");