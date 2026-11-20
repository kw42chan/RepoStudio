import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, expect, test } from "vitest";

const dir = path.join(os.tmpdir(), "repostudio-ro-data");
process.env.REPOSTUDIO_DATA_DIR = dir;

beforeAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
  // A file occupying the configured directory blocks writes on Windows and Unix.
  await fs.writeFile(dir, "This path cannot be used as a data directory.");
});

afterAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
});

test("saves a brand when the data directory cannot be written", async () => {
  const { readStore, upsertBrandPreset } = await import("./store");
  const saved = await upsertBrandPreset({
    id: "preset-readonly",
    name: "Read only brand",
    voice: "Direct",
    audience: "Founders",
    cta: "Follow",
    handle: "@readonly",
    primaryColor: "#5C4033",
    secondaryColor: "#F59E0B",
    defaultWritingStyle: "educational",
  });
  expect(saved.name).toBe("Read only brand");
  const store = await readStore();
  const found = store.brandPresets.find((preset) => preset.id === "preset-readonly");
  expect(found?.primaryColor).toBe("#5C4033");
  expect(found?.secondaryColor).toBe("#F59E0B");
  await expect(fs.access(path.join(dir, "store.json"))).rejects.toThrow();
});

test("deletes a saved brand and keeps the rest", async () => {
  const { deleteBrandPreset, readStore, upsertBrandPreset } = await import(
    "./store"
  );
  await upsertBrandPreset({
    id: "preset-keep",
    name: "Keep me",
    voice: "Direct",
    audience: "Founders",
    cta: "Follow",
    handle: "@keep",
    primaryColor: "#1D4ED8",
    secondaryColor: "#0F766E",
    defaultWritingStyle: "educational",
  });
  await upsertBrandPreset({
    id: "preset-drop",
    name: "Drop me",
    voice: "Warm",
    audience: "Creators",
    cta: "Comment",
    handle: "@drop",
    primaryColor: "#2563EB",
    secondaryColor: "#F59E0B",
    defaultWritingStyle: "tactical",
  });
  await deleteBrandPreset("preset-drop");
  const store = await readStore();
  expect(store.brandPresets.some((preset) => preset.id === "preset-drop")).toBe(
    false
  );
  expect(store.brandPresets.some((preset) => preset.id === "preset-keep")).toBe(
    true
  );
});
