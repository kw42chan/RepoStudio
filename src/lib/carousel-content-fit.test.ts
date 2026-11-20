import { expect,it } from "vitest";
import { cjkCopyWarnings, compatibleFitAlternatives } from "./carousel-content-fit";
import { fixtureCarousel,fixtureAssets } from "./carousel-fixture-decks";
it("warns about Chinese punctuation and explicit orphan lines",()=>{
  expect(cjkCopyWarnings("中文\n，標點錯行")).toHaveLength(1);
  expect(cjkCopyWarnings("中文「\n下一行")).toHaveLength(1);
  expect(cjkCopyWarnings("說明文字\n字")).toHaveLength(1);
  expect(cjkCopyWarnings("清晰的中文句子。")).toEqual([]);
});
it("offers a less dense layout only when it preserves required fields",()=>{
  const list=fixtureCarousel("en").slides.find(s=>s.templateId==="signal-numbered-list")!;
  const alternatives=compatibleFitAlternatives(list,fixtureAssets);
  expect(alternatives.some(t=>t.id==="signal-vertical-timeline")).toBe(true);
  expect(alternatives.some(t=>t.id==="signal-statement")).toBe(false);
});
