import { NextRequest, NextResponse } from "next/server";
import { promises as dns } from "dns";
import net from "net";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().url("Enter a valid http or https link."),
});

const MAX_BYTES = 512 * 1024;
const MAX_REDIRECTS = 3;

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const parts = ip.split(".").map(Number);
    const [a, b] = parts;
    if (a === 10 || a === 127 || a === 0) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === "::1" ||
      lower === "::" ||
      lower.startsWith("fc") ||
      lower.startsWith("fd") ||
      lower.startsWith("fe80")
    );
  }
  return true;
}

async function isSafePublicUrl(rawUrl: string): Promise<boolean> {
  try {
    const parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === "localhost" || host.endsWith(".local")) return false;
    if (net.isIP(host)) return !isPrivateIp(host);
    const resolved = await dns.lookup(host, { all: true });
    if (resolved.length === 0) return false;
    return resolved.every((entry) => !isPrivateIp(entry.address));
  } catch {
    return false;
  }
}

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

async function readLimitedText(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  while (received < MAX_BYTES) {
    const { done, value } = await reader.read();
    if (done || !value) break;
    const room = MAX_BYTES - received;
    chunks.push(value.byteLength > room ? value.slice(0, room) : value);
    received += Math.min(value.byteLength, room);
    if (value.byteLength > room) break;
  }
  await reader.cancel().catch(() => undefined);
  return Buffer.concat(chunks).toString("utf-8");
}

export async function POST(req: NextRequest) {
  try {
    const parsed = requestSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Invalid link" },
        { status: 400 }
      );
    }

    let current = parsed.data.url;
    let res: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      if (!(await isSafePublicUrl(current))) {
        return NextResponse.json(
          { error: "That link cannot be fetched. Paste the post text instead." },
          { status: 400 }
        );
      }
      res = await fetch(current, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; RepoStudio/1.0; +https://repostudio.apps.grok.bot)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });
      if (res.status >= 300 && res.status < 400) {
        const location = res.headers.get("location");
        if (!location) break;
        current = new URL(location, current).toString();
        continue;
      }
      break;
    }

    if (!res || !res.ok) {
      return NextResponse.json(
        {
          error:
            "The link did not return a readable page. Many social apps block fetching, so paste the caption into the box.",
        },
        { status: 422 }
      );
    }

    const contentType = res.headers.get("content-type") || "";
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

    const html = await readLimitedText(res);
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
