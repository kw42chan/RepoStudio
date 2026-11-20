import {
  carouselPalette,
  parseHex,
  slideGround,
  type SlideGround,
} from "./carousel-design";
import { getCarouselTemplateRenderVariant } from "./carousel-templates";
import type { CarouselSlide, SlideSurface, VisualTemplate } from "./types";

export interface ResolvedSlideColors {
  background: string;
  ink: string;
  muted: string;
  accent: string;
  isLight: boolean;
  ground: SlideGround;
}

export const EDWARD_DARK = "#0d2818";
export const EDWARD_MINT = "#6ee7a0";

const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const SLIDE_SURFACE_PRESETS = [
  { id: "edward-dark", label: "Edward dark" },
  { id: "brand-gradient", label: "Brand gradient" },
  { id: "light-card", label: "Light card" },
] as const;

export type SlideSurfacePresetId = (typeof SLIDE_SURFACE_PRESETS)[number]["id"];

type ThemeTemplate = Pick<VisualTemplate, "accentColor" | "surfaceColor">;

function toHex(rgb: [number, number, number]): string {
  return `#${rgb.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

export function normalizeSlideHex(input: string | undefined): string | undefined {
  if (!input || !HEX.test(input.trim())) return undefined;
  return toHex(parseHex(input));
}

function readsLight(hex: string): boolean {
  const [red, green, blue] = parseHex(hex);
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255 > 0.65;
}

function textColors(isLight: boolean, darkInk: string): Pick<ResolvedSlideColors, "ink" | "muted"> {
  return isLight
    ? { ink: darkInk, muted: "#8A8580" }
    : { ink: "#F7F7F5", muted: "rgba(255,255,255,0.72)" };
}

function surfaceKind(slide: Pick<CarouselSlide, "surface">): SlideSurface["kind"] {
  return slide.surface?.kind ?? "inherit";
}

function gradientCss(
  angle: number | undefined,
  stops: { color: string; at: number }[]
): string | undefined {
  const painted = stops
    .map((stop) => {
      const color = normalizeSlideHex(stop.color);
      if (!color || !Number.isFinite(stop.at)) return null;
      const at = Math.min(100, Math.max(0, stop.at));
      return { color, at };
    })
    .filter((stop): stop is { color: string; at: number } => Boolean(stop))
    .sort((a, b) => a.at - b.at);
  if (painted.length < 2) return undefined;
  const degrees = Number.isFinite(angle) ? Math.min(360, Math.max(0, angle as number)) : 165;
  return `linear-gradient(${degrees}deg, ${painted
    .map((stop) => `${stop.color} ${stop.at}%`)
    .join(", ")})`;
}

function dominantHex(surface: SlideSurface, fallback: string): string {
  if (surface.kind === "solid") return normalizeSlideHex(surface.color) ?? fallback;
  if (surface.kind === "gradient") {
    const first = surface.stops[0]?.color;
    return normalizeSlideHex(first) ?? fallback;
  }
  return fallback;
}

/**
 * Single color resolver for the live preview and full-resolution export.
 * `inherit` keeps today's narrative ground, or Edward's baked dark stage.
 */
export function resolveSlideColors(
  slide: Pick<
    CarouselSlide,
    "surface" | "accentOverride" | "role" | "slideNumber" | "templateId"
  >,
  visualTemplate: ThemeTemplate,
  primaryColor: string,
  secondaryColor: string,
  totalSlides = 1
): ResolvedSlideColors {
  const palette = carouselPalette(
    primaryColor || visualTemplate.accentColor,
    secondaryColor || visualTemplate.surfaceColor
  );
  const override = normalizeSlideHex(slide.accentOverride);
  const kind = surfaceKind(slide);
  const edward = Boolean(getCarouselTemplateRenderVariant(slide.templateId));

  if (kind === "inherit" && edward) {
    const brandMint =
      secondaryColor?.startsWith("#") && secondaryColor.trim().length >= 7
        ? normalizeSlideHex(secondaryColor)
        : undefined;
    return {
      background: EDWARD_DARK,
      ink: "#F7F7F5",
      muted: "rgba(255,255,255,0.72)",
      accent: override ?? brandMint ?? EDWARD_MINT,
      isLight: false,
      ground: "dark",
    };
  }

  if (kind === "inherit") {
    const ground = slideGround(slide.slideNumber - 1, totalSlides, slide.templateId === "hook-scroll-cover" ? "cover" : slide.role);
    const isLight = ground === "light";
    const background =
      ground === "gradient"
        ? `linear-gradient(165deg, ${palette.brandDark} 0%, ${palette.brandPrimary} 50%, ${palette.brandLight} 100%)`
        : ground === "dark"
          ? palette.darkBg
          : palette.lightBg;
    const accent =
      override ??
      (isLight
        ? palette.brandPrimary
        : ground === "gradient"
          ? "rgba(255,255,255,0.6)"
          : palette.brandSecondary);
    return {
      background,
      ...textColors(isLight, palette.darkBg),
      accent,
      isLight,
      ground,
    };
  }

  const surface = slide.surface as SlideSurface;
  const gradient =
    surface.kind === "gradient"
      ? gradientCss(surface.angle, surface.stops)
      : undefined;
  if (surface.kind === "gradient" && !gradient) {
    return resolveSlideColors(
      { ...slide, surface: { kind: "inherit" } },
      visualTemplate,
      primaryColor,
      secondaryColor,
      totalSlides
    );
  }

  const solid = surface.kind === "solid" ? normalizeSlideHex(surface.color) : undefined;
  if (surface.kind === "solid" && !solid) {
    return resolveSlideColors(
      { ...slide, surface: { kind: "inherit" } },
      visualTemplate,
      primaryColor,
      secondaryColor,
      totalSlides
    );
  }

  const ground: SlideGround = surface.kind === "gradient" ? "gradient" : "dark";
  const sample = dominantHex(surface, palette.brandDark);
  const isLight =
    surface.kind === "gradient"
      ? surface.stops.every((stop) => {
          const color = normalizeSlideHex(stop.color);
          return color ? readsLight(color) : false;
        })
      : readsLight(solid || sample);
  const resolvedGround: SlideGround = isLight ? "light" : ground === "gradient" ? "gradient" : "dark";
  const accent =
    override ??
    (isLight
      ? palette.brandPrimary
      : resolvedGround === "gradient"
        ? "rgba(255,255,255,0.6)"
        : palette.brandSecondary);

  return {
    background: surface.kind === "gradient" ? gradient! : solid!,
    ...textColors(isLight, palette.darkBg),
    accent,
    isLight,
    ground: resolvedGround,
  };
}

export function surfacePatchForPreset(
  id: SlideSurfacePresetId,
  primaryColor: string,
  secondaryColor: string,
  visualTemplate: ThemeTemplate
): Pick<CarouselSlide, "surface" | "accentOverride"> {
  const palette = carouselPalette(
    primaryColor || visualTemplate.accentColor,
    secondaryColor || visualTemplate.surfaceColor
  );
  if (id === "edward-dark") {
    return {
      surface: { kind: "solid", color: EDWARD_DARK },
      accentOverride: EDWARD_MINT,
    };
  }
  if (id === "brand-gradient") {
    return {
      surface: {
        kind: "gradient",
        angle: 165,
        stops: [
          { color: palette.brandDark, at: 0 },
          { color: palette.brandPrimary, at: 50 },
          { color: palette.brandLight, at: 100 },
        ],
      },
      accentOverride: undefined,
    };
  }
  return {
    surface: { kind: "solid", color: palette.lightBg },
    accentOverride: undefined,
  };
}
