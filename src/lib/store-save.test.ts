import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { afterAll, beforeAll, expect, test } from "vitest";

const dir = path.join(os.tmpdir(), "repostudio-ro-data");
process.env.REPOSTUDIO_DATA_DIR = dir;

beforeAll(async () => {
  await fs.rm(dir, { recursive: true, force: true });
  await fs.mkdir(dir, { recursive: true });
  await fs.chmod(dir, 0o555);
});

afterAll(async () => {
  await fs.chmod(dir, 0o755).catch(() => undefined);
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
