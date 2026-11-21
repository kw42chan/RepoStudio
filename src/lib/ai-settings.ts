import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { TEXT_MODEL, VISION_MODEL } from "./models";

const modelId = z.string().trim().min(3).max(200).regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]*\/[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/);
export const aiSettingsInput = z.object({
  apiKey: z.string().trim().max(256).regex(/^(sk-or-v1-[a-f0-9]{64})?$/, "Enter a valid OpenRouter API key.").optional(),
  textModel: modelId,
  visionModel: modelId,
}).strict();
type SettingsInput = z.infer<typeof aiSettingsInput>;
const storedSchema = z.object({ textModel: modelId, visionModel: modelId, secret: z.string() });

function directory() { return path.join(process.env.REPOSTUDIO_DATA_DIR || path.join(process.cwd(), ".data"), "secrets"); }
async function encryptionKey() {
  const dir = directory();
  await mkdir(dir, { recursive: true, mode: 0o700 });
  const file = path.join(dir, "master.key");
  try { await writeFile(file, randomBytes(32), { flag: "wx", mode: 0o600 }); }
  catch (error) { if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error; }
  return readFile(file);
}
async function readSaved() {
  let raw: string;
  try { raw = await readFile(path.join(directory(), "openrouter.json"), "utf8"); }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return null; throw error; }
  const saved = storedSchema.parse(JSON.parse(raw));
  const data = Buffer.from(saved.secret, "base64");
  const decipher = createDecipheriv("aes-256-gcm", await readFile(path.join(directory(), "master.key")), data.subarray(0, 12));
  decipher.setAuthTag(data.subarray(12, 28));
  const apiKey = Buffer.concat([decipher.update(data.subarray(28)), decipher.final()]).toString("utf8");
  return { apiKey, textModel: saved.textModel, visionModel: saved.visionModel };
}

/** Server-only credentials: never return this value from an API route. */
export async function resolveAiSettings() {
  const saved = await readSaved();
  const apiKey = saved?.apiKey || process.env.OPENROUTER_API_KEY || "";
  return {
    apiKey,
    provider: apiKey ? "openrouter" as const : process.env.OPENAI_API_KEY ? "openai" as const : "demo" as const,
    source: saved ? "settings" as const : apiKey || process.env.OPENAI_API_KEY ? "environment" as const : "none" as const,
    textModel: saved?.textModel || process.env.OPENROUTER_MODEL || TEXT_MODEL,
    visionModel: saved?.visionModel || process.env.OPENROUTER_VISION_MODEL || VISION_MODEL,
  };
}
export async function publicAiSettings() {
  const { apiKey, ...settings } = await resolveAiSettings();
  return { ...settings, configured: settings.provider !== "demo", hasOpenRouterKey: Boolean(apiKey),
    textModel: settings.provider === "openai" ? "gpt-4o-mini" : settings.textModel,
    visionModel: settings.provider === "openai" ? "gpt-4o-mini" : settings.visionModel };
}
export type PublicAiSettings = Awaited<ReturnType<typeof publicAiSettings>>;

// Serialize read/modify/write so blank-key model updates cannot lose a concurrent key save.
let writes: Promise<unknown> = Promise.resolve();
function serialize<T>(operation: () => Promise<T>): Promise<T> {
  const next = writes.then(operation, operation); writes = next.catch(() => {}); return next;
}
export function saveAiSettings(input: SettingsInput) {
  return serialize(async () => {
    const checked = aiSettingsInput.parse(input);
    const current = await resolveAiSettings();
    const apiKey = checked.apiKey || current.apiKey;
    if (!apiKey) throw new Error("API_KEY_REQUIRED");
    const key = await encryptionKey();
    const iv = randomBytes(12); const cipher = createCipheriv("aes-256-gcm", key, iv);
    const encrypted = Buffer.concat([cipher.update(apiKey, "utf8"), cipher.final()]);
    const secret = Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64");
    const file = path.join(directory(), "openrouter.json"); const temporary = `${file}.${randomUUID()}.tmp`;
    try {
      await writeFile(temporary, JSON.stringify({ textModel: checked.textModel, visionModel: checked.visionModel, secret }), { flag: "wx", mode: 0o600 });
      await rename(temporary, file);
    } finally { await unlink(temporary).catch(() => {}); }
    return publicAiSettings();
  });
}
export function removeAiSettings() {
  return serialize(async () => {
    try { await unlink(path.join(directory(), "openrouter.json")); }
    catch (error) { if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error; }
    return publicAiSettings();
  });
}

export async function checkOpenRouter(input: SettingsInput) {
  const current = await resolveAiSettings();
  const apiKey = input.apiKey || current.apiKey;
  if (!apiKey) return { ok: false, message: "Enter an OpenRouter API key first." };
  try {
    const keyResponse = await fetch("https://openrouter.ai/api/v1/key", {
      headers: { Authorization: `Bearer ${apiKey}` }, cache: "no-store", signal: AbortSignal.timeout(10_000), redirect: "error",
    });
    if (!keyResponse.ok) return { ok: false, message: keyResponse.status === 401 || keyResponse.status === 403 ? "OpenRouter rejected this key. Check the key and its permissions." : "OpenRouter is unavailable. Try again shortly." };
    const keyInfo = await keyResponse.json();
    if (!keyInfo?.data || typeof keyInfo.data !== "object") return { ok: false, message: "OpenRouter returned an unexpected response. Try again." };
    if (keyInfo.data.limit_remaining !== null && typeof keyInfo.data.limit_remaining === "number" && keyInfo.data.limit_remaining <= 0) return { ok: false, message: "This key has no remaining credit allowance. Check your OpenRouter limits." };
    const response = await fetch("https://openrouter.ai/api/v1/models", { cache: "no-store", signal: AbortSignal.timeout(10_000), redirect: "error" });
    if (!response.ok) return { ok: false, message: "Key accepted, but the model list could not be checked. Try again." };
    const catalog = await response.json();
    const models: Array<{ id: string; architecture?: { input_modalities?: string[] } }> = Array.isArray(catalog.data) ? catalog.data : [];
    if (!models.some(model => model.id === input.textModel)) return { ok: false, message: "Key accepted. The text model ID was not found in OpenRouter's model list." };
    const vision = models.find(model => model.id === input.visionModel);
    if (!vision?.architecture?.input_modalities?.includes("image")) return { ok: false, message: "Key accepted. Choose a reference model that supports images." };
    return { ok: true, message: "Key accepted and both models found. No content was generated. Save to apply these settings." };
  } catch { return { ok: false, message: "Could not reach OpenRouter. Check your connection and try again." }; }
}
