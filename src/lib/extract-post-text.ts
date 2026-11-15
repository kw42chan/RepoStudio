export function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => {
      const n = Number.parseInt(hex, 16);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    })
    .replace(/&#(\d+);/g, (_, code) => {
      const n = Number(code);
      return Number.isFinite(n) ? String.fromCodePoint(n) : "";
    });
}

function readAttr(tag: string, name: string): string | undefined {
  const match = tag.match(
    new RegExp(`\\b${name}\\s*=\\s*("([^"]*)"|'([^']*)')`, "i")
  );
  if (!match) return undefined;
  return match[2] ?? match[3] ?? "";
}

export function readMeta(html: string, key: string): string | undefined {
  const tags = html.match(/<meta\b[^>]*>/gi) || [];
  for (const tag of tags) {
    const prop = (readAttr(tag, "property") || readAttr(tag, "name") || "")
      .toLowerCase();
    if (prop !== key.toLowerCase()) continue;
    const content = readAttr(tag, "content");
    if (content) return decodeEntities(content).trim();
  }
  return undefined;
}

function htmlToText(inner: string): string {
  const text = decodeEntities(
    inner
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n")
      .replace(/<[^>]+>/g, "")
  );
  return text
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n[ \t]+/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function readMarkedBlock(html: string, marker: string): string | undefined {
  const at = html.indexOf(marker);
  if (at < 0) return undefined;
  const open = html.lastIndexOf("<", at);
  const start = html.indexOf(">", at);
  if (open < 0 || start < 0) return undefined;
  const tagName = /^<\s*([a-z0-9]+)/i.exec(html.slice(open, start))?.[1];
  if (!tagName) return undefined;
  const close = html.toLowerCase().indexOf(`</${tagName.toLowerCase()}>`, start);
  if (close < 0) return undefined;
  const text = htmlToText(html.slice(start + 1, close));
  return text.length > 0 ? text : undefined;
}

function readJsonLdArticle(html: string): string | undefined {
  const blocks = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  let best = "";
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block[1]) as unknown;
      const nodes = Array.isArray(parsed) ? parsed : [parsed];
      for (const node of nodes) {
        if (!node || typeof node !== "object") continue;
        const body = (node as { articleBody?: unknown }).articleBody;
        if (typeof body === "string" && body.trim().length > best.length) {
          best = body.trim();
        }
      }
    } catch {
      continue;
    }
  }
  return best || undefined;
}

export function extractPostText(html: string): {
  text: string;
  title?: string;
} {
  const title =
    readMeta(html, "og:title") ||
    readMeta(html, "twitter:title") ||
    decodeEntities(html.match(/<title>([^<]+)<\/title>/i)?.[1] || "").trim() ||
    undefined;
  const description =
    readMeta(html, "og:description") ||
    readMeta(html, "twitter:description") ||
    readMeta(html, "description");
  const article = readJsonLdArticle(html);
  const commentary =
    readMarkedBlock(html, "main-feed-activity-embed-card__commentary") ||
    readMarkedBlock(html, "main-feed-activity-card__commentary");

  const post = longestSamePost(
    [article, commentary, description].filter((item): item is string =>
      Boolean(item && item.trim())
    )
  );

  if (post) return { text: post, title };
  if (description) return { text: description, title };
  return { text: "", title };
}

function longestSamePost(parts: string[]): string {
  let best = "";
  for (const part of parts) {
    const next = part.trim();
    if (!next) continue;
    if (!best) {
      best = next;
      continue;
    }
    const a = best.replace(/\s+/g, " ").trim();
    const b = next.replace(/\s+/g, " ").trim();
    const samePost =
      a.slice(0, 48) === b.slice(0, 48) ||
      a.startsWith(b.slice(0, 48)) ||
      b.startsWith(a.slice(0, 48));
    if (samePost && b.length > a.length) best = next;
    if (!samePost && best.length < 180 && next.length > best.length + 200) {
      best = next;
    }
  }
  return best;
}

export function linkedInEmbedUrls(pageUrl: string): string[] {
  let decoded = pageUrl;
  try {
    decoded = decodeURIComponent(pageUrl);
  } catch {
    decoded = pageUrl;
  }
  const ids = new Set<string>();
  const activity = decoded.match(/activity[:-](\d{8,})/i)?.[1];
  const share = decoded.match(/urn:li:share:(\d{8,})/i)?.[1];
  const ugc = decoded.match(/urn:li:ugcPost:(\d{8,})/i)?.[1];
  if (activity) ids.add(`urn:li:activity:${activity}`);
  if (share) ids.add(`urn:li:share:${share}`);
  if (ugc) ids.add(`urn:li:ugcPost:${ugc}`);
  return [...ids].map(
    (urn) => `https://www.linkedin.com/embed/feed/update/${urn}`
  );
}
