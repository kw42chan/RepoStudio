import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  extractPostText,
  linkedInEmbedUrls,
} from "@/lib/extract-post-text";
import { rejectNonJson } from "@/lib/json-body";
import { fetchPublic, resolvePublicAddress } from "@/lib/public-fetch";
import { requireViewer } from "@/lib/viewer";

const requestSchema = z.object({
  url: z.string().url("Enter a valid http or https link."),
});

const MAX_BYTES = 1024 * 1024;
const MAX_REDIRECTS = 3;
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function isLinkedIn(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return host.includes("linkedin.") || host === "lnkd.in";
  } catch {
    return false;
  }
}

async function loadPage(
  startUrl: string,
  browser: boolean
): Promise<
  | { html: string; finalUrl: string }
  | { error: NextResponse }
> {
  let current = startUrl;
  let status = 0;
  let headers: Record<string, string | string[] | undefined> = {};
  let html = "";
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const target = await resolvePublicAddress(current);
    if (!target) {
      return {
        error: NextResponse.json(
          { error: "That link cannot be fetched. Paste the post text instead." },
          { status: 400 }
        ),
      };
    }
    const page = await fetchPublic(
      target,
      MAX_BYTES,
      browser ? BROWSER_UA : undefined
    );
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
    return {
      error: NextResponse.json(
        {
          error:
            "The link did not return a readable page. Many social apps block fetching, so paste the caption into the box.",
        },
        { status: 422 }
      ),
    };
  }

  const contentType = String(headers["content-type"] || "");
  if (
    contentType &&
    !contentType.includes("text") &&
    !contentType.includes("json") &&
    !contentType.includes("xml")
  ) {
    return {
      error: NextResponse.json(
        { error: "That link is not a text post. Paste the caption instead." },
        { status: 422 }
      ),
    };
  }

  return { html, finalUrl: current };
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

    const loaded = await loadPage(parsed.data.url, isLinkedIn(parsed.data.url));
    if ("error" in loaded) return loaded.error;

    const pages = [loaded];
    if (isLinkedIn(loaded.finalUrl)) {
      for (const embedUrl of linkedInEmbedUrls(loaded.finalUrl)) {
        const embed = await loadPage(embedUrl, true);
        if (!("error" in embed)) pages.push(embed);
      }
    }

    let text = "";
    let title: string | undefined;
    for (const page of pages) {
      const extracted = extractPostText(page.html);
      if (!title && extracted.title) title = extracted.title;
      if (extracted.text.length > text.length) text = extracted.text;
    }
    text = text.slice(0, 20000);

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
      platform: guessPlatform(loaded.finalUrl),
      finalUrl: loaded.finalUrl,
    });
  } catch (err) {
    console.error("Source fetch error:", err);
    return NextResponse.json(
      { error: "Could not load that link. Paste the post text instead." },
      { status: 500 }
    );
  }
}
