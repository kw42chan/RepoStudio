import { describe, expect, it } from "vitest";
import { selectDeckPatterns, selectPattern } from "./carousel-pattern-selection";
import { fixtureCarousel, fixtureAssets } from "./carousel-fixture-decks";
import { styleAnalysisSchema, referenceTemplate } from "./carousel-reference-style";

describe("deterministic pattern selection", () => {
  it("routes structured intents consistently and rejects invalid model suggestions", () => {
    const source = fixtureCarousel("en");
    const list = source.slides.find(s=>s.templateId==="signal-numbered-list")!;
    const result=selectPattern({...list,intent:"parallel-list",preferredPatternIds:["does-not-exist"]},{platform:"instagram"});
    expect(result.templateId).toBe("signal-numbered-list");expect(result.warnings).toHaveLength(1);
    const metric=source.slides.find(s=>s.templateId==="signal-metric-evidence")!;
    expect(selectPattern({...metric,intent:"metric"},{platform:"instagram",assets:fixtureAssets}).templateId).toBe("signal-metric-evidence");
    expect(selectPattern({...metric,intent:"metric",patternContent:{...metric.patternContent,metric:"fast"}},{platform:"instagram",assets:fixtureAssets}).templateId).not.toBe("signal-metric-evidence");
    expect(selectPattern({...metric,intent:"metric",preferredPatternIds:[metric.templateId!]},{platform:"instagram",assets:[]}).templateId).not.toBe("signal-metric-evidence");
    expect(selectDeckPatterns(source,fixtureAssets)).toEqual(selectDeckPatterns(source,fixtureAssets));
    expect(source.slides[0].templateId).toBe("signal-collage-cover");
  });
  it("keeps reference traits descriptive and excludes identity and executable fields",()=>{
    const analysis=styleAnalysisSchema.parse({version:1,method:"local-palette",palette:{background:"#ffffff",surface:"#ffffff",ink:"#111111",muted:"#666666",accent:"#bd4a28"},headingStyle:"serif",bodyStyle:"sans",spacing:"balanced",chrome:"editorial-rule",imageTreatment:"none",patternCandidates:["signal-statement"],warnings:[]});
    const template=referenceTemplate(analysis,"@creator https://example.com Review");
    expect(template.name).toBe("Review");expect(template).not.toHaveProperty("backdropImageUrl");
    expect(styleAnalysisSchema.safeParse({...analysis,creator:"@someone"}).success).toBe(false);
    expect(styleAnalysisSchema.safeParse({...analysis,patternCandidates:["<script>"]}).success).toBe(false);
  });
});
