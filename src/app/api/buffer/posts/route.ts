import { NextResponse } from "next/server";
import { listBufferPosts } from "@/lib/buffer";

export async function GET() {
  const data = await listBufferPosts();
  return NextResponse.json(data);
}
