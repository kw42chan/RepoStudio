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

export function readSyndicationTweet(body: string): string | undefined {
  try {
    const data = JSON.parse(body) as { text?: unknown };
    if (typeof data.text !== "string") return undefined;
    const text = data.text.trim();
    return text.length > 0 ? text : undefined;
  } catch {
    return undefined;
  }
}
