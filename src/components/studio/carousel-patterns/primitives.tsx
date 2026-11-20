import type { CSSProperties, ReactNode } from "react";
import type { CarouselSlide } from "@/lib/types";
import type { ResolvedBrandTheme } from "@/lib/carousel-brand-theme";

export interface PatternRenderProps {
  slide: CarouselSlide; theme: ResolvedBrandTheme; ink: string; muted: string; accent: string; panel: string;
}
export function headingStyle(theme: ResolvedBrandTheme, size = 60): CSSProperties {
  return { margin: 0, fontFamily: theme.heading.fontFamily, fontWeight: theme.heading.weight, fontSize: `max(32px, calc(${size}px * var(--carousel-heading-scale, ${theme.heading.sizeScale})))`, lineHeight: 1.15, overflowWrap: "anywhere", whiteSpace: "pre-wrap", lineBreak: "strict" };
}
export function bodyStyle(theme: ResolvedBrandTheme, size = 36): CSSProperties {
  return { margin: 0, fontFamily: theme.body.fontFamily, fontWeight: theme.body.weight, fontSize: `max(32px, calc(${size}px * var(--carousel-body-scale, ${theme.body.sizeScale})))`, lineHeight: 1.4, overflowWrap: "anywhere", whiteSpace: "pre-wrap", lineBreak: "strict" };
}
export function EvidenceFrame({ children, panel, style }: { children: ReactNode; panel: string; style?: CSSProperties }) {
  return <div style={{ background: panel, borderRadius: 22, padding: 24, minWidth: 0, ...style }}>{children}</div>;
}
export function NumberedNode({ number, accent }: { number: number; accent: string }) {
  return <span style={{ width: 52, height: 52, display: "inline-flex", flexShrink: 0, alignItems: "center", justifyContent: "center", borderRadius: "50%", background: accent, color: "white", fontSize: 28, fontWeight: 700 }}>{number}</span>;
}
export function MissingImage({ label }: { label: string }) {
  return <div style={{ display: "flex", height: "100%", minHeight: 120, alignItems: "center", justifyContent: "center", border: "2px dashed currentColor", borderRadius: 22, fontSize: 30, opacity: .6 }}>Add {label.replaceAll("-", " ")}</div>;
}
