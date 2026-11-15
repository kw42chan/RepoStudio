import { createOpenAI, openai } from "@ai-sdk/openai";
import { z } from "zod";

const DEFAULT_TEXT_MODEL = "openai/gpt-4o-mini";
const DEFAULT_VISION_MODEL = "google/gemini-2.5-flash";

export function getLlmModels() {
  const openrouterKey = process.env.OPENROUTER_API_KEY;
  if (openrouterKey) {
    const openrouter = createOpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: openrouterKey,
      headers: {
        "HTTP-Referer": "https://repostudio.apps.grok.bot",
        "X-Title": "RepoStudio",
      },
    });
    const textModelId = process.env.OPENROUTER_MODEL || DEFAULT_TEXT_MODEL;
    const visionModelId =
      process.env.OPENROUTER_VISION_MODEL ||
      process.env.OPENROUTER_MODEL ||
      DEFAULT_VISION_MODEL;

    // OpenRouter serves /chat/completions. The default provider call uses
    // OpenAI's /responses endpoint, which OpenRouter does not implement.
    return {
      provider: "openrouter" as const,
      textModel: openrouter.chat(textModelId),
      visionModel: openrouter.chat(visionModelId),
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

function parseJsonContent(content: string): unknown {
  const trimmed = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  const json =
    start >= 0 && end > start ? trimmed.slice(start, end + 1) : trimmed;
  return JSON.parse(json);
}

export async function completeOpenRouterJson<T>(
  schema: z.ZodType<T>,
  prompt: string
): Promise<T> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is not set.");
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_TEXT_MODEL;
  let lastError = "OpenRouter returned JSON that did not match the expected shape.";

  for (let attempt = 0; attempt < 2; attempt++) {
    const messages = [
      {
        role: "system",
        content:
          "You are a social media strategist. Reply with one JSON object only. Do not wrap it in markdown.",
      },
      { role: "user", content: prompt },
    ];
    if (attempt === 1) {
      messages.push({
        role: "user",
        content: `The previous JSON failed validation: ${lastError}. Return corrected JSON only.`,
      });
    }

    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://repostudio.apps.grok.bot",
        "X-Title": "RepoStudio",
      },
      body: JSON.stringify({
        model,
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages,
      }),
      signal: AbortSignal.timeout(45_000),
    });

    const payload = (await res.json().catch(() => null)) as {
      error?: { message?: string };
      choices?: Array<{ message?: { content?: string | null } }>;
    } | null;

    if (!res.ok) {
      const message =
        payload?.error?.message || `OpenRouter request failed (${res.status}).`;
      if (res.status >= 500 || res.status === 429) {
        lastError = message;
        continue;
      }
      throw new Error(message);
    }

    const content = payload?.choices?.[0]?.message?.content;
    if (!content) {
      lastError = "OpenRouter returned an empty response.";
      continue;
    }

    try {
      const checked = schema.safeParse(parseJsonContent(content));
      if (checked.success) return checked.data;
      lastError = checked.error.issues
        .slice(0, 4)
        .map((issue) => `${issue.path.join(".") || "response"}: ${issue.message}`)
        .join("; ");
    } catch {
      lastError = "OpenRouter did not return valid JSON.";
    }
  }

  throw new Error(lastError);
}
