"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { BrandDesignSettingsV1, AspectRatio, CarouselContent, SourcePost, RepurposeIdea, VisualTemplate } from "@/lib/types";
export interface BriefResult { igCarousel?:CarouselContent; liCarousel?:CarouselContent; sourcePost:SourcePost; idea:RepurposeIdea; usedMock:boolean }
export function CarouselAgentChat({ context, onGenerated, onTemplate }: {
  context:{brandVoice:string;audience:string;cta:string;handle:string;primaryColor:string;secondaryColor:string;design:BrandDesignSettingsV1;visualTemplateId:string;aspectRatio:AspectRatio};
  onGenerated:(result:BriefResult)=>void; onTemplate:(template:VisualTemplate)=>void;
}) {
  const [brief,setBrief] = useState(""); const [busy,setBusy] = useState(false); const [message,setMessage] = useState("");
  const [reference,setReference] = useState<VisualTemplate | null>(null); const [confirmed,setConfirmed] = useState(false);
  async function analyze(file?: File) {
    if (!file) return;
    if (file.size>10*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)) {setMessage("Choose a PNG, JPEG or WebP within 10 MB.");return;}
    setBusy(true);setConfirmed(false);setReference(null);setMessage("");
    try {
      const imageDataUrl = await new Promise<string>((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result));r.onerror=reject;r.readAsDataURL(file);});
      const response=await fetch("/api/style-extract",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({imageDataUrl,name:"Reviewed reference style"})});
      const data=await response.json();if(!response.ok)throw new Error(data.error);setReference(data.template);
    } catch(e){setMessage(e instanceof Error?e.message:"Could not analyze image.");}finally{setBusy(false);}
  }
  async function saveReference() {
    if (!reference) return;setBusy(true);
    try {const response=await fetch("/api/templates",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({template:reference,confirmReference:true})});const data=await response.json();if(!response.ok)throw new Error(data.error);onTemplate(data.template);setConfirmed(true);setMessage("Reviewed style saved and selected for this brief.");}catch(e){setMessage(e instanceof Error?e.message:"Could not save style.");}finally{setBusy(false);}
  }
  async function generate() {
    setBusy(true);setMessage("");
    try {const response=await fetch("/api/carousel-brief",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({brief,...context})});const data=await response.json();if(!response.ok)throw new Error(data.error);onGenerated(data);setMessage(data.usedMock?"Created demo carousels. Connect a language model for generated content.":"Created both carousels. Review their layouts and copy below.");}catch(e){setMessage(e instanceof Error?e.message:"Could not generate carousels.");}finally{setBusy(false);}
  }
  return <details className="rounded-xl border bg-card p-4"><summary className="cursor-pointer font-medium">Agent Chat — create carousels from a brief</summary><div className="mt-4 space-y-3">
    <label className="block text-sm">Carousel brief<textarea className="mt-1 block w-full rounded border bg-background p-3" rows={3} placeholder="Describe the audience, topic, and takeaway. Include the facts you want to use." value={brief} onChange={e=>setBrief(e.target.value)}/></label>
    <label className="block text-sm">Optional style reference<input className="block mt-1 text-xs" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e=>{void analyze(e.target.files?.[0]);e.target.value="";}}/></label>
    {reference && <div className="rounded border p-3 space-y-2"><p className="text-sm">Review reference traits</p><p className="text-xs">{reference.fontStyle} headings; {reference.referenceStyle?.spacing} spacing; {reference.referenceStyle?.imageTreatment} images.</p><div className="flex gap-2">{reference.referenceStyle && Object.values(reference.referenceStyle.palette).map((color,i)=><span key={i} aria-label={color} className="h-6 w-6 rounded border" style={{backgroundColor:color}}/>)}</div>{reference.referenceStyle?.warnings.map(w=><p key={w} className="text-xs text-amber-800">{w}</p>)}<p className="text-xs text-muted-foreground">Only visual traits are saved. Source wording, logos, and creator identity are excluded.</p><Button type="button" variant="outline" disabled={busy||confirmed} onClick={saveReference}>{confirmed?"Reference style confirmed":"Confirm and save reference style"}</Button></div>}
    <Button type="button" disabled={busy||brief.trim().length<10||Boolean(reference&&!confirmed)} onClick={generate}>{busy?"Working…":"Create carousels from brief"}</Button>
    {message && <p role="status" className="text-sm">{message}</p>}
  </div></details>;
}
