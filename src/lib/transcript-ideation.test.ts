import { beforeEach, expect, test } from "vitest";
import { ideateFromSourcePost,generateContentForFormats } from "./ai";
import { SourcePost } from "./types";

const transcript = `[00:00:01] The offer was weak, so more ads could not save it.
[00:00:04] Rewriting the first line made the same budget convert.`;

beforeEach(() => {
  delete process.env.OPENROUTER_API_KEY;
  delete process.env.OPENAI_API_KEY;
});

test("a pasted transcript turns the spoken lines into ideas, without the timestamps", async () => {
  const source: SourcePost = {
    id: "src-transcript",
    rawText: transcript,
    sourcePlatform: "Transcript",
    brandVoice: "Direct, practical",
    targetAudience: "founders",
    ctaPreference: "Follow",
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  const result = await ideateFromSourcePost(source);

  expect(result.ideas[0].hook).toContain(
    "The offer was weak, so more ads could not save it."
  );
  expect(result.ideas[0].hook).not.toContain("[00:00:01]");
  expect(result.sourceAnalysis.keyInsight).toBe(
    "Rewriting the first line made the same budget convert."
  );
  const generated=await generateContentForFormats({sourcePost:source,idea:result.ideas[0],formats:["reel","ig_carousel"],writingStyle:{styleId:"educational"},visualTemplateId:"minimal-light",aspectRatio:"4:5",brandHandle:"@test"});
  expect(JSON.stringify(generated)).not.toMatch(/\[00:00:0[14]\]/);
});
