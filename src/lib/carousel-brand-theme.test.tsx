import { describe, expect, it } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { CAROUSEL_FONTS, normalizeBrandDesign, brandDesignSchema, resolveFont } from "./carousel-fonts";
import { resolveBrandTheme } from "./carousel-brand-theme";
import { normalizeStore } from "./store";
import { BUILT_IN_VISUAL_TEMPLATES } from "./presets";
import { SlideCanvas } from "@/components/studio/carousel-preview";
import type { CarouselSlide } from "./types";
import { fixtureCarousel } from "./carousel-fixture-decks";

describe("brand typography", () => {
  it("keeps body settings independent of heading settings and rejects invalid settings", () => {
    const template = BUILT_IN_VISUAL_TEMPLATES[0];
    const design = normalizeBrandDesign(undefined);
    const before = resolveBrandTheme({ design }, template);
    const after = resolveBrandTheme({ design: { ...design, heading: { fontId: "lora", weight: 800, sizeScale: 1.2 } } }, template);
    expect(after.body).toEqual(before.body);
    expect(after.heading.fontFamily).not.toBe(before.heading.fontFamily);
    expect(after.heading.weight).toBe(700);
    expect(brandDesignSchema.safeParse({ ...design, version: 2 }).success).toBe(false);
    expect(brandDesignSchema.safeParse({ ...design, body: { ...design.body, sizeScale: .1 } }).success).toBe(false);
    expect(CAROUSEL_FONTS.filter(f => f.cjk)).toHaveLength(4);
    for (const font of CAROUSEL_FONTS) expect(resolveFont(font.id).css).toMatch(/noto/);
  });

  it("migrates old presets and drafts without changing unrelated data", () => {
    const preset = { id: "old", name: "Old", voice: "Direct", audience: "Builders", cta: "Save", handle: "@old", primaryColor: "#123456", secondaryColor: "#654321", defaultWritingStyle: "educational" as const };
    const legacyCarousel={...fixtureCarousel("en"),visualTemplateId:"newsletter-serif",design:undefined};
    const sourcePost={id:"source",rawText:"Original content",brandVoice:"Direct",targetAudience:"Builders",ctaPreference:"Save",createdAt:"2026-01-01"};
    const idea={id:"idea",angleType:"Educational",title:"Original",hook:"Original hook",summary:"Keep",rationale:"Keep",formatFit:{reel:80,igCarousel:90,liCarousel:90}};
    const draft={id:"old-draft",title:"Original draft",sourcePost,idea,igCarousel:legacyCarousel,createdAt:"2026-01-01",updatedAt:"2026-01-01"};
    const pack={id:"old-pack",name:"Old pack",platform:"instagram" as const,slideTemplateIds:["hook-scroll-cover"],catalogVersion:"1.3.0",createdAt:"2026-01-01"};
    const migrated = normalizeStore({ brandPresets: [preset],drafts:[draft],layoutPacks:[pack] });
    expect(migrated.brandPresets[0].design).toEqual(normalizeBrandDesign(undefined));
    expect(migrated.brandPresets[0]).toMatchObject(preset);
    expect(migrated.drafts[0].igCarousel?.design?.heading.fontId).toBe("lora");
    expect(migrated.drafts[0].sourcePost).toEqual(sourcePost);
    expect(migrated.drafts[0].igCarousel?.slides).toEqual(legacyCarousel.slides);
    expect(migrated.layoutPacks).toEqual([pack]);
    expect(normalizeStore(migrated)).toEqual(migrated);
  });

  it.each(["hook-scroll-cover", "ref-edwardai-body-tip-lock-three"])("uses identical resolved typography in preview and export for %s", templateId => {
    const slide: CarouselSlide = { id: "a", slideNumber: 1, role: "cover", headline: "中文 heading", body: "Supporting copy", visualDirection: "", templateId };
    const design = normalizeBrandDesign(undefined);
    design.heading.fontId = "lora"; design.body.fontId = "inter";
    const props = { slide, totalSlides: 3, template: BUILT_IN_VISUAL_TEMPLATES[0], primaryColor: "#123456", secondaryColor: "#654321", brandHandle: "@test", platform: "instagram" as const, aspectRatio: "4:5" as const, design };
    for (const fullResolution of [false, true]) {
      const html = renderToStaticMarkup(<SlideCanvas {...props} fullResolution={fullResolution}/>);
      expect(html).toContain("--font-lora"); expect(html).toContain("--font-inter");
      expect(html).toContain("font-weight:700"); expect(html).toContain("font-weight:500");
    }
  });
});
