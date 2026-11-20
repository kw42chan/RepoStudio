import type { ReactNode } from "react";
import { bodyStyle, headingStyle, NumberedNode, EvidenceFrame, type PatternRenderProps } from "./primitives";

export function TextPattern(props: PatternRenderProps & { image: (id: string) => ReactNode }) {
  const { slide, theme, ink, muted, accent, panel, image } = props;
  const items = slide.patternContent?.items ?? [];
  const body = bodyStyle(theme);
  if (slide.templateId === "signal-statement" || slide.templateId === "signal-cta") {
    return <div data-content-zone style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, flex: 1 }}>
      <h2 data-content-text style={headingStyle(theme, 80)}>{slide.headline}</h2>
      {slide.templateId === "signal-cta" ? <div data-content-text style={{ ...bodyStyle(theme, 40), color: accent, fontWeight: theme.heading.weight }}>{slide.patternContent?.action}</div> : slide.body && <p data-content-text style={{ ...body, color: muted }}>{slide.body}</p>}
    </div>;
  }
  if (slide.templateId === "signal-horizontal-timeline") {
    return <div data-content-zone style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1, gap: 44 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(items.length, 1)}, minmax(0,1fr))`, gap: 16, position: "relative" }}>
        <div style={{ position: "absolute", top: 26, left: 26, right: 26, borderTop: `5px solid ${accent}` }}/>
        {items.map((item, i) => <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 24, paddingTop: 0 }}>
          <NumberedNode number={i+1} accent={accent}/><div style={{ width: "100%", maxHeight: 110 }}>{image(`timeline-${i+1}`)}</div><h3 data-content-text style={{ ...headingStyle(theme,36), marginTop: i % 2 ? 48 : 0 }}>{item.title}</h3><p data-content-text style={bodyStyle(theme, 32)}>{item.body}</p>
        </div>)}
      </div>
      {slide.patternContent?.outcome && <p data-content-text style={{ ...body, color: accent }}>{slide.patternContent.outcome}</p>}
    </div>;
  }
  const timeline = slide.templateId === "signal-vertical-timeline";
  return <div data-content-zone style={{ display: "flex", flexDirection: "column", justifyContent: "space-evenly", gap: timeline ? 20 : 28, flex: 1, position: "relative" }}>
    {timeline && <div aria-hidden="true" style={{ position: "absolute", left: 38, top: 26, bottom: 26, borderLeft: `4px solid ${accent}` }}/>}
    {items.map((item,i) => <EvidenceFrame key={i} panel={timeline ? "transparent" : panel} style={{ padding: timeline ? "0 0 0 12px" : 28, position: "relative" }}>
      <div style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
        <NumberedNode number={i+1} accent={accent}/><div style={{ minWidth: 0, flex: 1 }}><h3 data-content-text style={{ ...headingStyle(theme, 38), color: ink }}>{item.title}</h3>{item.body && <p data-content-text style={{ ...bodyStyle(theme, 32), color: muted, marginTop: 8 }}>{item.body}</p>}</div>
      </div>
    </EvidenceFrame>)}
  </div>;
}
