import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import raw from "./manifest.v1.json";
import decks from "./fixtures/decks.json";
import golden from "../../../docs/carousel-phase-4-0/golden/index.json";
import { parseCarouselTemplateManifest } from "./schema";
import { fixtureDeckSchema, validatePatternFixture } from "./fixtures";
import { carouselTemplateManifest, listGraphicsStyles, resolveGraphicsStyleId, resolveProductionTemplateId } from "./index";

const patterns = carouselTemplateManifest.templates.filter(t => t.pattern);
const selected = patterns.filter(t => t.pattern?.release === "first");

describe("Phase 4.0 contracts", () => {
  it("validates the complete catalog and rejects malformed or inconsistent entries", () => {
    expect(parseCarouselTemplateManifest(raw).templates).toHaveLength(raw.templates.length);
    const duplicate = structuredClone(raw);
    duplicate.templates.push(duplicate.templates[0]);
    expect(() => parseCarouselTemplateManifest(duplicate)).toThrow(/Duplicate/);
    const malformed = structuredClone(raw);
    const index = malformed.templates.findIndex(t => "pattern" in t);
    Object.assign(malformed.templates[index], { pattern: { familyId: "unknown" } });
    expect(() => parseCarouselTemplateManifest(malformed)).toThrow();
    const selectable = structuredClone(raw);
    selectable.templates[index].showInStylePicker = true;
    expect(() => parseCarouselTemplateManifest(selectable)).toThrow(/selectable/);
    const brokenPack = structuredClone(raw);
    brokenPack.layoutPacks[1].slideTemplateIds = ["missing"];
    expect(() => parseCarouselTemplateManifest(brokenPack)).toThrow(/Unknown template/);
  });

  it("keeps every proposed pattern out of production selection with a rendered fallback", () => {
    expect(patterns).toHaveLength(15);
    expect(selected).toHaveLength(9);
    for (const t of patterns) {
      expect(resolveGraphicsStyleId(t.id).invalid).toBe(true);
      expect(resolveProductionTemplateId(t.id)).toBe(t.productionFallbackId);
      for (const platform of ["instagram", "linkedin"] as const) {
        expect(listGraphicsStyles({ platform }).some(s => s.templateId === t.id)).toBe(false);
      }
    }
  });

  it.each(decks.map(d => [d.id, d] as const))("checks the %s fixture deck through its contract", (_, input) => {
    const deck = fixtureDeckSchema.parse(input);
    for (const slide of deck.slides) {
      const pattern = patterns.find(t => t.id === slide.templateId)?.pattern;
      expect(pattern).toBeDefined();
      const errors = validatePatternFixture(slide, pattern!);
      if (deck.expected === "valid") expect(errors).toEqual([]);
      if (deck.expected === "over-limit") expect(errors).toEqual(["limit:headline"]);
      if (deck.expected === "missing-required-images") {
        expect(errors.length).toBe(pattern!.imageSlots.filter(s => s.required).length);
        expect(errors.every(e => e.startsWith("image:required:"))).toBe(true);
      }
    }
  });

  it("covers every selected pattern in all language and maximum-content fixtures", () => {
    expect(decks.find(d => d.id === "zh-Hant")!.slides.every(s => /\p{Script=Han}/u.test(s.headline))).toBe(true);
    expect(decks.find(d => d.id === "mixed")!.slides.every(s => /\p{Script=Han}/u.test(s.headline) && /[a-z]/i.test(s.headline))).toBe(true);
    for (const id of ["zh-Hant", "en", "mixed", "maximum-content"]) {
      expect(new Set(decks.find(d => d.id === id)!.slides.map(s => s.templateId))).toEqual(new Set(selected.map(t => t.id)));
    }
    expect(decks.find(d => d.id === "maximum-slide-count")!.slides).toHaveLength(12);
  });

  it("has one 1080 × 1350 reference PNG and recorded behavior per selected pattern", () => {
    expect(golden.map(g => g.templateId).sort()).toEqual(selected.map(t => t.id).sort());
    for (const reference of golden) {
      const bytes = readFileSync(new URL(`../../../docs/carousel-phase-4-0/golden/${reference.templateId}.png`, import.meta.url));
      expect(bytes.subarray(1, 4).toString()).toBe("PNG");
      expect(bytes.readUInt32BE(16)).toBe(1080);
      expect(bytes.readUInt32BE(20)).toBe(1350);
      expect(reference.typography).toBeTruthy();
      expect(reference.imageBehavior).toBeTruthy();
    }
  });
});
