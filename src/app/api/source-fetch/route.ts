import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rejectNonJson } from "@/lib/json-body";
import { requireViewer } from "@/lib/viewer";
import { fetchPublic, resolvePublicAddress } from "@/lib/public-fetch";

const requestSchema = z.object({
  url: z.string().url("Enter a valid http or https link."),
});

const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    });
}

function readMeta(html: string, key: string): string | undefined {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${key}["']`,
      "i"
    ),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeEntities(match[1]).trim();
  }
  return undefined;
}

function visibleText(html: string): string {
  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
  return decodeEntities(stripped).replace(/\s+/g, " ").trim();
}

function guessPlatform(url: string): string | undefined {
  const host = new URL(url).hostname.toLowerCase();
  if (host.includes("linkedin.")) return "LinkedIn";
  if (host.includes("instagram.")) return "Instagram";
  if (host.includes("threads.")) return "Threads";
  if (host === "x.com" || host.includes("twitter.")) return "X / Twitter";
  if (host.includes("tiktok.")) return "TikTok";
  if (host.includes("youtube.") || host === "youtu.be") return "YouTube";
  return undefined;
}

export async function POST(req: NextRequest) {
  const viewer = await requireViewer(req);
  if (viewer) return viewer;
  const rejected = rejectNonJson(req);
  if (rejected) return rejected;
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid link" },
        { status: 400 }
      );
    }

    let current = parsed.data.url;
    let status = 0;
    let headers: Record<string, string | string[] | undefined> = {};
    let html = "";
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      const target = await resolvePublicAddress(current);
      if (!target) {
        return NextResponse.json(
          { error: "That link cannot be fetched. Paste the post text instead." },
          { status: 400 }
        );
      }
      const page = await fetchPublic(target, MAX_BYTES);
      status = page.status;
      headers = page.headers;
      html = page.body.toString("utf-8");
      if (status >= 300 && status < 400) {
        const location = headers.location;
        const next = Array.isArray(location) ? location[0] : location;
        if (!next) break;
        current = new URL(next, current).toString();
        continue;
      }
      break;
    }

    if (status < 200 || status >= 300) {
      return NextResponse.json(
        {
          error:
            "The link did not return a readable page. Many social apps block fetching, so paste the caption into the box.",
        },
        { status: 422 }
      );
    }

    const contentType = String(headers["content-type"] || "");
    if (
      contentType &&
      !contentType.includes("text") &&
      !contentType.includes("json") &&
      !contentType.includes("xml")
    ) {
      return NextResponse.json(
        { error: "That link is not a text post. Paste the caption instead." },
        { status: 422 }
      );
    }

    const title =
      readMeta(html, "og:title") ||
      readMeta(html, "twitter:title") ||
      decodeEntities(html.match(/<title>([^<]+)<\/title>/i)?.[1] || "").trim();
    const description =
      readMeta(html, "og:description") ||
      readMeta(html, "twitter:description") ||
      readMeta(html, "description");
    const body = visibleText(html).slice(0, 4000);

    const parts = [title, description].filter(Boolean) as string[];
    let text = parts.join("\n\n").trim();
    if (text.length < 40 && body.length > text.length) {
      text = body.slice(0, 2500);
    } else if (body && !body.includes(text.slice(0, 40))) {
      text = `${text}\n\n${body.slice(0, 1200)}`.trim();
    }

    if (text.length < 10) {
      return NextResponse.json(
        {
          error:
            "No post text was found on that page. Paste the caption into the box.",
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      text,
      title: title || undefined,
      platform: guessPlatform(current),
      finalUrl: current,
    });
  } catch (err) {
    console.error("Source fetch error:", err);
    return NextResponse.json(
      { error: "Could not load that link. Paste the post text instead." },
      { status: 500 }
    );
  }
}
