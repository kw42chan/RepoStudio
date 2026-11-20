import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { listPatterns, applyPattern, patternContentWarnings } from "./carousel-pattern-registry";
import { fixtureCarousel, fixtureAssets } from "./carousel-fixture-decks";
import { BUILT_IN_VISUAL_TEMPLATES } from "./presets";
import { SlideCanvas } from "@/components/studio/carousel-preview";
import { mediaWarnings, resolveSlideMedia } from "./carousel-slide-media";

describe("production patterns and media", () => {
  it("renders all nine manifest patterns and never lists deferred variants", () => {
    expect(listPatterns()).toHaveLength(9);
    for (const slide of fixtureCarousel("en").slides) {
      expect(patternContentWarnings(slide)).toEqual([]);
      expect(mediaWarnings(slide,fixtureAssets)).toEqual([]);
      const html = renderToStaticMarkup(<SlideCanvas slide={slide} totalSlides={9} template={BUILT_IN_VISUAL_TEMPLATES[0]} primaryColor="#BD4A28" secondaryColor="#8B6B4F" brandHandle="@fixture" platform="instagram" aspectRatio="4:5" assets={fixtureAssets} fullResolution/>);
      expect(html).toContain('data-layout="pattern"'); expect(html).toContain(slide.headline);
    }
    expect(listPatterns({ role: "cta" }).map(p => p.id)).toEqual(["signal-cta"]);
  });
  it("clamps crop settings and reports missing required images without creating optional frames", () => {
    const deck = fixtureCarousel("en"); const cover = deck.slides[0];
    const media = cover.media![0];
    const crop = resolveSlideMedia({ ...cover, media: [{ ...media, focalPoint: { x: 8, y: -4 }, zoom: 12 }] },fixtureAssets);
    expect(crop[0].focalPoint).toEqual({ x: 1,y: 0 }); expect(crop[0].zoom).toBe(3);
    expect(mediaWarnings({ ...cover, media: [] },fixtureAssets)).toHaveLength(1);
    const comparison = deck.slides.find(s => s.templateId === "spec-ab-comparison")!;
    expect(mediaWarnings({ ...comparison, media: [] },fixtureAssets)).toEqual([]);
    expect(resolveSlideMedia({ ...comparison, media: [] },fixtureAssets).every(m => !m.asset)).toBe(true);
    expect(resolveSlideMedia(deck.slides.find(s => s.templateId === "signal-statement")!,fixtureAssets)).toEqual([]);
  });
  it("preserves source content when applying a pattern and warns rather than inventing evidence", () => {
    const source = fixtureCarousel("en").slides[1];
    const result = applyPattern({ ...source, patternContent: undefined }, "signal-metric-evidence");
    expect(result.headline).toBe(source.headline);
    expect(result.patternContent?.metric).toBeUndefined();
    expect(patternContentWarnings(result).length).toBeGreaterThan(0);
  });
});
