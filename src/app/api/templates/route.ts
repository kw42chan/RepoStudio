import { NextRequest, NextResponse } from "next/server";
import {
  deleteVisualTemplate,
  getAllVisualTemplates,
  saveVisualTemplate,
} from "@/lib/store";
import { rejectNonJson } from "@/lib/json-body";
import { VisualTemplate } from "@/lib/types";

export async function GET() {
  const templates = await getAllVisualTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as { template?: VisualTemplate };
    if (!body.template || !body.template.name) {
      return NextResponse.json(
        { error: "Valid template object is required." },
        { status: 400 }
      );
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
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing template id" }, { status: 400 });
  }
  await deleteVisualTemplate(id);
  return NextResponse.json({ ok: true });
}
