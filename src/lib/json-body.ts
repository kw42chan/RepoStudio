import { NextRequest, NextResponse } from "next/server";

export function rejectNonJson(req: NextRequest): NextResponse | null {
  const type = (req.headers.get("content-type") || "").toLowerCase();
  if (!type.includes("application/json")) {
    return NextResponse.json(
      { error: "Send this request as application/json." },
      { status: 415 }
    );
  }
  return null;
}
