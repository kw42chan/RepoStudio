import { NextRequest, NextResponse } from "next/server";
import { isBufferOAuthConfigured } from "@/lib/buffer";
import { updateBufferConnection } from "@/lib/store";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/buffer/oauth/callback`;

  if (!isBufferOAuthConfigured()) {
    // One-click fallback when OAuth client credentials are not yet configured
    await updateBufferConnection({
      mode: "demo",
      organizationName: "Demo Buffer Workspace",
      connectedAt: new Date().toISOString(),
    });
    return NextResponse.redirect(new URL("/?buffer=demo_connected", origin));
  }

  const clientId = process.env.BUFFER_CLIENT_ID!;
  const authorizeUrl = new URL("https://bufferapp.com/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");

  return NextResponse.redirect(authorizeUrl.toString());
}
