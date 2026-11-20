"use client";
import { useState } from "react";
import { CarouselEditor } from "@/components/studio/carousel-editor";
import { BUILT_IN_VISUAL_TEMPLATES } from "@/lib/presets";
import type { CarouselContent } from "@/lib/types";
const initial: CarouselContent = {
  platform: "instagram", title: "Development fixture", caption: "Fixture", hashtags: [],
  aspectRatio: "4:5", visualTemplateId: "minimal-light", brandHandle: "@fixture", writingStyle: { styleId: "educational" }, layoutPackId: "default",
  slides: Array.from({ length: 5 }, (_, i) => ({ id: `fixture-${i}`, slideNumber: i+1, role: i === 0 ? "cover" : i === 4 ? "cta" : "body", headline: `Clear idea ${i+1}`, body: "One useful supporting sentence.", visualDirection: "", templateId: "hook-scroll-cover" })),
};
export function FixtureStudio() {
  const [carousel, setCarousel] = useState(initial);
  return <div className="mx-auto max-w-7xl p-6"><h1 className="text-xl font-bold mb-4">Development carousel fixtures</h1><CarouselEditor carousel={carousel} onChange={setCarousel} templates={BUILT_IN_VISUAL_TEMPLATES} primaryColor="#BD4A28" secondaryColor="#8B6B4F" onRegenerateStyle={() => {}} onOpenTemplateImporter={() => {}} onSaveAsNewTemplate={async () => {}} onOpenSchedule={() => {}}/></div>;
}
