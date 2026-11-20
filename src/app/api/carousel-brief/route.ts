import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { generateContentForFormats } from "@/lib/ai";
import { selectDeckPatterns } from "@/lib/carousel-pattern-selection";
import { requireViewer } from "@/lib/viewer";
import { rejectNonJson } from "@/lib/json-body";
import { readStore } from "@/lib/store";
import { brandDesignSchema } from "@/lib/carousel-fonts";
const briefSchema = z.object({
  brief:z.string().min(10).max(10000),visualTemplateId:z.string(),aspectRatio:z.enum(["4:5","1:1"]),
  brandVoice:z.string().max(2000),audience:z.string().max(2000),cta:z.string().max(1000),handle:z.string().max(100),
  primaryColor:z.string().regex(/^#[a-f0-9]{6}$/i),secondaryColor:z.string().regex(/^#[a-f0-9]{6}$/i),design:brandDesignSchema,
});
export async function POST(req: NextRequest) {
  const denied = await requireViewer(req); if (denied) return denied;
  const rejected = rejectNonJson(req); if (rejected) return rejected;
  try {
    const data = briefSchema.safeParse(await req.json());
    if (!data.success) return NextResponse.json({error:"Write a brief of 10–10,000 characters and select valid brand settings."},{status:400});
    const { brief, ...context } = data.data; const store = await readStore();
    const sourcePost = { id:crypto.randomUUID(),rawText:brief,sourcePlatform:"Brief",brandVoice:context.brandVoice,targetAudience:context.audience,ctaPreference:context.cta,createdAt:new Date().toISOString() };
    const idea = { id:crypto.randomUUID(),angleType:"Carousel brief",title:brief.split("\n")[0].slice(0,120),hook:brief.split("\n")[0],summary:brief,rationale:"User-provided brief",formatFit:{reel:50,igCarousel:90,liCarousel:90} };
    const generated = await generateContentForFormats({sourcePost,idea,formats:["ig_carousel","li_carousel"],writingStyle:{styleId:"educational"},visualTemplateId:context.visualTemplateId,aspectRatio:context.aspectRatio,brandHandle:context.handle,layoutPackIds:{instagram:"auto-patterns",linkedin:"auto-patterns"},userLayoutPacks:store.layoutPacks});
    const reference = store.visualTemplates.find(t=>t.id===context.visualTemplateId)?.referenceStyle;
    for (const key of ["igCarousel","liCarousel"] as const) if (generated[key]) generated[key] = selectDeckPatterns({ ...generated[key]!,design:context.design,primaryColor:context.primaryColor,secondaryColor:context.secondaryColor,slides:generated[key]!.slides.map(s=>({...s,preferredPatternIds:s.preferredPatternIds ?? reference?.patternCandidates})) },store.imageAssets ?? []);
    return NextResponse.json({...generated,sourcePost,idea});
  } catch { return NextResponse.json({error:"Could not create this carousel. Try a more specific brief."},{status:500}); }
}
