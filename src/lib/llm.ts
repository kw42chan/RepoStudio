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

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : {};
}

function coerceModelJson(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const obj = { ...asRecord(value) };

  if (typeof obj.hashtags === "string") {
    obj.hashtags = obj.hashtags.split(/[\s,]+/).filter(Boolean);
  }

  if (Array.isArray(obj.beats)) {
    const beats = obj.beats.slice(0, 8).map((beat, index) => {
      const item = asRecord(beat);
      return {
        id: String(item.id || `beat-${index + 1}`),
        timeframe: String(item.timeframe || item.time || `0:${index * 5}`),
        spokenLine: String(
          item.spokenLine || item.spoken || item.line || item.script || ""
        ),
        onScreenText: String(
          item.onScreenText || item.on_screen_text || item.overlay || item.text || ""
        ),
        visualCue: String(item.visualCue || item.visual || item.broll || ""),
      };
    });
    while (beats.length < 4) {
      const index = beats.length;
      beats.push({
        id: `beat-${index + 1}`,
        timeframe: `0:${index * 5}`,
        spokenLine: "",
        onScreenText: "",
        visualCue: "",
      });
    }
    obj.beats = beats;
  }

  if (Array.isArray(obj.slides)) {
    const slides = obj.slides.slice(0, 10).map((slide, index) => {
      const item = asRecord(slide);
      const roleRaw = String(item.role || (index === 0 ? "cover" : "body")).toLowerCase();
      const role = roleRaw === "cover" || roleRaw === "cta" ? roleRaw : "body";
      return {
        id: String(item.id || `slide-${index + 1}`),
        slideNumber: Number(item.slideNumber || index + 1),
        role,
        eyebrow: item.eyebrow ? String(item.eyebrow) : undefined,
        headline: String(item.headline || item.title || ""),
        body: String(item.body || item.copy || item.text || ""),
        visualDirection: String(item.visualDirection || item.visual || ""),
      };
    });
    while (slides.length < 5) {
      const index = slides.length;
      slides.push({
        id: `slide-${index + 1}`,
        slideNumber: index + 1,
        role: index === 0 ? "cover" : "body",
        eyebrow: undefined,
        headline: "",
        body: "",
        visualDirection: "",
      });
    }
    obj.slides = slides;
  }

  if (obj.formatFit && typeof obj.formatFit === "object") {
    const fit = asRecord(obj.formatFit);
    obj.formatFit = {
      reel: Number(fit.reel ?? 80),
      igCarousel: Number(fit.igCarousel ?? fit.ig_carousel ?? 80),
      liCarousel: Number(fit.liCarousel ?? fit.li_carousel ?? 80),
    };
  }

  if (Array.isArray(obj.ideas)) {
    obj.ideas = obj.ideas.slice(0, 6).map((idea, index) => {
      const item = asRecord(coerceModelJson(idea));
      return {
        ...item,
        id: String(item.id || `idea-${index + 1}`),
      };
    });
  }

  return obj;
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
  return coerceModelJson(JSON.parse(json));
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
