import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { sql } from "./db";
import {
  AppStoreData,
  BrandVoicePreset,
  BufferConnection,
  ContentDraft,
  ScheduledPost,
  VisualTemplate,
} from "./types";
import {
  BUILT_IN_VISUAL_TEMPLATES,
  DEFAULT_BRAND_PRESETS,
  withBrandColors,
} from "./presets";

const STORE_ROW_ID = "main";

function dataDir(): string {
  return (
    process.env.REPOSTUDIO_DATA_DIR?.trim() || path.join(process.cwd(), ".data")
  );
}

function storePaths(): { primary: string; fallback: string } {
  const custom = process.env.REPOSTUDIO_DATA_DIR?.trim();
  return {
    primary: path.join(dataDir(), "store.json"),
    fallback: custom
      ? path.join(os.tmpdir(), "repostudio-fallback", path.basename(custom), "store.json")
      : path.join(os.tmpdir(), "repostudio", "store.json"),
  };
}

function createInitialStore(): AppStoreData {
  return {
    drafts: [],
    brandPresets: DEFAULT_BRAND_PRESETS,
    visualTemplates: [],
    bufferConnection: {
      mode: process.env.BUFFER_ACCESS_TOKEN ? "token" : "disconnected",
      accessToken: process.env.BUFFER_ACCESS_TOKEN || undefined,
      organizationName: process.env.BUFFER_ACCESS_TOKEN
        ? "Connected via ENV Token"
        : undefined,
    },
    mockQueue: [
      {
        id: "mock-post-1",
        format: "li_carousel",
        channelId: "mock-li-1",
        channelName: "Your Brand (LinkedIn)",
        service: "linkedin",
        text: "Why fixing your first 5 minutes of onboarding beats spending more on ads. Swipe through the 3-step teardown.",
        mode: "addToQueue",
        status: "queued",
        createdAt: new Date(Date.now() - 86400_000).toISOString(),
        isMock: true,
      },
    ],
  };
}

function normalizeStore(parsed: Partial<AppStoreData>): AppStoreData {
  const initial = createInitialStore();
  return {
    drafts: parsed.drafts ?? initial.drafts,
    brandPresets:
      parsed.brandPresets && parsed.brandPresets.length > 0
        ? parsed.brandPresets.map(withBrandColors)
        : initial.brandPresets,
    visualTemplates: parsed.visualTemplates ?? [],
    bufferConnection: parsed.bufferConnection ?? initial.bufferConnection,
    mockQueue: parsed.mockQueue ?? initial.mockQueue,
  };
}

async function readFileStore(): Promise<AppStoreData | null> {
  const { primary, fallback } = storePaths();
  for (const filePath of [primary, fallback]) {
    try {
      const raw = await fs.readFile(filePath, "utf-8");
      return normalizeStore(JSON.parse(raw) as Partial<AppStoreData>);
    } catch {
      continue;
    }
  }
  return null;
}

async function writeFileStore(data: AppStoreData): Promise<void> {
  const payload = JSON.stringify(data, null, 2);
  const { primary, fallback } = storePaths();
  const targets = [primary, fallback];
  let lastError: unknown;
  for (const filePath of targets) {
    try {
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, payload, "utf-8");
      return;
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function readStore(): Promise<AppStoreData> {
  try {
    const rows = await sql<{ data: string }>(
      "select data from app_store where id = $1",
      [STORE_ROW_ID]
    );
    if (rows[0]?.data) {
      return normalizeStore(JSON.parse(rows[0].data) as Partial<AppStoreData>);
    }
  } catch (error) {
    console.error("Store read failed:", error);
    return (await readFileStore()) ?? createInitialStore();
  }

  const seeded = (await readFileStore()) ?? createInitialStore();
  await writeStore(seeded);
  return seeded;
}

export async function writeStore(data: AppStoreData): Promise<void> {
  const payload = JSON.stringify(data);
  let saved = false;
  try {
    await sql(
      "insert into app_store (id, data) values ($1, $2) on conflict (id) do update set data = excluded.data",
      [STORE_ROW_ID, payload]
    );
    saved = true;
  } catch (error) {
    console.error("Store database write failed:", error);
  }
  try {
    await writeFileStore(data);
  } catch (error) {
    console.error("Store file write failed:", error);
    if (!saved) throw error;
  }
}

export async function getAllVisualTemplates(): Promise<VisualTemplate[]> {
  const store = await readStore();
  return [...BUILT_IN_VISUAL_TEMPLATES, ...store.visualTemplates];
}

export async function saveVisualTemplate(
  template: VisualTemplate
): Promise<VisualTemplate> {
  const store = await readStore();
  const idx = store.visualTemplates.findIndex((t) => t.id === template.id);
  if (idx >= 0) {
    store.visualTemplates[idx] = template;
  } else {
    store.visualTemplates.unshift(template);
  }
  await writeStore(store);
  return template;
}

export async function deleteVisualTemplate(id: string): Promise<void> {
  const store = await readStore();
  store.visualTemplates = store.visualTemplates.filter((t) => t.id !== id);
  await writeStore(store);
}

export async function upsertDraft(draft: ContentDraft): Promise<ContentDraft> {
  const store = await readStore();
  const idx = store.drafts.findIndex((d) => d.id === draft.id);
  if (idx >= 0) {
    store.drafts[idx] = draft;
  } else {
    store.drafts.unshift(draft);
  }
  await writeStore(store);
  return draft;
}

export async function deleteDraft(id: string): Promise<void> {
  const store = await readStore();
  store.drafts = store.drafts.filter((d) => d.id !== id);
  await writeStore(store);
}

export async function updateBufferConnection(
  connection: BufferConnection
): Promise<BufferConnection> {
  const store = await readStore();
  store.bufferConnection = connection;
  await writeStore(store);
  return connection;
}

export async function addMockQueuePost(
  post: ScheduledPost
): Promise<ScheduledPost> {
  const store = await readStore();
  store.mockQueue.unshift(post);
  await writeStore(store);
  return post;
}

export async function upsertBrandPreset(
  preset: BrandVoicePreset
): Promise<BrandVoicePreset> {
  const store = await readStore();
  const idx = store.brandPresets.findIndex((p) => p.id === preset.id);
  if (idx >= 0) {
    store.brandPresets[idx] = preset;
  } else {
    store.brandPresets.unshift(preset);
  }
  await writeStore(store);
  return preset;
}
