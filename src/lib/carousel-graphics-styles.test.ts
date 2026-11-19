import { describe, expect, it } from "vitest";
import {
  applyGraphicsStyleToSlide,
  applyLayoutPackToCarousel,
  formatGraphicsStyleLabel,
  graphicsStyleCaption,
  listGraphicsStylesForPlatform,
  previewCarouselTemplateId,
  resetSlideGraphicsStyle,
} from "./carousel-templates";
import type { CarouselContent, CarouselSlide } from "./types";
import { resolveSlideColors } from "./carousel-slide-theme";

function slide(
  overrides: Partial<CarouselSlide> & Pick<CarouselSlide, "role" | "slideNumber">
): CarouselSlide {
  return {
    id: `slide-${overrides.slideNumber}`,
    headline: "Headline",
    body: "1. Reference image\n2. Fixed geometry\n3. Quantity words",
    visualDirection: "Visual",
    templateId: "body-narrative-default",
    ...overrides,
  };
}

describe("graphics style catalog", () => {
  it("lists rendered picker styles for instagram, grouped and labeled", () => {
    const styles = listGraphicsStylesForPlatform("instagram");
    expect(styles.map((style) => style.templateId)).toContain(
      "ref-edwardai-hook-hero-showcase"
    );
    expect(styles.map((style) => style.templateId)).toContain(
      "body-tool-grid-2x3"
    );
    const hero = styles.find(
      (style) => style.templateId === "ref-edwardai-hook-hero-showcase"
    );
    expect(hero?.groupId).toBe("hooks");
    expect(hero?.pickerLabel).toBe("Hero showcase (dark stage)");
    expect(hero?.thumbnailPath).toMatch(/\.svg$/);
    expect(styles[0]?.groupId).toBe("hooks");
    expect(styles.at(-1)?.groupId).toBe("close");
  });

  it("hides instagram-only Edward styles on LinkedIn", () => {
    const linkedin = listGraphicsStylesForPlatform("linkedin").map(
      (style) => style.templateId
    );
    expect(linkedin).toContain("hook-scroll-cover");
    expect(linkedin).toContain("body-tool-grid-2x3");
    expect(linkedin).not.toContain("ref-edwardai-body-scene-compare");
  });

  it("marks experimental styles with a preview suffix", () => {
    expect(
      formatGraphicsStyleLabel({ label: "Wireframe grid", experimental: true })
    ).toBe("Wireframe grid (preview)");
    expect(formatGraphicsStyleLabel({ label: "Narrative" })).toBe("Narrative");
  });
});

describe("applyGraphicsStyleToSlide", () => {
  it("sets templateId and list item length on slide 4", () => {
    const before = slide({ role: "body", slideNumber: 4 });
    const after = applyGraphicsStyleToSlide(
      before,
      "ref-edwardai-body-tip-lock-three"
    );

    expect(before.templateId).toBe("body-narrative-default");
    expect(after.templateId).toBe("ref-edwardai-body-tip-lock-three");
    expect(after.listItems).toHaveLength(3);
    expect(previewCarouselTemplateId(before)).toBe("body-narrative-default");
    expect(previewCarouselTemplateId(after)).toBe(
      "ref-edwardai-body-tip-lock-three"
    );
    expect(graphicsStyleCaption(4, after.templateId)).toBe(
      "Slide 4 · Three-rule tip list"
    );
  });

  it("rebuilds list slots when the new style needs a different count", () => {
    const three = applyGraphicsStyleToSlide(
      slide({ role: "body", slideNumber: 4 }),
      "ref-edwardai-body-tip-lock-three"
    );
    const seven = applyGraphicsStyleToSlide(
      three,
      "ref-edwardai-body-numbered-switches"
    );
    expect(seven.templateId).toBe("ref-edwardai-body-numbered-switches");
    expect(seven.listItems).toHaveLength(7);
    expect(previewCarouselTemplateId(seven)).toBe(
      "ref-edwardai-body-numbered-switches"
    );
  });

  it("drops list slots when switching back to narrative", () => {
    const listed = applyGraphicsStyleToSlide(
      slide({ role: "body", slideNumber: 4 }),
      "ref-edwardai-body-tip-lock-three"
    );
    const narrative = applyGraphicsStyleToSlide(
      listed,
      "body-narrative-default"
    );
    expect(narrative.templateId).toBe("body-narrative-default");
    expect(narrative.listItems).toBeUndefined();
  });
});

describe("resetSlideGraphicsStyle", () => {
  it("restores the pack template for that slide index", () => {
    const overridden = applyGraphicsStyleToSlide(
      slide({ role: "body", slideNumber: 4 }),
      "body-narrative-default"
    );
    const reset = resetSlideGraphicsStyle(overridden, {
      platform: "instagram",
      totalSlides: 7,
      slideIndex: 3,
      layoutPackId: "instagram-edwardai-ref",
    });
    expect(reset.templateId).toBe("ref-edwardai-body-tip-lock-three");
    expect(reset.role).toBe("body");
    expect(reset.listItems).toHaveLength(3);
    expect(reset.surface).toEqual({ kind: "inherit" });
    expect(graphicsStyleCaption(3, "ref-edwardai-body-scene-compare")).toBe(
      "Slide 3 · Scene compare (Edward)"
    );
  });

  it("restores Instagram Default slide 2 after a grid restyle", () => {
    const overridden = applyGraphicsStyleToSlide(
      slide({
        role: "cover",
        slideNumber: 2,
        surface: { kind: "solid", color: "#112233" },
        accentOverride: "#ff00aa",
      }),
      "body-tool-grid-2x3"
    );
    const withGrid = {
      ...overridden,
      gridCells: Array.from({ length: 6 }, (_, i) => ({
        number: i + 1,
        title: "Tool",
        toolIds: ["notion"],
        description: "Desc",
      })),
    };
    const reset = resetSlideGraphicsStyle(withGrid, {
      platform: "instagram",
      totalSlides: 7,
      slideIndex: 1,
      layoutPackId: "default",
    });

    expect(reset.templateId).toBe("hook-scroll-cover");
    expect(reset.role).toBe("cover");
    expect(reset.layout).toBeUndefined();
    expect(reset.gridCells).toBeUndefined();
    expect(reset.surface).toEqual({ kind: "inherit" });
    expect(reset.accentOverride).toBeUndefined();
    const visual = { accentColor: "#2563eb", surfaceColor: "#ffffff" };
    const cover = slide({ role: "cover", slideNumber: 1, templateId: "hook-scroll-cover" });
    expect(resolveSlideColors(reset, visual, "#2563eb", "#ffffff", 7)).toEqual(
      resolveSlideColors(cover, visual, "#2563eb", "#ffffff", 7)
    );
  });

  it("resets every Instagram Default slide to the light cover style", () => {
    const visual = { accentColor: "#2563eb", surfaceColor: "#ffffff" };
    const first = slide({ role: "cover", slideNumber: 1, templateId: "hook-scroll-cover" });
    const expectedColors = resolveSlideColors(first, visual, "#2563eb", "#ffffff", 7);
    for (let index = 0; index < 7; index++) {
      const original = slide({ role: index === 6 ? "cta" : "body", slideNumber: index + 1, surface: { kind: "solid", color: "#112233" } });
      const reset = resetSlideGraphicsStyle(original, {
        platform: "instagram", totalSlides: 7, slideIndex: index, layoutPackId: "default",
      });
      expect(reset.templateId).toBe("hook-scroll-cover");
      expect(reset.role).toBe("cover");
      expect(reset.headline).toBe(original.headline);
      expect(reset.body).toBe(original.body);
      expect(resolveSlideColors(reset, visual, "#2563eb", "#ffffff", 7)).toEqual(expectedColors);
    }
  });
});

describe("applyLayoutPackToCarousel", () => {
  it("restores Instagram Default on existing slides when the pack changes", () => {
    const slides = [1, 2, 3, 4, 5, 6, 7].map((slideNumber) =>
      applyGraphicsStyleToSlide(
        slide({
          role: slideNumber === 1 ? "cover" : slideNumber === 7 ? "cta" : "body",
          slideNumber,
          surface: { kind: "solid", color: "#112233" },
        }),
        slideNumber === 2
          ? "ref-edwardai-body-scene-compare"
          : "body-narrative-default"
      )
    );
    const carousel = {
      platform: "instagram",
      title: "Test",
      slides,
      caption: "",
      hashtags: [],
      writingStyle: { styleId: "educational" },
      visualTemplateId: "minimal-light",
      aspectRatio: "4:5",
      brandHandle: "@brand",
      layoutPackId: "instagram-edwardai-ref",
    } as CarouselContent;

    const restored = applyLayoutPackToCarousel(carousel, "default");
    const slide2 = restored.slides[1];

    expect(restored.layoutPackId).toBe("default");
    expect(slide2?.templateId).toBe("hook-scroll-cover");
    expect(slide2?.role).toBe("cover");
    expect(slide2?.surface).toEqual({ kind: "inherit" });
    expect(slide2?.headline).toBe("Headline");
    expect(restored.slides[0]?.templateId).toBe("hook-scroll-cover");
    expect(restored.slides.every((item) => item.templateId === "hook-scroll-cover" && item.role === "cover")).toBe(true);
  });
});
