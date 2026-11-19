import manifest from "./manifest.v1.json";
import { hydrateSlideStructuredSlots } from "../carousel-slide-slots";
import type {
  CarouselContent,
  CarouselSlide,
  LayoutPackIds,
  RepurposeIdea,
  UserLayoutPack,
} from "../types";
import type { CarouselSlideLayout } from "../types";

export {
  getCarouselTemplateRenderVariant,
  templateIdUsesStructuredRenderer,
  type CarouselTemplateRenderVariant,
} from "./render-variants";

export type CarouselTemplateCategoryId =
  | "hook-cover"
  | "hook-hero"
  | "body-narrative"
  | "body-grid"
  | "body-profile"
  | "body-list"
  | "body-stats"
  | "body-cheatsheet"
  | "cta-close";

export type CarouselTemplateIntent =
  | "hook"
  | "explain"
  | "list"
  | "cta"
  | "compare";

export type CarouselTemplateImplementationStatus =
  | "rendered"
  | "reference-only";

export interface CarouselTemplateSlots {
  required: string[];
  optional: string[];
}

export interface CarouselTemplateStructure {
  zones?: string[];
  background?: string;
  pattern?: string;
  columns?: string[];
  repeatPerSlide?: number;
  listItems?: { count: number; cellSlots: string[] };
  metricCells?: { count: number; cellSlots: string[] };
}

export interface CarouselTemplateDefinition {
  id: string;
  version: number;
  category: CarouselTemplateCategoryId;
  intent: CarouselTemplateIntent;
  layout: CarouselSlideLayout;
  implementationStatus?: CarouselTemplateImplementationStatus;
  /** When true (and the template is rendered), the style appears in the per-slide picker. */
  showInStylePicker?: boolean;
  /** Short picker label when the catalog does not override it. */
  styleLabel?: string;
  tags?: string[];
  experimental?: boolean;
  platforms?: Array<CarouselContent["platform"]>;
  productionFallbackId?: string;
  sourceUrl?: string;
  inspirationNotes?: string;
  structure?: CarouselTemplateStructure;
  roles: Array<CarouselSlide["role"]>;
  slots: CarouselTemplateSlots;
  gridCells?: {
    count: number;
    cellSlots: string[];
  };
  preview: {
    thumbnailKey: string;
    description: string;
    thumbnailPath?: string;
  };
}

export interface CarouselReferenceCarousel {
  id: string;
  sourceUrl: string;
  author: string;
  topic: string;
  typicalSlideCount: string;
  fetchMethod: string;
  slideSequence: Array<{
    position: number | string;
    templateId: string;
    role: string;
  }>;
}

export interface CarouselTemplateCategory {
  id: CarouselTemplateCategoryId;
  label: string;
  whenToUse: string;
}

export interface CarouselLayoutPack {
  id: string;
  label: string;
  platforms: Array<CarouselContent["platform"]>;
  description: string;
  referenceId?: string;
  slideTemplateIds?: string[];
  slideRoles?: Array<CarouselSlide["role"]>;
  forceLinkedInGrid?: boolean;
  comingSoon?: boolean;
  disabled?: boolean;
}

export interface GraphicsStyleCatalogGroup {
  id: string;
  label: string;
  categories: CarouselTemplateCategoryId[];
}

export interface GraphicsStyleCatalogEntry {
  templateId: string;
  label: string;
  tags?: string[];
  experimental?: boolean;
  platforms?: Array<CarouselContent["platform"]>;
}

export interface GraphicsStyleCatalog {
  version: number;
  groups: GraphicsStyleCatalogGroup[];
  styles?: GraphicsStyleCatalogEntry[];
}

export interface GraphicsStyle {
  templateId: string;
  label: string;
  pickerLabel: string;
  description: string;
  thumbnailPath?: string;
  tags: string[];
  experimental: boolean;
  platforms: Array<CarouselContent["platform"]>;
  category: CarouselTemplateCategoryId;
  groupId: string;
  groupLabel: string;
}

export interface CarouselTemplateManifest {
  version: string;
  references?: CarouselReferenceCarousel[];
  layoutPacks?: CarouselLayoutPack[];
  graphicsStyleCatalog?: GraphicsStyleCatalog;
  categories: CarouselTemplateCategory[];
  templates: CarouselTemplateDefinition[];
}

export const carouselTemplateManifest =
  manifest as CarouselTemplateManifest;

const layoutPacksById = new Map(
  (carouselTemplateManifest.layoutPacks ?? []).map((pack) => [pack.id, pack])
);

const templatesById = new Map(
  carouselTemplateManifest.templates.map((template) => [
    template.id,
    template,
  ])
);

export function getCarouselTemplate(
  templateId: string
): CarouselTemplateDefinition | undefined {
  return templatesById.get(templateId);
}

export function listCarouselTemplates(): CarouselTemplateDefinition[] {
  return carouselTemplateManifest.templates;
}

export function getLayoutForTemplate(
  templateId: string
): CarouselSlideLayout | undefined {
  return getCarouselTemplate(templateId)?.layout;
}

/** Maps a reference template id to the production template used for layout/render today. */
export function resolveProductionTemplateId(templateId: string): string {
  const template = getCarouselTemplate(templateId);
  if (!template) {
    return templateId;
  }
  if (template.implementationStatus === "reference-only") {
    return template.productionFallbackId ?? templateId;
  }
  return templateId;
}

export function listReferenceCarousels(): CarouselReferenceCarousel[] {
  return carouselTemplateManifest.references ?? [];
}

export function getReferenceCarousel(
  sourceUrlOrId: string
): CarouselReferenceCarousel | undefined {
  const refs = listReferenceCarousels();
  return refs.find(
    (ref) =>
      ref.id === sourceUrlOrId ||
      ref.sourceUrl === sourceUrlOrId ||
      ref.sourceUrl.replace(/\/$/, "") === sourceUrlOrId.replace(/\/$/, "")
  );
}

export function listReferenceOnlyTemplates(): CarouselTemplateDefinition[] {
  return carouselTemplateManifest.templates.filter(
    (template) => template.implementationStatus === "reference-only"
  );
}

export const USER_LAYOUT_PACK_PREFIX = "user-pack:";
export const FALLBACK_GRAPHICS_STYLE_ID = "body-narrative-default";

export function userLayoutPackSelectId(id: string): string {
  return id.startsWith(USER_LAYOUT_PACK_PREFIX)
    ? id
    : `${USER_LAYOUT_PACK_PREFIX}${id}`;
}

export function userLayoutPackStorageId(id: string): string {
  return id.startsWith(USER_LAYOUT_PACK_PREFIX)
    ? id.slice(USER_LAYOUT_PACK_PREFIX.length)
    : id;
}

export function layoutPackFromUser(pack: UserLayoutPack): CarouselLayoutPack {
  return {
    id: userLayoutPackSelectId(pack.id),
    label: pack.name,
    platforms: [pack.platform],
    description: `Saved sequence from catalog ${pack.catalogVersion}.`,
    slideTemplateIds: pack.slideTemplateIds,
    slideRoles: pack.slideRoles,
  };
}

export function getLayoutPack(
  packId: string,
  userPacks: UserLayoutPack[] = []
): CarouselLayoutPack | undefined {
  const builtin = layoutPacksById.get(packId);
  if (builtin) return builtin;
  if (!packId.startsWith(USER_LAYOUT_PACK_PREFIX)) return undefined;
  const storageId = userLayoutPackStorageId(packId);
  const found = userPacks.find((pack) => pack.id === storageId);
  return found ? layoutPackFromUser(found) : undefined;
}

export function listLayoutPacksForPlatform(
  platform: CarouselContent["platform"],
  userPacks: UserLayoutPack[] = []
): CarouselLayoutPack[] {
  const builtin = (carouselTemplateManifest.layoutPacks ?? []).filter((pack) =>
    pack.platforms.includes(platform)
  );
  const mine = userPacks
    .filter((pack) => pack.platform === platform)
    .map(layoutPackFromUser);
  return [...builtin, ...mine];
}

/** Known rendered graphics styles stay; anything else becomes Narrative. */
export function resolveGraphicsStyleId(templateId: string): {
  templateId: string;
  invalid: boolean;
} {
  const template = getCarouselTemplate(templateId);
  if (template && (template.implementationStatus ?? "rendered") === "rendered") {
    return { templateId, invalid: false };
  }
  return { templateId: FALLBACK_GRAPHICS_STYLE_ID, invalid: true };
}

export function effectiveLayoutPackId(
  platform: CarouselContent["platform"],
  layoutPackIds?: LayoutPackIds,
  userPacks: UserLayoutPack[] = []
): string {
  const chosen =
    platform === "instagram"
      ? layoutPackIds?.instagram
      : layoutPackIds?.linkedin;
  const packId = chosen?.trim() || "default";
  const pack = getLayoutPack(packId, userPacks);
  if (!pack || pack.disabled) {
    return "default";
  }
  if (!pack.platforms.includes(platform)) {
    return "default";
  }
  return packId;
}

export function layoutPackForcesLinkedInGrid(packId: string): boolean {
  if (packId === "default" || packId === "linkedin-pm-grid") {
    return true;
  }
  return getLayoutPack(packId)?.forceLinkedInGrid === true;
}

export interface NormalizeCarouselOptions {
  layoutPackId?: string;
  userPacks?: UserLayoutPack[];
}

const LISTICLE_ANGLE_HINTS = [
  "step-by-step",
  "playbook",
  "list",
  "tools",
  "toolkit",
  "roundup",
  "every",
  "should know",
];

const LISTICLE_TEXT_HINTS = [
  "tools",
  "toolkit",
  "stack",
  "listicle",
  "every pm",
  "should know",
];

export interface PickTemplateContext {
  platform: CarouselContent["platform"];
  idea?: RepurposeIdea;
  totalSlides: number;
  slideIndex: number;
  layoutPackId?: string;
  userPacks?: UserLayoutPack[];
}

function ideaSuggestsToolGrid(idea: RepurposeIdea | undefined): boolean {
  if (!idea) return false;
  const angle = idea.angleType.toLowerCase();
  const blob = `${idea.title} ${idea.hook} ${idea.summary}`.toLowerCase();
  return (
    LISTICLE_ANGLE_HINTS.some((hint) => angle.includes(hint)) ||
    LISTICLE_TEXT_HINTS.some((hint) => blob.includes(hint))
  );
}

function slideHasCompleteGrid(slide: CarouselSlide): boolean {
  return (
    slide.layout === "grid-2x3" && (slide.gridCells?.length ?? 0) === 6
  );
}

/**
 * Maps slide content and carousel context to a library template id.
 */
export function pickTemplateForSlide(
  slide: CarouselSlide,
  context: PickTemplateContext
): string {
  const pack =
    context.layoutPackId && context.layoutPackId !== "default"
      ? getLayoutPack(context.layoutPackId, context.userPacks)
      : undefined;
  const packedTemplate = pack?.slideTemplateIds?.[context.slideIndex];
  if (packedTemplate) {
    return packedTemplate;
  }

  if (slideHasCompleteGrid(slide)) {
    return "body-tool-grid-2x3";
  }

  if (slide.role === "cover" || context.slideIndex === 0) {
    return "hook-scroll-cover";
  }

  if (
    slide.role === "cta" ||
    context.slideIndex === context.totalSlides - 1
  ) {
    return "cta-action-close";
  }

  if (
    slide.layout === "grid-2x3" &&
    (slide.gridCells?.length ?? 0) > 0
  ) {
    return "body-tool-grid-2x3";
  }

  return "body-narrative-default";
}

export { ideaSuggestsToolGrid };

const DEFAULT_STYLE_PLATFORMS: Array<CarouselContent["platform"]> = [
  "instagram",
  "linkedin",
];

export function formatGraphicsStyleLabel(style: {
  label: string;
  experimental?: boolean;
}): string {
  return style.experimental ? `${style.label} (preview)` : style.label;
}

function catalogStyleById(): Map<string, GraphicsStyleCatalogEntry> {
  const entries = carouselTemplateManifest.graphicsStyleCatalog?.styles ?? [];
  return new Map(entries.map((entry) => [entry.templateId, entry]));
}

function groupForCategory(
  category: CarouselTemplateCategoryId
): GraphicsStyleCatalogGroup {
  const groups = carouselTemplateManifest.graphicsStyleCatalog?.groups ?? [];
  return (
    groups.find((group) => group.categories.includes(category)) ?? {
      id: "other",
      label: "Other",
      categories: [],
    }
  );
}

function styleFromTemplate(
  template: CarouselTemplateDefinition
): GraphicsStyle {
  const entry = catalogStyleById().get(template.id);
  const experimental = entry?.experimental ?? template.experimental ?? false;
  const label =
    entry?.label ?? template.styleLabel ?? template.preview.description;
  const group = groupForCategory(template.category);
  return {
    templateId: template.id,
    label,
    pickerLabel: formatGraphicsStyleLabel({ label, experimental }),
    description: template.preview.description,
    thumbnailPath: template.preview.thumbnailPath,
    tags: entry?.tags ?? template.tags ?? [],
    experimental,
    platforms: entry?.platforms ?? template.platforms ?? DEFAULT_STYLE_PLATFORMS,
    category: template.category,
    groupId: group.id,
    groupLabel: group.label,
  };
}

function pickerTemplateIds(): string[] {
  const ids = new Set<string>();
  for (const template of carouselTemplateManifest.templates) {
    if (
      template.implementationStatus === "rendered" &&
      template.showInStylePicker === true
    ) {
      ids.add(template.id);
    }
  }
  for (const entry of carouselTemplateManifest.graphicsStyleCatalog?.styles ??
    []) {
    const template = getCarouselTemplate(entry.templateId);
    if (
      template &&
      (template.implementationStatus ?? "rendered") === "rendered" &&
      template.showInStylePicker !== false
    ) {
      ids.add(template.id);
    }
  }
  return carouselTemplateManifest.templates
    .map((template) => template.id)
    .filter((id) => ids.has(id));
}

/** Catalog styles for the per-slide graphics picker. Grows with manifest entries. */
export function listGraphicsStyles(options?: {
  platform?: CarouselContent["platform"];
}): GraphicsStyle[] {
  const groupOrder = (
    carouselTemplateManifest.graphicsStyleCatalog?.groups ?? []
  ).map((group) => group.id);
  const templateIndex = new Map(
    carouselTemplateManifest.templates.map((template, index) => [
      template.id,
      index,
    ])
  );
  const styles = pickerTemplateIds()
    .map((id) => getCarouselTemplate(id))
    .filter((template): template is CarouselTemplateDefinition =>
      Boolean(template)
    )
    .map(styleFromTemplate)
    .filter((style) =>
      options?.platform ? style.platforms.includes(options.platform) : true
    );

  styles.sort((a, b) => {
    const groupA = groupOrder.indexOf(a.groupId);
    const groupB = groupOrder.indexOf(b.groupId);
    const rankA = groupA === -1 ? 99 : groupA;
    const rankB = groupB === -1 ? 99 : groupB;
    if (rankA !== rankB) return rankA - rankB;
    return (
      (templateIndex.get(a.templateId) ?? 0) -
      (templateIndex.get(b.templateId) ?? 0)
    );
  });
  return styles;
}

export function listGraphicsStylesForPlatform(
  platform: CarouselContent["platform"]
): GraphicsStyle[] {
  return listGraphicsStyles({ platform });
}

export function getGraphicsStyle(
  templateId: string
): GraphicsStyle | undefined {
  return listGraphicsStyles().find((style) => style.templateId === templateId);
}

export function graphicsStyleCaption(
  slideNumber: number,
  templateId: string | undefined
): string {
  const style = templateId ? getGraphicsStyle(templateId) : undefined;
  const label = style?.pickerLabel ?? "Pack default";
  return `Slide ${slideNumber} · ${label}`;
}

/** Id written to `data-carousel-template` on the live preview. */
export function previewCarouselTemplateId(
  slide: Pick<CarouselSlide, "templateId" | "role" | "layout">
): string {
  if (slide.templateId) return slide.templateId;
  if (slide.layout === "grid-2x3") return "body-tool-grid-2x3";
  if (slide.role === "cover") return "hook-scroll-cover";
  if (slide.role === "cta") return "cta-action-close";
  return "body-narrative-default";
}

function templateKeepsListItems(
  template: CarouselTemplateDefinition,
  templateId: string
): boolean {
  return Boolean(
    template.structure?.listItems?.count &&
      (template.category === "body-list" ||
        templateId.includes("tip-lock") ||
        templateId.includes("switches"))
  );
}

export function applyGraphicsStyleToSlide(
  slide: CarouselSlide,
  templateId: string
): CarouselSlide {
  const productionId = resolveProductionTemplateId(templateId);
  const layoutTemplate = getCarouselTemplate(productionId);
  if (!layoutTemplate && !getCarouselTemplate(templateId)) {
    return slide;
  }

  const applied = applyTemplateLayoutToSlide(slide, templateId);
  const slotTemplate = layoutTemplate ?? getCarouselTemplate(templateId);
  if (!slotTemplate) return applied;

  const usesList = templateKeepsListItems(slotTemplate, slotTemplate.id);
  const usesMetrics =
    slotTemplate.category === "body-stats" ||
    slotTemplate.id.includes("metrics");
  const usesCheatsheet =
    slotTemplate.category === "body-cheatsheet" ||
    slotTemplate.id.includes("cheatsheet");

  return hydrateSlideStructuredSlots({
    ...applied,
    listItems: usesList ? applied.listItems : undefined,
    metricCells: usesMetrics ? applied.metricCells : undefined,
    cheatsheetRows: usesCheatsheet ? applied.cheatsheetRows : undefined,
  });
}

function positionalSlideRole(
  slideIndex: number,
  totalSlides: number
): CarouselSlide["role"] {
  if (slideIndex <= 0) return "cover";
  if (slideIndex >= totalSlides - 1) return "cta";
  return "body";
}

/**
 * Pack default for one index, ignoring the slide's current style, role, and grid.
 * The Default pack has no explicit sequence: cover, narrative body, close.
 */
export function defaultTemplateForPackIndex(context: PickTemplateContext): {
  templateId: string;
  role: CarouselSlide["role"];
} {
  const packId = context.layoutPackId?.trim() || "default";
  const pack = getLayoutPack(packId, context.userPacks);
  const role =
    pack?.slideRoles?.[context.slideIndex] ??
    positionalSlideRole(context.slideIndex, context.totalSlides);
  const packed = pack?.slideTemplateIds?.[context.slideIndex];
  if (packed) {
    return { templateId: resolveGraphicsStyleId(packed).templateId, role };
  }
  if (
    context.platform === "linkedin" &&
    layoutPackForcesLinkedInGrid(packId) &&
    context.slideIndex === 3
  ) {
    return { templateId: "body-tool-grid-2x3", role: "body" };
  }
  const clean: CarouselSlide = {
    id: "pack-default",
    slideNumber: context.slideIndex + 1,
    role,
    headline: "",
    body: "",
    visualDirection: "",
  };
  return {
    templateId: pickTemplateForSlide(clean, { ...context, layoutPackId: packId }),
    role,
  };
}

export function resetSlideGraphicsStyle(
  slide: CarouselSlide,
  context: PickTemplateContext
): CarouselSlide {
  const { templateId, role } = defaultTemplateForPackIndex(context);
  const keepGrid =
    templateId === "body-tool-grid-2x3" ? slide.gridCells : undefined;
  return applyGraphicsStyleToSlide(
    {
      ...slide,
      role,
      layout: undefined,
      gridCells: keepGrid,
      listItems: undefined,
      metricCells: undefined,
      cheatsheetRows: undefined,
      surface: { kind: "inherit" },
      accentOverride: undefined,
    },
    templateId
  );
}

export function applyTemplateLayoutToSlide(
  slide: CarouselSlide,
  templateId: string
): CarouselSlide {
  const productionId = resolveProductionTemplateId(templateId);
  const layoutTemplate = getCarouselTemplate(productionId);
  if (!layoutTemplate) {
    return slide;
  }

  const next: CarouselSlide = {
    ...slide,
    templateId,
    layout:
      layoutTemplate.layout === "default" ? undefined : layoutTemplate.layout,
  };

  if (layoutTemplate.layout !== "grid-2x3") {
    return {
      ...next,
      gridCells: undefined,
    };
  }

  return next;
}

export function normalizeCarouselSlideTemplates(
  carousel: CarouselContent,
  idea?: RepurposeIdea,
  options?: NormalizeCarouselOptions
): CarouselContent {
  const layoutPackId = options?.layoutPackId ?? carousel.layoutPackId ?? "default";
  const userPacks = options?.userPacks ?? [];
  const pack = getLayoutPack(layoutPackId, userPacks);
  const totalSlides = carousel.slides.length;
  const warnings: string[] = [];
  const slides = carousel.slides.map((slide, slideIndex) => {
    const roleFromPack = pack?.slideRoles?.[slideIndex];
    const baseSlide =
      roleFromPack && roleFromPack !== slide.role
        ? { ...slide, role: roleFromPack }
        : slide;
    const picked = pickTemplateForSlide(baseSlide, {
      platform: carousel.platform,
      idea,
      totalSlides,
      slideIndex,
      layoutPackId,
      userPacks,
    });
    const resolved = resolveGraphicsStyleId(picked);
    if (resolved.invalid) {
      warnings.push(
        `Slide ${slideIndex + 1} used an unknown graphics style and fell back to Narrative.`
      );
    }
    const withTemplate = applyTemplateLayoutToSlide(
      baseSlide,
      resolved.templateId
    );
    return hydrateSlideStructuredSlots(withTemplate);
  });

  return {
    ...carousel,
    slides,
    layoutPackId,
    layoutWarnings: warnings.length > 0 ? warnings : undefined,
  };
}