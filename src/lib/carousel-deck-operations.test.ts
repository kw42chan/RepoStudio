import { describe, expect, it } from "vitest";
import { applyDeckCommand, activeSlideIndex, type DeckCommand } from "./carousel-deck-operations";
import type { CarouselContent, CarouselSlide } from "./types";

function deck(count = 5): CarouselContent {
  return { platform: "instagram", title: "Deck", caption: "Caption", hashtags: [], writingStyle: { styleId: "educational" }, visualTemplateId: "minimal-light", aspectRatio: "4:5", brandHandle: "@test", slides: Array.from({ length: count }, (_, i) => ({ id: `s${i}`, slideNumber: i+1, role: i === 0 ? "cover" : i === count-1 ? "cta" : "body", headline: `Slide ${i}`, body: "Copy", visualDirection: "", templateId: "hook-scroll-cover" })) };
}
function invariants(value: CarouselContent) {
  expect(value.slides.length).toBeGreaterThanOrEqual(3); expect(value.slides.length).toBeLessThanOrEqual(12);
  expect(new Set(value.slides.map(s => s.id)).size).toBe(value.slides.length);
  expect(value.slides.map(s => s.slideNumber)).toEqual(value.slides.map((_, i) => i+1));
  expect(value.slides.filter(s => s.role === "cover")).toHaveLength(1);
  expect(value.slides[0].role).toBe("cover");
  expect(value.slides.filter(s => s.role === "cta").length).toBeLessThanOrEqual(1);
  if (value.slides.some(s => s.role === "cta")) expect(value.slides.at(-1)?.role).toBe("cta");
}

describe("deck commands", () => {
  it("handles every command without mutating source content or saved pack state", () => {
    const before = deck(); const source = structuredClone(before);
    const added: CarouselSlide = { ...before.slides[1], id: "new" };
    const commands: DeckCommand[] = [{ type: "normalize" }, { type: "add", slide: added, afterId: "s1" }, { type: "delete", id: "s2" }, { type: "move", id: "s4", toIndex: 0 }, { type: "duplicate", id: "s1", newId: "copy" }];
    let after = before;
    for (const command of commands) { after = applyDeckCommand(after, command); invariants(after); }
    expect(before).toEqual(source);
    expect(after.slides.find(s => s.id === "copy")?.headline).toBe("Slide 1");
    expect(after.layoutWarnings).toHaveLength(1);
  });
  it("keeps stable focus, enforces count limits, and rejects duplicate IDs", () => {
    const before = deck(); const after = applyDeckCommand(before, { type: "move", id: "s2", toIndex: 1 });
    expect(activeSlideIndex(before, after, "s2")).toBe(1);
    expect(applyDeckCommand(deck(3), { type: "delete", id: "s0" }).slides).toHaveLength(3);
    expect(applyDeckCommand(deck(12), { type: "duplicate", id: "s1", newId: "copy" }).slides).toHaveLength(12);
    expect(applyDeckCommand(before, { type: "duplicate", id: "s1", newId: "s2" })).toBe(before);
    expect(applyDeckCommand(before, { type: "move", id: "missing", toIndex: 0 })).toBe(before);
  });
  it("preserves invariants through a long mixed command sequence", () => {
    let value = deck();
    for (let i=0;i<100;i++) {
      value = applyDeckCommand(value, { type: "move", id: value.slides[i % value.slides.length].id, toIndex: i % 3 });
      value = applyDeckCommand(value, { type: "duplicate", id: value.slides[1].id, newId: `copy${i}` });
      value = applyDeckCommand(value, { type: "delete", id: value.slides[2].id });
      invariants(value);
    }
  });
});
