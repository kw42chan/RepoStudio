import manifest from "./manifest.v1.json";
import type {
  CarouselContent,
  CarouselSlide,
  LayoutPackIds,
  RepurposeIdea,
} from "../types";
import type { CarouselSlideLayout } from "../types";

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

export interface CarouselTemplateManifest {
  version: string;
  references?: CarouselReferenceCarousel[];
  layoutPacks?: CarouselLayoutPack[];
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

export function getLayoutPack(packId: string): CarouselLayoutPack | undefined {
  return layoutPacksById.get(packId);
}

export function listLayoutPacksForPlatform(
  platform: CarouselContent["platform"]
): CarouselLayoutPack[] {
  return (carouselTemplateManifest.layoutPacks ?? []).filter((pack) =>
    pack.platforms.includes(platform)
  );
}

export function effectiveLayoutPackId(
  platform: CarouselContent["platform"],
  layoutPackIds?: LayoutPackIds
): string {
  const chosen =
    platform === "instagram"
      ? layoutPackIds?.instagram
      : layoutPackIds?.linkedin;
  const packId = chosen?.trim() || "default";
  const pack = getLayoutPack(packId);
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
      ? getLayoutPack(context.layoutPackId)
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

export function applyTemplateLayoutToSlide(
  slide: CarouselSlide,
  templateId: string
): CarouselSlide {
  const productionId = resolveProductionTemplateId(templateId);
  const template = getCarouselTemplate(productionId);
  if (!template) {
    return slide;
  }

  const next: CarouselSlide = {
    ...slide,
    templateId,
    layout: template.layout === "default" ? undefined : template.layout,
  };

  if (template.layout !== "grid-2x3") {
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
  const pack = getLayoutPack(layoutPackId);
  const totalSlides = carousel.slides.length;
  const slides = carousel.slides.map((slide, slideIndex) => {
    const roleFromPack = pack?.slideRoles?.[slideIndex];
    const baseSlide =
      roleFromPack && roleFromPack !== slide.role
        ? { ...slide, role: roleFromPack }
        : slide;
    const templateId = pickTemplateForSlide(baseSlide, {
      platform: carousel.platform,
      idea,
      totalSlides,
      slideIndex,
      layoutPackId,
    });
    return applyTemplateLayoutToSlide(baseSlide, templateId);
  });

  return { ...carousel, slides, layoutPackId };
}