"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  applyGraphicsStyleToSlide,
  getGraphicsStyle,
  listGraphicsStylesForPlatform,
  resetSlideGraphicsStyle,
  type GraphicsStyle,
} from "@/lib/carousel-templates";
import type { CarouselContent, CarouselSlide } from "@/lib/types";

interface GraphicsStylePickerProps {
  platform: CarouselContent["platform"];
  slide: CarouselSlide;
  slideIndex: number;
  totalSlides: number;
  layoutPackId?: string;
  onApply: (next: CarouselSlide) => void;
}

function stylesForSlide(
  platform: CarouselContent["platform"],
  templateId: string | undefined
): GraphicsStyle[] {
  const listed = listGraphicsStylesForPlatform(platform);
  if (!templateId || listed.some((style) => style.templateId === templateId)) {
    return listed;
  }
  const current = getGraphicsStyle(templateId);
  return current ? [current, ...listed] : listed;
}

export function GraphicsStylePicker({
  platform,
  slide,
  slideIndex,
  totalSlides,
  layoutPackId,
  onApply,
}: GraphicsStylePickerProps) {
  const styles = stylesForSlide(platform, slide.templateId);
  const current =
    styles.find((style) => style.templateId === slide.templateId) ??
    (slide.templateId ? getGraphicsStyle(slide.templateId) : undefined);
  const groups: Array<{ id: string; label: string; styles: GraphicsStyle[] }> =
    [];
  for (const style of styles) {
    const group = groups.find((entry) => entry.id === style.groupId);
    if (group) {
      group.styles.push(style);
    } else {
      groups.push({
        id: style.groupId,
        label: style.groupLabel,
        styles: [style],
      });
    }
  }

  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <Label className="text-xs">Graphics style</Label>
        <Select
          items={styles.map((style) => ({
            value: style.templateId,
            label: style.pickerLabel,
          }))}
          value={slide.templateId ?? null}
          onValueChange={(value) => {
            if (typeof value !== "string" || value === slide.templateId) return;
            onApply(applyGraphicsStyleToSlide(slide, value));
          }}
        >
          <SelectTrigger className="h-9 w-full">
            <SelectValue placeholder="Choose a graphics style" />
          </SelectTrigger>
          <SelectContent align="start" className="max-h-80">
            {groups.map((group) => (
              <SelectGroup key={group.id}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.styles.map((style) => (
                  <SelectItem key={style.templateId} value={style.templateId}>
                    {style.pickerLabel}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
          </SelectContent>
        </Select>
      </div>

      {current && (
        <div className="flex gap-2 rounded-md border bg-muted/30 p-2">
          {current.thumbnailPath ? (
            <img
              src={current.thumbnailPath}
              alt=""
              className="h-14 w-11 shrink-0 rounded-sm border object-cover"
            />
          ) : (
            <div className="flex h-14 w-11 shrink-0 items-center justify-center rounded-sm border bg-background text-[10px] text-muted-foreground">
              Aa
            </div>
          )}
          <p className="text-xs leading-snug text-muted-foreground">
            {current.description}
          </p>
        </div>
      )}

      {layoutPackId ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            onApply(
              resetSlideGraphicsStyle(slide, {
                platform,
                totalSlides,
                slideIndex,
                layoutPackId,
              })
            )
          }
        >
          Reset slide to pack default
        </Button>
      ) : null}
    </div>
  );
}
