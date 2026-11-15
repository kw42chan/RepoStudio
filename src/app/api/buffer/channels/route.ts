import { NextRequest, NextResponse } from "next/server";
import { listBufferChannels } from "@/lib/buffer";
import { requireViewer } from "@/lib/viewer";

export async function GET(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const data = await listBufferChannels();
  return NextResponse.json(data);
}
