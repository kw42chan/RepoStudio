import { validatedCatalog } from "./carousel-templates/catalog";
import type { CarouselSlide } from "./types";

export function listPatterns(context: { role?: CarouselSlide["role"]; platform?: "instagram" | "linkedin"; includeReferences?: boolean } = {}) {
  return validatedCatalog.templates.filter(t => t.pattern && (context.includeReferences || t.implementationStatus === "rendered") && (!context.role || t.roles.includes(context.role)) && (!context.platform || !t.platforms || t.platforms.includes(context.platform)));
}

export function getPattern(id: string | undefined) {
  return validatedCatalog.templates.find(t => t.id === id && t.pattern && t.implementationStatus === "rendered");
}

/** Preserve actual user content. Missing structured fields are edited explicitly. */
export function applyPattern(slide: CarouselSlide, patternId: string): CarouselSlide {
  const template = getPattern(patternId);
  if (!template?.pattern) return slide;
  const content = { ...slide.patternContent };
  if (!content.items && slide.listItems?.length) content.items = slide.listItems.map(i => ({ title: i.title, body: i.description }));
  if (!content.metric && slide.metricCells?.length) { content.metric = slide.metricCells[0].value; content.unit = slide.metricCells[0].label; }
  if (patternId === "signal-cta" && !content.action) content.action = slide.body;
  return { ...slide, templateId: patternId, layout: undefined, patternContent: content };
}

export function patternFields(slide: CarouselSlide): Record<string, unknown> {
  return { headline: slide.headline, body: slide.body, ...slide.patternContent };
}

export function patternContentWarnings(slide: CarouselSlide): string[] {
  const definition = getPattern(slide.templateId)?.pattern;
  if (!definition) return [];
  const fields = patternFields(slide);
  const errors: string[] = [];
  const len = (value: string) => Array.from(value).length;
  for (const field of definition.requiredSlots) {
    const value = fields[field];
    if (!value || Array.isArray(value) && value.length === 0) errors.push(`Add ${field === "items" ? "points" : field} to complete this layout.`);
  }
  const limit = definition.contentLimits;
  if (len(slide.headline) > limit.headlineMax) errors.push(`Shorten the heading to ${limit.headlineMax} characters.`);
  if (definition.optionalSlots.includes("body") && len(slide.body) > limit.bodyMax) errors.push(`Shorten the supporting copy to ${limit.bodyMax} characters.`);
  const items = slide.patternContent?.items ?? [];
  if (items.length < limit.minItems || items.length > limit.maxItems) errors.push(`Use ${limit.minItems === limit.maxItems ? limit.minItems : `${limit.minItems}–${limit.maxItems}`} points for this layout.`);
  if (items.some(i => len(i.title) > limit.itemTitleMax || len(i.body) > limit.itemBodyMax)) errors.push(`Keep point titles within ${limit.itemTitleMax} characters and descriptions within ${limit.itemBodyMax}.`);
  return [...new Set(errors)];
}
