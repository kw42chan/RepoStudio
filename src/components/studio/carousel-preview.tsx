"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AspectRatio, CarouselSlide, VisualTemplate } from "@/lib/types";
import { getExportDimensions } from "@/lib/export-carousel";

interface SlideCanvasProps {
  slide: CarouselSlide;
  totalSlides: number;
  template: VisualTemplate;
  accentColor: string;
  brandHandle: string;
  platform: "instagram" | "linkedin";
  aspectRatio: AspectRatio;
  fullResolution?: boolean;
}

export function SlideCanvas({
  slide,
  totalSlides,
  template,
  accentColor,
  brandHandle,
  platform,
  aspectRatio,
  fullResolution = false,
}: SlideCanvasProps) {
  const dims = getExportDimensions(aspectRatio);
  const fontFamily =
    template.fontStyle === "serif"
      ? "Georgia, Cambria, 'Times New Roman', serif"
      : template.fontStyle === "mono"
        ? "ui-monospace, SFMono-Regular, Menlo, monospace"
        : "var(--font-geist-sans), system-ui, sans-serif";

  const backgroundStyle: React.CSSProperties =
    template.layoutMood === "gradient"
      ? {
          background: `linear-gradient(145deg, ${template.backgroundColor} 0%, ${template.surfaceColor} 55%, ${accentColor}22 100%)`,
        }
      : { backgroundColor: template.backgroundColor };

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
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          transform: fullResolution ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          color: template.textColor,
          fontFamily,
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "76px",
          boxSizing: "border-box",
          ...backgroundStyle,
        }}
      >
        {template.backdropImageUrl && (
          <img
            src={template.backdropImageUrl}
            alt=""
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: template.backdropOpacity ?? 0.16,
              pointerEvents: "none",
            }}
          />
        )}

        {/* Top Bar */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            fontSize: "24px",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: template.mutedColor,
          }}
        >
          <span>{brandHandle || "@yourbrand"}</span>
          <span
            style={{
              padding: "8px 18px",
              borderRadius: "999px",
              backgroundColor: `${accentColor}20`,
              color: accentColor,
              fontSize: "20px",
              fontWeight: 700,
            }}
          >
            {String(slide.slideNumber).padStart(2, "0")} /{" "}
            {String(totalSlides).padStart(2, "0")}
          </span>
        </div>

        {/* Main Content */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "32px",
            padding: template.layoutMood === "card" ? "56px" : "0px",
            borderRadius: template.layoutMood === "card" ? "32px" : "0px",
            backgroundColor:
              template.layoutMood === "card"
                ? template.surfaceColor
                : "transparent",
            border:
              template.layoutMood === "card"
                ? `2px solid ${accentColor}40`
                : "none",
          }}
        >
          {slide.eyebrow && (
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "24px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: accentColor,
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "36px",
                  height: "4px",
                  backgroundColor: accentColor,
                  borderRadius: "2px",
                }}
              />
              {slide.eyebrow}
            </div>
          )}

          <h2
            style={{
              margin: 0,
              fontSize:
                slide.role === "cover"
                  ? "78px"
                  : slide.role === "cta"
                    ? "64px"
                    : "58px",
              lineHeight: 1.12,
              fontWeight: template.fontStyle === "bold-display" ? 900 : 800,
              letterSpacing: "-0.02em",
              color: template.textColor,
            }}
          >
            {slide.headline}
          </h2>

          <p
            style={{
              margin: 0,
              fontSize: slide.role === "cover" ? "34px" : "36px",
              lineHeight: 1.48,
              color:
                slide.role === "cover"
                  ? template.mutedColor
                  : template.textColor,
              opacity: slide.role === "cover" ? 1 : 0.88,
            }}
          >
            {slide.body}
          </p>
        </div>

        {/* Footer */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderTop: `2px solid ${template.mutedColor}30`,
            paddingTop: "28px",
            fontSize: "22px",
            color: template.mutedColor,
          }}
        >
          <span>
            {platform === "linkedin" ? "LinkedIn Carousel" : "Instagram Carousel"}{" "}
            • {dims.width}×{dims.height}
          </span>
          <span style={{ color: accentColor, fontWeight: 700 }}>
            {slide.role === "cta" ? "Save & Share" : "Swipe →"}
          </span>
        </div>
      </div>
    </div>
  );
}

interface CarouselPreviewProps {
  slides: CarouselSlide[];
  activeIndex: number;
  onSelectIndex: (index: number) => void;
  template: VisualTemplate;
  accentColor: string;
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
  accentColor,
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
        accentColor={accentColor}
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
              accentColor={accentColor}
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
