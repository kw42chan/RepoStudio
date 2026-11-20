"use client";
import { getPattern, patternContentWarnings } from "@/lib/carousel-pattern-registry";
import type { CarouselSlide } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function PatternContentControls({ slide, onChange }: { slide: CarouselSlide; onChange: (slide: CarouselSlide) => void }) {
  const pattern = getPattern(slide.templateId)?.pattern;
  if (!pattern) return null;
  const content = slide.patternContent ?? {};
  const update = (next: typeof content) => onChange({ ...slide, patternContent: next });
  const items = content.items ?? [];
  const fields = [...pattern.requiredSlots, ...pattern.optionalSlots].filter(key => !["headline","body","items"].includes(key));
  return <fieldset className="rounded border p-3 space-y-3"><legend className="px-1 text-sm font-medium">Layout content</legend>
    {fields.map(key => <label key={key} className="block text-xs space-y-1">{key.replaceAll("-"," ")}
      <textarea className="block w-full rounded border bg-background p-2" value={String(content[key as keyof typeof content] ?? "")} onChange={e => update({ ...content, [key]: e.target.value })}/>
    </label>)}
    {pattern.requiredSlots.includes("items") && <div className="space-y-2"><p className="text-xs">Points: {items.length} / {pattern.contentLimits.maxItems}</p>
      {items.map((item,index) => <div key={index} className="rounded border p-2 space-y-2">
        <label className="block text-xs">Point {index+1} title<input className="block w-full rounded border p-2 bg-background" value={item.title} onChange={e => update({ ...content, items: items.map((v,i) => i === index ? { ...v, title: e.target.value } : v) })}/></label>
        <label className="block text-xs">Point {index+1} description<textarea className="block w-full rounded border p-2 bg-background" value={item.body} onChange={e => update({ ...content, items: items.map((v,i) => i === index ? { ...v, body: e.target.value } : v) })}/></label>
        <Button type="button" variant="outline" size="sm" onClick={() => update({ ...content, items: items.filter((_,i) => i !== index) })}>Remove point {index+1}</Button>
      </div>)}
      <Button type="button" variant="outline" size="sm" disabled={items.length >= pattern.contentLimits.maxItems} onClick={() => update({ ...content, items: [...items, { title: "", body: "" }] })}>Add point</Button>
    </div>}
    {patternContentWarnings(slide).map(message => <p key={message} role="status" className="text-xs text-amber-800">{message}</p>)}
  </fieldset>;
}
