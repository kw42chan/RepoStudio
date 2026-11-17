import { describe, expect, it } from "vitest";
import {
  carouselTemplateManifest,
  getCarouselTemplate,
  getReferenceCarousel,
  ideaSuggestsToolGrid,
  listReferenceCarousels,
  listLayoutPacksForPlatform,
  listReferenceOnlyTemplates,
  normalizeCarouselSlideTemplates,
  pickTemplateForSlide,
  resolveProductionTemplateId,
} from "./carousel-templates";
import type { CarouselContent, CarouselSlide, RepurposeIdea } from "./types";

function slide(overrides: Partial<CarouselSlide> & Pick<CarouselSlide, "role" | "slideNumber">): CarouselSlide {
  return {
    id: `slide-${overrides.slideNumber}`,
    headline: "Headline",
    body: "Body",
    visualDirection: "Visual",
    ...overrides,
  };
}

const mockIdea: RepurposeIdea = {
  id: "idea-1",
  angleType: "Step-by-Step Playbook",
  title: "Six tools PMs reuse weekly",
  hook: "Stop rebuilding the stack",
  summary: "Toolkit roundup",
  rationale: "Saves",
  formatFit: { reel: 80, igCarousel: 90, liCarousel: 95 },
};

describe("carousel template manifest", () => {
  it("exposes v1.1 categories and aligned layout keys", () => {
    expect(carouselTemplateManifest.version).toBe("1.1.0");
    expect(carouselTemplateManifest.categories.length).toBeGreaterThanOrEqual(9);
    const grid = getCarouselTemplate("body-tool-grid-2x3");
    expect(grid?.layout).toBe("grid-2x3");
    expect(grid?.category).toBe("body-grid");
  });

  it("indexes three edwardai reference carousels", () => {
    expect(listReferenceCarousels()).toHaveLength(3);
    const agents = getReferenceCarousel(
      "https://www.instagram.com/p/DbP6R_8k4Y5/"
    );
    expect(agents?.slideSequence.some((s) => s.templateId.includes("agent"))).toBe(
      true
    );
  });

  it("resolves reference-only templates to production fallbacks", () => {
    expect(listReferenceOnlyTemplates().length).toBeGreaterThanOrEqual(9);
    expect(resolveProductionTemplateId("ref-edwardai-hook-hero-showcase")).toBe(
      "hook-scroll-cover"
    );
    expect(resolveProductionTemplateId("hook-scroll-cover")).toBe(
      "hook-scroll-cover"
    );
  });

  it("lists layout packs per platform", () => {
    expect(
      listLayoutPacksForPlatform("instagram").some(
        (pack) => pack.id === "instagram-edwardai-ref"
      )
    ).toBe(true);
    expect(
      listLayoutPacksForPlatform("linkedin").some(
        (pack) => pack.id === "linkedin-edwardai-ref"
      )
    ).toBe(true);
  });
});

describe("pickTemplateForSlide", () => {
  const baseContext = {
    platform: "linkedin" as const,
    idea: mockIdea,
    totalSlides: 7,
  };

  it("assigns hook-cover category on slide 1", () => {
    const templateId = pickTemplateForSlide(
      slide({ role: "cover", slideNumber: 1 }),
      { ...baseContext, slideIndex: 0 }
    );
    expect(templateId).toBe("hook-scroll-cover");
    expect(getCarouselTemplate(templateId)?.category).toBe("hook-cover");
  });

  it("assigns cta-close on the final slide", () => {
    const templateId = pickTemplateForSlide(
      slide({ role: "cta", slideNumber: 7 }),
      { ...baseContext, slideIndex: 6 }
    );
    expect(templateId).toBe("cta-action-close");
    expect(getCarouselTemplate(templateId)?.category).toBe("cta-close");
  });

  it("assigns body-grid when six grid cells are present", () => {
    const templateId = pickTemplateForSlide(
      slide({
        role: "body",
        slideNumber: 4,
        layout: "grid-2x3",
        gridCells: Array.from({ length: 6 }, (_, i) => ({
          number: i + 1,
          title: "T",
          toolIds: ["notion"],
          description: "D",
        })),
      }),
      { ...baseContext, slideIndex: 3 }
    );
    expect(templateId).toBe("body-tool-grid-2x3");
  });

  it("defaults middle body slides to narrative template", () => {
    const templateId = pickTemplateForSlide(
      slide({ role: "body", slideNumber: 3 }),
      { ...baseContext, slideIndex: 2 }
    );
    expect(templateId).toBe("body-narrative-default");
  });
});

describe("ideaSuggestsToolGrid", () => {
  it("detects listicle-style angles", () => {
    expect(ideaSuggestsToolGrid(mockIdea)).toBe(true);
    expect(
      ideaSuggestsToolGrid({
        ...mockIdea,
        angleType: "Founder Story",
        title: "A quiet week shipping",
        hook: "We shipped",
        summary: "Case study",
      })
    ).toBe(false);
  });
});

describe("normalizeCarouselSlideTemplates", () => {
  it("stamps templateId on every slide", () => {
    const carousel: CarouselContent = {
      platform: "instagram",
      title: "Test",
      slides: [
        slide({ role: "cover", slideNumber: 1 }),
        slide({ role: "body", slideNumber: 2 }),
        slide({ role: "cta", slideNumber: 3 }),
      ],
      caption: "",
      hashtags: [],
      writingStyle: { styleId: "educational" },
      visualTemplateId: "default",
      aspectRatio: "4:5",
      brandHandle: "@brand",
    };

    const normalized = normalizeCarouselSlideTemplates(carousel, mockIdea);
    expect(normalized.slides[0].templateId).toBe("hook-scroll-cover");
    expect(normalized.slides[1].templateId).toBe("body-narrative-default");
    expect(normalized.slides[2].templateId).toBe("cta-action-close");
  });
});