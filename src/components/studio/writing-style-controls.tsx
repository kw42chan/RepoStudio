"use client";

import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { WRITING_STYLES } from "@/lib/presets";
import { WritingStyleConfig, WritingStyleId } from "@/lib/types";

interface WritingStyleControlsProps {
  value: WritingStyleConfig;
  onChange: (next: WritingStyleConfig) => void;
  onRegenerate?: () => void;
  regenerating?: boolean;
  compact?: boolean;
}

export function WritingStyleControls({
  value,
  onChange,
  onRegenerate,
  regenerating,
  compact = false,
}: WritingStyleControlsProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-[200px] flex-1 space-y-1">
          <Label className="text-xs">Writing Style</Label>
          <Select
            value={value.styleId}
            onValueChange={(v) =>
              onChange({ ...value, styleId: v as WritingStyleId })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {WRITING_STYLES.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="min-w-[180px] flex-1 space-y-1">
          <Label className="text-xs">Optional Custom Tone</Label>
          <Input
            placeholder="e.g. Sharp, witty, executive, calm"
            value={value.customTone || ""}
            onChange={(e) =>
              onChange({ ...value, customTone: e.target.value })
            }
          />
        </div>

        {onRegenerate && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onRegenerate}
            disabled={regenerating}
            className="gap-1.5"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${regenerating ? "animate-spin" : ""}`}
            />
            {regenerating ? "Regenerating..." : "Apply Style"}
          </Button>
        )}
      </div>

      {(!compact || value.styleId === "custom" || value.customStyle) && (
        <div className="space-y-1">
          <Label className="text-xs">Optional Custom Writing Style</Label>
          <Input
            placeholder="e.g. Short punchy sentences, data-first, no emojis, end with a question"
            value={value.customStyle || ""}
            onChange={(e) =>
              onChange({ ...value, customStyle: e.target.value })
            }
          />
        </div>
      )}
    </div>
  );
}
