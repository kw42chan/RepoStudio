import { NextRequest, NextResponse } from "next/server";
import { aiSettingsInput, checkOpenRouter, publicAiSettings, removeAiSettings, saveAiSettings } from "@/lib/ai-settings";
import { requireViewer } from "@/lib/viewer";
import { rejectNonJson } from "@/lib/json-body";

const respond = (data: unknown, status = 200) => NextResponse.json(data, { status, headers: { "Cache-Control": "no-store" } });

async function guard(req: NextRequest) {
  const denied = await requireViewer(req); if (denied) return denied;
  const origin = req.headers.get("origin");
  if (origin && origin !== new URL(req.url).origin) return respond({ error: "Use Settings from this app to change the connection." }, 403);
  return null;
}
export async function GET(req: NextRequest) {
  const denied = await requireViewer(req); if (denied) return denied;
  try { return respond(await publicAiSettings()); }
  catch { return respond({ error: "Could not read language model settings." }, 500); }
}
async function update(req: NextRequest, test: boolean) {
  const denied = await guard(req); if (denied) return denied;
  const rejected = rejectNonJson(req); if (rejected) return rejected;
  try {
    // Bound the stream, rather than trusting the Content-Length header.
    const reader = req.body?.getReader(); if (!reader) return respond({ error: "Enter valid connection settings." }, 400);
    const chunks: Uint8Array[] = []; let bytes = 0;
    for (;;) { const { done, value } = await reader.read(); if (done) break; bytes += value.byteLength; if (bytes > 4096) { await reader.cancel(); return respond({ error: "Settings are too large." }, 413); } chunks.push(value); }
    const input = aiSettingsInput.safeParse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    if (!input.success) return respond({ error: "Enter a valid OpenRouter key and both model IDs (provider/model)." }, 400);
    if (test) return respond(await checkOpenRouter(input.data));
    return respond(await saveAiSettings(input.data));
  } catch (error) {
    if (error instanceof SyntaxError) return respond({ error: "Enter valid connection settings." }, 400);
    if (error instanceof Error && error.message === "API_KEY_REQUIRED") return respond({ error: "Enter an OpenRouter API key first." }, 400);
    return respond({ error: "Could not save the connection. Check that the server's data folder is writable." }, 500);
  }
}
export const PUT = (req: NextRequest) => update(req, false);
export const POST = (req: NextRequest) => update(req, true);
export async function DELETE(req: NextRequest) {
  const denied = await guard(req); if (denied) return denied;
  try { return respond(await removeAiSettings()); }
  catch { return respond({ error: "Could not remove the saved connection." }, 500); }
}
