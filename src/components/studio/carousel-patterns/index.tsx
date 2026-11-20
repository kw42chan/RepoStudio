import { resolveSlideMedia } from "@/lib/carousel-slide-media";
import { ImageFrame } from "./image-frame";
import { getPattern } from "@/lib/carousel-pattern-registry";
import { resolveSlideColors } from "@/lib/carousel-slide-theme";
import { getExportDimensions } from "@/lib/export-carousel";
import type { ResolvedBrandTheme } from "@/lib/carousel-brand-theme";
import type { CarouselSlide, VisualTemplate, AspectRatio, SlideImageAsset } from "@/lib/types";
import { TextPattern } from "./text-patterns";
import { EvidencePattern } from "./evidence-patterns";
import { headingStyle, bodyStyle } from "./primitives";

export function PatternSlide({ slide, totalSlides, theme, template, primaryColor, secondaryColor, brandHandle, aspectRatio, platform, assets = [], fullResolution = false }: { slide: CarouselSlide; totalSlides: number; theme: ResolvedBrandTheme; template: VisualTemplate; primaryColor: string; secondaryColor: string; brandHandle: string; aspectRatio: AspectRatio; platform: string; assets?: SlideImageAsset[]; fullResolution?: boolean }) {
  const definition = getPattern(slide.templateId)?.pattern;
  if (!definition) return null;
  const dims = getExportDimensions(aspectRatio); const scale = fullResolution ? 1 : .34;
  const spacing = template.referenceStyle?.spacing;
  const padding = spacing === "generous" ? 72 : spacing === "compact" ? 56 : 64;
  const gap = spacing === "compact" ? 24 : 32;
  const colors = resolveSlideColors(slide, template, primaryColor, secondaryColor, totalSlides);
  const hero = slide.templateId === "signal-statement" || slide.templateId === "signal-cta";
  const props = { slide, theme, ink: colors.ink, muted: colors.muted, accent: colors.accent, panel: colors.isLight ? "rgba(0,0,0,.05)" : "rgba(255,255,255,.08)" };
  const textOnly = ["signal-statement","signal-cta","signal-numbered-list","signal-vertical-timeline","signal-horizontal-timeline"].includes(slide.templateId ?? "");
  const media = resolveSlideMedia(slide,assets);
  const image = (id: string) => { const slot = media.find(m => m.slot.id === id); return slot ? <ImageFrame key={id} media={slot}/> : null; };

  return <div style={{ width: dims.width*scale, height: dims.height*scale, overflow: "hidden", borderRadius: fullResolution ? 0 : 12 }}>
    <article data-platform={platform} data-carousel-template={slide.templateId} data-layout="pattern" data-base-gap={gap} data-heading-scale={theme.heading.sizeScale} data-body-scale={theme.body.sizeScale} style={{ width: dims.width, height: dims.height, transform: `scale(${scale})`, transformOrigin: "top left", background: colors.background, color: colors.ink, padding, boxSizing: "border-box", display: "flex", flexDirection: "column", gap: "calc(var(--carousel-gap, " + gap + ") * 1px)", ...bodyStyle(theme) }}>
      <header style={{ display: "flex", justifyContent: "space-between", fontSize: 28, borderBottom: `2px solid ${colors.accent}`, paddingBottom: 24 }}><span>{brandHandle}</span><span>{slide.slideNumber} / {totalSlides}</span></header>
      {!hero && <h2 data-content-text style={headingStyle(theme)}>{slide.headline}</h2>}
      {!hero && definition.optionalSlots.includes("body") && slide.body && <p data-content-text style={{ ...bodyStyle(theme), color: colors.muted }}>{slide.body}</p>}
      {textOnly ? <TextPattern {...props} image={image}/> : <EvidencePattern {...props} image={image}/>}
      {(["recommendation","badge","takeaway"] as const).map(key => slide.patternContent?.[key] ? <p key={key} data-content-text style={{ ...bodyStyle(theme,32), color: colors.accent }}>{slide.patternContent[key]}</p> : null)}
      <footer style={{ display: "flex", justifyContent: "space-between", borderTop: `2px solid ${colors.accent}`, paddingTop: 24, fontSize: 28, marginTop: "auto" }}><span>{slide.eyebrow ?? ""}</span><span>{slide.slideNumber === totalSlides ? "✓" : "→"}</span></footer>
    </article>
  </div>;
}
