import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), ".data", "uploads");
const MAX_VIDEO_BYTES = 100 * 1024 * 1024; // 100 MB

const ALLOWED_EXTENSIONS: Record<string, string> = {
  "video/mp4": "mp4",
  "video/quicktime": "mov",
  "video/webm": "webm",
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
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
      return NextResponse.json(
        { error: "Video exceeds the 100 MB upload limit." },
        { status: 400 }
      );
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
    const targetPath = path.join(UPLOADS_DIR, safeName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(targetPath, buffer);

    return NextResponse.json({
      url: `/api/uploads/${safeName}`,
      fileName: file.name,
      storedName: safeName,
      sizeBytes: file.size,
    });
  } catch (err) {
    console.error("Video upload error:", err);
    return NextResponse.json(
      { error: "Failed to upload video." },
      { status: 500 }
    );
  }
}
