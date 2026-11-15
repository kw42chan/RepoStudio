import { generateObject } from "ai";
import { z } from "zod";
import { sameLanguageRule } from "./language";
import { completeOpenRouterJson, getLlmModels } from "./llm";
import {
  AspectRatio,
  CarouselContent,
  ContentFormat,
  IdeationResult,
  ReelContent,
  RepurposeIdea,
  SourcePost,
  WritingStyleConfig,
} from "./types";
import { WRITING_STYLES } from "./presets";
import { spokenTextFromTranscript } from "./transcript";

const ideationSchema = z.object({
  sourceAnalysis: z.object({
    coreHookPattern: z.string(),
    keyInsight: z.string(),
    structureBreakdown: z.string(),
  }),
  ideas: z
    .array(
      z.object({
        id: z.string(),
        angleType: z.string(),
        title: z.string(),
        hook: z.string(),
        summary: z.string(),
        rationale: z.string(),
        formatFit: z.object({
          reel: z.number().min(1).max(100),
          igCarousel: z.number().min(1).max(100),
          liCarousel: z.number().min(1).max(100),
        }),
      })
    )
    .min(4)
    .max(6),
});

const reelSchema = z.object({
  hook: z.string(),
  estimatedDuration: z.string(),
  beats: z
    .array(
      z.object({
        id: z.string(),
        timeframe: z.string(),
        spokenLine: z.string(),
        onScreenText: z.string(),
        visualCue: z.string(),
      })
    )
    .min(4)
    .max(7),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

const carouselSchema = z.object({
  title: z.string(),
  slides: z
    .array(
      z.object({
        id: z.string(),
        slideNumber: z.number(),
        role: z.enum(["cover", "body", "cta"]),
        eyebrow: z.string().optional(),
        headline: z.string(),
        body: z.string(),
        visualDirection: z.string(),
      })
    )
    .min(5)
    .max(10),
  caption: z.string(),
  hashtags: z.array(z.string()),
});

function extractKeyLines(rawText: string): string[] {
  return rawText
    .split(/\n+/)
    .map((line) => line.replace(/^[-*•\d.)\s]+/, "").trim())
    .filter((line) => line.length > 12);
}

function describeWritingStyle(style: WritingStyleConfig): string {
  const preset = WRITING_STYLES.find((s) => s.id === style.styleId);
  const parts: string[] = [];
  if (preset && preset.id !== "custom") {
    parts.push(`${preset.label} (${preset.description})`);
  }
  if (style.customStyle?.trim()) {
    parts.push(`Custom style direction: ${style.customStyle.trim()}`);
  }
  if (style.customTone?.trim()) {
    parts.push(`Custom tone: ${style.customTone.trim()}`);
  }
  return parts.length > 0 ? parts.join(" | ") : "Educational / How-To";
}

function buildMockIdeation(source: SourcePost): IdeationResult {
  const lines = extractKeyLines(source.rawText);
  const firstLine =
    lines[0] || "Most creators overlook the highest-leverage part of this workflow.";
  const secondLine =
    lines[1] || "Small structural changes compound faster than adding more volume.";
  const thirdLine =
    lines[2] || "Focus on one repeatable system you can ship every week.";

  const topicSnippet =
    firstLine.length > 72 ? `${firstLine.slice(0, 69)}...` : firstLine;

  const ideas: RepurposeIdea[] = [
    {
      id: `idea-1-${Date.now()}`,
      angleType: "Contrarian Reframe",
      title: "Why the common advice fails here",
      hook: `Stop doing more. Fix the bottleneck first: "${topicSnippet}"`,
      summary: `Flips the original post into a sharp contrarian argument tailored for ${source.targetAudience || "your audience"}, contrasting noisy tactics with the core leverage point.`,
      rationale:
        "Contrarian hooks drive strong watch-through on Reels and high comment engagement on LinkedIn.",
      formatFit: { reel: 94, igCarousel: 82, liCarousel: 89 },
    },
    {
      id: `idea-2-${Date.now()}`,
      angleType: "Step-by-Step Playbook",
      title: "The 5-step execution breakdown",
      hook: "Steal this exact playbook we used to turn insight into results",
      summary: `Turns "${secondLine.slice(0, 60)}" into a save-worthy, slide-by-slide operating checklist.`,
      rationale:
        "Actionable frameworks are the #1 driver of Instagram Carousel saves and LinkedIn document downloads.",
      formatFit: { reel: 78, igCarousel: 96, liCarousel: 95 },
    },
    {
      id: `idea-3-${Date.now()}`,
      angleType: "Myth vs. Reality",
      title: "What people think vs. what actually works",
      hook: "3 myths costing you momentum right now (and what to do instead)",
      summary: `Uses the contrast inside the source post ("${thirdLine.slice(0, 55)}") to build side-by-side myth/reality slides.`,
      rationale:
        "Side-by-side comparisons are scannable on 1080×1350 slides and keep viewers swiping to the CTA.",
      formatFit: { reel: 85, igCarousel: 91, liCarousel: 87 },
    },
    {
      id: `idea-4-${Date.now()}`,
      angleType: "Founder / Operator Story",
      title: "Behind-the-scenes teardown",
      hook: "We changed one thing in our workflow and everything clicked",
      summary: `Frames the source post as a personal behind-the-scenes case study in a ${source.brandVoice || "direct, practical"} voice.`,
      rationale:
        "Story-led hooks perform strongly for talking-head Reels and authentic LinkedIn narrative carousels.",
      formatFit: { reel: 92, igCarousel: 84, liCarousel: 90 },
    },
    {
      id: `idea-5-${Date.now()}`,
      angleType: "Rapid-Fire Checklist",
      title: "60-second audit before you publish",
      hook: "Run this 4-point check before your next campaign goes live",
      summary:
        "Distills the source post into a fast, zero-fluff pre-flight checklist your audience can screenshot or save.",
      rationale:
        "High utility density makes this ideal for both short Reels and compact 6-slide carousels.",
      formatFit: { reel: 88, igCarousel: 90, liCarousel: 84 },
    },
  ];

  return {
    sourceAnalysis: {
      coreHookPattern: `Pattern-interrupt statement ("${topicSnippet}") followed by concrete proof.`,
      keyInsight: secondLine,
      structureBreakdown: `Hook -> Problem diagnosis -> ${Math.max(2, lines.length - 2)} tactical proof points -> Actionable takeaway.`,
    },
    ideas,
    usedMock: true,
  };
}

export async function ideateFromSourcePost(
  source: SourcePost
): Promise<IdeationResult> {
  if (source.sourcePlatform === "Transcript") {
    source = {
      ...source,
      rawText: spokenTextFromTranscript(source.rawText),
    };
  }

  const llm = getLlmModels();
  if (!llm) {
    return buildMockIdeation(source);
  }

  try {
    const prompt = `${sameLanguageRule(source.rawText)}

You are an expert social media strategist specializing in repurposing viral posts into high-performing Instagram Reels, Instagram Carousels, and LinkedIn Carousels.

Analyze this copied post and generate 5 distinct repurposing angles:
---
${source.rawText}
---
Brand Voice: ${source.brandVoice}
Target Audience: ${source.targetAudience}
CTA Preference: ${source.ctaPreference}

Return:
1. sourceAnalysis: coreHookPattern, keyInsight, structureBreakdown
2. ideas: exactly 5 objects. Each needs id, angleType, title, hook, summary, rationale, and formatFit with reel, igCarousel, and liCarousel as numbers from 1 to 100.
The angles must be specific to this post's actual claim, not generic marketing advice.`;

    const object = process.env.OPENROUTER_API_KEY
      ? await completeOpenRouterJson(ideationSchema, prompt)
      : (
          await generateObject({
            model: llm.textModel,
            schema: ideationSchema,
            prompt,
          })
        ).object;

    return {
      ...object,
      usedMock: false,
    };
  } catch (err) {
    console.error("Ideation model failed:", err);
    throw err instanceof Error
      ? err
      : new Error("The language model could not generate ideas.");
  }
}

function applyTonePrefix(
  base: string,
  style: WritingStyleConfig
): string {
  if (style.styleId === "contrarian") {
    return `Unpopular opinion: ${base}`;
  }
  if (style.styleId === "myth-buster") {
    return `Myth: You need more volume. Reality: ${base}`;
  }
  if (style.styleId === "minimalist") {
    return base.split(".")[0] + ".";
  }
  return base;
}

function buildMockReel(
  source: SourcePost,
  idea: RepurposeIdea,
  writingStyle: WritingStyleConfig
): ReelContent {
  const lines = extractKeyLines(source.rawText);
  const point1 = lines[1] || idea.summary;
  const point2 = lines[2] || "Replace guesswork with a repeatable 3-step system.";
  const toneNote = writingStyle.customTone
    ? ` (${writingStyle.customTone})`
    : "";

  return {
    hook: applyTonePrefix(idea.hook, writingStyle),
    estimatedDuration: "32s",
    beats: [
      {
        id: "beat-1",
        timeframe: "0:00 – 0:03",
        spokenLine: applyTonePrefix(idea.hook, writingStyle),
        onScreenText: idea.title.toUpperCase(),
        visualCue: "Tight framing to camera, bold kinetic title card on screen.",
      },
      {
        id: "beat-2",
        timeframe: "0:03 – 0:11",
        spokenLine: `Here is why most people get this wrong${toneNote}: ${lines[0] || idea.summary}`,
        onScreenText: "The real bottleneck",
        visualCue: "Cut to screen recording or B-roll showing the common mistake.",
      },
      {
        id: "beat-3",
        timeframe: "0:11 – 0:21",
        spokenLine: `Instead, do this: ${point1}`,
        onScreenText: "Step 1: Fix the core flow",
        visualCue: "Over-the-shoulder shot or clean animated bullet callout.",
      },
      {
        id: "beat-4",
        timeframe: "0:21 – 0:28",
        spokenLine: `Then lock it in with this move: ${point2}`,
        onScreenText: "Step 2: Compound the win",
        visualCue: "Zoom in slightly on key metric or checklist visual.",
      },
      {
        id: "beat-5",
        timeframe: "0:28 – 0:32",
        spokenLine: source.ctaPreference || "Save this Reel and follow for more.",
        onScreenText: "SAVE THIS FOR LATER",
        visualCue: "Point toward caption/save icon with clean end-card.",
      },
    ],
    caption: `${idea.hook}\n\n${idea.summary}\n\n${writingStyle.customStyle ? `Style focus: ${writingStyle.customStyle}\n\n` : ""}${source.ctaPreference || "Save this for your next sprint."}`,
    hashtags: [
      "#contentstrategy",
      "#socialmediamarketing",
      "#instagramreels",
      "#creatorworkflow",
      "#growthmarketing",
    ],
    writingStyle,
  };
}

function buildMockCarousel(
  platform: "instagram" | "linkedin",
  source: SourcePost,
  idea: RepurposeIdea,
  writingStyle: WritingStyleConfig,
  visualTemplateId: string,
  aspectRatio: AspectRatio,
  brandHandle: string
): CarouselContent {
  const lines = extractKeyLines(source.rawText);
  const styleLabel =
    WRITING_STYLES.find((s) => s.id === writingStyle.styleId)?.label ||
    "Custom";

  const isLinkedIn = platform === "linkedin";
  const prefix = isLinkedIn ? "FRAMEWORK" : "PLAYBOOK";

  const slides = [
    {
      id: "slide-1",
      slideNumber: 1,
      role: "cover" as const,
      eyebrow: `${prefix} • ${styleLabel.toUpperCase()}`,
      headline: applyTonePrefix(idea.title, writingStyle),
      body: idea.hook,
      visualDirection:
        "High-contrast cover headline with bold accent rule and swipe indicator.",
    },
    {
      id: "slide-2",
      slideNumber: 2,
      role: "body" as const,
      eyebrow: "01 / THE SHIFT",
      headline: "Stop optimizing the wrong lever",
      body: lines[0] || idea.summary,
      visualDirection: "Clean single-column insight card with subtle divider.",
    },
    {
      id: "slide-3",
      slideNumber: 3,
      role: "body" as const,
      eyebrow: "02 / CORE INSIGHT",
      headline: "Focus on high-leverage execution",
      body:
        lines[1] ||
        "Simplify the first 5 minutes of the experience before scaling traffic.",
      visualDirection: "Numbered highlight block with accent badge.",
    },
    {
      id: "slide-4",
      slideNumber: 4,
      role: "body" as const,
      eyebrow: "03 / ACTION STEP",
      headline: "Remove friction, add clarity",
      body:
        lines[2] ||
        "Replace blank states and vague prompts with concrete, ready-to-use templates.",
      visualDirection: "Two-part comparison or checklist card.",
    },
    {
      id: "slide-5",
      slideNumber: 5,
      role: "body" as const,
      eyebrow: "04 / THE PAYOFF",
      headline: isLinkedIn
        ? "Compounding results without extra spend"
        : "More saves, more shares, less burnout",
      body:
        lines[3] ||
        "When the core system works, every piece of distribution multiplies in value.",
      visualDirection: "Metric callout or summary takeaway box.",
    },
    {
      id: "slide-6",
      slideNumber: 6,
      role: "cta" as const,
      eyebrow: "NEXT STEP",
      headline: isLinkedIn
        ? "Found this breakdown useful?"
        : "Save this for your next post",
      body:
        source.ctaPreference ||
        "Save this carousel, share it with a teammate, and follow for weekly playbooks.",
      visualDirection: "Centered CTA card with handle and follow prompt.",
    },
  ];

  const caption = isLinkedIn
    ? `${idea.hook}\n\nMost teams overcomplicate this. Here is the ${styleLabel.toLowerCase()} breakdown in 6 slides:\n\n1. Identify the real bottleneck\n2. Strip out unnecessary steps\n3. Ship a repeatable system\n\n${source.ctaPreference || "Repost to help someone in your network."}`
    : `${idea.hook}\n\nSwipe through for the full ${styleLabel.toLowerCase()} breakdown ->\n\n${source.ctaPreference || "Save this post so you can reference it later."}`;

  return {
    platform,
    title: idea.title,
    slides,
    caption,
    hashtags: isLinkedIn
      ? ["#ContentStrategy", "#B2BGrowth", "#LinkedInCarousel", "#Marketing"]
      : ["#instagramcarousel", "#contentcreation", "#socialmediatips", "#growth"],
    writingStyle,
    visualTemplateId,
    aspectRatio,
    brandHandle: brandHandle || "@yourbrand",
  };
}

async function generateTextObject<T>(
  schema: z.ZodType<T>,
  prompt: string
): Promise<T> {
  if (process.env.OPENROUTER_API_KEY) {
    return completeOpenRouterJson(schema, prompt);
  }
  const llm = getLlmModels();
  if (!llm) {
    throw new Error("No language model configured.");
  }
  const { object } = await generateObject({
    model: llm.textModel,
    schema,
    prompt,
  });
  return object;
}

export async function generateContentForFormats(params: {
  sourcePost: SourcePost;
  idea: RepurposeIdea;
  formats: ContentFormat[];
  writingStyle: WritingStyleConfig;
  visualTemplateId: string;
  aspectRatio: AspectRatio;
  brandHandle: string;
}): Promise<{
  reel?: ReelContent;
  igCarousel?: CarouselContent;
  liCarousel?: CarouselContent;
  usedMock: boolean;
}> {
  const {
    sourcePost,
    idea,
    formats,
    writingStyle,
    visualTemplateId,
    aspectRatio,
    brandHandle,
  } = params;

  const styleDescription = describeWritingStyle(writingStyle);
  const llm = getLlmModels();

  if (!llm) {
    return {
      reel: formats.includes("reel")
        ? buildMockReel(sourcePost, idea, writingStyle)
        : undefined,
      igCarousel: formats.includes("ig_carousel")
        ? buildMockCarousel(
            "instagram",
            sourcePost,
            idea,
            writingStyle,
            visualTemplateId,
            aspectRatio,
            brandHandle
          )
        : undefined,
      liCarousel: formats.includes("li_carousel")
        ? buildMockCarousel(
            "linkedin",
            sourcePost,
            idea,
            writingStyle,
            visualTemplateId,
            aspectRatio,
            brandHandle
          )
        : undefined,
      usedMock: true,
    };
  }

  try {
    const results: {
      reel?: ReelContent;
      igCarousel?: CarouselContent;
      liCarousel?: CarouselContent;
    } = {};

    let usedMock = false;
    for (const format of formats) {
      try {
        if (format === "reel") {
          const object = await generateTextObject(
            reelSchema,
            `${sameLanguageRule(sourcePost.rawText)}

Create an Instagram Reel script from this repurpose angle.
Source post: ${sourcePost.rawText}
Angle: ${idea.title} — ${idea.hook} (${idea.summary})
Brand Voice: ${sourcePost.brandVoice}
Target Audience: ${sourcePost.targetAudience}
CTA: ${sourcePost.ctaPreference}
Writing Style & Tone: ${styleDescription}

Make the 0-3s hook impossible to scroll past, keep spoken lines natural and punchy, and include on-screen text and visual cues for each beat.
Return JSON with hook, estimatedDuration, beats (each with id, timeframe, spokenLine, onScreenText, visualCue), caption, and hashtags.`
          );
          results.reel = { ...object, writingStyle };
        }

        if (format === "ig_carousel") {
          const object = await generateTextObject(
            carouselSchema,
            `${sameLanguageRule(sourcePost.rawText)}

Create a 6-8 slide Instagram Carousel (1080x1350 portrait) from this repurpose angle.
Source post: ${sourcePost.rawText}
Angle: ${idea.title} — ${idea.hook} (${idea.summary})
Brand Voice: ${sourcePost.brandVoice}
Target Audience: ${sourcePost.targetAudience}
CTA: ${sourcePost.ctaPreference}
Writing Style & Tone: ${styleDescription}

Slide 1 must be role "cover", middle slides role "body" (concise, scannable copy that fits a 1080x1350 slide cleanly), and final slide role "cta".
Return JSON with title, slides (id, slideNumber, role, eyebrow, headline, body, visualDirection), caption, and hashtags.`
          );
          results.igCarousel = {
            platform: "instagram",
            ...object,
            writingStyle,
            visualTemplateId,
            aspectRatio,
            brandHandle,
          };
        }

        if (format === "li_carousel") {
          const object = await generateTextObject(
            carouselSchema,
            `${sameLanguageRule(sourcePost.rawText)}

Create a 6-8 slide LinkedIn Document Carousel (1080x1350) from this repurpose angle.
Source post: ${sourcePost.rawText}
Angle: ${idea.title} — ${idea.hook} (${idea.summary})
Brand Voice: ${sourcePost.brandVoice}
Target Audience: ${sourcePost.targetAudience}
CTA: ${sourcePost.ctaPreference}
Writing Style & Tone: ${styleDescription}

Slide 1 must be role "cover", middle slides role "body" with crisp executive takeaways, and final slide role "cta". Include a strong long-form LinkedIn caption.
Return JSON with title, slides (id, slideNumber, role, eyebrow, headline, body, visualDirection), caption, and hashtags.`
          );
          results.liCarousel = {
            platform: "linkedin",
            ...object,
            writingStyle,
            visualTemplateId,
            aspectRatio,
            brandHandle,
          };
        }
      } catch (err) {
        console.error(`Content generation failed for ${format}:`, err);
        usedMock = true;
        if (format === "reel") {
          results.reel = buildMockReel(sourcePost, idea, writingStyle);
        }
        if (format === "ig_carousel") {
          results.igCarousel = buildMockCarousel(
            "instagram",
            sourcePost,
            idea,
            writingStyle,
            visualTemplateId,
            aspectRatio,
            brandHandle
          );
        }
        if (format === "li_carousel") {
          results.liCarousel = buildMockCarousel(
            "linkedin",
            sourcePost,
            idea,
            writingStyle,
            visualTemplateId,
            aspectRatio,
            brandHandle
          );
        }
      }
    }

    return { ...results, usedMock };
  } catch (err) {
    console.error("Content generation model failed:", err);
    throw err instanceof Error
      ? err
      : new Error("The language model could not write this content.");
  }
}
