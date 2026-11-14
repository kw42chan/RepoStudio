import { createOpenAI, openai } from "@ai-sdk/openai";

export function getLlmModels() {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openrouterKey,
      headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3100",
        "X-Title": "RepoStudio",
      },
    });
    const textModelId = process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini";
    const visionModelId =
      process.env.OPENROUTER_VISION_MODEL ||
      process.env.OPENROUTER_MODEL ||
      "google/gemini-2.5-flash";

    return {
      provider: "openrouter" as const,
      textModel: openrouter(textModelId),
      visionModel: openrouter(visionModelId),
    };
  }

  if (process.env.OPENAI_API_KEY) {
    return {
      provider: "openai" as const,
      textModel: openai("gpt-4o-mini"),
      visionModel: openai("gpt-4o-mini"),
    };
  }

  return null;
}
