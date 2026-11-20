"use client";
import { useState } from "react";
import { CarouselEditor } from "@/components/studio/carousel-editor";
import { BUILT_IN_VISUAL_TEMPLATES } from "@/lib/presets";
import type { CarouselContent } from "@/lib/types";
import { fixtureCarousel, fixtureAssets } from "@/lib/carousel-fixture-decks";
import { SlideCanvas } from "@/components/studio/carousel-preview";
import { normalizeBrandDesign } from "@/lib/carousel-fonts";
const initial: CarouselContent = {
  platform: "instagram", title: "Development fixture", caption: "Fixture", hashtags: [],
  aspectRatio: "4:5", visualTemplateId: "minimal-light", brandHandle: "@fixture", writingStyle: { styleId: "educational" }, layoutPackId: "default",
  slides: Array.from({ length: 5 }, (_, i) => ({ id: `fixture-${i}`, slideNumber: i+1, role: i === 0 ? "cover" : i === 4 ? "cta" : "body", headline: `Clear idea ${i+1}`, body: "One useful supporting sentence.", visualDirection: "", templateId: "hook-scroll-cover" })),
};
export function FixtureStudio() {
  const [carousel, setCarousel] = useState(initial);
  const [caseId, setCaseId] = useState("initial");
  return <div className="mx-auto max-w-7xl p-6"><h1 className="text-xl font-bold mb-4">Development carousel fixtures</h1>
    <div className="flex flex-wrap gap-3 mb-6">{["en","zh-Hant","mixed","maximum-content","maximum-english","missing-images","long-headings","maximum-slide-count"].map(id => <button className="rounded border p-2" key={id} onClick={() => { setCaseId(id); setCarousel(fixtureCarousel(id)); }}>Load {id}</button>)}</div>
    <div className="flex gap-3 mb-4">{["light","dark"].map(mode=><button className="rounded border p-2" key={mode} onClick={()=>setCarousel(current=>({...current,slides:current.slides.map(s=>({...s,surface:{kind:"solid",color:mode==="light"?"#f5f1e8":"#111827"}}))}))}>Use {mode} mode</button>)}</div>
    <button className="rounded border p-2 mb-4" onClick={()=>{const design=normalizeBrandDesign(undefined);design.heading.sizeScale=1.2;design.body.sizeScale=1.15;setCarousel(current=>({...current,design}));}}>Use large brand type</button>
    <CarouselEditor key={caseId} initialImageAssets={fixtureAssets} carousel={carousel} onChange={setCarousel} templates={BUILT_IN_VISUAL_TEMPLATES} primaryColor="#BD4A28" secondaryColor="#8B6B4F" onRegenerateStyle={() => {}} onOpenTemplateImporter={() => {}} onSaveAsNewTemplate={async () => {}} onOpenSchedule={() => {}}/>
    <section aria-label="Pattern specimens" className="mt-8 space-y-8">{caseId !== "initial" && carousel.slides.map(slide => <div key={slide.id} data-specimen={slide.templateId}><SlideCanvas assets={fixtureAssets} slide={slide} totalSlides={carousel.slides.length} template={BUILT_IN_VISUAL_TEMPLATES[0]} primaryColor="#BD4A28" secondaryColor="#8B6B4F" brandHandle="@fixture" aspectRatio="4:5" platform="instagram" fullResolution/></div>)}</section>
  </div>;
}
