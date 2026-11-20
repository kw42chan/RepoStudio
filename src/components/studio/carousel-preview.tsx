"use client";
import { resolveBrandTheme, type ResolvedBrandTheme } from "@/lib/carousel-brand-theme";
import type { BrandDesignSettingsV1 } from "@/lib/carousel-fonts";


import React from "react";
import { fitSlide, type SlideFitReport } from "@/lib/carousel-content-fit";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getToolLogo } from "@/lib/carousel-assets";
import {
  brandMark,
  carouselPalette,
  slideGround,
} from "@/lib/carousel-design";
import { resolveSlideColors } from "@/lib/carousel-slide-theme";
import {
  getCarouselTemplate,
  getCarouselTemplateRenderVariant,
  graphicsStyleCaption,
  previewCarouselTemplateId,
} from "@/lib/carousel-templates";
import { EdwardAiStructuredSlide } from "@/components/studio/edwardai-slide-layouts";
import { getPattern } from "@/lib/carousel-pattern-registry";
import { PatternSlide } from "./carousel-patterns";
import { AspectRatio, CarouselSlide, VisualTemplate, SlideImageAsset } from "@/lib/types";
import { getExportDimensions } from "@/lib/export-carousel";

interface SlideCanvasProps {
  assets?: SlideImageAsset[];
  design?: BrandDesignSettingsV1;
  slide: CarouselSlide;
  totalSlides: number;
  template: VisualTemplate;
  primaryColor: string;
  secondaryColor: string;
  brandHandle: string;
  platform: "instagram" | "linkedin";
  aspectRatio: AspectRatio;
  fullResolution?: boolean;
}

interface SlideChromeProps {
  slide: CarouselSlide;
  totalSlides: number;
  palette: ReturnType<typeof carouselPalette>;
  bodyFont: string;
  px: (value: number) => number;
  isLight: boolean;
  ground: ReturnType<typeof slideGround>;
  isLast: boolean;
}

function SlideProgressChrome({
  slide,
  totalSlides,
  palette,
  bodyFont,
  px,
  isLight,
  ground,
  isLast,
}: SlideChromeProps) {
  return (
    <>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: px(10),
          padding: `${px(16)}px ${px(28)}px ${px(20)}px`,
        }}
      >
        <div
          style={{
            flex: 1,
            height: px(3),
            borderRadius: px(2),
            overflow: "hidden",
            background: isLight
              ? "rgba(0,0,0,0.08)"
              : "rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(slide.slideNumber / Math.max(totalSlides, 1)) * 100}%`,
              borderRadius: px(2),
              background: isLight
                ? palette.brandPrimary
                : ground === "dark"
                  ? palette.brandSecondary
                  : "#ffffff",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: bodyFont,
            fontSize: px(11),
            fontWeight: 500,
            color: isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.4)",
          }}
        >
          {slide.slideNumber}/{totalSlides}
        </span>
      </div>

      {!isLast && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: px(48),
            zIndex: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: `linear-gradient(to right, transparent, ${
              isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.08)"
            })`,
          }}
        >
          <svg width={px(24)} height={px(24)} viewBox="0 0 24 24" fill="none">
            <path
              d="M9 6l6 6-6 6"
              stroke={isLight ? "rgba(0,0,0,0.25)" : "rgba(255,255,255,0.35)"}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </>
  );
}

interface GridSlideCanvasProps {
  theme: ResolvedBrandTheme;
  slide: CarouselSlide;
  totalSlides: number;
  template: VisualTemplate;
  palette: ReturnType<typeof carouselPalette>;
  brandHandle: string;
  platform: "instagram" | "linkedin";
  dims: { width: number; height: number };
  unit: number;
  px: (value: number) => number;
  headingFont: string;
  bodyFont: string;
  fullResolution: boolean;
  isLast: boolean;
}

function GridSlideCanvas({
  theme,
  slide,
  totalSlides,
  palette,
  brandHandle,
  platform,
  dims,
  unit,
  px,
  headingFont,
  bodyFont,
  fullResolution,
  isLast,
}: GridSlideCanvasProps) {
  const mark = brandMark(brandHandle);
  const cells = (slide.gridCells || []).slice(0, 6);
  const ink = "#F7F7F5";
  const muted = "rgba(255,255,255,0.72)";
  const accent = palette.brandSecondary;
  const cardBg = "rgba(255,255,255,0.08)";
  const cardBorder = "rgba(255,255,255,0.14)";
  const scale = fullResolution ? 1 : 0.34;
  const ground = "dark" as const;

  return (
    <div
      style={{
        width: `${dims.width * scale}px`,
        height: `${dims.height * scale}px`,
        overflow: "hidden",
        position: "relative",
        borderRadius: fullResolution ? "0px" : "12px",
      }}
      className={fullResolution ? "" : "shadow-md border"}
    >
      <div
        data-platform={platform}
        data-layout="grid-2x3"
        data-carousel-template={previewCarouselTemplateId(slide)}
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          transform: fullResolution ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          background: palette.darkBg,
          color: ink,
          fontFamily: bodyFont, fontWeight: theme.body.weight,
        }}
      >
        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
            padding: `${px(32)}px ${px(56)}px ${px(52)}px ${px(32)}px`,
            gap: px(18),
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: px(10),
            }}
          >
            <span
              style={{
                width: px(34),
                height: px(34),
                borderRadius: "50%",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: palette.brandPrimary,
                color: "#ffffff",
                fontFamily: headingFont,
                fontWeight: theme.heading.weight,
                fontSize: Math.round(px(14) * theme.heading.sizeScale),
              }}
            >
              {mark.initial}
            </span>
            <span
              style={{
                fontSize: Math.round(px(12) * theme.body.sizeScale),
                fontWeight: theme.body.weight,
                letterSpacing: `${px(0.4)}px`,
              }}
            >
              {mark.label}
            </span>
          </div>

          {slide.eyebrow && (
            <span
              style={{
                fontSize: Math.round(px(10) * theme.body.sizeScale),
                fontWeight: theme.body.weight,
                letterSpacing: `${px(2)}px`,
                textTransform: "uppercase",
                color: accent,
              }}
            >
              {slide.eyebrow}
            </span>
          )}

          <h2
            style={{
              margin: 0,
              fontFamily: headingFont,
              fontSize: Math.round(px(28) * theme.heading.sizeScale),
              fontWeight: theme.heading.weight,
              letterSpacing: `${-0.3 * unit}px`,
              lineHeight: 1.1,
              maxWidth: "20ch",
            }}
          >
            {slide.headline}
          </h2>

          {slide.body && (
            <p
              style={{
                margin: 0,
                fontSize: Math.round(px(13) * theme.body.sizeScale),
                lineHeight: 1.45,
                color: muted,
                maxWidth: "36ch",
              }}
            >
              {slide.body}
            </p>
          )}

          <div
            style={{
              flex: 1,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gridTemplateRows: "repeat(3, minmax(0, 1fr))",
              gap: px(10),
              minHeight: 0,
            }}
          >
            {cells.map((cell) => (
              <div
                key={cell.number}
                style={{
                  borderRadius: px(12),
                  border: `1px solid ${cardBorder}`,
                  background: cardBg,
                  padding: `${px(10)}px ${px(12)}px`,
                  display: "flex",
                  flexDirection: "column",
                  gap: px(4),
                  minHeight: 0,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: px(8),
                  }}
                >
                  <span
                    style={{
                      width: px(22),
                      height: px(22),
                      borderRadius: px(6),
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: accent,
                      color: palette.brandDark,
                      fontWeight: theme.body.weight,
                      fontSize: Math.round(px(11) * theme.body.sizeScale),
                      flexShrink: 0,
                    }}
                  >
                    {cell.number}
                  </span>
                  <span
                    style={{
                      fontWeight: theme.body.weight,
                      fontSize: Math.round(px(12) * theme.body.sizeScale),
                      lineHeight: 1.2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {cell.title}
                  </span>
                </div>
                {cell.toolIds.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: px(4),
                      flexWrap: "wrap",
                    }}
                  >
                    {cell.toolIds.map((toolId) => {
                      const { src, label } = getToolLogo(toolId);
                      return (
                        <img
                          key={`${cell.number}-${toolId}`}
                          src={src}
                          alt={label}
                          title={label}
                          width={px(18)}
                          height={px(18)}
                          style={{
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      );
                    })}
                  </div>
                )}
                <p
                  style={{
                    margin: 0,
                    fontSize: Math.round(px(10) * theme.body.sizeScale),
                    lineHeight: 1.35,
                    color: muted,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {cell.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <SlideProgressChrome
          slide={slide}
          totalSlides={totalSlides}
          palette={palette}
          bodyFont={bodyFont}
          px={px}
          isLight={false}
          ground={ground}
          isLast={isLast}
        />
      </div>
    </div>
  );
}

export function SlideCanvas({
  assets,
  design,
  slide,
  totalSlides,
  template,
  primaryColor,
  secondaryColor,
  brandHandle,
  platform,
  aspectRatio,
  fullResolution = false,
}: SlideCanvasProps) {
  const dims = getExportDimensions(aspectRatio);
  const unit = dims.width / 420;
  const px = (value: number) => Math.round(value * unit);
  const palette = carouselPalette(
    primaryColor || template.accentColor,
    secondaryColor || template.surfaceColor
  );
  const colors = resolveSlideColors(
    slide,
    template,
    primaryColor,
    secondaryColor,
    totalSlides
  );
  const ground = colors.ground;
  const isLight = colors.isLight;
  const isLast = slide.slideNumber === totalSlides || slide.role === "cta";
  const showLockup = slide.role === "cover" || slide.role === "cta" || slide.templateId === "hook-scroll-cover";
  const mark = brandMark(brandHandle);
  const theme = resolveBrandTheme({ design }, template);
  const headingFont = theme.heading.fontFamily;
  const bodyFont = theme.body.fontFamily;
  const ink = colors.ink;
  const muted = colors.muted;
  const tagColor = colors.accent;
  const background = colors.background;
  const headingSize = Math.round(px(slide.headline.length > 72 ? 26 : slide.role === "cover" || slide.templateId === "hook-scroll-cover" ? 34 : 30) * theme.heading.sizeScale);
  const scale = fullResolution ? 1 : 0.34;
  const carouselTemplateId = previewCarouselTemplateId(slide);
  const carouselTemplateLayout =
    getCarouselTemplate(carouselTemplateId)?.layout ?? "default";
  const edwardVariant = getCarouselTemplateRenderVariant(carouselTemplateId);

  if (getPattern(carouselTemplateId)) {
    return <PatternSlide {...{ slide, totalSlides, theme, template, primaryColor, secondaryColor, brandHandle, aspectRatio, platform, fullResolution, assets }} />;
  }

  if (edwardVariant) {
    return (
      <EdwardAiStructuredSlide
        theme={theme}
        slide={slide}
        totalSlides={totalSlides}
        template={template}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        brandHandle={brandHandle}
        platform={platform}
        aspectRatio={aspectRatio}
        variant={edwardVariant}
        fullResolution={fullResolution}
      />
    );
  }

  if (slide.layout === "grid-2x3" && (slide.gridCells?.length ?? 0) > 0) {
    return (
      <GridSlideCanvas
        theme={theme}
        slide={slide}
        totalSlides={totalSlides}
        template={template}
        palette={palette}
        brandHandle={brandHandle}
        platform={platform}
        dims={dims}
        unit={unit}
        px={px}
        headingFont={headingFont}
        bodyFont={bodyFont}
        fullResolution={fullResolution}
        isLast={isLast}
      />
    );
  }

  return (
    <div
      style={{
        width: `${dims.width * scale}px`,
        height: `${dims.height * scale}px`,
        overflow: "hidden",
        position: "relative",
        borderRadius: fullResolution ? "0px" : "12px",
      }}
      className={fullResolution ? "" : "shadow-md border"}
    >
      <div
        data-platform={platform}
        data-layout={carouselTemplateLayout}
        data-carousel-template={carouselTemplateId}
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          transform: fullResolution ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          background,
          color: ink,
          fontFamily: bodyFont, fontWeight: theme.body.weight,
        }}
      >
        {template.backdropImageUrl && isLight && (
          <img
            src={template.backdropImageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: Math.min(template.backdropOpacity ?? 0.16, 0.2),
              pointerEvents: "none",
            }}
          />
        )}

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: showLockup ? "center" : "flex-end",
            gap: px(14),
            boxSizing: "border-box",
            padding: `${px(36)}px ${px(64)}px ${px(64)}px ${px(36)}px`,
          }}
        >
          {showLockup && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: px(12),
                marginBottom: px(8),
              }}
            >
              <span
                style={{
                  width: px(40),
                  height: px(40),
                  borderRadius: "50%",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: isLight ? palette.brandPrimary : palette.lightBg,
                  color: isLight ? "#ffffff" : palette.brandDark,
                  fontFamily: headingFont,
                  fontWeight: theme.heading.weight,
                  fontSize: Math.round(px(16) * theme.heading.sizeScale),
                }}
              >
                {mark.initial}
              </span>
              <span
                style={{
                  fontFamily: bodyFont,
                  fontSize: Math.round(px(13) * theme.body.sizeScale),
                  fontWeight: theme.body.weight,
                  letterSpacing: `${px(0.5)}px`,
                }}
              >
                {mark.label}
              </span>
            </div>
          )}

          {slide.eyebrow && (
            <span
              style={{
                display: "block",
                fontFamily: bodyFont,
                fontSize: Math.round(px(10) * theme.body.sizeScale),
                fontWeight: theme.body.weight,
                letterSpacing: `${px(2)}px`,
                textTransform: "uppercase",
                color: tagColor,
              }}
            >
              {slide.eyebrow}
            </span>
          )}

          <h2
            style={{
              margin: 0,
              maxWidth: "16ch",
              fontFamily: headingFont,
              fontSize: headingSize,
              fontWeight: theme.heading.weight,
              letterSpacing: `${-0.4 * unit}px`,
              lineHeight: 1.12,
              color: ink,
            }}
          >
            {slide.headline}
          </h2>

          {slide.role === "cta" && slide.body.length <= 90 ? (
            <span
              style={{
                alignSelf: "flex-start",
                maxWidth: "22ch",
                marginTop: px(8),
                padding: `${px(12)}px ${px(22)}px`,
                borderRadius: px(28),
                background: palette.lightBg,
                color: palette.brandDark,
                fontFamily: bodyFont,
                fontWeight: theme.body.weight,
                fontSize: Math.round(px(14) * theme.body.sizeScale),
                lineHeight: 1.35,
              }}
            >
              {slide.body}
            </span>
          ) : (
            <p
              style={{
                margin: 0,
                maxWidth: "28ch",
                fontFamily: bodyFont,
                fontSize: Math.round(px(14) * theme.body.sizeScale),
                fontWeight: theme.body.weight,
                lineHeight: 1.5,
                color: muted,
              }}
            >
              {slide.body}
            </p>
          )}
        </div>

        <SlideProgressChrome
          slide={slide}
          totalSlides={totalSlides}
          palette={palette}
          bodyFont={bodyFont}
          px={px}
          isLight={isLight}
          ground={ground}
          isLast={isLast}
        />
      </div>
    </div>
  );
}

interface CarouselPreviewProps {
  onMeasured?: (reports: SlideFitReport[]) => void;
  assets?: SlideImageAsset[];
  design?: BrandDesignSettingsV1;
  slides: CarouselSlide[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  template: VisualTemplate;
  primaryColor: string;
  secondaryColor: string;
  brandHandle: string;
  platform: "instagram" | "linkedin";
  aspectRatio: AspectRatio;
  exportRefs: React.MutableRefObject<(HTMLDivElement | null)[]>;
}

export function CarouselPreview({
  onMeasured,
  assets,
  design,
  slides,
  activeIndex,
  onSelectIndex,
  template,
  primaryColor,
  secondaryColor,
  brandHandle,
  platform,
  aspectRatio,
  exportRefs,
}: CarouselPreviewProps) {
  const currentSlide = slides[activeIndex] || slides[0];
  const dims = getExportDimensions(aspectRatio);
  const containerRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    let cancelled = false;
    async function measure() {
      await document.fonts.ready;
      await Promise.all([...containerRef.current?.querySelectorAll("img") ?? []].map(img => img.decode().catch(() => undefined)));
      if(cancelled)return;
      const visible=containerRef.current?.querySelector<HTMLElement>("[data-carousel-template]");
      if(visible)fitSlide(visible);
      const reports=exportRefs.current.slice(0,slides.length).flatMap((wrapper,i)=>{
        const root=wrapper?.querySelector<HTMLElement>("[data-carousel-template]");
        return root ? [{id:slides[i].id,...fitSlide(root)}] : [];
      });
      onMeasured?.(reports);
    }
    void measure();return()=>{cancelled=true;};
  },[slides,activeIndex,template,design,primaryColor,secondaryColor,aspectRatio,assets,exportRefs,onMeasured]);

  if (!currentSlide) return null;

  return (
    <div ref={containerRef} className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span>
          Live Preview ({dims.width} × {dims.height})
        </span>
        <span>
          Slide {activeIndex + 1} of {slides.length}
        </span>
      </div>

      <SlideCanvas
        assets={assets}
        design={design}
        slide={currentSlide}
        totalSlides={slides.length}
        template={template}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        brandHandle={brandHandle}
        platform={platform}
        aspectRatio={aspectRatio}
      />

      <p className="text-xs text-muted-foreground">
        {graphicsStyleCaption(activeIndex + 1, currentSlide.templateId)}
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={activeIndex <= 0}
          onClick={() => onSelectIndex(Math.max(0, activeIndex - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1.5">
          {slides.map((s, idx) => (
            <button
              key={s.id}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === activeIndex
                  ? "w-5 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          disabled={activeIndex >= slides.length - 1}
          onClick={() =>
            onSelectIndex(Math.min(slides.length - 1, activeIndex + 1))
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Off-screen full-resolution container used for 1080x1350 / 1080x1080 PNG & PDF export */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: "-99999px",
          top: 0,
          pointerEvents: "none",
        }}
      >
        {slides.map((slide, idx) => (
          <div
            key={`export-${slide.id}`}
            ref={(el) => {
              exportRefs.current[idx] = el;
            }}
          >
            <SlideCanvas
        assets={assets}
        design={design}
              slide={slide}
              totalSlides={slides.length}
              template={template}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              brandHandle={brandHandle}
              platform={platform}
              aspectRatio={aspectRatio}
              fullResolution
            />
          </div>
        ))}
      </div>
    </div>
  );
}
