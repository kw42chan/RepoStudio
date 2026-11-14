import { NextResponse } from "next/server";
import { listBufferChannels } from "@/lib/buffer";

export async function GET() {
  const data = await listBufferChannels();
  return NextResponse.json(data);
}
