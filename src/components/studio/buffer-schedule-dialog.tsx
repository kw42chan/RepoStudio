"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  BufferChannel,
  BufferScheduleMode,
  ContentFormat,
  ScheduledPost,
} from "@/lib/types";

interface BufferScheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  format: ContentFormat;
  defaultText: string;
  draftId?: string;
  onScheduled?: (post: ScheduledPost) => void;
}

export function BufferScheduleDialog({
  open,
  onOpenChange,
  format,
  defaultText,
  draftId,
  onScheduled,
}: BufferScheduleDialogProps) {
  const [channels, setChannels] = useState<BufferChannel[]>([]);
  const [oauthConfigured, setOauthConfigured] = useState(false);
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [channelId, setChannelId] = useState("");
  const [mode, setMode] = useState<BufferScheduleMode>("addToQueue");
  const [scheduledAt, setScheduledAt] = useState("");
  const [text, setText] = useState(defaultText);
  const [result, setResult] = useState<ScheduledPost | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setText(defaultText);
    setResult(null);
    setError(null);
  }, [defaultText, open]);

  async function loadChannels() {
    setLoading(true);
    try {
      const [statusRes, chRes] = await Promise.all([
        fetch("/api/buffer/status"),
        fetch("/api/buffer/channels"),
      ]);
      if (statusRes.ok) {
        const s = await statusRes.json();
        setOauthConfigured(Boolean(s.oauthConfigured));
      }
      if (chRes.ok) {
        const data = (await chRes.json()) as { channels: BufferChannel[] };
        setChannels(data.channels);
        const preferredService =
          format === "li_carousel" ? "linkedin" : "instagram";
        const match =
          data.channels.find((c) => c.service === preferredService) ||
          data.channels[0];
        if (match) setChannelId(match.id);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) {
      loadChannels();
    }
  }, [open]);

  async function handleOneClickConnect() {
    if (oauthConfigured) {
      window.location.href = "/api/buffer/oauth/start";
      return;
    }
    setConnecting(true);
    try {
      await fetch("/api/buffer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo" }),
      });
      await loadChannels();
    } finally {
      setConnecting(false);
    }
  }

  async function handleSubmit() {
    if (!channelId) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/buffer/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          draftId,
          format,
          channelId,
          text,
          mode,
          scheduledAt: mode === "customScheduled" ? scheduledAt : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to schedule post");
      }
      setResult(data.post);
      onScheduled?.(data.post);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to schedule post");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule to Buffer</DialogTitle>
          <DialogDescription>
            Send your repurposed caption and post details directly to your
            Buffer queue.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Checking Buffer channels...
          </div>
        ) : channels.length === 0 ? (
          <div className="rounded-lg border p-5 text-center space-y-3">
            <p className="text-sm font-medium">
              Buffer is not connected yet
            </p>
            <p className="text-xs text-muted-foreground">
              Connect in one click—no manual API key copying needed.
            </p>
            <Button
              onClick={handleOneClickConnect}
              disabled={connecting}
              className="gap-2"
            >
              <PlugZap className="h-4 w-4" />
              {connecting
                ? "Connecting..."
                : oauthConfigured
                  ? "Connect with Buffer"
                  : "One-Click Connect Buffer"}
            </Button>
          </div>
        ) : result ? (
          <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-medium text-sm">
              <CheckCircle2 className="h-4 w-4" />
              Scheduled to {result.channelName}
              {result.isMock && (
                <Badge variant="outline" className="ml-auto text-[11px]">
                  Demo Workspace
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Status: <span className="font-medium">{result.status}</span>
              {result.scheduledAt
                ? ` • ${new Date(result.scheduledAt).toLocaleString()}`
                : ""}
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Done
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Buffer Channel</Label>
              <Select value={channelId} onValueChange={(v) => v && setChannelId(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {channels.map((ch) => (
                    <SelectItem key={ch.id} value={ch.id}>
                      {ch.formattedUsername} ({ch.service})
                      {ch.isMock ? " [Demo]" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Delivery Mode</Label>
                <Select
                  value={mode}
                  onValueChange={(v) => setMode(v as BufferScheduleMode)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="addToQueue">Add to Queue</SelectItem>
                    <SelectItem value="shareNow">Share Now</SelectItem>
                    <SelectItem value="customScheduled">
                      Custom Date & Time
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {mode === "customScheduled" && (
                <div className="space-y-1.5">
                  <Label>Scheduled Time</Label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Post Caption / Copy</Label>
              <Textarea
                rows={5}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>

            {format !== "reel" && (
              <p className="text-xs text-muted-foreground">
                Tip: Export your 1080×1350 slides as PNGs (Instagram) or PDF
                (LinkedIn) from the studio to attach them to this Buffer post.
              </p>
            )}

            {error && (
              <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                {error}
              </p>
            )}

            <Button
              className="w-full gap-2"
              onClick={handleSubmit}
              disabled={submitting || !text.trim()}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {submitting ? "Sending to Buffer..." : "Confirm & Schedule"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
