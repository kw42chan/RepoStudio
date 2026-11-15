import { NextRequest, NextResponse } from "next/server";
import { rejectNonJson } from "@/lib/json-body";
import { updateBufferConnection } from "@/lib/store";

export async function POST(req: NextRequest) {
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const body = (await req.json()) as {
      action: "demo" | "disconnect" | "token";
      accessToken?: string;
    };

    if (body.action === "demo") {
      const connection = await updateBufferConnection({
        mode: "demo",
        organizationName: "Demo Buffer Workspace",
        connectedAt: new Date().toISOString(),
      });
      return NextResponse.json({ connection });
    }

    if (body.action === "disconnect") {
      const connection = await updateBufferConnection({
        mode: "disconnected",
      });
      return NextResponse.json({ connection });
    }

    if (body.action === "token") {
      if (!body.accessToken?.trim()) {
        return NextResponse.json(
          { error: "Access token is required." },
          { status: 400 }
        );
      }
      const connection = await updateBufferConnection({
        mode: "token",
        accessToken: body.accessToken.trim(),
        organizationName: "Buffer Personal Token",
        connectedAt: new Date().toISOString(),
      });
      return NextResponse.json({ connection });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Buffer connect error:", err);
    return NextResponse.json(
      { error: "Failed to update Buffer connection." },
      { status: 500 }
    );
  }
}
