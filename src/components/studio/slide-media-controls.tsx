"use client";
import { useState } from "react";
import { resolveSlideMedia } from "@/lib/carousel-slide-media";
import type { CarouselSlide, SlideImageAsset, SlideMediaPlacement } from "@/lib/types";
import { Button } from "@/components/ui/button";

export function SlideMediaControls({ slide, assets, onChange, onAsset }: { slide: CarouselSlide; assets: SlideImageAsset[]; onChange: (slide: CarouselSlide) => void; onAsset: (asset: SlideImageAsset) => void }) {
  const [busy, setBusy] = useState<string | null>(null); const [error,setError] = useState("");
  const slots = resolveSlideMedia(slide,assets);
  if (!slots.length) return null;
  const patch = (slotId: string, change: Partial<SlideMediaPlacement>) => {
    const current = slide.media?.find(m => m.slotId === slotId);
    const placement = { slotId, assetId: "", focalPoint: { x: .5,y: .5 }, zoom: 1, ...current, ...change };
    onChange({ ...slide, media: [...(slide.media ?? []).filter(m => m.slotId !== slotId), placement] });
  };
  async function upload(slotId: string, file?: File) {
    if (!file) return; setBusy(slotId); setError("");
    try {
      const form = new FormData(); form.append("file",file);
      const response = await fetch("/api/image-assets", { method: "POST",body: form }); const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed.");
      onAsset(data.asset); patch(slotId, { assetId: data.asset.id, focalPoint: { x: .5,y: .5 }, zoom: 1 });
    } catch (e) { setError(e instanceof Error ? e.message : "Upload failed."); } finally { setBusy(null); }
  }
  return <fieldset className="rounded border p-3 space-y-4"><legend className="px-1 text-sm font-medium">Slide images</legend>
    <p className="text-xs text-muted-foreground">PNG, JPEG or WebP. Up to 10 MB. Uploaded images stay in your library when removed from a slide.</p>
    {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
    {slots.map(({ slot,asset,focalPoint,zoom }) => <div key={slot.id} className="space-y-2 rounded border p-2">
      <p className="text-xs font-medium">{slot.id.replaceAll("-"," ")} {slot.required ? "(required)" : "(optional)"}</p>
      <label className="block text-xs">Upload {slot.id}<input className="block max-w-full text-xs" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy !== null} onChange={e => { void upload(slot.id,e.target.files?.[0]); e.target.value = ""; }}/></label>
      {busy === slot.id && <p role="status" className="text-xs">Uploading image…</p>}
      <label className="block text-xs">Use saved image for {slot.id}<select aria-label={`Use saved image for ${slot.id}`} className="block w-full rounded border p-2 bg-background" value={asset?.id ?? ""} onChange={e => patch(slot.id,{ assetId: e.target.value, focalPoint: { x: .5,y: .5 }, zoom: 1 })}><option value="">No image</option>{assets.map(a => <option key={a.id} value={a.id}>{a.fileName}</option>)}</select></label>
      {asset && <>
        <label className="block text-xs">Horizontal focus for {slot.id}<input className="block w-full" type="range" min="0" max="1" step=".01" value={focalPoint.x} onChange={e=>patch(slot.id,{focalPoint:{...focalPoint,x:Number(e.target.value)}})}/></label>
        <label className="block text-xs">Vertical focus for {slot.id}<input className="block w-full" type="range" min="0" max="1" step=".01" value={focalPoint.y} onChange={e=>patch(slot.id,{focalPoint:{...focalPoint,y:Number(e.target.value)}})}/></label>
        <label className="block text-xs">Zoom for {slot.id}<input className="block w-full" type="range" min="1" max="3" step=".05" value={zoom} onChange={e=>patch(slot.id,{zoom:Number(e.target.value)})}/></label>
        <label className="block text-xs">Image description for {slot.id}<input className="block w-full rounded border p-2 bg-background" value={slide.media?.find(m=>m.slotId===slot.id)?.altText ?? ""} onChange={e=>patch(slot.id,{altText:e.target.value})}/></label>
        <Button type="button" size="sm" variant="outline" onClick={()=>onChange({...slide,media:slide.media?.filter(m=>m.slotId!==slot.id)})}>Remove image from {slot.id}</Button>
      </>}
    </div>)}
  </fieldset>;
}
