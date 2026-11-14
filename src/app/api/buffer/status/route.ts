import { NextResponse } from "next/server";
import { isBufferOAuthConfigured } from "@/lib/buffer";
import { readStore } from "@/lib/store";

export async function GET() {
  const store = await readStore();
  return NextResponse.json({
    connection: {
      mode: store.bufferConnection.mode,
      organizationName: store.bufferConnection.organizationName,
      connectedAt: store.bufferConnection.connectedAt,
      hasToken: Boolean(
        store.bufferConnection.accessToken || process.env.BUFFER_ACCESS_TOKEN
      ),
    },
    oauthConfigured: isBufferOAuthConfigured(),
    envTokenConfigured: Boolean(process.env.BUFFER_ACCESS_TOKEN),
  });
}
