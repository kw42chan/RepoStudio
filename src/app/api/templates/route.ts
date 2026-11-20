import { NextRequest, NextResponse } from "next/server";
import {
  deleteVisualTemplate,
  getAllVisualTemplates,
  saveVisualTemplate,
} from "@/lib/store";
import { rejectNonJson } from "@/lib/json-body";
import { requireViewer } from "@/lib/viewer";
import { VisualTemplate } from "@/lib/types";
import { styleAnalysisSchema, referenceTemplate } from "@/lib/carousel-reference-style";

export async function GET(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const templates = await getAllVisualTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as { template?: VisualTemplate; confirmReference?: boolean };
    if (!body.template || !body.template.name) {
      return NextResponse.json(
        { error: "Valid template object is required." },
        { status: 400 }
      );
    }

    if (body.template.referenceStyle) {
      if (body.confirmReference !== true) return NextResponse.json({error:"Review and confirm the reference style before saving."},{status:409});
      const analysis = styleAnalysisSchema.safeParse({ ...body.template.referenceStyle, headingStyle: body.template.fontStyle, palette: { background: body.template.backgroundColor,surface:body.template.surfaceColor,ink:body.template.textColor,muted:body.template.mutedColor,accent:body.template.accentColor } });
      if (!analysis.success) return NextResponse.json({error:"Invalid reference style traits."},{status:400});
      body.template = { ...referenceTemplate(analysis.data,body.template.name),id:body.template.id };
    }

    const toSave: VisualTemplate = {
      ...body.template,
      id: body.template.id || `tpl-${Date.now()}`,
      isBuiltIn: false,
      createdAt: body.template.createdAt || new Date().toISOString(),
    };

    const saved = await saveVisualTemplate(toSave);
    return NextResponse.json({ template: saved });
  } catch (err) {
    console.error("Save template error:", err);
    return NextResponse.json(
      { error: "Failed to save template." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing template id" }, { status: 400 });
  }
  await deleteVisualTemplate(id);
  return NextResponse.json({ ok: true });
}
