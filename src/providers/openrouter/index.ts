import { createOpenAiCompatibleAdapter } from "@/providers/openai";

export const openrouterAdapter = createOpenAiCompatibleAdapter(
  "openrouter",
  "https://openrouter.ai/api/v1",
);