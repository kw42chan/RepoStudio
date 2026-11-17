import { describe, expect, it } from "vitest";
import { applyCarouselLayoutPipeline } from "./ai";
import type { CarouselContent, RepurposeIdea, SourcePost } from "./types";

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

function sevenSlideCarousel(
  platform: CarouselContent["platform"]
): CarouselContent {
  const roles = ["cover", "body", "body", "body", "body", "body", "cta"] as const;
  return {
    platform,
    title: "Test",
    slides: roles.map((role, i) => ({
      id: `s${i + 1}`,
      slideNumber: i + 1,
      role,
      headline: `H${i + 1}`,
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

describe("carousel layout packs", () => {
  it("applies instagram-edwardai-ref template ids on normalize", () => {
    const result = applyCarouselLayoutPipeline(
      sevenSlideCarousel("instagram"),
      "instagram",
      mockSource,
      mockIdea,
      { instagram: "instagram-edwardai-ref" }
    );
    expect(result.layoutPackId).toBe("instagram-edwardai-ref");
    expect(result.slides[0]?.templateId).toBe("ref-edwardai-hook-hero-showcase");
    expect(result.slides[3]?.templateId).toBe(
      "ref-edwardai-body-tip-lock-three"
    );
    expect(result.slides[6]?.templateId).toBe("cta-action-close");
  });

  it("applies linkedin-pm-grid on slide 4 with grid cells", () => {
    const result = applyCarouselLayoutPipeline(
      sevenSlideCarousel("linkedin"),
      "linkedin",
      mockSource,
      mockIdea,
      { linkedin: "linkedin-pm-grid" }
    );
    expect(result.layoutPackId).toBe("linkedin-pm-grid");
    const slide4 = result.slides.find((s) => s.slideNumber === 4);
    expect(slide4?.templateId).toBe("body-tool-grid-2x3");
    expect(slide4?.layout).toBe("grid-2x3");
    expect(slide4?.gridCells).toHaveLength(6);
  });

  it("keeps default heuristics when packs unset", () => {
    const result = applyCarouselLayoutPipeline(
      sevenSlideCarousel("instagram"),
      "instagram",
      mockSource,
      mockIdea
    );
    expect(result.layoutPackId).toBe("default");
    expect(result.slides[0]?.templateId).toBe("hook-scroll-cover");
  });
});