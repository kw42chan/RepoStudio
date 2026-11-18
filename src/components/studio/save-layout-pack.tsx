"use client";

import { useState } from "react";
import { BookmarkPlus, Loader2 } from "lucide-react";
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
import {
  carouselTemplateManifest,
  previewCarouselTemplateId,
} from "@/lib/carousel-templates";
import type { CarouselContent, UserLayoutPack } from "@/lib/types";

interface SaveLayoutPackProps {
  carousel: CarouselContent;
  onSaved: (pack: UserLayoutPack) => void;
}

export function SaveLayoutPack({ carousel, onSaved }: SaveLayoutPackProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [platform, setPlatform] = useState(carousel.platform);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name this pack so you can find it in Step 2.");
      return;
    }
    setSaving(true);
    setError("");
    const pack: UserLayoutPack = {
      id: crypto.randomUUID(),
      name: trimmed,
      platform,
      slideTemplateIds: carousel.slides.map((slide) =>
        previewCarouselTemplateId(slide)
      ),
      slideRoles: carousel.slides.map((slide) => slide.role),
      createdAt: new Date().toISOString(),
      catalogVersion: carouselTemplateManifest.version,
      basedOnPackId: carousel.layoutPackId,
    };
    try {
      const res = await fetch("/api/layout-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not save this pack.");
        return;
      }
      onSaved(data.pack as UserLayoutPack);
      setName("");
      setOpen(false);
    } catch {
      setError("Could not save this pack.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={() => {
          setPlatform(carousel.platform);
          setOpen(true);
        }}
      >
        <BookmarkPlus className="h-3.5 w-3.5" />
        Save current slide sequence as pack…
      </Button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border bg-muted/30 p-3">
      <p className="text-xs font-medium">Save current slide sequence as pack</p>
      <div className="grid gap-2 sm:grid-cols-[1fr_160px_auto]">
        <div className="space-y-1">
          <Label className="text-xs">Name</Label>
          <Input
            value={name}
            placeholder="Edward tips, 7 slides"
            onChange={(event) => setName(event.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Platform</Label>
          <Select
            value={platform}
            items={[
              { value: "instagram", label: "Instagram" },
              { value: "linkedin", label: "LinkedIn" },
            ]}
            onValueChange={(value) => {
              if (value === "instagram" || value === "linkedin") {
                setPlatform(value);
              }
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end gap-2">
          <Button type="button" size="sm" disabled={saving} onClick={save}>
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Save"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        </div>
      </div>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
