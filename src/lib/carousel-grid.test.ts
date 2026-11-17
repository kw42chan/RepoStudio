import { describe, expect, it } from "vitest";
import {
  carouselSlideSchema,
  ensureLinkedInGridSlide,
  gridCellSchema,
} from "./ai";
import type { CarouselContent, RepurposeIdea, SourcePost } from "./types";

describe("carousel grid slide schema", () => {
  it("accepts a grid-2x3 slide with six cells", () => {
    const slide = {
      id: "slide-grid",
      slideNumber: 4,
      role: "body" as const,
      headline: "Tools every PM should know",
      body: "Six picks for faster shipping.",
      visualDirection: "2x3 grid",
      layout: "grid-2x3" as const,
      gridCells: [
        {
          number: 1,
          title: "Planning",
          toolIds: ["notion"],
          description: "Single source of truth.",
        },
        {
          number: 2,
          title: "Design",
          toolIds: ["figma"],
          description: "Share before you build.",
        },
        {
          number: 3,
          title: "Research",
          toolIds: ["perplexity", "claude"],
          description: "Faster discovery loops.",
        },
        {
          number: 4,
          title: "Build",
          toolIds: ["cursor"],
          description: "Tighter spec-to-code.",
        },
        {
          number: 5,
          title: "Comms",
          toolIds: ["slack"],
          description: "One thread for GTM.",
        },
        {
          number: 6,
          title: "Track",
          toolIds: ["linear"],
          description: "Rank what ships next.",
        },
      ],
    };

    expect(carouselSlideSchema.parse(slide).layout).toBe("grid-2x3");
    expect(gridCellSchema.parse(slide.gridCells[0]).toolIds).toEqual(["notion"]);
  });

  it("keeps default slides without layout fields", () => {
    const slide = {
      id: "slide-2",
      slideNumber: 2,
      role: "body" as const,
      headline: "The shift",
      body: "Short body copy.",
      visualDirection: "Dark slide.",
    };

    expect(carouselSlideSchema.parse(slide).layout).toBeUndefined();
  });
});

const mockSource = {
  rawText: "Sample post",
  brandVoice: "Direct",
  targetAudience: "PMs",
  ctaPreference: "Comment",
} as SourcePost;

const mockIdea = {
  id: "idea-1",
  title: "Six tools PMs reuse weekly",
  hook: "Stop rebuilding the stack",
  summary: "Toolkit roundup",
} as RepurposeIdea;

const baseCarousel = (
  slides: CarouselContent["slides"]
): CarouselContent => ({
  platform: "linkedin",
  title: "Test",
  slides,
  caption: "",
  hashtags: [],
  writingStyle: { styleId: "educational" },
  visualTemplateId: "default",
  aspectRatio: "4:5",
  brandHandle: "@brand",
});

describe("ensureLinkedInGridSlide", () => {
  it("leaves carousels that already include a 2x3 grid slide", () => {
    const withGrid = baseCarousel([
      {
        id: "slide-4",
        slideNumber: 4,
        role: "body",
        headline: "Grid",
        body: "Body",
        visualDirection: "Grid",
        layout: "grid-2x3",
        gridCells: Array.from({ length: 6 }, (_, i) => ({
          number: i + 1,
          title: `T${i + 1}`,
          toolIds: ["notion"],
          description: "Desc",
        })),
      },
    ]);
    expect(ensureLinkedInGridSlide(withGrid, mockSource, mockIdea)).toBe(
      withGrid
    );
  });

  it("replaces slide 4 with a grid slide when the LLM omitted layout", () => {
    const withoutGrid = baseCarousel([
      { id: "s1", slideNumber: 1, role: "cover", headline: "H", body: "B", visualDirection: "V" },
      { id: "s2", slideNumber: 2, role: "body", headline: "H", body: "B", visualDirection: "V" },
      { id: "s3", slideNumber: 3, role: "body", headline: "H", body: "B", visualDirection: "V" },
      { id: "s4", slideNumber: 4, role: "body", headline: "Old", body: "B", visualDirection: "V" },
      { id: "s5", slideNumber: 5, role: "body", headline: "H", body: "B", visualDirection: "V" },
      { id: "s6", slideNumber: 6, role: "body", headline: "H", body: "B", visualDirection: "V" },
      { id: "s7", slideNumber: 7, role: "cta", headline: "H", body: "B", visualDirection: "V" },
    ]);
    const fixed = ensureLinkedInGridSlide(withoutGrid, mockSource, mockIdea);
    const slide4 = fixed.slides.find((s) => s.slideNumber === 4);
    expect(slide4?.layout).toBe("grid-2x3");
    expect(slide4?.gridCells).toHaveLength(6);
    expect(slide4?.headline).toBe(mockIdea.title);
    expect(slide4?.id).toBe("s4");
  });
});