import { describe, expect, it } from "vitest";
import { applyCarouselLayoutPipeline } from "./ai";
import {
  carouselTemplateManifest,
  getLayoutPack,
  userLayoutPackSelectId,
} from "./carousel-templates";
import type {
  CarouselContent,
  RepurposeIdea,
  SourcePost,
  UserLayoutPack,
} from "./types";

const mockSource = {
  rawText: "Sample",
  brandVoice: "Direct",
  targetAudience: "PMs",
  ctaPreference: "Comment",
} as SourcePost;

const mockIdea = {
  id: "idea-1",
  title: "Angle",
  hook: "Hook",
  summary: "Summary",
  angleType: "Educational",
  rationale: "R",
  formatFit: { reel: 80, igCarousel: 90, liCarousel: 90 },
} as RepurposeIdea;

const sequence = [
  "ref-edwardai-hook-hero-showcase",
  "body-narrative-default",
  "ref-edwardai-body-tip-lock-three",
  "cta-action-close",
];

function pack(overrides: Partial<UserLayoutPack> = {}): UserLayoutPack {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Mixed Edward",
    platform: "instagram",
    slideTemplateIds: sequence,
    slideRoles: ["cover", "body", "body", "cta"],
    createdAt: "2026-11-18T00:00:00.000Z",
    catalogVersion: carouselTemplateManifest.version,
    ...overrides,
  };
}

function blankCarousel(): CarouselContent {
  return {
    platform: "instagram",
    title: "Test",
    slides: sequence.map((_, index) => ({
      id: `s${index + 1}`,
      slideNumber: index + 1,
      role: "body" as const,
      headline: `H${index + 1}`,
      body: "Body",
      visualDirection: "Visual",
    })),
    caption: "",
    hashtags: [],
    writingStyle: { styleId: "educational" },
    visualTemplateId: "minimal-light",
    aspectRatio: "4:5",
    brandHandle: "@brand",
  };
}

describe("user layout packs", () => {
  it("reselects a saved sequence as the same template ids", () => {
    const saved = pack();
    const selectId = userLayoutPackSelectId(saved.id);
    expect(getLayoutPack(selectId, [saved])?.slideTemplateIds).toEqual(sequence);

    const result = applyCarouselLayoutPipeline(
      blankCarousel(),
      "instagram",
      mockSource,
      mockIdea,
      { instagram: selectId },
      [saved]
    );

    expect(result.layoutPackId).toBe(selectId);
    expect(result.slides.map((slide) => slide.templateId)).toEqual(sequence);
    expect(result.slides.map((slide) => slide.role)).toEqual(saved.slideRoles);
    expect(result.layoutWarnings).toBeUndefined();
  });

  it("falls back when a saved style id is not in the catalog", () => {
    const saved = pack({
      slideTemplateIds: ["not-a-real-style", "body-narrative-default"],
      slideRoles: ["cover", "body"],
    });
    const result = applyCarouselLayoutPipeline(
      {
        ...blankCarousel(),
        slides: blankCarousel().slides.slice(0, 2),
      },
      "instagram",
      mockSource,
      mockIdea,
      { instagram: userLayoutPackSelectId(saved.id) },
      [saved]
    );

    expect(result.slides[0]?.templateId).toBe("body-narrative-default");
    expect(result.slides[1]?.templateId).toBe("body-narrative-default");
    expect(result.layoutWarnings?.[0]).toMatch(/Slide 1/);
    expect(result.layoutWarnings).toHaveLength(1);
  });
});
