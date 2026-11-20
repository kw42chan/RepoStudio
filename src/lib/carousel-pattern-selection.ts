import { getPattern, listPatterns, applyPattern, patternContentWarnings } from "./carousel-pattern-registry";
import { mediaWarnings } from "./carousel-slide-media";
import type { CarouselContent, CarouselSlide, SlideImageAsset } from "./types";
export const SLIDE_INTENTS = ["cover","claim","metric","parallel-list","comparison","flow","sequence","sequence-summary","evidence","cta"] as const;
export type SlideIntent = typeof SLIDE_INTENTS[number];

function intentFor(slide: CarouselSlide): SlideIntent {
  if (slide.role === "cover") return "cover";
  if (slide.role === "cta") return "cta";
  if (slide.intent) return slide.intent;
  if (slide.patternContent?.metric) return "metric";
  if (slide.patternContent?.items?.length === 3 || slide.listItems?.length === 3) return "parallel-list";
  return "claim";
}

export function selectPattern(slide: CarouselSlide, context: { platform: CarouselContent["platform"]; assets?: SlideImageAsset[]; previousId?: string; usedIds?: string[] }) {
  const intent = intentFor(slide); const candidates = listPatterns({ role: slide.role, platform: context.platform });
  const rejected: string[] = [];
  const preferred = slide.preferredPatternIds ?? [];
  const valid = candidates.flatMap(t => {
    const candidate = applyPattern(slide,t.id);
    const unsuitable = patternContentWarnings(candidate).length > 0 || mediaWarnings(candidate,context.assets ?? []).length > 0 || t.id === "signal-metric-evidence" && context.usedIds?.includes(t.id);
    if (unsuitable) { if (preferred.includes(t.id)) rejected.push(t.id); return []; }
    const same = context.previousId === t.id;
    const densePair = getPattern(context.previousId)?.pattern?.density === "dense" && t.pattern!.density === "dense";
    const score = (t.pattern!.intentTags.includes(intent) ? 50 : 0) + (preferred.includes(t.id) ? 20 : 0) - (same ? 25 : 0) - (densePair ? 15 : 0);
    return [{ templateId: t.id, score, slide: candidate }];
  }).sort((a,b) => b.score-a.score || a.templateId.localeCompare(b.templateId));
  const fallbackId = slide.role === "cover" ? "hook-scroll-cover" : slide.role === "cta" ? "cta-action-close" : "body-narrative-default";
  const selected = valid[0];
  const templateId = selected?.templateId ?? fallbackId;
  const invalidPreferred = preferred.some(id => !candidates.some(t => t.id === id) || rejected.includes(id));
  const warnings = invalidPreferred ? ["A suggested layout did not match this slide's content or images. A compatible layout was selected."] : [];
  if (!selected) warnings.push("Using the standard layout because the new patterns need shorter copy, more structured points, or an image.");
  return { templateId, slide: selected?.slide ?? { ...slide, templateId: fallbackId, layout: undefined }, reason: selected ? `Selected for ${intent}; required content and image slots are compatible.` : "Standard layout preserves the available content.", warnings };
}

export function selectDeckPatterns(carousel: CarouselContent, assets: SlideImageAsset[] = []): CarouselContent {
  const usedIds: string[] = []; const warnings: string[] = [];
  const slides = carousel.slides.map((slide,index) => {
    const role = index === 0 ? "cover" : index === carousel.slides.length-1 ? "cta" : "body";
    const selected = selectPattern({ ...slide, role, slideNumber: index+1 }, { platform: carousel.platform, assets, previousId: usedIds.at(-1), usedIds });
    usedIds.push(selected.templateId); warnings.push(...selected.warnings.map(w => `Slide ${index+1}: ${w}`));
    return { ...selected.slide, selectionReason: selected.reason };
  });
  return { ...carousel, slides, layoutPackId: "auto-patterns", layoutWarnings: warnings.length ? warnings : undefined };
}

export function patternPromptSummary() {
  return listPatterns().map(t => ({ id: t.id, roles: t.roles, intents: t.pattern!.intentTags, required: t.pattern!.requiredSlots, limits: t.pattern!.contentLimits, imageSlots: t.pattern!.imageSlots.map(s => ({id:s.id,required:s.required})), guidance:t.pattern!.selectionGuidance }));
}
