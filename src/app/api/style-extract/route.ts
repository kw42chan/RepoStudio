import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { getLlmModels } from "@/lib/llm";
import { rejectNonJson } from "@/lib/json-body";
import { fetchPublic, resolvePublicAddress } from "@/lib/public-fetch";
import { VisualTemplate } from "@/lib/types";

const extractSchema = z.object({
  backgroundColor: z.string(),
  surfaceColor: z.string(),
  textColor: z.string(),
  mutedColor: z.string(),
  accentColor: z.string(),
  fontStyle: z.enum(["sans", "serif", "mono", "bold-display"]),
  layoutMood: z.enum(["clean", "editorial", "bold", "gradient", "card"]),
  description: z.string(),
});

async function resolveUrlToImageAndHints(url: string): Promise<{
  imageUrl?: string;
  themeColor?: string;
  pageTitle?: string;
}> {
  try {
    const target = await resolvePublicAddress(url);
    if (!target) return {};

    const page = await fetchPublic(target, 512 * 1024);
    if (page.status < 200 || page.status >= 300) return {};
    const contentType = String(page.headers["content-type"] || "");
    if (contentType.startsWith("image/")) {
      return {
        imageUrl: `data:${contentType.split(";")[0]};base64,${page.body.toString("base64")}`,
      };
    }

    const html = page.body.toString("utf-8");
    const ogMatch =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    const themeMatch =
      html.match(/<meta[^>]+name=["']theme-color["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+name=["']theme-color["']/i);
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);

    let resolvedImage = ogMatch?.[1];
    if (resolvedImage && !resolvedImage.startsWith("http")) {
      resolvedImage = new URL(resolvedImage, url).toString();
    }

    return {
      imageUrl: resolvedImage,
      themeColor: themeMatch?.[1],
      pageTitle: titleMatch?.[1]?.trim(),
    };
  } catch {
    return {};
  }
}

function deterministicPaletteFromSeed(
  seed: string,
  themeColor?: string,
  toneNotes?: string
): Omit<VisualTemplate, "id" | "name" | "isBuiltIn" | "createdAt"> {
  const lower = `${seed} ${toneNotes || ""}`.toLowerCase();
  const isDark =
    lower.includes("dark") ||
    lower.includes("black") ||
    lower.includes("night") ||
    lower.includes("neon");
  const isWarm =
    lower.includes("warm") ||
    lower.includes("cream") ||
    lower.includes("serif") ||
    lower.includes("editorial");

  let accent = themeColor && /^#[0-9a-f]{3,6}$/i.test(themeColor) ? themeColor : "#2563EB";
  if (!themeColor) {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    const accents = ["#2563EB", "#E11D48", "#059669", "#D97706", "#7C3AED", "#0284C7"];
    accent = accents[Math.abs(hash) % accents.length];
  }

  return {
    description: toneNotes
      ? `Imported style (${toneNotes})`
      : "Extracted from your uploaded template / URL",
    backgroundColor: isDark ? "#0F1117" : isWarm ? "#FBF7F0" : "#F8FAFC",
    surfaceColor: isDark ? "#181B23" : "#FFFFFF",
    textColor: isDark ? "#F8FAFC" : "#0F172A",
    mutedColor: isDark ? "#94A3B8" : "#64748B",
    accentColor: accent,
    fontStyle: isWarm ? "serif" : isDark ? "bold-display" : "sans",
    layoutMood: isDark ? "bold" : isWarm ? "editorial" : "clean",
  };
}

export async function POST(req: NextRequest) {
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = await req.json();
    const {
      name,
      imageDataUrl,
      templateUrl,
      customStyleNotes,
      customToneNotes,
      useAsBackdrop,
    } = body as {
      name?: string;
      imageDataUrl?: string;
      templateUrl?: string;
      customStyleNotes?: string;
      customToneNotes?: string;
      useAsBackdrop?: boolean;
    };

    if (!imageDataUrl && !templateUrl) {
      return NextResponse.json(
        { error: "Provide either an uploaded template image or a template URL." },
        { status: 400 }
      );
    }

    let resolvedImage = imageDataUrl;
    let themeColorHint: string | undefined;
    let pageTitle: string | undefined;

    if (templateUrl) {
      const urlInfo = await resolveUrlToImageAndHints(templateUrl);
      resolvedImage = resolvedImage || urlInfo.imageUrl;
      themeColorHint = urlInfo.themeColor;
      pageTitle = urlInfo.pageTitle;
    }

    let extracted = deterministicPaletteFromSeed(
      templateUrl || name || "custom-template",
      themeColorHint,
      `${customStyleNotes || ""} ${customToneNotes || ""}`
    );

    const llm = getLlmModels();
    if (llm && resolvedImage) {
      try {
        const { object } = await generateObject({
          model: llm.visionModel,
          schema: extractSchema,
          providerOptions: {
            openai: { strictJsonSchema: false },
          },
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: `Analyze this social media carousel visual template and extract its color palette (valid 6-digit hex codes), typography feel, and layout mood.
Optional user notes — Style: ${customStyleNotes || "none"}, Tone: ${customToneNotes || "none"}.
Ensure high readability contrast between backgroundColor and textColor.`,
                },
                {
                  type: "image",
                  image: resolvedImage,
                },
              ],
            },
          ],
        });
        extracted = object;
      } catch {
        // Keep deterministic fallback if vision call fails
      }
    }

    const template: VisualTemplate = {
      id: `tpl-${Date.now()}`,
      name:
        name?.trim() ||
        (pageTitle ? pageTitle.slice(0, 32) : "Custom Imported Template"),
      description: extracted.description,
      isBuiltIn: false,
      backgroundColor: extracted.backgroundColor,
      surfaceColor: extracted.surfaceColor,
      textColor: extracted.textColor,
      mutedColor: extracted.mutedColor,
      accentColor: extracted.accentColor,
      fontStyle: extracted.fontStyle,
      layoutMood: extracted.layoutMood,
      customStyleNotes: customStyleNotes?.trim() || undefined,
      customToneNotes: customToneNotes?.trim() || undefined,
      backdropImageUrl: useAsBackdrop && resolvedImage ? resolvedImage : undefined,
      backdropOpacity: useAsBackdrop && resolvedImage ? 0.16 : undefined,
      sourceUrl: templateUrl?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };

    return NextResponse.json({ template });
  } catch (err) {
    console.error("Style extraction error:", err);
    return NextResponse.json(
      { error: "Failed to extract visual template." },
      { status: 500 }
    );
  }
}
