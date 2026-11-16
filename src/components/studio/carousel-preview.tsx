"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  brandMark,
  carouselPalette,
  slideGround,
} from "@/lib/carousel-design";
import { AspectRatio, CarouselSlide, VisualTemplate } from "@/lib/types";
import { getExportDimensions } from "@/lib/export-carousel";

interface SlideCanvasProps {
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

export function SlideCanvas({
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
  const ground = slideGround(slide.slideNumber - 1, totalSlides, slide.role);
  const isLight = ground === "light";
  const isLast = slide.slideNumber === totalSlides || slide.role === "cta";
  const showLockup = slide.role === "cover" || slide.role === "cta";
  const mark = brandMark(brandHandle);
  const headingFont =
    template.fontStyle === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : template.fontStyle === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, monospace"
        : 'var(--font-epilogue), "Epilogue", system-ui, sans-serif';
  const bodyFont =
    template.fontStyle === "serif"
      ? 'var(--font-epilogue), "Epilogue", system-ui, sans-serif'
      : headingFont;
  const ink = isLight ? palette.darkBg : "#F7F7F5";
  const muted = isLight ? "#8A8580" : "rgba(255,255,255,0.72)";
  const tagColor = isLight
    ? palette.brandPrimary
    : ground === "gradient"
      ? "rgba(255,255,255,0.6)"
      : palette.brandSecondary;
  const background =
    ground === "gradient"
      ? `linear-gradient(165deg, ${palette.brandDark} 0%, ${palette.brandPrimary} 50%, ${palette.brandLight} 100%)`
      : ground === "dark"
        ? palette.darkBg
        : palette.lightBg;
  const headingSize = px(slide.headline.length > 72 ? 26 : slide.role === "cover" ? 34 : 30);
  const scale = fullResolution ? 1 : 0.34;

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
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          transform: fullResolution ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          background,
          color: ink,
          fontFamily: bodyFont,
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
                  fontWeight: 600,
                  fontSize: px(16),
                }}
              >
                {mark.initial}
              </span>
              <span
                style={{
                  fontFamily: bodyFont,
                  fontSize: px(13),
                  fontWeight: 600,
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
                fontSize: px(10),
                fontWeight: 600,
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
              fontWeight: template.fontStyle === "bold-display" ? 700 : 600,
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
                fontWeight: 600,
                fontSize: px(14),
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
                fontSize: px(14),
                fontWeight: 400,
                lineHeight: 1.5,
                color: muted,
              }}
            >
              {slide.body}
            </p>
          )}
        </div>

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
      </div>
    </div>
  );
}

interface CarouselPreviewProps {
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

  if (!currentSlide) return null;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex w-full items-center justify-between text-xs text-muted-foreground">
        <span>
          Live Preview ({dims.width} × {dims.height})
        </span>
        <span>
          Slide {activeIndex + 1} of {slides.length}
        </span>
      </div>

      <SlideCanvas
        slide={currentSlide}
        totalSlides={slides.length}
        template={template}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
        brandHandle={brandHandle}
        platform={platform}
        aspectRatio={aspectRatio}
      />

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
