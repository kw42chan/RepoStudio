import { describe, expect, it } from "vitest";
import { getCarouselTemplateRenderVariant } from "./carousel-templates";

describe("carousel template render variants", () => {
  it("maps all nine edward ref templates", () => {
    const ids = [
      "ref-edwardai-hook-hero-showcase",
      "ref-edwardai-hook-photo-agent-cta",
      "ref-edwardai-hook-hero-centered-stat",
      "ref-edwardai-body-scene-compare",
      "ref-edwardai-body-tip-lock-three",
      "ref-edwardai-body-numbered-switches",
      "ref-edwardai-body-agent-profile-card",
      "ref-edwardai-body-cheatsheet-3way",
      "ref-edwardai-body-stats-metrics-row",
    ];
    for (const id of ids) {
      expect(getCarouselTemplateRenderVariant(id)).toBeTruthy();
    }
  });

  it("returns null for default narrative", () => {
    expect(getCarouselTemplateRenderVariant("body-narrative-default")).toBeNull();
  });
});