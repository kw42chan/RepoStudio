"use client";

import React from "react";
import {
  brandMark,
  carouselPalette,
} from "@/lib/carousel-design";
import {
  previewCarouselTemplateId,
  type CarouselTemplateRenderVariant,
} from "@/lib/carousel-templates";
import type { CarouselSlide, VisualTemplate } from "@/lib/types";
import { getExportDimensions } from "@/lib/export-carousel";
import type { AspectRatio } from "@/lib/types";

export interface EdwardAiSlideProps {
  slide: CarouselSlide;
  totalSlides: number;
  template: VisualTemplate;
  primaryColor: string;
  secondaryColor: string;
  brandHandle: string;
  platform: "instagram" | "linkedin";
  aspectRatio: AspectRatio;
  variant: CarouselTemplateRenderVariant;
  fullResolution?: boolean;
}

function EdwardPalette(
  primaryColor: string,
  secondaryColor: string,
  template: VisualTemplate
) {
  const palette = carouselPalette(
    primaryColor || template.accentColor,
    secondaryColor || template.surfaceColor
  );
  const mint =
    secondaryColor?.startsWith("#") && secondaryColor.length >= 7
      ? secondaryColor
      : "#6ee7a0";
  return {
    palette,
    edwardBg: "#0d2818",
    edwardPanel: "#163322",
    edwardStroke: "#2d5a40",
    mint,
    ink: "#F7F7F5",
    muted: "rgba(255,255,255,0.72)",
  };
}

function ProgressFooter({
  slide,
  totalSlides,
  px,
  mint,
}: {
  slide: CarouselSlide;
  totalSlides: number;
  px: (n: number) => number;
  mint: string;
}) {
  const isLast = slide.slideNumber === totalSlides || slide.role === "cta";
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
            background: "rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${(slide.slideNumber / Math.max(totalSlides, 1)) * 100}%`,
              borderRadius: px(2),
              background: mint,
            }}
          />
        </div>
        <span
          style={{
            fontSize: px(11),
            fontWeight: 500,
            color: "rgba(255,255,255,0.4)",
          }}
        >
          {slide.slideNumber}/{totalSlides}
        </span>
      </div>
      {!isLast && slide.role === "cover" && (
        <div
          style={{
            position: "absolute",
            right: px(20),
            bottom: px(56),
            zIndex: 9,
            fontSize: px(11),
            fontWeight: 600,
            letterSpacing: px(1),
            color: mint,
            textTransform: "uppercase",
          }}
        >
          Swipe →
        </div>
      )}
    </>
  );
}

function HeroStage({
  slide,
  px,
  heightPct,
  edwardPanel,
  edwardStroke,
  mint,
}: {
  slide: CarouselSlide;
  px: (n: number) => number;
  heightPct: number;
  edwardPanel: string;
  edwardStroke: string;
  mint: string;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: `${heightPct}%`,
        borderRadius: px(12),
        border: `1px solid ${edwardStroke}`,
        background: `linear-gradient(165deg, ${edwardPanel} 0%, #0a1f14 100%)`,
        position: "relative",
        overflow: "hidden",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(circle at 30% 20%, rgba(110,231,160,0.15), transparent 55%), radial-gradient(circle at 70% 80%, rgba(255,255,255,0.06), transparent 50%)",
        }}
      />
      <p
        style={{
          position: "absolute",
          left: px(16),
          right: px(16),
          bottom: px(12),
          margin: 0,
          fontSize: px(11),
          lineHeight: 1.35,
          color: mint,
          opacity: 0.85,
        }}
      >
        {slide.visualDirection.slice(0, 120)}
      </p>
    </div>
  );
}

function VariantBody({
  variant,
  slide,
  px,
  headingFont,
  bodyFont,
  colors,
  brandHandle,
}: {
  variant: CarouselTemplateRenderVariant;
  slide: CarouselSlide;
  px: (n: number) => number;
  headingFont: string;
  bodyFont: string;
  colors: ReturnType<typeof EdwardPalette>;
  brandHandle: string;
}) {
  const mark = brandMark(brandHandle);
  const { edwardPanel, edwardStroke, mint, ink, muted, palette } = colors;

  switch (variant) {
    case "hero-showcase":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: px(16),
            height: "100%",
            padding: `${px(28)}px ${px(32)}px ${px(64)}px`,
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", gap: px(10), alignItems: "center" }}>
            <span
              style={{
                padding: `${px(6)}px ${px(12)}px`,
                borderRadius: px(20),
                background: edwardPanel,
                fontSize: px(10),
                fontWeight: 600,
                color: mint,
              }}
            >
              {slide.eyebrow || mark.label}
            </span>
            <span
              style={{
                padding: `${px(6)}px ${px(10)}px`,
                borderRadius: px(20),
                background: edwardPanel,
                fontSize: px(10),
                color: muted,
              }}
            >
              {mark.label}
            </span>
          </div>
          <HeroStage
            slide={slide}
            px={px}
            heightPct={52}
            edwardPanel={edwardPanel}
            edwardStroke={edwardStroke}
            mint={mint}
          />
          <h1
            style={{
              margin: 0,
              fontFamily: headingFont,
              fontSize: px(30),
              fontWeight: 600,
              lineHeight: 1.1,
              color: ink,
            }}
          >
            {slide.headline}
          </h1>
          <p
            style={{
              margin: 0,
              fontFamily: bodyFont,
              fontSize: px(14),
              color: mint,
              lineHeight: 1.45,
            }}
          >
            {slide.body}
          </p>
        </div>
      );

    case "hero-photo-cta":
      return (
        <div style={{ position: "relative", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: `linear-gradient(180deg, rgba(13,40,24,0.2) 0%, rgba(13,40,24,0.92) 68%), linear-gradient(135deg, ${palette.brandPrimary}, ${palette.brandDark})`,
            }}
          />
          <div
            style={{
              position: "relative",
              zIndex: 1,
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: `${px(28)}px ${px(32)}px ${px(72)}px`,
              gap: px(12),
            }}
          >
            <span
              style={{
                alignSelf: "flex-start",
                padding: `${px(8)}px ${px(14)}px`,
                borderRadius: px(24),
                background: "rgba(255,255,255,0.92)",
                color: palette.brandDark,
                fontWeight: 700,
                fontSize: px(11),
              }}
            >
              {slide.eyebrow || "3 agents"}
            </span>
            <h1
              style={{
                margin: 0,
                fontFamily: headingFont,
                fontSize: px(32),
                fontWeight: 700,
                color: "#fff",
                maxWidth: "14ch",
              }}
            >
              {slide.headline}
            </h1>
            <p style={{ margin: 0, fontSize: px(15), color: "#fde68a", maxWidth: "26ch" }}>
              {slide.body}
            </p>
            <span
              style={{
                marginTop: px(8),
                alignSelf: "flex-start",
                padding: `${px(10)}px ${px(18)}px`,
                borderRadius: px(22),
                background: mint,
                color: palette.brandDark,
                fontWeight: 700,
                fontSize: px(12),
              }}
            >
              Save the cheat sheet
            </span>
          </div>
        </div>
      );

    case "hero-centered-stat":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            height: "100%",
            padding: `${px(32)}px ${px(36)}px ${px(72)}px`,
            gap: px(14),
            boxSizing: "border-box",
          }}
        >
          <div style={{ display: "flex", gap: px(8) }}>
            {(slide.eyebrow || "Settings").split(/\s+/).slice(0, 2).map((tag) => (
              <span
                key={tag}
                style={{
                  padding: `${px(5)}px ${px(10)}px`,
                  borderRadius: px(14),
                  border: `1px solid ${edwardStroke}`,
                  fontSize: px(9),
                  color: mint,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              width: px(200),
              height: px(200),
              borderRadius: px(16),
              border: `1px solid ${edwardStroke}`,
              background: edwardPanel,
              marginTop: px(8),
              marginBottom: px(4),
            }}
          />
          <p style={{ margin: 0, fontSize: px(12), color: mint, fontStyle: "italic" }}>
            {slide.body.split(".")[0]}
          </p>
          <h1
            style={{
              margin: 0,
              fontFamily: headingFont,
              fontSize: px(28),
              fontWeight: 600,
              color: ink,
              maxWidth: "16ch",
            }}
          >
            {slide.headline}
          </h1>
        </div>
      );

    case "scene-compare":
      return (
        <div
          style={{
            padding: `${px(32)}px ${px(32)}px ${px(64)}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(16),
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <span
            style={{
              alignSelf: "flex-start",
              padding: `${px(6)}px ${px(12)}px`,
              borderRadius: px(16),
              background: edwardPanel,
              color: mint,
              fontSize: px(10),
              fontWeight: 600,
              letterSpacing: px(0.5),
            }}
          >
            {slide.eyebrow || "Scene proof"}
          </span>
          <HeroStage
            slide={slide}
            px={px}
            heightPct={48}
            edwardPanel={edwardPanel}
            edwardStroke={edwardStroke}
            mint={mint}
          />
          <h2
            style={{
              margin: 0,
              fontFamily: headingFont,
              fontSize: px(24),
              color: ink,
              lineHeight: 1.15,
            }}
          >
            {slide.headline}
          </h2>
          <p style={{ margin: 0, fontSize: px(14), color: muted, lineHeight: 1.5 }}>
            {slide.body}
          </p>
        </div>
      );

    case "numbered-list": {
      const items = slide.listItems ?? [];
      return (
        <div
          style={{
            padding: `${px(36)}px ${px(32)}px ${px(64)}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(18),
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: headingFont,
              fontSize: px(26),
              color: ink,
              maxWidth: "18ch",
            }}
          >
            {slide.headline}
          </h2>
          {items.map((item) => (
            <div
              key={item.number}
              style={{
                display: "grid",
                gridTemplateColumns: `${px(36)}px 1fr`,
                gap: px(12),
                alignItems: "start",
              }}
            >
              <span
                style={{
                  width: px(32),
                  height: px(32),
                  borderRadius: px(8),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: edwardPanel,
                  border: `1px solid ${edwardStroke}`,
                  color: mint,
                  fontWeight: 700,
                  fontSize: px(14),
                }}
              >
                {item.number}
              </span>
              <div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: px(14),
                    color: ink,
                    marginBottom: px(4),
                  }}
                >
                  {item.title}
                </div>
                <div style={{ fontSize: px(12), color: muted, lineHeight: 1.45 }}>
                  {item.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    case "profile-card":
      return (
        <div
          style={{
            padding: `${px(40)}px ${px(32)}px ${px(64)}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(16),
            height: "100%",
          }}
        >
          {profileGlyph(px, mint, edwardPanel)}
          <span
            style={{
              alignSelf: "flex-start",
              padding: `${px(4)}px ${px(10)}px`,
              borderRadius: px(12),
              background: mint,
              color: palette.brandDark,
              fontSize: px(10),
              fontWeight: 700,
            }}
          >
            {slide.eyebrow || "主力"}
          </span>
          <h2 style={{ margin: 0, fontSize: px(28), fontFamily: headingFont, color: ink }}>
            {slide.headline}
          </h2>
          <p style={{ margin: 0, fontSize: px(15), color: mint, lineHeight: 1.5 }}>
            {slide.body.split(".")[0]}.
          </p>
          <p
            style={{
              margin: 0,
              marginTop: "auto",
              fontSize: px(13),
              color: muted,
              borderTop: `1px solid ${edwardStroke}`,
              paddingTop: px(16),
            }}
          >
            Trade-off: {slide.body.includes(".") ? slide.body.split(".").slice(1).join(".").trim() : slide.body}
          </p>
        </div>
      );

    case "cheatsheet": {
      const rows = slide.cheatsheetRows ?? [];
      return (
        <div
          style={{
            padding: `${px(32)}px ${px(28)}px ${px(64)}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(14),
            height: "100%",
          }}
        >
          <h2 style={{ margin: 0, fontSize: px(24), fontFamily: headingFont, color: ink }}>
            {slide.headline}
          </h2>
          <div
            style={{
              borderRadius: px(10),
              border: `1px solid ${edwardStroke}`,
              overflow: "hidden",
              fontSize: px(11),
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1.2fr 0.9fr 1.4fr",
                gap: px(8),
                padding: `${px(10)}px ${px(12)}px`,
                background: edwardPanel,
                color: mint,
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: px(0.5),
              }}
            >
              <span>Scenario</span>
              <span>Agent</span>
              <span>Note</span>
            </div>
            {rows.map((row, i) => (
              <div
                key={`${row.scenario}-${i}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 0.9fr 1.4fr",
                  gap: px(8),
                  padding: `${px(10)}px ${px(12)}px`,
                  borderTop: `1px solid ${edwardStroke}`,
                  color: i % 2 === 0 ? ink : muted,
                }}
              >
                <span>{row.scenario}</span>
                <span style={{ color: mint, fontWeight: 600 }}>{row.agent}</span>
                <span>{row.note}</span>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, fontSize: px(12), color: muted }}>{slide.body}</p>
        </div>
      );
    }

    case "stats-row": {
      const metrics = slide.metricCells ?? [];
      return (
        <div
          style={{
            padding: `${px(48)}px ${px(32)}px ${px(64)}px`,
            display: "flex",
            flexDirection: "column",
            gap: px(28),
            height: "100%",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              margin: 0,
              textAlign: "center",
              fontFamily: headingFont,
              fontSize: px(26),
              color: ink,
            }}
          >
            {slide.headline}
          </h2>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              gap: px(12),
              flexWrap: "wrap",
            }}
          >
            {metrics.map((cell) => (
              <div key={cell.label} style={{ textAlign: "center", minWidth: px(100) }}>
                <div
                  style={{
                    fontSize: px(40),
                    fontWeight: 700,
                    color: mint,
                    lineHeight: 1,
                  }}
                >
                  {cell.value}
                </div>
                <div style={{ marginTop: px(8), fontSize: px(12), color: muted }}>
                  {cell.label}
                </div>
              </div>
            ))}
          </div>
          <p style={{ margin: 0, textAlign: "center", fontSize: px(13), color: muted }}>
            {slide.body}
          </p>
        </div>
      );
    }

    default:
      return null;
  }
}

function profileGlyph(
  px: (n: number) => number,
  mint: string,
  edwardPanel: string
) {
  return (
    <div
      style={{
        width: px(56),
        height: px(56),
        borderRadius: px(14),
        background: edwardPanel,
        border: `2px solid ${mint}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: px(28),
      }}
    >
      ✦
    </div>
  );
}

export function EdwardAiStructuredSlide({
  slide,
  totalSlides,
  template,
  primaryColor,
  secondaryColor,
  brandHandle,
  platform,
  aspectRatio,
  variant,
  fullResolution = false,
}: EdwardAiSlideProps) {
  const dims = getExportDimensions(aspectRatio);
  const unit = dims.width / 420;
  const px = (value: number) => Math.round(value * unit);
  const scale = fullResolution ? 1 : 0.34;
  const colors = EdwardPalette(primaryColor, secondaryColor, template);
  const headingFont =
    template.fontStyle === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : 'var(--font-epilogue), "Epilogue", system-ui, sans-serif';
  const bodyFont = 'var(--font-epilogue), "Epilogue", system-ui, sans-serif';

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
        data-layout={`edwardai-${variant}`}
        data-carousel-template={previewCarouselTemplateId(slide)}
        style={{
          width: `${dims.width}px`,
          height: `${dims.height}px`,
          transform: fullResolution ? "none" : `scale(${scale})`,
          transformOrigin: "top left",
          position: "relative",
          overflow: "hidden",
          background: colors.edwardBg,
          color: colors.ink,
          fontFamily: bodyFont,
        }}
      >
        <VariantBody
          variant={variant}
          slide={slide}
          px={px}
          headingFont={headingFont}
          bodyFont={bodyFont}
          colors={colors}
          brandHandle={brandHandle}
        />
        <ProgressFooter
          slide={slide}
          totalSlides={totalSlides}
          px={px}
          mint={colors.mint}
        />
      </div>
    </div>
  );
}