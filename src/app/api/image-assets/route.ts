import { NextRequest, NextResponse } from "next/server";
import { requireViewer } from "@/lib/viewer";
import { readStore } from "@/lib/store";
import { MAX_IMAGE_BYTES, saveImageAsset } from "@/lib/image-assets";

export async function GET(req: NextRequest) {
  const denied = await requireViewer(req); if (denied) return denied;
  return NextResponse.json({ assets: (await readStore()).imageAssets ?? [] });
}

export async function POST(req: NextRequest) {
  const denied = await requireViewer(req); if (denied) return denied;
  const maximum = MAX_IMAGE_BYTES + 65536;
  if (Number(req.headers.get("content-length")) > maximum) return NextResponse.json({ error: "Image exceeds 10 MB." }, { status: 413 });
  if (!req.body) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
  const reader = req.body.getReader(); const chunks: Uint8Array[] = []; let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read(); if (done) break;
      length += value.length;
      if (length > maximum) { await reader.cancel(); return NextResponse.json({ error: "Image exceeds 10 MB." }, { status: 413 }); }
      chunks.push(value);
    }
    const bytes = Buffer.concat(chunks);
    const form = await new Request(req.url, { method: "POST", headers: { "content-type": req.headers.get("content-type") ?? "" }, body: bytes }).formData();
    const file = form.get("file");
    if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image." }, { status: 400 });
    if (file.size > MAX_IMAGE_BYTES) return NextResponse.json({ error: "Image exceeds 10 MB." }, { status: 413 });
    return NextResponse.json({ asset: await saveImageAsset(Buffer.from(await file.arrayBuffer()), file.name, file.type) });
  } catch {
    return NextResponse.json({ error: "Could not upload this image. Choose a valid PNG, JPEG, or WebP within 10 MB and 40 megapixels." }, { status: 400 });
  } finally { reader.releaseLock(); }
}
