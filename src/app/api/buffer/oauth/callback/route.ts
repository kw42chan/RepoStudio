import { NextRequest, NextResponse } from "next/server";
import { updateBufferConnection } from "@/lib/store";
import { requireViewer } from "@/lib/viewer";

const STATE_COOKIE = "buffer_oauth_state";

export async function GET(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get(STATE_COOKIE)?.value;

  if (error || !code || !state || !expected || state !== expected) {
    const response = NextResponse.redirect(
      new URL("/?buffer=oauth_cancelled", origin)
    );
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  }

  const clientId = process.env.BUFFER_CLIENT_ID;
  const clientSecret = process.env.BUFFER_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    return NextResponse.redirect(new URL("/?buffer=oauth_missing_env", origin));
  }

  try {
    const form = new URLSearchParams();
    form.append("client_id", clientId);
    form.append("client_secret", clientSecret);
    form.append("redirect_uri", `${origin}/api/buffer/oauth/callback`);
    form.append("code", code);
    form.append("grant_type", "authorization_code");

    const tokenRes = await fetch(
      "https://api.bufferapp.com/1/oauth2/token.json",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString(),
      }
    );

    if (!tokenRes.ok) {
      return NextResponse.redirect(new URL("/?buffer=oauth_failed", origin));
    }

    const tokenData = (await tokenRes.json()) as { access_token?: string };
    if (!tokenData.access_token) {
      return NextResponse.redirect(new URL("/?buffer=oauth_failed", origin));
    }

    await updateBufferConnection({
      mode: "oauth",
      accessToken: tokenData.access_token,
      organizationName: "Buffer Connected (OAuth)",
      connectedAt: new Date().toISOString(),
    });

    const response = NextResponse.redirect(new URL("/?buffer=connected", origin));
    response.cookies.set(STATE_COOKIE, "", { path: "/", maxAge: 0 });
    return response;
  } catch {
    return NextResponse.redirect(new URL("/?buffer=oauth_failed", origin));
  }
}
