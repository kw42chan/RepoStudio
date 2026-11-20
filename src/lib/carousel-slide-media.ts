import type { CarouselSlide, SlideImageAsset } from "./types";
import { getPattern } from "./carousel-pattern-registry";

const clamp = (n: number | undefined, min: number, max: number, fallback: number) => Number.isFinite(n) ? Math.max(min, Math.min(max, n!)) : fallback;
export function resolveSlideMedia(slide: CarouselSlide, assets: SlideImageAsset[]) {
  const pattern = getPattern(slide.templateId)?.pattern;
  return (pattern?.imageSlots ?? []).map(slot => {
    const placement = slide.media?.find(m => m.slotId === slot.id);
    const asset = assets.find(a => a.id === placement?.assetId);
    return { slot, asset, altText: placement?.altText ?? "", focalPoint: { x: clamp(placement?.focalPoint.x, 0, 1, slot.defaultFocalPoint.x), y: clamp(placement?.focalPoint.y, 0, 1, slot.defaultFocalPoint.y) }, zoom: clamp(placement?.zoom, 1, 3, 1), missingRequired: slot.required && !asset };
  });
}

export function mediaWarnings(slide: CarouselSlide, assets: SlideImageAsset[]) {
  return resolveSlideMedia(slide, assets).filter(s => s.missingRequired).map(s => `Add an image to ${s.slot.id.replaceAll("-", " ")} before exporting.`);
}
