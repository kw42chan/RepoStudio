import { NextRequest, NextResponse } from "next/server";
import { updateBufferConnection } from "@/lib/store";

export async function GET(req: NextRequest) {
  const origin = req.nextUrl.origin;
  const code = req.nextUrl.searchParams.get("code");
  const error = req.nextUrl.searchParams.get("error");

  if (error || !code) {
    return NextResponse.redirect(new URL("/?buffer=oauth_cancelled", origin));
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

    return NextResponse.redirect(new URL("/?buffer=connected", origin));
  } catch {
    return NextResponse.redirect(new URL("/?buffer=oauth_failed", origin));
  }
}
