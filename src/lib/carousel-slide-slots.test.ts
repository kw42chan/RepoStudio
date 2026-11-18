import { describe, expect, it } from "vitest";
import { normalizeCarouselSlideTemplates } from "./carousel-templates";
import { hydrateSlideStructuredSlots } from "./carousel-slide-slots";
import type { CarouselContent, CarouselSlide } from "./types";

describe("hydrateSlideStructuredSlots", () => {
  it("fills three listItems for tip-lock template", () => {
    const slide: CarouselSlide = {
      id: "s4",
      slideNumber: 4,
      role: "body",
      headline: "Lock consistency",
      body: "1. Reference image\n2. Fixed geometry\n3. Quantity words",
      visualDirection: "Dark list",
      templateId: "ref-edwardai-body-tip-lock-three",
    };
    const hydrated = hydrateSlideStructuredSlots(slide);
    expect(hydrated.listItems).toHaveLength(3);
    expect(hydrated.listItems?.[0].title).toMatch(/Reference/i);
  });
});

describe("normalize with edward pack hydrates slots", () => {
  it("stamps listItems on slide 4", () => {
    const carousel: CarouselContent = {
      platform: "instagram",
      title: "T",
      slides: Array.from({ length: 7 }, (_, i) => ({
        id: `s${i + 1}`,
        slideNumber: i + 1,
        role:
          i === 0
            ? ("cover" as const)
            : i === 6
              ? ("cta" as const)
              : ("body" as const),
        headline: `H${i + 1}`,
        body:
          i === 3
            ? "1. First rule\n2. Second rule\n3. Third rule"
            : "Body",
        visualDirection: "V",
      })),
      caption: "",
      hashtags: [],
      writingStyle: { styleId: "educational" },
      visualTemplateId: "default",
      aspectRatio: "4:5",
      brandHandle: "@brand",
    };
    const normalized = normalizeCarouselSlideTemplates(carousel, undefined, {
      layoutPackId: "instagram-edwardai-ref",
    });
    expect(normalized.slides[3]?.listItems).toHaveLength(3);
  });
});