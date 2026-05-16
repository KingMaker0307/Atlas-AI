import { createOpenAiCompatibleAdapter } from "@/providers/openai";

export const openRouterAdapter = createOpenAiCompatibleAdapter(
  "openrouter",
  "https://openrouter.ai/api/v1",
);
