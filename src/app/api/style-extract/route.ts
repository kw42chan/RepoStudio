import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import net from "net";
import { generateObject } from "ai";
import { z } from "zod";
import { getLlmModels } from "@/lib/llm";
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

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80")
    );
  }
  return true;
}

async function isSafePublicUrl(rawUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (net.isIP(host)) return !isPrivateIp(host);
    const resolved = await dns.lookup(host, { all: true });
    if (resolved.length === 0) return false;
    return resolved.every((entry) => !isPrivateIp(entry.address));
  } catch {
    return false;
  }
}

async function resolveUrlToImageAndHints(url: string): Promise<{
  imageUrl?: string;
  themeColor?: string;
  pageTitle?: string;
}> {
  try {
    if (!(await isSafePublicUrl(url))) {
      return {};
    }

    const res = await fetch(url, {
      headers: { "User-Agent": "RepoStudio-TemplateImporter/1.0" },
      redirect: "error",
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return {};
    const contentType = res.headers.get("content-type") || "";
    if (contentType.startsWith("image/")) {
      const buf = Buffer.from(await res.arrayBuffer());
      const base64 = buf.toString("base64");
      return { imageUrl: `data:${contentType};base64,${base64}` };
    }

    const html = await res.text();
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
