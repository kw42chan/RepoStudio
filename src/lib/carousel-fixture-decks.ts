import decks from "./carousel-templates/fixtures/decks.json";
import type { CarouselContent, CarouselSlide, SlideImageAsset } from "./types";
export const fixtureAssets: SlideImageAsset[] = [{ id: "fixture-proof", url: "/fixtures/carousel-proof.png", fileName: "Synthetic fixture", mimeType: "image/png", width: 800, height: 600, sizeBytes: 1, createdAt: "2026-11-20T00:00:00Z" }];
export function fixtureCarousel(id: string): CarouselContent {
  const deck = decks.find(d => d.id === id) ?? decks[0];
  return { platform: "instagram", title: deck.id, caption: "Fixture", hashtags: [], aspectRatio: "4:5", visualTemplateId: "minimal-light", brandHandle: "@fixture", writingStyle: { styleId: "educational" }, slides: deck.slides.map((raw, i) => {
    const { templateId, headline, body = "", images, ...content } = raw;
    return { id: `pattern-${i}`, slideNumber: i+1, role: i === 0 ? "cover" : i === deck.slides.length-1 ? "cta" : "body", headline, body, visualDirection: "", templateId, patternContent: content, media: images.map(image => ({ ...image, zoom: 1 })) } as CarouselSlide;
  }) };
}
