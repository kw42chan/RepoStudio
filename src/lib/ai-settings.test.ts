import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { NextRequest } from "next/server";
import { z } from "zod";
import { aiSettingsInput, checkOpenRouter, publicAiSettings, removeAiSettings, resolveAiSettings, saveAiSettings } from "./ai-settings";
import { completeOpenRouterJson, getLlmModels } from "./llm";
import { generateContentForFormats, ideateFromSourcePost } from "./ai";
import type { SourcePost } from "./types";
import { GET, PUT, POST, DELETE } from "@/app/api/settings/ai/route";
import { requireViewer } from "./viewer";
vi.mock("./viewer", () => ({ requireViewer: vi.fn(async () => null) }));
const key = `sk-or-v1-${"a".repeat(64)}`;
const input = { apiKey: key, textModel: "openai/gpt-4o-mini", visionModel: "google/gemini-2.5-flash" };
let dir: string;
beforeEach(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "repostudio-settings-test-"));
  vi.stubEnv("REPOSTUDIO_DATA_DIR", dir); vi.stubEnv("OPENROUTER_API_KEY", ""); vi.stubEnv("OPENAI_API_KEY", "");
  vi.mocked(requireViewer).mockResolvedValue(null);
});
afterEach(async () => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.restoreAllMocks(); await rm(dir, { recursive: true, force: true }); });
function request(method: string, body?: unknown, origin = "http://localhost:3100") {
  return new NextRequest("http://localhost:3100/api/settings/ai", { method, headers: { "Content-Type": "application/json", Origin: origin }, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
}
describe("private OpenRouter settings", () => {
  it("encrypts saved keys, returns only safe status and reloads into generation without environment mutation", async () => {
    const saved = await saveAiSettings(input);
    expect(JSON.stringify(saved)).not.toContain(key); expect(saved.source).toBe("settings");
    expect(await readFile(path.join(dir, "secrets/openrouter.json"), "utf8")).not.toContain(key);
    expect((await resolveAiSettings()).apiKey).toBe(key);
    expect(process.env.OPENROUTER_API_KEY).toBe("");
    expect((await getLlmModels())?.textModel.modelId).toBe(input.textModel);
    expect((await getLlmModels())?.visionModel.modelId).toBe(input.visionModel);
    await saveAiSettings({ ...input, apiKey: "", textModel: "other/model" });
    expect((await resolveAiSettings()).apiKey).toBe(key);
    expect((await publicAiSettings()).textModel).toBe("other/model");
    await removeAiSettings(); expect((await publicAiSettings()).provider).toBe("demo");
  });
  it("restores environment fallback after removing saved settings", async () => {
    vi.stubEnv("OPENROUTER_API_KEY", `sk-or-v1-${"b".repeat(64)}`);
    vi.stubEnv("OPENROUTER_MODEL", "env/text");
    await saveAiSettings(input); expect((await publicAiSettings()).source).toBe("settings");
    await removeAiSettings(); expect((await publicAiSettings()).textModel).toBe("env/text");
    expect((await publicAiSettings()).source).toBe("environment");
  });
  it("does not silently discard corrupted saved credentials", async () => {
    await saveAiSettings(input); const { writeFile } = await import("node:fs/promises");
    await writeFile(path.join(dir, "secrets/master.key"), Buffer.alloc(32));
    await expect(resolveAiSettings()).rejects.toThrow();
    expect((await GET(request("GET"))).status).toBe(500);
    expect((await DELETE(request("DELETE"))).status).toBe(200);
  });
  it("rejects malformed keys, model IDs and missing credentials", async () => {
    expect(aiSettingsInput.safeParse({ ...input, apiKey: "sk-other-secret" }).success).toBe(false);
    expect(aiSettingsInput.safeParse({ ...input, textModel: "https://evil.test/?q=secret" }).success).toBe(false);
    await expect(saveAiSettings({ ...input, apiKey: "" })).rejects.toThrow("API_KEY_REQUIRED");
  });
  it("uses the saved key and chosen model, preserves structured slide content and allows provider routing", async () => {
    await saveAiSettings(input);
    const slide = { id: "s1", headline: "Claim", intent: "metric", patternContent: { metric: "42", unit: "%" } };
    const fetcher = vi.fn().mockResolvedValue(Response.json({ choices: [{ message: { content: JSON.stringify({ slides: [slide] }) } }] }));
    vi.stubGlobal("fetch", fetcher);
    const output = await completeOpenRouterJson(z.object({ slides: z.array(z.object({ intent: z.string().optional(), patternContent: z.object({ metric: z.string(), unit: z.string() }).optional() })) }), "Synthetic prompt");
    const options = fetcher.mock.calls[0][1]; expect(options.headers.Authorization).toBe(`Bearer ${key}`);
    expect(JSON.parse(options.body).model).toBe(input.textModel); expect(JSON.parse(options.body).provider).toBeUndefined();
    expect(output.slides[0].patternContent?.metric).toBe("42"); expect(output.slides[0].intent).toBe("metric");
  });
  it("routes ideation and both carousel formats through saved settings, and labels provider-failure fallback", async () => {
    const source: SourcePost = { id: "source-test", rawText: "Define the audience, state the outcome and show evidence. These three steps make a brief clearer.", sourcePlatform: "Brief", brandVoice: "Direct", targetAudience: "Builders", ctaPreference: "Save", createdAt: "2026-11-20T00:00:00Z" };
    const demoIdeas = await ideateFromSourcePost(source);
    const parameters: Parameters<typeof generateContentForFormats>[0] = { sourcePost: source, idea: demoIdeas.ideas[0], formats: ["ig_carousel", "li_carousel"], writingStyle: { styleId: "educational" }, visualTemplateId: "minimal-light", aspectRatio: "4:5", brandHandle: "@qa" };
    const demo = await generateContentForFormats(parameters);
    const completion = (value: unknown) => Response.json({ choices: [{ message: { content: JSON.stringify(value) } }] });
    const fetcher = vi.fn().mockResolvedValueOnce(completion(demoIdeas)).mockResolvedValueOnce(completion(demo.igCarousel)).mockResolvedValueOnce(completion(demo.liCarousel));
    await saveAiSettings(input); vi.stubGlobal("fetch", fetcher);
    expect((await ideateFromSourcePost(source)).usedMock).toBe(false);
    const live = await generateContentForFormats(parameters);
    expect(live.usedMock).toBe(false); expect(live.igCarousel?.slides.length).toBeGreaterThanOrEqual(5); expect(live.liCarousel?.slides.length).toBeGreaterThanOrEqual(5);
    expect(fetcher).toHaveBeenCalledTimes(3);
    for (const [, options] of fetcher.mock.calls) { expect(options.headers.Authorization).toBe(`Bearer ${key}`); expect(JSON.parse(options.body).model).toBe(input.textModel); }
    fetcher.mockResolvedValue(Response.json({ error: { message: key } }, { status: 401 }));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {});
    const fallback = await generateContentForFormats(parameters);
    expect(fallback.usedMock).toBe(true); expect(fallback.generationNotice).toContain("configured model could not finish");
    expect(JSON.stringify(errors.mock.calls)).not.toContain(key);
  });
});
describe("connection check without content generation", () => {
  it("checks key authentication and image capability without saving or calling completions", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ data: { limit_remaining: null } })).mockResolvedValueOnce(Response.json({ data: [{ id: input.textModel }, { id: input.visionModel, architecture: { input_modalities: ["text", "image"] } }] }));
    vi.stubGlobal("fetch", fetcher);
    expect((await checkOpenRouter(input)).ok).toBe(true);
    expect(fetcher.mock.calls.map(call => call[0])).toEqual(["https://openrouter.ai/api/v1/key", "https://openrouter.ai/api/v1/models"]);
    expect((await publicAiSettings()).provider).toBe("demo");
  });
  it.each([401, 403, 429, 500])("redacts provider errors (%s)", async status => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ error: { message: key } }, { status })));
    const result = await checkOpenRouter(input); expect(result.ok).toBe(false); expect(JSON.stringify(result)).not.toContain(key);
  });
  it("handles unavailable models, text-only vision models and network errors", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce(Response.json({ data: {} })).mockResolvedValueOnce(Response.json({ data: [] }));
    vi.stubGlobal("fetch", fetcher); expect((await checkOpenRouter(input)).message).toContain("text model ID");
    fetcher.mockResolvedValueOnce(Response.json({ data: {} })).mockResolvedValueOnce(Response.json({ data: [{ id: input.textModel }, { id: input.visionModel, architecture: { input_modalities: ["text"] } }] }));
    expect((await checkOpenRouter(input)).message).toContain("supports images");
    fetcher.mockRejectedValueOnce(new Error(key)); expect(JSON.stringify(await checkOpenRouter(input))).not.toContain(key);
  });
});
describe("settings API boundary", () => {
  it("authenticates all operations before touching credentials", async () => {
    vi.mocked(requireViewer).mockImplementation(async () => new Response("Unauthorized", { status: 401 }));
    for (const handler of [GET, PUT, POST, DELETE]) expect((await handler(request("POST", input))).status).toBe(401);
  });
  it("rejects cross-origin writes and oversized or malformed inputs", async () => {
    expect((await PUT(request("PUT", input, "https://evil.test"))).status).toBe(403);
    expect((await PUT(request("PUT", { ...input, apiKey: "x".repeat(5000) }))).status).toBe(413);
    expect((await PUT(request("PUT", { ...input, apiKey: "bad" }))).status).toBe(400);
    expect((await PUT(new NextRequest("http://localhost:3100/api/settings/ai", { method: "PUT", headers: { "Content-Type": "application/json" }, body: "{" }))).status).toBe(400);
  });
  it("never returns saved secrets and disables caching", async () => {
    const response = await PUT(request("PUT", input)); expect(response.status).toBe(200);
    expect(await response.text()).not.toContain(key);
    const status = await GET(request("GET")); expect(status.headers.get("Cache-Control")).toBe("no-store");
    expect(await status.text()).not.toContain(key);
    await DELETE(request("DELETE")); expect((await publicAiSettings()).configured).toBe(false);
  });
});
