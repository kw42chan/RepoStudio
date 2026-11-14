"use client";

import { useState } from "react";
import {
  Check,
  Copy,
  Film,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ReelBeat, ReelContent, WritingStyleConfig } from "@/lib/types";
import { WritingStyleControls } from "./writing-style-controls";

interface ReelEditorProps {
  reel: ReelContent;
  onChange: (next: ReelContent) => void;
  onRegenerateStyle: (style: WritingStyleConfig) => void;
  regenerating?: boolean;
  onOpenSchedule: (
    text: string,
    mediaUrl?: string,
    mediaFileName?: string
  ) => void;
}

export function ReelEditor({
  reel,
  onChange,
  onRegenerateStyle,
  regenerating,
  onOpenSchedule,
}: ReelEditorProps) {
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Video upload failed");
      }
      onChange({
        ...reel,
        videoUrl: data.url,
        videoFileName: data.fileName,
        videoSizeBytes: data.sizeBytes,
      });
    } catch (err) {
      setUploadError(
        err instanceof Error ? err.message : "Failed to upload video"
      );
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  function updateBeat(id: string, patch: Partial<ReelBeat>) {
    onChange({
      ...reel,
      beats: reel.beats.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    });
  }

  function addBeat() {
    onChange({
      ...reel,
      beats: [
        ...reel.beats,
        {
          id: `beat-${Date.now()}`,
          timeframe: "Next 5s",
          spokenLine: "",
          onScreenText: "",
          visualCue: "",
        },
      ],
    });
  }

  function removeBeat(id: string) {
    if (reel.beats.length <= 1) return;
    onChange({
      ...reel,
      beats: reel.beats.filter((b) => b.id !== id),
    });
  }

  const fullCaption = `${reel.caption}\n\n${reel.hashtags.join(" ")}`.trim();

  async function copyScript() {
    const scriptText = [
      `HOOK (0-3s): ${reel.hook}`,
      "",
      ...reel.beats.map(
        (b, i) =>
          `[${b.timeframe}] Beat ${i + 1}\nSay: ${b.spokenLine}\nOn-screen: ${b.onScreenText}\nVisual: ${b.visualCue}`
      ),
      "",
      `CAPTION:\n${fullCaption}`,
    ].join("\n");

    await navigator.clipboard.writeText(scriptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="space-y-4">
      <WritingStyleControls
        value={reel.writingStyle}
        onChange={(writingStyle) => onChange({ ...reel, writingStyle })}
        onRegenerate={() => onRegenerateStyle(reel.writingStyle)}
        regenerating={regenerating}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Instagram Reel Script</span>
          <Badge variant="secondary">{reel.estimatedDuration}</Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copyScript}
            className="gap-1.5"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
            {copied ? "Copied Script" : "Copy Script"}
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() =>
              onOpenSchedule(fullCaption, reel.videoUrl, reel.videoFileName)
            }
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            {reel.videoUrl ? "Schedule Reel Video to Buffer" : "Schedule to Buffer"}
          </Button>
        </div>
      </div>

      {/* Upload Finished Reel Video */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-sm flex items-center gap-2">
                <Film className="h-4 w-4 text-primary" />
                Upload Edited Reel Video
              </CardTitle>
              <CardDescription className="text-xs">
                Record & edit your Reel externally using the script below, then
                upload the finished MP4/MOV/WebM here to schedule it with
                Buffer.
              </CardDescription>
            </div>
            {reel.videoFileName && (
              <Badge variant="secondary" className="shrink-0">
                Ready for Buffer
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {reel.videoUrl ? (
            <div className="grid gap-4 sm:grid-cols-[220px_1fr] items-center">
              <video
                src={reel.videoUrl}
                controls
                className="w-full max-h-64 rounded-lg border bg-black object-contain"
              />
              <div className="space-y-2">
                <p className="text-sm font-medium break-all">
                  {reel.videoFileName}
                </p>
                {reel.videoSizeBytes && (
                  <p className="text-xs text-muted-foreground">
                    {(reel.videoSizeBytes / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-muted">
                    <Upload className="h-3.5 w-3.5" />
                    Replace Video
                    <input
                      type="file"
                      accept="video/mp4,video/quicktime,video/webm"
                      className="hidden"
                      onChange={handleVideoUpload}
                      disabled={uploading}
                    />
                  </label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      onChange({
                        ...reel,
                        videoUrl: undefined,
                        videoFileName: undefined,
                        videoSizeBytes: undefined,
                      })
                    }
                    className="text-xs text-muted-foreground hover:text-destructive"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed p-6 text-center cursor-pointer hover:bg-muted/30 transition-colors">
              {uploading ? (
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              ) : (
                <Upload className="h-6 w-6 text-muted-foreground" />
              )}
              <div className="space-y-0.5">
                <p className="text-sm font-medium">
                  {uploading
                    ? "Uploading Reel video..."
                    : "Click to upload your edited Reel video"}
                </p>
                <p className="text-xs text-muted-foreground">
                  MP4, MOV, or WebM (up to 100 MB)
                </p>
              </div>
              <input
                type="file"
                accept="video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleVideoUpload}
                disabled={uploading}
              />
            </label>
          )}

          {uploadError && (
            <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {uploadError}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">0–3s Opening Hook</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={2}
            value={reel.hook}
            onChange={(e) => onChange({ ...reel, hook: e.target.value })}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Scene-by-Scene Beats</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addBeat}
            className="gap-1"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Beat
          </Button>
        </div>

        {reel.beats.map((beat, idx) => (
          <Card key={beat.id}>
            <CardContent className="pt-4 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Beat {idx + 1}</Badge>
                  <Input
                    className="h-7 w-32 text-xs"
                    value={beat.timeframe}
                    onChange={(e) =>
                      updateBeat(beat.id, { timeframe: e.target.value })
                    }
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeBeat(beat.id)}
                  disabled={reel.beats.length <= 1}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Spoken Line
                  </Label>
                  <Textarea
                    rows={2}
                    value={beat.spokenLine}
                    onChange={(e) =>
                      updateBeat(beat.id, { spokenLine: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      On-Screen Text Overlay
                    </Label>
                    <Input
                      value={beat.onScreenText}
                      onChange={(e) =>
                        updateBeat(beat.id, { onScreenText: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">
                      Visual / B-Roll Cue
                    </Label>
                    <Input
                      value={beat.visualCue}
                      onChange={(e) =>
                        updateBeat(beat.id, { visualCue: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Caption & Hashtags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            rows={4}
            value={reel.caption}
            onChange={(e) => onChange({ ...reel, caption: e.target.value })}
          />
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">
              Hashtags (space-separated)
            </Label>
            <Input
              value={reel.hashtags.join(" ")}
              onChange={(e) =>
                onChange({
                  ...reel,
                  hashtags: e.target.value
                    .split(/\s+/)
                    .map((t) => t.trim())
                    .filter(Boolean),
                })
              }
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
