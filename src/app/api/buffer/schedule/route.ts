import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { scheduleBufferPost } from "@/lib/buffer";

const schema = z.object({
  draftId: z.string().optional(),
  format: z.enum(["reel", "ig_carousel", "li_carousel"]),
  channelId: z.string().min(1),
  text: z.string().min(1),
  mode: z.enum(["addToQueue", "shareNow", "customScheduled"]),
  scheduledAt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid schedule payload" },
        { status: 400 }
      );
    }

    const result = await scheduleBufferPost(parsed.data);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Buffer schedule error:", err);
    return NextResponse.json(
      { error: "Failed to schedule post to Buffer." },
      { status: 500 }
    );
  }
}
