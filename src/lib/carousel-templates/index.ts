import manifest from "./manifest.v1.json";
import type { CarouselContent, CarouselSlide, RepurposeIdea } from "../types";
import type { CarouselSlideLayout } from "../types";

export type CarouselTemplateCategoryId =
  | "hook-cover"
  | "body-narrative"
  | "body-grid"
  | "cta-close";

export type CarouselTemplateIntent =
  | "hook"
  | "explain"
  | "list"
  | "cta";

export interface CarouselTemplateSlots {
  required: string[];
  optional: string[];
}

export interface CarouselTemplateDefinition {
  id: string;
  version: number;
  category: CarouselTemplateCategoryId;
  intent: CarouselTemplateIntent;
  layout: CarouselSlideLayout;
  roles: Array<CarouselSlide["role"]>;
  slots: CarouselTemplateSlots;
  gridCells?: {
    count: number;
    cellSlots: string[];
  };
  preview: {
    thumbnailKey: string;
    description: string;
  };
}

export interface CarouselTemplateCategory {
  id: CarouselTemplateCategoryId;
  label: string;
  whenToUse: string;
}

export interface CarouselTemplateManifest {
  version: string;
  categories: CarouselTemplateCategory[];
  templates: CarouselTemplateDefinition[];
}

export const carouselTemplateManifest =
  manifest as CarouselTemplateManifest;

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
  const template = getCarouselTemplate(templateId);
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
  idea?: RepurposeIdea
): CarouselContent {
  const totalSlides = carousel.slides.length;
  const slides = carousel.slides.map((slide, slideIndex) => {
    const templateId = pickTemplateForSlide(slide, {
      platform: carousel.platform,
      idea,
      totalSlides,
      slideIndex,
    });
    return applyTemplateLayoutToSlide(slide, templateId);
  });

  return { ...carousel, slides };
}