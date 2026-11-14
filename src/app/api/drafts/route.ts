import { NextRequest, NextResponse } from "next/server";
import { deleteDraft, readStore, upsertDraft } from "@/lib/store";
import { ContentDraft } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ drafts: store.drafts });
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as { draft?: ContentDraft };
    if (!body.draft) {
      return NextResponse.json({ error: "Missing draft" }, { status: 400 });
    }
    const now = new Date().toISOString();
    const saved = await upsertDraft({
      ...body.draft,
      id: body.draft.id || `draft-${Date.now()}`,
      createdAt: body.draft.createdAt || now,
      updatedAt: now,
    });
    return NextResponse.json({ draft: saved });
  } catch (err) {
    console.error("Save draft error:", err);
    return NextResponse.json(
      { error: "Failed to save draft." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing draft id" }, { status: 400 });
  }
  await deleteDraft(id);
  return NextResponse.json({ ok: true });
}
