import { describe, expect, it } from "vitest";
import { carouselSlideSchema } from "./ai";
import { carouselPalette } from "./carousel-design";
import {
  EDWARD_DARK,
  EDWARD_MINT,
  resolveSlideColors,
  surfacePatchForPreset,
} from "./carousel-slide-theme";
import type { CarouselSlide, VisualTemplate } from "./types";

const template = {
  accentColor: "#5C4033",
  surfaceColor: "#F6F3EE",
} as VisualTemplate;

const primary = "#5C4033";
const secondary = "#C4A574";

function slide(
  overrides: Partial<CarouselSlide> & Pick<CarouselSlide, "role" | "slideNumber">
): CarouselSlide {
  return {
    id: `slide-${overrides.slideNumber}`,
    headline: "Headline",
    body: "Body",
    visualDirection: "Visual",
    ...overrides,
  };
}

describe("resolveSlideColors", () => {
  it("inherits the narrative ground for a cover slide", () => {
    const palette = carouselPalette(primary, secondary);
    const colors = resolveSlideColors(
      slide({ role: "cover", slideNumber: 1 }),
      template,
      primary,
      secondary,
      7
    );
    expect(colors.background).toBe(palette.lightBg);
    expect(colors.ink).toBe(palette.darkBg);
    expect(colors.isLight).toBe(true);
    expect(colors.accent).toBe(palette.brandPrimary);
  });

  it("uses a solid background and light ink on a dark color", () => {
    const colors = resolveSlideColors(
      slide({
        role: "body",
        slideNumber: 3,
        surface: { kind: "solid", color: "#112233" },
      }),
      template,
      primary,
      secondary,
      7
    );
    expect(colors.background).toBe("#112233");
    expect(colors.ink).toBe("#F7F7F5");
    expect(colors.isLight).toBe(false);
  });

  it("builds a two-stop gradient without changing a neighboring inherit slide", () => {
    const painted = slide({
      role: "body",
      slideNumber: 2,
      surface: {
        kind: "gradient",
        angle: 90,
        stops: [
          { color: "#ff00aa", at: 0 },
          { color: "#111111", at: 100 },
        ],
      },
    });
    const untouched = slide({ role: "body", slideNumber: 3 });
    const gradient = resolveSlideColors(painted, template, primary, secondary, 7);
    const inherited = resolveSlideColors(untouched, template, primary, secondary, 7);
    const inheritedAlone = resolveSlideColors(
      slide({ role: "body", slideNumber: 3 }),
      template,
      primary,
      secondary,
      7
    );

    expect(gradient.background).toBe(
      "linear-gradient(90deg, #ff00aa 0%, #111111 100%)"
    );
    expect(gradient.background).not.toBe(inherited.background);
    expect(inherited.background).toBe(inheritedAlone.background);
    expect(inherited.background).not.toContain("ff00aa");
  });

  it("keeps Edward's dark stage on inherit and lets accent override the mint", () => {
    const colors = resolveSlideColors(
      slide({
        role: "cover",
        slideNumber: 1,
        templateId: "ref-edwardai-hook-hero-showcase",
      }),
      template,
      primary,
      secondary,
      7
    );
    expect(colors.background).toBe(EDWARD_DARK);
    expect(colors.accent).toBe(secondary.toLowerCase());

    const overridden = resolveSlideColors(
      slide({
        role: "cover",
        slideNumber: 1,
        templateId: "ref-edwardai-hook-hero-showcase",
        accentOverride: "#abcdef",
      }),
      template,
      primary,
      secondary,
      7
    );
    expect(overridden.background).toBe(EDWARD_DARK);
    expect(overridden.accent).toBe("#abcdef");
  });

  it("falls back to Edward mint when the brand secondary is not a hex", () => {
    const colors = resolveSlideColors(
      slide({
        role: "body",
        slideNumber: 2,
        templateId: "ref-edwardai-body-scene-compare",
      }),
      template,
      primary,
      "mint",
      7
    );
    expect(colors.accent).toBe(EDWARD_MINT);
  });
});

describe("surface presets and draft shape", () => {
  it("builds the three studio presets", () => {
    const edward = surfacePatchForPreset("edward-dark", primary, secondary, template);
    expect(edward.surface).toEqual({ kind: "solid", color: EDWARD_DARK });
    expect(edward.accentOverride).toBe(EDWARD_MINT);

    const gradient = surfacePatchForPreset("brand-gradient", primary, secondary, template);
    expect(gradient.surface?.kind).toBe("gradient");
    expect(gradient.accentOverride).toBeUndefined();

    const light = surfacePatchForPreset("light-card", primary, secondary, template);
    expect(light.surface).toEqual({
      kind: "solid",
      color: carouselPalette(primary, secondary).lightBg,
    });
  });

  it("keeps surface and accent on a carousel slide, which drafts store as JSON", () => {
    const parsed = carouselSlideSchema.parse(
      slide({
        role: "body",
        slideNumber: 2,
        surface: {
          kind: "gradient",
          angle: 165,
          stops: [
            { color: "#112233", at: 0 },
            { color: "#abcdef", at: 100 },
          ],
        },
        accentOverride: "#6ee7a0",
      })
    );
    expect(parsed.surface?.kind).toBe("gradient");
    expect(parsed.accentOverride).toBe("#6ee7a0");

    const omitted = carouselSlideSchema.parse(
      slide({ role: "cover", slideNumber: 1 })
    );
    expect(omitted.surface).toBeUndefined();
    expect(JSON.parse(JSON.stringify({ slides: [parsed] })).slides[0].surface.kind).toBe(
      "gradient"
    );
  });
});
