"use client";

import Link from "next/link";
import { applyDeckCommand, activeSlideIndex, MIN_SLIDES, MAX_SLIDES, type DeckCommand } from "@/lib/carousel-deck-operations";
import { useRef, useState, useEffect } from "react";
import {
  Download,
  FileText,
  ImagePlus,
  Loader2,
  Plus,
  Save,
  Send,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  AspectRatio,
  CarouselContent,
  CarouselSlide,
  SlideImageAsset,
  UserLayoutPack,
  VisualTemplate,
  WritingStyleConfig,
} from "@/lib/types";
import { exportSlidesAsPdf, exportSlidesAsPng } from "@/lib/export-carousel";
import { CarouselPreview } from "./carousel-preview";
import { GraphicsStylePicker } from "./graphics-style-picker";
import { SlideSurfaceControls } from "./slide-surface-controls";
import { SaveLayoutPack } from "./save-layout-pack";
import { WritingStyleControls } from "./writing-style-controls";
import { SlideMediaControls } from "./slide-media-controls";
import { mediaWarnings } from "@/lib/carousel-slide-media";
import { patternContentWarnings } from "@/lib/carousel-pattern-registry";
import { PatternContentControls } from "./pattern-content-controls";

interface CarouselEditorProps {
  initialImageAssets?: SlideImageAsset[];
  carousel: CarouselContent;
  templates: VisualTemplate[];
  primaryColor: string;
  secondaryColor: string;
  onChange: (next: CarouselContent) => void;
  onRegenerateStyle: (style: WritingStyleConfig) => void;
  regenerating?: boolean;
  onOpenTemplateImporter: () => void;
  onSaveAsNewTemplate: (template: VisualTemplate) => Promise<void>;
  onOpenSchedule: (text: string) => void;
  userLayoutPacks?: UserLayoutPack[];
  onLayoutPackSaved?: (pack: UserLayoutPack) => void;
  /** Step 2 selection. Reset uses this pack, not only the id stamped at generate time. */
  layoutPackId?: string;
}

export function CarouselEditor({
  initialImageAssets = [],
  carousel,
  templates,
  primaryColor,
  secondaryColor,
  onChange,
  onRegenerateStyle,
  regenerating,
  onOpenTemplateImporter,
  onSaveAsNewTemplate,
  onOpenSchedule,
  userLayoutPacks,
  onLayoutPackSaved,
  layoutPackId,
}: CarouselEditorProps) {
  const [assets, setAssets] = useState<SlideImageAsset[]>(initialImageAssets);
  const [exportError, setExportError] = useState("");
  useEffect(() => { let cancelled = false; fetch("/api/image-assets").then(r => r.ok ? r.json() : null).then(data => { if (data && !cancelled) setAssets(current => [...new Map([...current, ...data.assets].map(a => [a.id,a])).values()]); }).catch(() => undefined); return () => { cancelled = true; }; }, []);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [customVisualStyle, setCustomVisualStyle] = useState("");
  const [customVisualTone, setCustomVisualTone] = useState("");
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  const activeTemplate =
    templates.find((t) => t.id === carousel.visualTemplateId) || templates[0];
  const effectiveAccent = primaryColor;

  const activeSlide =
    carousel.slides[activeSlideIdx] || carousel.slides[0];

  function updateSlide(id: string, patch: Partial<CarouselSlide>) {
    onChange({
      ...carousel,
      slides: carousel.slides.map((s) =>
        s.id === id ? { ...s, ...patch } : s
      ),
    });
  }

  function runDeckCommand(command: DeckCommand, focusId?: string) {
    const next = applyDeckCommand(carousel, command);
    onChange(next);
    setActiveSlideIdx(activeSlideIndex(carousel, next, focusId ?? activeSlide.id));
  }

  function addSlide() {
    const id = crypto.randomUUID();
    const afterId = activeSlideIdx === carousel.slides.length - 1 && activeSlide.role === "cta" ? carousel.slides[Math.max(0, activeSlideIdx - 1)].id : activeSlide.id;
    runDeckCommand({ type: "add", afterId, slide: {
      id, slideNumber: 1, role: "body", headline: "New takeaway",
      body: "Add concise supporting copy here.", visualDirection: "Clean single-column layout",
      templateId: carousel.platform === "instagram" && (!carousel.layoutPackId || carousel.layoutPackId === "default") ? "hook-scroll-cover" : "body-narrative-default",
    } }, id);
  }

  function removeSlide(id: string) { runDeckCommand({ type: "delete", id }); }

  async function handleExport(type: "png" | "pdf") {
    const problems = carousel.slides.flatMap(s => [...patternContentWarnings(s), ...mediaWarnings(s, assets)]);
    if (problems.length) { setExportError(problems[0]); return; }
    setExportError("");
    const els = exportRefs.current
      .slice(0, carousel.slides.length)
      .filter((el): el is HTMLDivElement => Boolean(el));
    if (els.length === 0) return;

    setExporting(type);
    try {
      const slug = `${carousel.platform}-carousel`;
      if (type === "png") {
        await exportSlidesAsPng(els, slug, carousel.aspectRatio);
      } else {
        await exportSlidesAsPdf(els, slug, carousel.aspectRatio);
      }
    } catch (e) { setExportError(e instanceof Error ? e.message : "Could not export slides."); } finally {
      setExporting(null);
    }
  }

  async function handleSaveCurrentAsTemplate() {
    if (!activeTemplate) return;
    setSavingTemplate(true);
    try {
      const tpl: VisualTemplate = {
        ...activeTemplate,
        id: `tpl-${Date.now()}`,
        name:
          newTemplateName.trim() ||
          `${activeTemplate.name} (Custom)`,
        isBuiltIn: false,
        accentColor: effectiveAccent,
        customStyleNotes: customVisualStyle.trim() || activeTemplate.customStyleNotes,
        customToneNotes: customVisualTone.trim() || activeTemplate.customToneNotes,
        createdAt: new Date().toISOString(),
      };
      await onSaveAsNewTemplate(tpl);
      onChange({ ...carousel, visualTemplateId: tpl.id });
      setNewTemplateName("");
    } finally {
      setSavingTemplate(false);
    }
  }

  const fullCaption =
    `${carousel.caption}\n\n${carousel.hashtags.join(" ")}`.trim();

  return (
    <div className="space-y-4">
      <WritingStyleControls
        value={carousel.writingStyle}
        onChange={(writingStyle) => onChange({ ...carousel, writingStyle })}
        onRegenerate={() => onRegenerateStyle(carousel.writingStyle)}
        regenerating={regenerating}
      />

      {/* Visual Style, Template Import & Export Bar */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex flex-wrap items-end gap-3">
            <div className="min-w-[210px] flex-1 space-y-1">
              <Label className="text-xs">Visual Template</Label>
              <Select
                value={carousel.visualTemplateId}
                onValueChange={(v) =>
                  v &&
                  onChange({
                    ...carousel,
                    visualTemplateId: v,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                      {!t.isBuiltIn ? " (Saved)" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[155px] space-y-1">
              <Label className="text-xs">Aspect Ratio</Label>
              <Select
                value={carousel.aspectRatio}
                onValueChange={(v) =>
                  onChange({ ...carousel, aspectRatio: v as AspectRatio })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="4:5">1080 × 1350 (4:5)</SelectItem>
                  <SelectItem value="1:1">1080 × 1080 (1:1)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Primary</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2">
                <span
                  className="h-5 w-5 rounded-sm"
                  style={{ backgroundColor: primaryColor }}
                />
                <span className="text-xs">{primaryColor}</span>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Secondary</Label>
              <div className="flex h-9 items-center gap-2 rounded-md border bg-background px-2">
                <span
                  className="h-5 w-5 rounded-sm"
                  style={{ backgroundColor: secondaryColor }}
                />
                <span className="text-xs">{secondaryColor}</span>
              </div>
            </div>

            <div className="min-w-[140px] flex-1 space-y-1">
              <Label className="text-xs">Brand Handle</Label>
              <Input
                value={carousel.brandHandle}
                onChange={(e) =>
                  onChange({ ...carousel, brandHandle: e.target.value })
                }
              />
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onOpenTemplateImporter}
              className="gap-1.5"
            >
              <ImagePlus className="h-4 w-4" />
              Import / Upload Template
            </Button>
          </div>

          <p className="text-sm">
            This template sets the type and layout. Primary and secondary
            colors come from the{" "}
            <Link href="/settings" className="underline">
              brand guidelines
            </Link>
            .
          </p>

          {/* Optional Custom Visual Style & Tone + Save as New Template */}
          <div className="grid gap-2 sm:grid-cols-3 pt-1">
            <Input
              placeholder="Optional custom visual style note..."
              value={customVisualStyle}
              onChange={(e) => setCustomVisualStyle(e.target.value)}
            />
            <Input
              placeholder="Optional custom visual tone note..."
              value={customVisualTone}
              onChange={(e) => setCustomVisualTone(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="New template name..."
                value={newTemplateName}
                onChange={(e) => setNewTemplateName(e.target.value)}
              />
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleSaveCurrentAsTemplate}
                disabled={savingTemplate}
                className="shrink-0 gap-1"
              >
                <Save className="h-3.5 w-3.5" />
                Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {exportError && <p role="alert" className="text-sm text-destructive">{exportError}</p>}
      {/* Main Split: Slide Editor + Live 1080x1350 Preview */}
      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {carousel.platform === "linkedin"
                  ? "LinkedIn Carousel"
                  : "Instagram Carousel"}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {carousel.slides.length} slides
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={carousel.slides.length >= MAX_SLIDES}
                onClick={addSlide}
                className="gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Slide
              </Button>
              <Button type="button" variant="outline" size="sm" disabled={activeSlideIdx === 0} onClick={() => runDeckCommand({ type: "move", id: activeSlide.id, toIndex: activeSlideIdx - 1 })}>Move left</Button>
              <Button type="button" variant="outline" size="sm" disabled={activeSlideIdx >= carousel.slides.length - 1} onClick={() => runDeckCommand({ type: "move", id: activeSlide.id, toIndex: activeSlideIdx + 1 })}>Move right</Button>
              <Button type="button" variant="outline" size="sm" disabled={carousel.slides.length >= MAX_SLIDES} onClick={() => { const newId = crypto.randomUUID(); runDeckCommand({ type: "duplicate", id: activeSlide.id, newId }, newId); }}>Duplicate slide</Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(exporting)}
                onClick={() => handleExport("png")}
                className="gap-1.5"
              >
                {exporting === "png" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                Export PNGs
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={Boolean(exporting)}
                onClick={() => handleExport("pdf")}
                className="gap-1.5"
              >
                {exporting === "pdf" ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <FileText className="h-3.5 w-3.5" />
                )}
                Export PDF
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

          <SaveLayoutPack
            carousel={carousel}
            onSaved={(pack) => onLayoutPackSaved?.(pack)}
          />
          {carousel.layoutWarnings?.length ? (
            <p className="text-xs text-amber-800 dark:text-amber-200">
              {carousel.layoutWarnings.join(" ")}
            </p>
          ) : null}

          {/* Slide selector pills */}
          <div className="flex flex-wrap gap-1.5">
            {carousel.slides.map((s, idx) => (
              <Button
                key={s.id}
                type="button"
                size="sm"
                variant={idx === activeSlideIdx ? "default" : "outline"}
                onClick={() => setActiveSlideIdx(idx)}
                className="h-7 px-2.5 text-xs"
              >
                {idx + 1}. {s.role.toUpperCase()}
              </Button>
            ))}
          </div>

          {activeSlide && (
            <Card>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm">
                  Slide {activeSlide.slideNumber} ({activeSlide.role})
                </CardTitle>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeSlide(activeSlide.id)}
                  aria-label="Delete slide"
                  disabled={carousel.slides.length <= MIN_SLIDES}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Eyebrow Label</Label>
                    <Input
                      value={activeSlide.eyebrow || ""}
                      onChange={(e) =>
                        updateSlide(activeSlide.id, {
                          eyebrow: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Role</Label>
                    <Select
                      value={activeSlide.role}
                      onValueChange={(v) =>
                        updateSlide(activeSlide.id, {
                          role: v as CarouselSlide["role"],
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">Cover</SelectItem>
                        <SelectItem value="body">Body</SelectItem>
                        <SelectItem value="cta">CTA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <GraphicsStylePicker
                  platform={carousel.platform}
                  slide={activeSlide}
                  slideIndex={activeSlideIdx}
                  totalSlides={carousel.slides.length}
                  layoutPackId={layoutPackId ?? carousel.layoutPackId}
                  userPacks={userLayoutPacks}
                  onApply={(next) =>
                    onChange({
                      ...carousel,
                      slides: carousel.slides.map((slide) =>
                        slide.id === next.id ? next : slide
                      ),
                    })
                  }
                />

                {activeTemplate && (
                  <SlideSurfaceControls
                    slide={activeSlide}
                    primaryColor={primaryColor}
                    secondaryColor={secondaryColor}
                    template={activeTemplate}
                    isFirst={activeSlideIdx === 0}
                    onChange={(patch) => updateSlide(activeSlide.id, patch)}
                    onCopyFromFirst={() => {
                      const first = carousel.slides[0];
                      if (!first) return;
                      updateSlide(activeSlide.id, {
                        surface: first.surface ?? { kind: "inherit" },
                        accentOverride: first.accentOverride,
                      });
                    }}
                    onApplyToAll={() => {
                      const patch = {
                        surface: activeSlide.surface ?? { kind: "inherit" },
                        accentOverride: activeSlide.accentOverride,
                      };
                      onChange({
                        ...carousel,
                        slides: carousel.slides.map((slide) => ({
                          ...slide,
                          ...patch,
                        })),
                      });
                    }}
                  />
                )}

                <div className="space-y-1">
                  <SlideMediaControls slide={activeSlide} assets={assets} onChange={next => updateSlide(activeSlide.id,next)} onAsset={asset => setAssets(current => [...current,asset])}/>
                  <PatternContentControls slide={activeSlide} onChange={next => updateSlide(activeSlide.id, next)} />
                  <Label htmlFor={`${carousel.platform}-headline`} className="text-xs">Headline</Label>
                  <Input
                    id={`${carousel.platform}-headline`}
                    value={activeSlide.headline}
                    onChange={(e) =>
                      updateSlide(activeSlide.id, {
                        headline: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`${carousel.platform}-body`} className="text-xs">Body Copy</Label>
                  <Textarea
                    id={`${carousel.platform}-body`}
                    rows={3}
                    value={activeSlide.body}
                    onChange={(e) =>
                      updateSlide(activeSlide.id, { body: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">
                {carousel.platform === "linkedin"
                  ? "LinkedIn Post Copy"
                  : "Instagram Caption & Hashtags"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={4}
                value={carousel.caption}
                onChange={(e) =>
                  onChange({ ...carousel, caption: e.target.value })
                }
              />
              <Input
                placeholder="Hashtags..."
                value={carousel.hashtags.join(" ")}
                onChange={(e) =>
                  onChange({
                    ...carousel,
                    hashtags: e.target.value
                      .split(/\s+/)
                      .map((t) => t.trim())
                      .filter(Boolean),
                  })
                }
              />
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col items-center">
          {activeTemplate && (
            <CarouselPreview
              assets={assets}
                design={carousel.design}
              slides={carousel.slides}
              activeIndex={activeSlideIdx}
              onSelectIndex={setActiveSlideIdx}
              template={activeTemplate}
              primaryColor={primaryColor}
              secondaryColor={secondaryColor}
              brandHandle={carousel.brandHandle}
              platform={carousel.platform}
              aspectRatio={carousel.aspectRatio}
              exportRefs={exportRefs}
            />
          )}
        </div>
      </div>
    </div>
  );
}
