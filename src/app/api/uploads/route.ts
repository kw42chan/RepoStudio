import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { requireViewer } from "@/lib/viewer";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB
const MULTIPART_OVERHEAD_BYTES = 64 * 1024;
const MAX_BODY_BYTES = MAX_VIDEO_BYTES + MULTIPART_OVERHEAD_BYTES;

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

function tooLarge() {
  return NextResponse.json(
    { error: "Video exceeds the 100 MB upload limit." },
    { status: 413 }
  );
}

async function readCappedBody(
  req: NextRequest,
  maxBytes: number
): Promise<ArrayBuffer | "too-large" | null> {
  const body = req.body;
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value?.byteLength) continue;
      received += value.byteLength;
      if (received > maxBytes) {
        await reader.cancel();
        return "too-large";
      }
      const chunk = new Uint8Array(value.byteLength);
      chunk.set(value);
      chunks.push(chunk);
    }
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // cancel() already released the lock
    }
  }
  const bytes = new Uint8Array(received);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}

export async function POST(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;

  const declaredLength = req.headers.get("content-length");
  if (declaredLength !== null) {
    const length = Number(declaredLength);
    if (!Number.isFinite(length) || length < 0) {
      return NextResponse.json(
        { error: "Please select a video file to upload." },
        { status: 400 }
      );
    }
    if (length > MAX_BODY_BYTES) {
      return tooLarge();
    }
  }

  let targetPath: string | null = null;
  try {
    const bytes = await readCappedBody(req, MAX_BODY_BYTES);
    if (bytes === "too-large") return tooLarge();
    if (!bytes) {
      return NextResponse.json(
        { error: "Please select a video file to upload." },
        { status: 400 }
      );
    }

    const headers = new Headers(req.headers);
    headers.set("content-length", String(bytes.byteLength));
    const formData = await new Request(req.url, {
      method: "POST",
      headers,
      body: bytes,
    }).formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: "Please select a video file to upload." },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json(
        { error: "Uploaded file is empty." },
        { status: 400 }
      );
    }

    if (file.size > MAX_VIDEO_BYTES) {
      return tooLarge();
    }

    const extFromMime = ALLOWED_EXTENSIONS[file.type];
    const origExt = path.extname(file.name).toLowerCase().replace(".", "");
    const ext =
      extFromMime ||
      (["mp4", "mov", "webm"].includes(origExt) ? origExt : null);

    if (!ext) {
      return NextResponse.json(
        { error: "Unsupported format. Please upload MP4, MOV, or WebM." },
        { status: 400 }
      );
    }

    await fs.mkdir(UPLOADS_DIR, { recursive: true });
    const safeName = `reel-${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    targetPath = path.join(UPLOADS_DIR, safeName);

    await fs.writeFile(targetPath, Buffer.from(await file.arrayBuffer()));

    return NextResponse.json({
      url: `/api/uploads/${safeName}`,
      fileName: file.name,
      storedName: safeName,
      sizeBytes: file.size,
    });
  } catch (err) {
    if (targetPath) {
      await fs.unlink(targetPath).catch(() => undefined);
    }
    console.error("Video upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload video." },
      { status: 500 }
    );
  }
}
