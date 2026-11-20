import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import { readStore, writeStore } from "./store";
import type { SlideImageAsset } from "./types";

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;
export function imageAssetPath(id: string) {
  if (!/^[a-f0-9-]{36}$/.test(id)) throw new Error("Invalid image identifier.");
  return path.join(process.env.REPOSTUDIO_DATA_DIR?.trim() || path.join(process.cwd(), ".data"), "images", `${id}.webp`);
}

/** Decode and normalize to WebP; arbitrary MIME labels cannot introduce executable files. */
export async function saveImageAsset(bytes: Buffer, fileName: string, declaredMime: string): Promise<SlideImageAsset> {
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES) throw new Error("Images must be between 1 byte and 10 MB.");
  if (!["image/png","image/jpeg","image/webp"].includes(declaredMime)) throw new Error("Choose a PNG, JPEG, or WebP image.");
  const decoded = sharp(bytes, { limitInputPixels: MAX_PIXELS, animated: false });
  const metadata = await decoded.metadata();
  if (!["png","jpeg","webp"].includes(metadata.format ?? "")) throw new Error("Unsupported image contents.");
  const result = await decoded.rotate().resize({ width: 4096, height: 4096, fit: "inside", withoutEnlargement: true }).webp({ quality: 90 }).toBuffer({ resolveWithObject: true });
  const id = randomUUID(); const target = imageAssetPath(id);
  const asset: SlideImageAsset = { id, url: `/api/image-assets/${id}`, fileName: path.basename(fileName).slice(0,180), mimeType: "image/webp", width: result.info.width, height: result.info.height, sizeBytes: result.data.length, createdAt: new Date().toISOString() };
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, result.data);
  try {
    const store = await readStore();
    store.imageAssets = [...(store.imageAssets ?? []), asset];
    await writeStore(store);
  } catch (error) { await fs.unlink(target).catch(() => undefined); throw error; }
  return asset;
}

export async function deleteImageAsset(id: string) {
  const target = imageAssetPath(id); const store = await readStore();
  const used = store.drafts.some(d => [d.igCarousel,d.liCarousel].some(c => c?.slides.some(s => s.media?.some(m => m.assetId === id))));
  if (used) return false;
  // Unlink before removing metadata so a failed delete stays recoverable.
  await fs.unlink(target).catch((error: NodeJS.ErrnoException) => { if (error.code !== "ENOENT") throw error; });
  store.imageAssets = (store.imageAssets ?? []).filter(a => a.id !== id);
  await writeStore(store); return true;
}
