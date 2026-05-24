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
  return (settings.baseUrl || "http://localhost:11434").replace(/\/$/, "");
}

async function parseError(response: Response): Promise<never> {
  throw new AiProviderError(`${response.status} ${response.statusText}`, response.status);
}

export const ollamaAdapter: AiProviderAdapter = {
  type: "ollama",
  async chat(request: CoachChatRequest): Promise<CoachChatResponse> {
    const response = await fetch(`${baseUrl(request.provider)}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: request.provider.model,
        stream: false,
        options: {
          temperature: request.provider.temperature,
          num_ctx: request.provider.contextLength,
        },
        messages: [
          {
            role: "system",
            content: `You are Atlas AI Coach. Use this local user context:\n${request.systemContext}`,
          },
          ...toProviderMessages(request.messages).filter((message) => message.role !== "system"),
        ],
      }),
      signal: request.signal,
    });

    if (!response.ok) await parseError(response);
    const body = (await response.json()) as {
      message?: { content?: string };
      prompt_eval_count?: number;
      eval_count?: number;
    };

    const content = body.message?.content ?? "";
    const tokenCount = (body.prompt_eval_count ?? 0) + (body.eval_count ?? 0); // Ollama reports prompt_eval_count and eval_count

    return { content, tokenCount };
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