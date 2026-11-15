import { lookup } from "dns/promises";
import http from "http";
import https from "https";
import net from "net";

export function isPrivateIp(ip: string): boolean {
  const mapped = ipv4FromMapped(ip);
  if (mapped) return isPrivateIp(mapped);

  if (net.isIPv4(ip)) {
    const [a, b] = ip.split(".").map(Number);
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
      lower.startsWith("fe80") ||
      lower.startsWith("::ffff:")
    );
  }

  return true;
}

function ipv4FromMapped(ip: string): string | null {
  const lower = ip.toLowerCase();
  const dotted = lower.match(/^::ffff:(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (dotted) return dotted[1];
  const hex = lower.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/);
  if (!hex) return null;
  const hi = Number.parseInt(hex[1], 16);
  const lo = Number.parseInt(hex[2], 16);
  return `${(hi >> 8) & 255}.${hi & 255}.${(lo >> 8) & 255}.${lo & 255}`;
}

export async function resolvePublicAddress(
  rawUrl: string
): Promise<{ url: URL; address: string; family: number } | null> {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    if (url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    if (host === "localhost" || host.endsWith(".local")) return null;

    if (net.isIP(host)) {
      if (isPrivateIp(host)) return null;
      return { url, address: host, family: net.isIPv6(host) ? 6 : 4 };
    }

    const records = await lookup(host, { all: true });
    if (records.length === 0 || records.some((entry) => isPrivateIp(entry.address))) {
      return null;
    }
    const chosen = records[0];
    return { url, address: chosen.address, family: chosen.family };
  } catch {
    return null;
  }
}

export function fetchPublic(
  target: { url: URL; address: string; family: number },
  maxBytes: number
): Promise<{ status: number; headers: http.IncomingHttpHeaders; body: Buffer }> {
  const { url, address, family } = target;
  const lib = url.protocol === "https:" ? https : http;

  return new Promise((resolve, reject) => {
    const req = lib.request(
      {
        host: address,
        servername: url.hostname,
        port: url.port || (url.protocol === "https:" ? 443 : 80),
        path: `${url.pathname}${url.search}`,
        method: "GET",
        family,
        headers: {
          Host: url.host,
          "User-Agent":
            "Mozilla/5.0 (compatible; RepoStudio/1.0; +https://repostudio.apps.grok.bot)",
          Accept: "text/html,application/xhtml+xml,image/*",
        },
        timeout: 8000,
      },
      (res) => {
        const chunks: Buffer[] = [];
        let received = 0;
        res.on("data", (chunk: Buffer) => {
          if (received >= maxBytes) return;
          const room = maxBytes - received;
          const slice = chunk.byteLength > room ? chunk.subarray(0, room) : chunk;
          chunks.push(slice);
          received += slice.byteLength;
          if (chunk.byteLength > room) res.destroy();
        });
        res.on("end", () => {
          resolve({
            status: res.statusCode || 0,
            headers: res.headers,
            body: Buffer.concat(chunks),
          });
        });
        res.on("error", reject);
      }
    );
    req.on("timeout", () => {
      req.destroy(new Error("The link took too long to respond."));
    });
    req.on("error", reject);
    req.end();
  });
}
