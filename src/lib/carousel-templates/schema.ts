import { z } from "zod";
import { FIRST_RELEASE_PATTERN_IDS } from "./pattern-ids";

const id = z.string().min(1);
const positiveInt = z.number().int().positive();
const slots = z.array(id);
const platform = z.enum(["instagram", "linkedin"]);
const role = z.enum(["cover", "body", "cta"]);
const category = z.enum(["hook-cover", "hook-hero", "body-narrative", "body-grid", "body-profile", "body-list", "body-stats", "body-cheatsheet", "cta-close"]);
const point = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1) }).strict();

export const patternContractSchema = z.object({
  familyId: z.enum(["editorial-signal", "specification-editorial", "warm-storyboard", "midnight-contrast"]),
  release: z.enum(["first", "deferred"]),
  intentTags: z.array(z.enum(["cover", "claim", "metric", "parallel-list", "comparison", "flow", "sequence", "sequence-summary", "evidence", "cta", "audit", "specification", "command", "transformation"])).min(1),
  requiredSlots: slots.min(1),
  optionalSlots: slots,
  imageSlots: z.array(z.object({
    id, purpose: z.enum(["photo", "screenshot", "illustration", "icon"]),
    aspectRatio: z.number().positive(), fit: z.enum(["cover", "contain"]),
    required: z.boolean(), defaultFocalPoint: point,
  }).strict()),
  contentLimits: z.object({
    headlineMax: positiveInt, bodyMax: positiveInt,
    minItems: z.number().int().nonnegative(), maxItems: z.number().int().nonnegative(),
    itemTitleMax: positiveInt, itemBodyMax: positiveInt,
  }).strict().refine(v => v.minItems <= v.maxItems, "minItems must not exceed maxItems"),
  density: z.enum(["light", "balanced", "dense"]),
  supportedModes: z.array(z.enum(["light", "dark"])).min(1),
  rendererVariant: id,
  selectionGuidance: id,
}).strict().superRefine((value, ctx) => {
  const names = [...value.requiredSlots, ...value.optionalSlots];
  if (new Set(names).size !== names.length) ctx.addIssue({ code: "custom", message: "Content slots must be unique" });
  if (new Set(value.imageSlots.map(s => s.id)).size !== value.imageSlots.length) ctx.addIssue({ code: "custom", message: "Image slots must be unique" });
});

export type CarouselPatternContract = z.infer<typeof patternContractSchema>;

const templateSchema = z.object({
  id, version: positiveInt, category,
  intent: z.enum(["hook", "explain", "list", "cta", "compare"]),
  layout: z.enum(["default", "grid-2x3"]),
  implementationStatus: z.enum(["rendered", "reference-only"]).optional(),
  showInStylePicker: z.boolean().optional(), styleLabel: id.optional(),
  tags: slots.optional(), experimental: z.boolean().optional(),
  platforms: z.array(platform).optional(), productionFallbackId: id.optional(),
  sourceUrl: z.string().url().optional(), inspirationNotes: id.optional(),
  structure: z.object({ zones: slots.optional(), background: id.optional(), pattern: id.optional(), columns: slots.optional(), repeatPerSlide: positiveInt.optional(), listItems: z.object({ count: positiveInt, cellSlots: slots }).optional(), metricCells: z.object({ count: positiveInt, cellSlots: slots }).optional() }).strict().optional(),
  roles: z.array(role).min(1), slots: z.object({ required: slots, optional: slots }).strict(),
  gridCells: z.object({ count: positiveInt, cellSlots: slots }).strict().optional(),
  preview: z.object({ thumbnailKey: id, description: id, thumbnailPath: id.optional() }).strict(),
  pattern: patternContractSchema.optional(),
}).strict();

export const carouselTemplateManifestSchema = z.object({
  version: id,
  references: z.array(z.object({ id, sourceUrl: z.string().url(), author: id, topic: id, typicalSlideCount: id, fetchMethod: id, slideSequence: z.array(z.object({ position: z.union([z.number(), id]), templateId: id, role: id }).strict()) }).strict()).optional(),
  layoutPacks: z.array(z.object({ id, label: id, platforms: z.array(platform), description: id, referenceId: id.optional(), slideTemplateIds: slots.optional(), slideRoles: z.array(role).optional(), forceLinkedInGrid: z.boolean().optional(), comingSoon: z.boolean().optional(), disabled: z.boolean().optional() }).strict()).optional(),
  graphicsStyleCatalog: z.object({ version: positiveInt, groups: z.array(z.object({ id, label: id, categories: z.array(category) }).strict()), styles: z.array(z.object({ templateId: id, label: id, tags: slots.optional(), experimental: z.boolean().optional(), platforms: z.array(platform).optional() }).strict()).optional() }).strict().optional(),
  categories: z.array(z.object({ id: category, label: id, whenToUse: id }).strict()),
  templates: z.array(templateSchema).min(1),
}).strict().superRefine((value, ctx) => {
  const templates = new Map(value.templates.map(t => [t.id, t]));
  const error = (message: string) => ctx.addIssue({ code: "custom", message });
  if (templates.size !== value.templates.length) error("Duplicate template identifier");
  const check = (name: string) => { if (!templates.has(name)) error(`Unknown template: ${name}`); };
  for (const t of value.templates) {
    if (t.pattern && t.implementationStatus === "rendered" && !FIRST_RELEASE_PATTERN_IDS.some(id => id === t.pattern!.rendererVariant)) error(`Unknown production pattern renderer: ${t.id}`);
    if (!value.categories.some(c => c.id === t.category)) error(`Unknown category for ${t.id}`);
    if (t.implementationStatus === "reference-only") {
      if (t.showInStylePicker) error(`Reference-only pattern cannot be selectable: ${t.id}`);
      const fallback = templates.get(t.productionFallbackId ?? "");
      if (!fallback || fallback.implementationStatus !== "rendered") error(`Reference pattern needs rendered fallback: ${t.id}`);
    }
  }
  value.layoutPacks?.forEach(p => p.slideTemplateIds?.forEach(check));
  value.references?.forEach(r => r.slideSequence.forEach(s => check(s.templateId)));
  value.graphicsStyleCatalog?.styles?.forEach(s => check(s.templateId));
});

/** Validate the checked-in catalog once, before any consumer can select a template. */
export function parseCarouselTemplateManifest(input: unknown) {
  return carouselTemplateManifestSchema.parse(input);
}
