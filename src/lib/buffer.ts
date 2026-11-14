import {
  addMockQueuePost,
  readStore,
  upsertDraft,
} from "./store";
import {
  BufferChannel,
  BufferScheduleMode,
  ContentFormat,
  ScheduledPost,
} from "./types";

const MOCK_CHANNELS: BufferChannel[] = [
  {
    id: "mock-ig-1",
    service: "instagram",
    formattedUsername: "@yourbrand.ig",
    timezone: "Asia/Hong_Kong",
    isMock: true,
  },
  {
    id: "mock-li-1",
    service: "linkedin",
    formattedUsername: "Your Brand (LinkedIn)",
    timezone: "Asia/Hong_Kong",
    isMock: true,
  },
];

export function isBufferOAuthConfigured(): boolean {
  return Boolean(
    process.env.BUFFER_CLIENT_ID && process.env.BUFFER_CLIENT_SECRET
  );
}

export async function getActiveBufferToken(): Promise<string | undefined> {
  const store = await readStore();
  if (
    (store.bufferConnection.mode === "oauth" ||
      store.bufferConnection.mode === "token") &&
    store.bufferConnection.accessToken
  ) {
    return store.bufferConnection.accessToken;
  }
  return process.env.BUFFER_ACCESS_TOKEN || undefined;
}

export async function listBufferChannels(): Promise<{
  channels: BufferChannel[];
  isMock: boolean;
}> {
  const store = await readStore();
  const token = await getActiveBufferToken();

  if (store.bufferConnection.mode === "disconnected" && !token) {
    return { channels: [], isMock: true };
  }

  if (token && store.bufferConnection.mode !== "demo") {
    try {
      const res = await fetch(
        `https://api.bufferapp.com/1/profiles.json?access_token=${encodeURIComponent(token)}`,
        { signal: AbortSignal.timeout(8000) }
      );
      if (res.ok) {
        const profiles = (await res.json()) as Array<{
          id: string;
          service: string;
          formatted_username?: string;
          service_username?: string;
          avatar?: string;
          timezone?: string;
        }>;
        const mapped: BufferChannel[] = profiles
          .filter(
            (p) => p.service === "instagram" || p.service === "linkedin"
          )
          .map((p) => ({
            id: p.id,
            service: p.service as "instagram" | "linkedin",
            formattedUsername:
              p.formatted_username || p.service_username || p.id,
            avatar: p.avatar,
            timezone: p.timezone || "UTC",
            isMock: false,
          }));
        if (mapped.length > 0) {
          return { channels: mapped, isMock: false };
        }
      }
    } catch {
      // Fall back to demo channels if live API is unreachable
    }
  }

  return { channels: MOCK_CHANNELS, isMock: true };
}

export async function listBufferPosts(): Promise<{
  posts: ScheduledPost[];
  isMock: boolean;
}> {
  const store = await readStore();
  const token = await getActiveBufferToken();

  if (token && store.bufferConnection.mode !== "demo") {
    try {
      const { channels, isMock } = await listBufferChannels();
      if (!isMock && channels.length > 0) {
        const allPosts: ScheduledPost[] = [];
        await Promise.all(
          channels.map(async (ch) => {
            const res = await fetch(
              `https://api.bufferapp.com/1/profiles/${encodeURIComponent(ch.id)}/updates/pending.json?access_token=${encodeURIComponent(token)}`,
              { signal: AbortSignal.timeout(8000) }
            );
            if (res.ok) {
              const data = (await res.json()) as {
                updates?: Array<{
                  id: string;
                  text?: string;
                  scheduled_at?: number;
                  created_at?: number;
                }>;
              };
              for (const u of data.updates || []) {
                allPosts.push({
                  id: u.id,
                  format:
                    ch.service === "linkedin" ? "li_carousel" : "ig_carousel",
                  channelId: ch.id,
                  channelName: ch.formattedUsername,
                  service: ch.service,
                  text: u.text || "",
                  mode: u.scheduled_at ? "customScheduled" : "addToQueue",
                  scheduledAt: u.scheduled_at
                    ? new Date(u.scheduled_at * 1000).toISOString()
                    : undefined,
                  status: "queued",
                  createdAt: u.created_at
                    ? new Date(u.created_at * 1000).toISOString()
                    : new Date().toISOString(),
                  isMock: false,
                });
              }
            }
          })
        );
        return { posts: allPosts, isMock: false };
      }
    } catch {
      // Fall back to local mock queue
    }
  }

  return { posts: store.mockQueue, isMock: true };
}

export async function scheduleBufferPost(params: {
  draftId?: string;
  format: ContentFormat;
  channelId: string;
  text: string;
  mode: BufferScheduleMode;
  scheduledAt?: string;
}): Promise<{ post: ScheduledPost; isMock: boolean }> {
  const store = await readStore();
  const token = await getActiveBufferToken();
  const { channels } = await listBufferChannels();
  const channel =
    channels.find((c) => c.id === params.channelId) || MOCK_CHANNELS[0];

  if (token && store.bufferConnection.mode !== "demo" && !channel.isMock) {
    try {
      const form = new URLSearchParams();
      form.append("access_token", token);
      form.append("profile_ids[]", params.channelId);
      form.append("text", params.text);
      if (params.mode === "shareNow") {
        form.append("now", "true");
      } else if (params.mode === "customScheduled" && params.scheduledAt) {
        form.append("scheduled_at", params.scheduledAt);
      }

      const res = await fetch(
        "https://api.bufferapp.com/1/updates/create.json",
        {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: form.toString(),
          signal: AbortSignal.timeout(8000),
        }
      );

      if (res.ok) {
        const created = (await res.json()) as {
          updates?: Array<{ id: string }>;
        };
        const post: ScheduledPost = {
          id: created.updates?.[0]?.id || `buf-${Date.now()}`,
          draftId: params.draftId,
          format: params.format,
          channelId: channel.id,
          channelName: channel.formattedUsername,
          service: channel.service,
          text: params.text,
          mode: params.mode,
          scheduledAt: params.scheduledAt,
          status:
            params.mode === "shareNow"
              ? "sent"
              : params.mode === "customScheduled"
                ? "scheduled"
                : "queued",
          createdAt: new Date().toISOString(),
          isMock: false,
        };

        if (params.draftId) {
          const draft = store.drafts.find((d) => d.id === params.draftId);
          if (draft) {
            await upsertDraft({
              ...draft,
              bufferStatus:
                params.mode === "shareNow"
                  ? "published"
                  : params.mode === "customScheduled"
                    ? "scheduled"
                    : "queued",
              updatedAt: new Date().toISOString(),
            });
          }
        }

        return { post, isMock: false };
      }
    } catch {
      // Fall back to local mock queue
    }
  }

  const mockPost: ScheduledPost = {
    id: `mock-post-${Date.now()}`,
    draftId: params.draftId,
    format: params.format,
    channelId: channel.id,
    channelName: channel.formattedUsername,
    service: channel.service,
    text: params.text,
    mode: params.mode,
    scheduledAt: params.scheduledAt,
    status:
      params.mode === "shareNow"
        ? "sent"
        : params.mode === "customScheduled"
          ? "scheduled"
          : "queued",
    createdAt: new Date().toISOString(),
    isMock: true,
  };

  await addMockQueuePost(mockPost);

  if (params.draftId) {
    const draft = store.drafts.find((d) => d.id === params.draftId);
    if (draft) {
      await upsertDraft({
        ...draft,
        bufferStatus:
          params.mode === "shareNow"
            ? "published"
            : params.mode === "customScheduled"
              ? "scheduled"
              : "queued",
        updatedAt: new Date().toISOString(),
      });
    }
  }

  return { post: mockPost, isMock: true };
}
