import { promises as fs } from "fs";
import path from "path";
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
} from "./presets";

const DATA_DIR = path.join(process.cwd(), ".data");
const STORE_PATH = path.join(DATA_DIR, "store.json");

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

export async function readStore(): Promise<AppStoreData> {
  try {
    const raw = await fs.readFile(STORE_PATH, "utf-8");
    const parsed = JSON.parse(raw) as Partial<AppStoreData>;
    const initial = createInitialStore();
    return {
      drafts: parsed.drafts ?? initial.drafts,
      brandPresets:
        parsed.brandPresets && parsed.brandPresets.length > 0
          ? parsed.brandPresets
          : initial.brandPresets,
      visualTemplates: parsed.visualTemplates ?? [],
      bufferConnection: parsed.bufferConnection ?? initial.bufferConnection,
      mockQueue: parsed.mockQueue ?? initial.mockQueue,
    };
  } catch {
    return createInitialStore();
  }
}

export async function writeStore(data: AppStoreData): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
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
