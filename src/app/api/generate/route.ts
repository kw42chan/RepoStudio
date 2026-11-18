import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateContentForFormats } from "@/lib/ai";
import { rejectNonJson } from "@/lib/json-body";
import { readStore } from "@/lib/store";
import { requireViewer } from "@/lib/viewer";

export const maxDuration = 60;

const requestSchema = z.object({
  sourcePost: z.object({
    id: z.string(),
    rawText: z.string(),
    sourcePlatform: z.string().optional(),
    sourceUrl: z.string().optional(),
    brandVoice: z.string(),
    targetAudience: z.string(),
    ctaPreference: z.string(),
    createdAt: z.string(),
  }),
  idea: z.object({
    id: z.string(),
    angleType: z.string(),
    title: z.string(),
    hook: z.string(),
    summary: z.string(),
    rationale: z.string(),
    formatFit: z.object({
      reel: z.number(),
      igCarousel: z.number(),
      liCarousel: z.number(),
    }),
  }),
  formats: z
    .array(z.enum(["reel", "ig_carousel", "li_carousel"]))
    .min(1),
  writingStyle: z.object({
    styleId: z.enum([
      "educational",
      "contrarian",
      "storytelling",
      "tactical",
      "myth-buster",
      "minimalist",
      "custom",
    ]),
    customStyle: z.string().optional(),
    customTone: z.string().optional(),
  }),
  visualTemplateId: z.string().default("minimal-light"),
  aspectRatio: z.enum(["4:5", "1:1"]).default("4:5"),
  brandHandle: z.string().default("@yourbrand"),
  layoutPackIds: z
    .object({
      instagram: z.string().optional(),
      linkedin: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const viewer = await requireViewer(req);
    if (viewer) return viewer;
    const rejected = rejectNonJson(req);
    if (rejected) return rejected;
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid generate payload" },
        { status: 400 }
      );
    }

    const store = await readStore();
    const generated = await generateContentForFormats({
      ...parsed.data,
      userLayoutPacks: store.layoutPacks,
    });
    return NextResponse.json(generated);
  } catch (err) {
    console.error("Generation error:", err);
    const message =
      err instanceof Error ? err.message : "Failed to generate content.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
