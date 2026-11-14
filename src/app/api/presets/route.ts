import { NextRequest, NextResponse } from "next/server";
import { readStore, upsertBrandPreset } from "@/lib/store";
import { BrandVoicePreset } from "@/lib/types";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({ presets: store.brandPresets });
}

export async function POST(req: NextRequest) {
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
