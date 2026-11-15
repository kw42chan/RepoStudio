import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { isBufferOAuthConfigured } from "@/lib/buffer";

const STATE_COOKIE = "buffer_oauth_state";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const redirectUri = `${origin}/api/buffer/oauth/callback`;

  if (!isBufferOAuthConfigured()) {
    return NextResponse.redirect(new URL("/?buffer=oauth_missing_env", origin));
  }

  const clientId = process.env.BUFFER_CLIENT_ID!;
  const state = randomBytes(16).toString("hex");
  const authorizeUrl = new URL("https://bufferapp.com/oauth2/authorize");
  authorizeUrl.searchParams.set("client_id", clientId);
  authorizeUrl.searchParams.set("redirect_uri", redirectUri);
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("state", state);

  const response = NextResponse.redirect(authorizeUrl.toString());
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https:"),
    path: "/",
    maxAge: 10 * 60,
  });
  return response;
}
