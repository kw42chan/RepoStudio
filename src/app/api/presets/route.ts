import { NextRequest, NextResponse } from "next/server";
import { rejectNonJson } from "@/lib/json-body";
import { deleteBrandPreset, readStore, upsertBrandPreset } from "@/lib/store";
import { requireViewer } from "@/lib/viewer";
import { BrandVoicePreset } from "@/lib/types";

export async function GET(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const store = await readStore();
  return NextResponse.json({ presets: store.brandPresets });
}

export async function POST(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as { preset?: BrandVoicePreset };
    if (!body.preset || !body.preset.name) {
      return NextResponse.json({ error: "Missing preset" }, { status: 400 });
    }
    const saved = await upsertBrandPreset({
      ...body.preset,
      id: body.preset.id || `preset-${Date.now()}`,
    });
    return NextResponse.json({ preset: saved });
  } catch (err) {
    console.error("Save preset error:", err);
    return NextResponse.json(
      { error: "Failed to save preset." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as { id?: string };
    if (!body.id) {
      return NextResponse.json({ error: "Missing preset" }, { status: 400 });
    }
    await deleteBrandPreset(body.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete preset error:", err);
    return NextResponse.json(
      { error: "Failed to delete preset." },
      { status: 500 }
    );
  }
}
