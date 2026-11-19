"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarClock, Loader2, Palette, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutPackList } from "@/components/studio/layout-pack-list";
import {
  ContentDraft,
  ScheduledPost,
  UserLayoutPack,
  VisualTemplate,
} from "@/lib/types";

export default function LibraryPage() {
  const [drafts, setDrafts] = useState<ContentDraft[]>([]);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [templates, setTemplates] = useState<VisualTemplate[]>([]);
  const [layoutPacks, setLayoutPacks] = useState<UserLayoutPack[]>([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [dRes, pRes, tRes, packRes] = await Promise.all([
        fetch("/api/drafts"),
        fetch("/api/buffer/posts"),
        fetch("/api/templates"),
        fetch("/api/layout-packs"),
      ]);
      if (dRes.ok) {
        const d = await dRes.json();
        setDrafts(d.drafts || []);
      }
      if (pRes.ok) {
        const p = await pRes.json();
        setPosts(p.posts || []);
      }
      if (tRes.ok) {
        const t = await tRes.json();
        setTemplates(
          (t.templates || []).filter((tpl: VisualTemplate) => !tpl.isBuiltIn)
        );
      }
      if (packRes.ok) {
        const packs = await packRes.json();
        setLayoutPacks(packs.packs || []);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function removeDraft(id: string) {
    await fetch(`/api/drafts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setDrafts((prev) => prev.filter((d) => d.id !== id));
  }

  async function removeTemplate(id: string) {
    await fetch(`/api/templates?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content Library</h1>
          <p className="text-sm text-muted-foreground">
            Saved drafts, Buffer queue, visual templates, and layout packs.
          </p>
        </div>
        <Link href="/">
          <Button className="gap-1.5">
            <Sparkles className="h-4 w-4" />
            New Repurpose
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-sm text-muted-foreground gap-2">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading library...
        </div>
      ) : (
        <Tabs defaultValue="drafts">
          <TabsList>
            <TabsTrigger value="drafts">
              Saved Drafts ({drafts.length})
            </TabsTrigger>
            <TabsTrigger value="queue">
              Buffer Queue ({posts.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              Saved Templates ({templates.length})
            </TabsTrigger>
            <TabsTrigger value="packs">
              My layout packs ({layoutPacks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="drafts" className="pt-4">
            {drafts.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center space-y-2">
                  <p className="text-sm font-medium">No saved drafts yet</p>
                  <p className="text-xs text-muted-foreground">
                    Generate content in the Studio and click Save Draft to store
                    it here.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {drafts.map((draft) => (
                  <Card key={draft.id}>
                    <CardHeader className="pb-2 flex flex-row items-start justify-between gap-2">
                      <div>
                        <CardTitle className="text-base">
                          {draft.title}
                        </CardTitle>
                        <CardDescription className="text-xs">
                          {draft.idea.angleType} • Updated{" "}
                          {new Date(draft.updatedAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeDraft(draft.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {draft.sourcePost.rawText}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {draft.reel && <Badge variant="secondary">Reel</Badge>}
                        {draft.igCarousel && (
                          <Badge variant="secondary">
                            IG Carousel ({draft.igCarousel.slides.length})
                          </Badge>
                        )}
                        {draft.liCarousel && (
                          <Badge variant="secondary">
                            LI Carousel ({draft.liCarousel.slides.length})
                          </Badge>
                        )}
                        {draft.bufferStatus && (
                          <Badge variant="outline">{draft.bufferStatus}</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="queue" className="pt-4 space-y-3">
            {posts.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center text-sm text-muted-foreground">
                  No posts queued in Buffer yet.
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Card key={post.id}>
                  <CardContent className="pt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{post.channelName}</Badge>
                        <Badge variant="outline">{post.status}</Badge>
                        {post.isMock && (
                          <Badge variant="outline">Demo Workspace</Badge>
                        )}
                      </div>
                      <p className="text-sm line-clamp-2">{post.text}</p>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
                      <CalendarClock className="h-3.5 w-3.5" />
                      {post.scheduledAt
                        ? new Date(post.scheduledAt).toLocaleString()
                        : new Date(post.createdAt).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="templates" className="pt-4">
            {templates.length === 0 ? (
              <Card>
                <CardContent className="py-10 text-center space-y-2">
                  <Palette className="h-6 w-6 mx-auto text-muted-foreground" />
                  <p className="text-sm font-medium">
                    No custom saved templates yet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Upload an image or import a template URL in the Carousel
                    Editor to save reusable visual styles.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((tpl) => (
                  <Card key={tpl.id}>
                    <CardHeader className="pb-2 flex flex-row items-start justify-between">
                      <div>
                        <CardTitle className="text-sm">{tpl.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {tpl.fontStyle} • {tpl.layoutMood}
                        </CardDescription>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTemplate(tpl.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex gap-1.5">
                        {[
                          tpl.backgroundColor,
                          tpl.surfaceColor,
                          tpl.textColor,
                          tpl.accentColor,
                        ].map((hex, i) => (
                          <div
                            key={`${tpl.id}-c-${i}`}
                            className="h-6 w-6 rounded border"
                            style={{ backgroundColor: hex }}
                            title={hex}
                          />
                        ))}
                      </div>
                      {tpl.sourceUrl && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          Source: {tpl.sourceUrl}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
          <TabsContent value="packs" className="pt-4">
            <LayoutPackList packs={layoutPacks} onChange={setLayoutPacks} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
