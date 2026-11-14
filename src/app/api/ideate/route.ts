import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { ideateFromSourcePost } from "@/lib/ai";
import { SourcePost } from "@/lib/types";

const requestSchema = z.object({
  rawText: z.string().min(10, "Please paste a social media post (at least 10 characters)."),
  sourcePlatform: z.string().optional(),
  sourceUrl: z.string().optional(),
  brandVoice: z.string().default("Direct, practical, zero fluff"),
  targetAudience: z.string().default("Creators, founders, and marketers"),
  ctaPreference: z.string().default("Save this post and follow for more"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const sourcePost: SourcePost = {
      id: `src-${Date.now()}`,
      rawText: parsed.data.rawText,
      sourcePlatform: parsed.data.sourcePlatform,
      sourceUrl: parsed.data.sourceUrl,
      brandVoice: parsed.data.brandVoice,
      targetAudience: parsed.data.targetAudience,
      ctaPreference: parsed.data.ctaPreference,
      createdAt: new Date().toISOString(),
    };

    const result = await ideateFromSourcePost(sourcePost);
    return NextResponse.json({ sourcePost, ...result });
  } catch (err) {
    console.error("Ideation error:", err);
    return NextResponse.json(
      { error: "Failed to analyze source post." },
      { status: 500 }
    );
  }
}
