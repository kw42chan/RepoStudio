export type CarouselTemplateRenderVariant =
  | "hero-showcase"
  | "hero-photo-cta"
  | "hero-centered-stat"
  | "scene-compare"
  | "numbered-list"
  | "profile-card"
  | "cheatsheet"
  | "stats-row";

const VARIANT_BY_TEMPLATE: Record<string, CarouselTemplateRenderVariant> = {
  "ref-edwardai-hook-hero-showcase": "hero-showcase",
  "ref-edwardai-hook-photo-agent-cta": "hero-photo-cta",
  "ref-edwardai-hook-hero-centered-stat": "hero-centered-stat",
  "ref-edwardai-body-scene-compare": "scene-compare",
  "ref-edwardai-body-tip-lock-three": "numbered-list",
  "ref-edwardai-body-numbered-switches": "numbered-list",
  "ref-edwardai-body-agent-profile-card": "profile-card",
  "ref-edwardai-body-cheatsheet-3way": "cheatsheet",
  "ref-edwardai-body-stats-metrics-row": "stats-row",
};

export function getCarouselTemplateRenderVariant(
  templateId: string | undefined
): CarouselTemplateRenderVariant | null {
  if (!templateId) return null;
  return VARIANT_BY_TEMPLATE[templateId] ?? null;
}

export function templateIdUsesStructuredRenderer(
  templateId: string | undefined
): boolean {
  return getCarouselTemplateRenderVariant(templateId) !== null;
}