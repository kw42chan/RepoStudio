"use client";

import { useState } from "react";
import { Check, Copy, Plus, Send, Trash2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  onOpenSchedule: (text: string) => void;
}

export function ReelEditor({
  reel,
  onChange,
  onRegenerateStyle,
  regenerating,
  onOpenSchedule,
}: ReelEditorProps) {
  const [copied, setCopied] = useState(false);

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
            onClick={() => onOpenSchedule(fullCaption)}
            className="gap-1.5"
          >
            <Send className="h-3.5 w-3.5" />
            Schedule to Buffer
          </Button>
        </div>
      </div>

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
