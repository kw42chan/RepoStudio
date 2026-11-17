import { describe, expect, it } from "vitest";
import { carouselSlideSchema, gridCellSchema } from "./ai";

describe("carousel grid slide schema", () => {
  it("accepts a grid-2x3 slide with six cells", () => {
    const slide = {
      id: "slide-grid",
      slideNumber: 4,
      role: "body" as const,
      headline: "Tools every PM should know",
      body: "Six picks for faster shipping.",
      visualDirection: "2x3 grid",
      layout: "grid-2x3" as const,
      gridCells: [
        {
          number: 1,
          title: "Planning",
          toolIds: ["notion"],
          description: "Single source of truth.",
        },
        {
          number: 2,
          title: "Design",
          toolIds: ["figma"],
          description: "Share before you build.",
        },
        {
          number: 3,
          title: "Research",
          toolIds: ["perplexity", "claude"],
          description: "Faster discovery loops.",
        },
        {
          number: 4,
          title: "Build",
          toolIds: ["cursor"],
          description: "Tighter spec-to-code.",
        },
        {
          number: 5,
          title: "Comms",
          toolIds: ["slack"],
          description: "One thread for GTM.",
        },
        {
          number: 6,
          title: "Track",
          toolIds: ["linear"],
          description: "Rank what ships next.",
        },
      ],
    };

    expect(carouselSlideSchema.parse(slide).layout).toBe("grid-2x3");
    expect(gridCellSchema.parse(slide.gridCells[0]).toolIds).toEqual(["notion"]);
  });

  it("keeps default slides without layout fields", () => {
    const slide = {
      id: "slide-2",
      slideNumber: 2,
      role: "body" as const,
      headline: "The shift",
      body: "Short body copy.",
      visualDirection: "Dark slide.",
    };

    expect(carouselSlideSchema.parse(slide).layout).toBeUndefined();
  });
});