import type { AiMessage, AiProviderSettings } from "@/types/domain";

export interface CoachChatRequest {
  provider: AiProviderSettings;
  apiKey: string;
  messages: AiMessage[];
  systemContext: string;
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface CoachChatResponse {
  content: string;
  tokenCount?: number; // Added tokenCount
}

export interface ModelInfo {
  id: string;
  label?: string;
}

export interface AiProviderAdapter {
  type: AiProviderSettings["type"];
  chat(request: CoachChatRequest): Promise<CoachChatResponse>; // Updated return type
  listModels(settings: AiProviderSettings, apiKey: string): Promise<ModelInfo[]>;
  validate(settings: AiProviderSettings, apiKey: string): Promise<boolean>;
}

export class AiProviderError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
  ) {
    super(message);
    this.name = "AiProviderError";
  }
}

export function toProviderMessages(messages: AiMessage[]): Array<{
  role: "user" | "assistant" | "system";
  content: string;
}> {
  return messages.map((message) => ({
    role: message.role,
    content: message.content,
  }));
}