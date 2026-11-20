import type { ReactNode } from "react";
import { bodyStyle, headingStyle, EvidenceFrame, NumberedNode, type PatternRenderProps } from "./primitives";

export function EvidencePattern(props: PatternRenderProps & { image: (id: string) => ReactNode }) {
  const { slide, theme, accent, muted, panel, image } = props;
  const content = slide.patternContent ?? {}; const items = content.items ?? [];
  if (slide.templateId === "spec-ab-comparison") return <div data-content-zone style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 24, flex: 1 }}>
    {items.map((item,i) => <EvidenceFrame key={i} panel={panel} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <span style={{ ...bodyStyle(theme, 32), color: accent }}>{i === 0 ? "A" : "B"}</span><h3 data-content-text style={headingStyle(theme, 42)}>{item.title}</h3>
      <div style={{ maxHeight: 180 }}>{image(i === 0 ? "example-a" : "example-b")}</div><p data-content-text style={bodyStyle(theme, 34)}>{item.body}</p>
    </EvidenceFrame>)}
  </div>;
  if (slide.templateId === "signal-metric-evidence") return <div data-content-zone style={{ display: "flex", flexDirection: "column", gap: 30, flex: 1 }}>
    <div><strong data-content-text style={{ ...headingStyle(theme, 96), color: accent }}>{content.metric}</strong><p data-content-text style={bodyStyle(theme)}>{content.unit}</p></div>
    <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 30, flex: 1, minHeight: 0 }}><div>{image("evidence-left")}</div><div style={{ display: "flex", flexDirection: "column", gap: 12 }}>{items.map((item,i) => <EvidenceFrame key={i} panel={panel} style={{ padding: 16 }}><h3 data-content-text style={headingStyle(theme, 32)}>{item.title}</h3><p data-content-text style={{ ...bodyStyle(theme, 32), color: muted }}>{item.body}</p></EvidenceFrame>)}</div></div>
  </div>;
  if (slide.templateId === "signal-collage-cover") return <div data-content-zone style={{ display: "grid", gridTemplateColumns: "minmax(0,.9fr) minmax(0,1.1fr)", gap: 28, flex: 1, minHeight: 0 }}>
    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 28 }}>{items.map((item,i)=><div key={i}><h3 data-content-text style={headingStyle(theme,36)}>{String(i+1).padStart(2,"0")} / {item.title}</h3><p data-content-text style={{ ...bodyStyle(theme,32), color: muted }}>{item.body}</p></div>)}</div>
    <div style={{ display: "flex", flexDirection: "column", gap: 20, minHeight: 0 }}><div style={{ flex: 1, minHeight: 100 }}>{image("hero-right")}</div><div style={{ display: "flex", gap: 14, maxHeight: 150 }}>{image("support-bottom-center")}{image("support-bottom-right")}</div></div>
  </div>;
  return <div data-content-zone style={{ display: "flex", flexDirection: "column", gap: 24, flex: 1, minHeight: 0 }}>
    <EvidenceFrame panel={panel}><p data-content-text style={bodyStyle(theme,36)}>{content.prompt}</p></EvidenceFrame>
    <div style={{ textAlign: "center", fontSize: 36, color: accent }}>↓</div>
    <div style={{ flex: 1, minHeight: 100 }}>{image("result-preview")}</div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 16 }}>{items.map((item,i)=><div key={i}><NumberedNode number={i+1} accent={accent}/><h3 data-content-text style={{ ...headingStyle(theme,32), marginTop: 12 }}>{item.title}</h3><p data-content-text style={bodyStyle(theme,32)}>{item.body}</p></div>)}</div>
  </div>;
}
