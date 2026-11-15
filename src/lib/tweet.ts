export function twitterStatusId(rawUrl: string): string | undefined {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    if (!host.endsWith("x.com") && !host.endsWith("twitter.com")) return undefined;
    return url.pathname.match(/\/status\/(\d+)/)?.[1];
  } catch {
    return undefined;
  }
}

export function syndicationToken(id: string): string {
  return ((Number(id) / 1e15) * Math.PI)
    .toString(36)
    .replace(/(0+|\.)/g, "");
}

export function readSyndicationTweet(body: string): {
  text: string;
  lang?: string;
} | undefined {
  try {
    const data = JSON.parse(body) as { text?: unknown; lang?: unknown };
    if (typeof data.text !== "string") return undefined;
    const text = data.text.trim();
    if (!text) return undefined;
    const lang = typeof data.lang === "string" ? data.lang : undefined;
    return { text, lang };
  } catch {
    return undefined;
  }
}

export function preferFullOriginal(original: string, pageText: string): string {
  const primary = original.trim();
  const page = pageText.trim();
  if (!primary) return page;
  if (!page) return primary;
  if (sameOpening(primary, page) && page.length > primary.length) return page;
  return primary;
}

function sameOpening(a: string, b: string): boolean {
  const left = a.replace(/\s+/g, "");
  const right = b.replace(/\s+/g, "");
  const size = Math.min(24, left.length, right.length);
  if (size < 12) return false;
  return left.slice(0, size) === right.slice(0, size);
}
