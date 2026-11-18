"use client";

import { useEffect, useState } from "react";
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
  normalizeSlideHex,
  SLIDE_SURFACE_PRESETS,
  surfacePatchForPreset,
  type SlideSurfacePresetId,
} from "@/lib/carousel-slide-theme";
import type { CarouselSlide, SlideSurface, VisualTemplate } from "@/lib/types";

interface SlideSurfaceControlsProps {
  slide: CarouselSlide;
  primaryColor: string;
  secondaryColor: string;
  template: VisualTemplate;
  isFirst: boolean;
  onChange: (patch: Pick<CarouselSlide, "surface" | "accentOverride">) => void;
  onCopyFromFirst: () => void;
  onApplyToAll: () => void;
}

const SURFACE_ITEMS = [
  { value: "inherit", label: "Inherit" },
  { value: "solid", label: "Solid" },
  { value: "gradient", label: "Gradient" },
];

function colorInputValue(color: string | undefined, fallback: string): string {
  const normalized = normalizeSlideHex(color) ?? normalizeSlideHex(fallback);
  return normalized ?? "#1a1918";
}

export function SlideSurfaceControls({
  slide,
  primaryColor,
  secondaryColor,
  template,
  isFirst,
  onChange,
  onCopyFromFirst,
  onApplyToAll,
}: SlideSurfaceControlsProps) {
  const kind = slide.surface?.kind ?? "inherit";
  const fallbackPrimary = primaryColor || template.accentColor;
  const fallbackSecondary = secondaryColor || template.surfaceColor;

  function setKind(nextKind: SlideSurface["kind"]) {
    if (nextKind === "inherit") {
      onChange({ surface: { kind: "inherit" }, accentOverride: slide.accentOverride });
      return;
    }
    if (nextKind === "solid") {
      const current =
        slide.surface?.kind === "solid" ? slide.surface.color : fallbackPrimary;
      onChange({
        surface: { kind: "solid", color: colorInputValue(current, fallbackPrimary) },
        accentOverride: slide.accentOverride,
      });
      return;
    }
    const stops =
      slide.surface?.kind === "gradient"
        ? slide.surface.stops
        : [
            { color: colorInputValue(fallbackPrimary, "#1a1918"), at: 0 },
            { color: colorInputValue(fallbackSecondary, "#f6f3ee"), at: 100 },
          ];
    onChange({
      surface: {
        kind: "gradient",
        angle: slide.surface?.kind === "gradient" ? slide.surface.angle ?? 165 : 165,
        stops,
      },
      accentOverride: slide.accentOverride,
    });
  }

  function setSolid(color: string) {
    const next = normalizeSlideHex(color);
    if (!next) return;
    onChange({
      surface: { kind: "solid", color: next },
      accentOverride: slide.accentOverride,
    });
  }

  function setStop(index: number, color: string) {
    if (slide.surface?.kind !== "gradient") return;
    const next = normalizeSlideHex(color);
    if (!next) return;
    const stops = slide.surface.stops.map((stop, stopIndex) =>
      stopIndex === index ? { ...stop, color: next } : stop
    );
    onChange({
      surface: { ...slide.surface, stops },
      accentOverride: slide.accentOverride,
    });
  }

  function setAngle(angle: number) {
    if (slide.surface?.kind !== "gradient") return;
    onChange({
      surface: { ...slide.surface, angle },
      accentOverride: slide.accentOverride,
    });
  }

  function setAccent(color: string) {
    if (!color.trim()) {
      onChange({
        surface: slide.surface ?? { kind: "inherit" },
        accentOverride: undefined,
      });
      return;
    }
    const next = normalizeSlideHex(color);
    if (!next) return;
    onChange({
      surface: slide.surface ?? { kind: "inherit" },
      accentOverride: next,
    });
  }

  return (
    <div className="space-y-2 rounded-md border bg-muted/20 p-3">
      <div className="space-y-1">
        <Label className="text-xs">Surface</Label>
        <Select
          items={SURFACE_ITEMS}
          value={kind}
          onValueChange={(value) => {
            if (value === "inherit" || value === "solid" || value === "gradient") {
              setKind(value);
            }
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SURFACE_ITEMS.map((item) => (
              <SelectItem key={item.value} value={item.value}>
                {item.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {kind === "solid" && slide.surface?.kind === "solid" && (
        <ColorField
          label="Background"
          value={slide.surface.color}
          onChange={setSolid}
        />
      )}

      {kind === "gradient" && slide.surface?.kind === "gradient" && (
        <div className="grid gap-2 sm:grid-cols-3">
          <ColorField
            label="Start"
            value={slide.surface.stops[0]?.color ?? fallbackPrimary}
            onChange={(color) => setStop(0, color)}
          />
          <ColorField
            label="End"
            value={slide.surface.stops[slide.surface.stops.length - 1]?.color ?? fallbackSecondary}
            onChange={(color) => setStop(slide.surface?.kind === "gradient" ? slide.surface.stops.length - 1 : 1, color)}
          />
          <div className="space-y-1">
            <Label className="text-xs">Angle</Label>
            <Input
              type="number"
              min={0}
              max={360}
              value={slide.surface.angle ?? 165}
              onChange={(event) => {
                const angle = Number(event.target.value);
                if (Number.isFinite(angle)) setAngle(angle);
              }}
            />
          </div>
        </div>
      )}

      <ColorField
        label="Accent"
        value={slide.accentOverride ?? ""}
        placeholder={EDWARD_PLACEHOLDER_ACCENT(fallbackSecondary)}
        onChange={setAccent}
      />

      <div className="flex flex-wrap gap-1.5">
        {SLIDE_SURFACE_PRESETS.map((preset) => (
          <Button
            key={preset.id}
            type="button"
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() =>
              onChange(
                surfacePatchForPreset(
                  preset.id as SlideSurfacePresetId,
                  primaryColor,
                  secondaryColor,
                  template
                )
              )
            }
          >
            {preset.label}
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          disabled={isFirst}
          onClick={onCopyFromFirst}
        >
          Copy from slide 1
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={onApplyToAll}
        >
          Apply to all slides
        </Button>
      </div>
    </div>
  );
}

function EDWARD_PLACEHOLDER_ACCENT(fallback: string): string {
  return normalizeSlideHex(fallback) ?? "#6ee7a0";
}

function ColorField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (color: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => {
    setDraft(value);
  }, [value]);
  const swatch = colorInputValue(draft || placeholder, "#1a1918");
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={label}
          value={swatch}
          onChange={(event) => {
            setDraft(event.target.value);
            onChange(event.target.value);
          }}
          className="h-9 w-10 cursor-pointer rounded-md border bg-background p-1"
        />
        <Input
          value={draft}
          placeholder={placeholder}
          spellCheck={false}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (!next.trim() || normalizeSlideHex(next)) onChange(next);
          }}
          className="h-9 font-mono text-xs"
        />
      </div>
    </div>
  );
}
