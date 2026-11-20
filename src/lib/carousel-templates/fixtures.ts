import { z } from "zod";
import type { CarouselPatternContract } from "./schema";

export const patternFixtureSlideSchema = z.object({
  templateId: z.string(), headline: z.string(), body: z.string().optional(),
  items: z.array(z.object({ title: z.string(), body: z.string() }).strict()).optional(),
  metric: z.string().optional(), unit: z.string().optional(), action: z.string().optional(),
  prompt: z.string().optional(), outcome: z.string().optional(), badge: z.string().optional(),
  recommendation: z.string().optional(), takeaway: z.string().optional(),
  images: z.array(z.object({ slotId: z.string(), assetId: z.string(), focalPoint: z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }) }).strict()),
}).strict();

export const fixtureDeckSchema = z.object({
  id: z.string(), expected: z.enum(["valid", "over-limit", "missing-required-images"]),
  slides: z.array(patternFixtureSlideSchema).min(3).max(12),
}).strict();

export type PatternFixtureSlide = z.infer<typeof patternFixtureSlideSchema>;

/** Contract checks for preparation fixtures; measured layout fit comes in Phase 4.6. */
export function validatePatternFixture(slide: PatternFixtureSlide, pattern: CarouselPatternContract): string[] {
  const errors: string[] = [];
  const length = (text: string) => Array.from(text).length;
  const fields = slide as Record<string, unknown>;
  for (const key of pattern.requiredSlots) {
    const value = fields[key];
    if (value === undefined || value === "" || (Array.isArray(value) && !value.length)) errors.push(`required:${key}`);
  }
  const limits = pattern.contentLimits;
  if (length(slide.headline) > limits.headlineMax) errors.push("limit:headline");
  if (length(slide.body ?? "") > limits.bodyMax) errors.push("limit:body");
  const items = slide.items ?? [];
  if (items.length < limits.minItems || items.length > limits.maxItems) errors.push("limit:items");
  if (items.some(i => length(i.title) > limits.itemTitleMax || length(i.body) > limits.itemBodyMax)) errors.push("limit:item-copy");
  for (const slot of pattern.imageSlots) {
    if (slot.required && !slide.images.some(i => i.slotId === slot.id)) errors.push(`image:required:${slot.id}`);
  }
  if (new Set(slide.images.map(i => i.slotId)).size !== slide.images.length) errors.push("image:duplicate");
  for (const image of slide.images) {
    if (!pattern.imageSlots.some(s => s.id === image.slotId)) errors.push(`image:unsupported:${image.slotId}`);
  }
  return errors;
}
