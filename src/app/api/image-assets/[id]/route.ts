import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "node:fs";
import { requireViewer } from "@/lib/viewer";
import { readStore } from "@/lib/store";
import { imageAssetPath, deleteImageAsset } from "@/lib/image-assets";
type Context = { params: Promise<{ id: string }> };

export async function GET(req: NextRequest, context: Context) {
  const denied = await requireViewer(req); if (denied) return denied;
  try {
    const { id } = await context.params;
    const asset = (await readStore()).imageAssets?.find(a => a.id === id);
    if (!asset) return NextResponse.json({ error: "Image not found." }, { status: 404 });
    return new NextResponse(await fs.readFile(imageAssetPath(id)), { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff", "Cache-Control": "private, max-age=3600" } });
  } catch { return NextResponse.json({ error: "Image not found." }, { status: 404 }); }
}
export async function DELETE(req: NextRequest, context: Context) {
  const denied = await requireViewer(req); if (denied) return denied;
  try {
    const { id } = await context.params;
    if (!await deleteImageAsset(id)) return NextResponse.json({ error: "This image is used in a saved draft. Remove it from every saved slide first." }, { status: 409 });
    return NextResponse.json({ ok: true });
  } catch { return NextResponse.json({ error: "Could not delete image." }, { status: 400 }); }
}
