"use client";

import { useEffect, useState } from "react";
import {
  BookmarkPlus,
  Check,
  Columns3,
  Lightbulb,
  Link2,
  Loader2,
  Sparkles,
  Video,
  Wand2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AspectRatio,
  BrandVoicePreset,
  CarouselContent,
  ContentDraft,
  ContentFormat,
  IdeationResult,
  ReelContent,
  RepurposeIdea,
  SourcePost,
  VisualTemplate,
  WritingStyleConfig,
} from "@/lib/types";
import {
  BUILT_IN_VISUAL_TEMPLATES,
  DEFAULT_BRAND_PRESETS,
  SAMPLE_SOURCE_POSTS,
} from "@/lib/presets";
import { WritingStyleControls } from "@/components/studio/writing-style-controls";
import { ReelEditor } from "@/components/studio/reel-editor";
import { CarouselEditor } from "@/components/studio/carousel-editor";
import { TemplateImporterDialog } from "@/components/studio/template-importer-dialog";
import { BufferScheduleDialog } from "@/components/studio/buffer-schedule-dialog";
import {
  languageNameFromCode,
  originalLanguageName,
} from "@/lib/language";
import { TEXT_MODEL } from "@/lib/models";

export default function RepurposeWorkspacePage() {
  const [presets, setPresets] =
    useState<BrandVoicePreset[]>(DEFAULT_BRAND_PRESETS);
  const [templates, setTemplates] = useState<VisualTemplate[]>(
    BUILT_IN_VISUAL_TEMPLATES
  );

  // Step 1: Source input
  const [rawText, setRawText] = useState("");
  const [sourceLanguage, setSourceLanguage] = useState<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("LinkedIn");
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [brandVoice, setBrandVoice] = useState(DEFAULT_BRAND_PRESETS[0].voice);
  const [targetAudience, setTargetAudience] = useState(
    DEFAULT_BRAND_PRESETS[0].audience
  );
  const [ctaPreference, setCtaPreference] = useState(
    DEFAULT_BRAND_PRESETS[0].cta
  );
  const [brandHandle, setBrandHandle] = useState(
    DEFAULT_BRAND_PRESETS[0].handle
  );

  // Step 2: Ideation
  const [ideating, setIdeating] = useState(false);
  const [ideationError, setIdeationError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [sourcePost, setSourcePost] = useState<SourcePost | null>(null);
  const [ideation, setIdeation] = useState<IdeationResult | null>(null);
  const [selectedIdea, setSelectedIdea] = useState<RepurposeIdea | null>(null);

  // Studio generation options
  const [writingStyle, setWritingStyle] = useState<WritingStyleConfig>({
    styleId: "educational",
    customStyle: "",
    customTone: "",
  });
  const [defaultTemplateId, setDefaultTemplateId] = useState("minimal-light");
  const [defaultAspectRatio, setDefaultAspectRatio] =
    useState<AspectRatio>("4:5");

  // Step 3: Content Studio
  const [generating, setGenerating] = useState(false);
  const [regeneratingFormat, setRegeneratingFormat] =
    useState<ContentFormat | null>(null);
  const [activeTab, setActiveTab] = useState<ContentFormat>("reel");
  const [draftId, setDraftId] = useState<string | undefined>(undefined);
  const [reel, setReel] = useState<ReelContent | undefined>(undefined);
  const [igCarousel, setIgCarousel] = useState<CarouselContent | undefined>(
    undefined
  );
  const [liCarousel, setLiCarousel] = useState<CarouselContent | undefined>(
    undefined
  );
  const [savingDraft, setSavingDraft] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // Dialogs
  const [importerOpen, setImporterOpen] = useState(false);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [scheduleFormat, setScheduleFormat] = useState<ContentFormat>("reel");
  const [scheduleText, setScheduleText] = useState("");
  const [scheduleMediaUrl, setScheduleMediaUrl] = useState<string | undefined>(
    undefined
  );
  const [scheduleMediaFileName, setScheduleMediaFileName] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    async function loadInitial() {
      try {
        const [pRes, tRes] = await Promise.all([
          fetch("/api/presets"),
          fetch("/api/templates"),
        ]);
        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData.presets?.length) setPresets(pData.presets);
        }
        if (tRes.ok) {
          const tData = await tRes.json();
          if (tData.templates?.length) setTemplates(tData.templates);
        }
      } catch {
        // use defaults
      }
    }
    loadInitial();
  }, []);

  function applyPreset(presetId: string) {
    const found = presets.find((p) => p.id === presetId);
    if (!found) return;
    setBrandVoice(found.voice);
    setTargetAudience(found.audience);
    setCtaPreference(found.cta);
    setBrandHandle(found.handle);
    setWritingStyle((prev) => ({
      ...prev,
      styleId: found.defaultWritingStyle,
      customTone: found.defaultTone || prev.customTone,
    }));
  }

  async function loadPostFromUrl(): Promise<string | null> {
    const url = sourceUrl.trim();
    if (!url) return rawText;
    setLoadingUrl(true);
    try {
      const res = await fetch("/api/source-fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not load that link");
      }
      setRawText(data.text);
      setSourceLanguage(
        languageNameFromCode(data.language) || originalLanguageName(data.text)
      );
      if (data.platform) setSourcePlatform(data.platform);
      return data.text as string;
    } finally {
      setLoadingUrl(false);
    }
  }

  async function handleIdeate() {
    setIdeationError(null);
    setIdeating(true);
    try {
      let text = rawText.trim();
      if (text.length < 10 && sourceUrl.trim()) {
        const loaded = await loadPostFromUrl();
        text = (loaded || "").trim();
      }
      const res = await fetch("/api/ideate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawText: text,
          sourcePlatform,
          sourceUrl: sourceUrl.trim() || undefined,
          brandVoice,
          targetAudience,
          ctaPreference,
        }),
      });
      const raw = await res.text();
      let data: {
        error?: string;
        sourcePost?: SourcePost;
        sourceAnalysis?: IdeationResult["sourceAnalysis"];
        ideas?: RepurposeIdea[];
        usedMock?: boolean;
      };
      try {
        data = JSON.parse(raw);
      } catch {
        throw new Error(
          "Idea generation did not finish. The text in the box was sent, but the model reply never came back. Try again."
        );
      }
      if (!res.ok || !data.sourcePost || !data.sourceAnalysis || !data.ideas) {
        throw new Error(data.error || "Failed to generate ideas");
      }
      setSourcePost(data.sourcePost);
      setIdeation({
        sourceAnalysis: data.sourceAnalysis,
        ideas: data.ideas,
        usedMock: Boolean(data.usedMock),
      });
      setSelectedIdea(data.ideas[0] || null);
    } catch (err) {
      setIdeationError(
        err instanceof Error ? err.message : "Failed to generate ideas"
      );
    } finally {
      setIdeating(false);
    }
  }

  async function handleGenerateFormats(
    formats: ContentFormat[],
    ideaOverride?: RepurposeIdea,
    styleOverride?: WritingStyleConfig
  ) {
    const idea = ideaOverride || selectedIdea;
    const style = styleOverride || writingStyle;
    if (!sourcePost || !idea || generating) return;

    setSelectedIdea(idea);
    setGenerating(true);
    setGenerateError(null);
    setDraftId((prev) => prev || `draft-${Date.now()}`);
    const failures: string[] = [];
    try {
      for (const format of formats) {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sourcePost,
            idea,
            formats: [format],
            writingStyle: style,
            visualTemplateId: defaultTemplateId,
            aspectRatio: defaultAspectRatio,
            brandHandle,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data) {
          failures.push(data?.error || `Could not write the ${format} draft.`);
          continue;
        }
        if (data.reel) setReel(data.reel);
        if (data.igCarousel) setIgCarousel(data.igCarousel);
        if (data.liCarousel) setLiCarousel(data.liCarousel);
        setActiveTab(format);
      }
      if (failures.length === formats.length) {
        setGenerateError(failures[0] || "Could not write the content.");
      } else {
        window.setTimeout(() => {
          document
            .getElementById("content-studio")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 50);
      }
    } catch (err) {
      setGenerateError(
        err instanceof Error ? err.message : "Generation failed"
      );
    } finally {
      setGenerating(false);
    }
  }

  async function handleRegenerateSingleFormat(
    format: ContentFormat,
    style: WritingStyleConfig
  ) {
    if (!sourcePost || !selectedIdea) return;
    setRegeneratingFormat(format);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourcePost,
          idea: selectedIdea,
          formats: [format],
          writingStyle: style,
          visualTemplateId:
            format === "ig_carousel"
              ? igCarousel?.visualTemplateId || defaultTemplateId
              : format === "li_carousel"
                ? liCarousel?.visualTemplateId || defaultTemplateId
                : defaultTemplateId,
          aspectRatio:
            format === "ig_carousel"
              ? igCarousel?.aspectRatio || defaultAspectRatio
              : format === "li_carousel"
                ? liCarousel?.aspectRatio || defaultAspectRatio
                : defaultAspectRatio,
          brandHandle,
        }),
      });
      const data = await res.json();
      if (!res.ok) return;
      if (format === "reel" && data.reel) setReel(data.reel);
      if (format === "ig_carousel" && data.igCarousel)
        setIgCarousel(data.igCarousel);
      if (format === "li_carousel" && data.liCarousel)
        setLiCarousel(data.liCarousel);
    } finally {
      setRegeneratingFormat(null);
    }
  }

  async function handleSaveDraft() {
    if (!sourcePost || !selectedIdea) return;
    setSavingDraft(true);
    try {
      const draft: ContentDraft = {
        id: draftId || `draft-${Date.now()}`,
        title: selectedIdea.title,
        sourcePost,
        idea: selectedIdea,
        reel,
        igCarousel,
        liCarousel,
        bufferStatus: "draft",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch("/api/drafts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft }),
      });
      if (res.ok) {
        const data = await res.json();
        setDraftId(data.draft.id);
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 2000);
      }
    } finally {
      setSavingDraft(false);
    }
  }

  async function handleSaveNewTemplate(template: VisualTemplate) {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ template }),
    });
    if (res.ok) {
      const data = await res.json();
      setTemplates((prev) => [
        ...prev.filter((t) => t.id !== data.template.id),
        data.template,
      ]);
    }
  }

  function openSchedule(
    format: ContentFormat,
    text: string,
    mediaUrl?: string,
    mediaFileName?: string
  ) {
    setScheduleFormat(format);
    setScheduleText(text);
    setScheduleMediaUrl(mediaUrl);
    setScheduleMediaFileName(mediaFileName);
    setScheduleOpen(true);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 space-y-8">
      {/* Hero / Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Social Content Repurpose Studio
          </h1>
          <p className="text-sm text-muted-foreground">
            Paste any viral post, extract repurpose angles, customize writing &
            1080×1350 visual styles, and schedule to Buffer.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {SAMPLE_SOURCE_POSTS.map((sample) => (
            <Button
              key={sample.label}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setRawText(sample.text);
                setSourcePlatform(sample.platform);
              }}
            >
              Load {sample.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Step 1: Source Inspiration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              1
            </span>
            Paste a Post or a Link
          </CardTitle>
          <CardDescription>
            Paste a public post URL, or paste the caption itself, to extract
            its hook and generate fresh repurposing angles.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="space-y-2">
              <div className="space-y-1.5">
                <Label>Post URL</Label>
                <div className="flex gap-2">
                  <Input
                    type="url"
                    placeholder="https://www.linkedin.com/posts/..."
                    value={sourceUrl}
                    onChange={(e) => setSourceUrl(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    className="shrink-0 gap-1.5"
                    disabled={loadingUrl || !sourceUrl.trim()}
                    onClick={async () => {
                      setIdeationError(null);
                      try {
                        await loadPostFromUrl();
                      } catch (err) {
                        setIdeationError(
                          err instanceof Error
                            ? err.message
                            : "Could not load that link"
                        );
                      }
                    }}
                  >
                    {loadingUrl ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                    {loadingUrl ? "Loading..." : "Load link"}
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label>Copied Post Content</Label>
                <Select
                  value={sourcePlatform}
                  onValueChange={(v) => v && setSourcePlatform(v)}
                >
                  <SelectTrigger className="w-36 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LinkedIn">From LinkedIn</SelectItem>
                    <SelectItem value="Instagram">From Instagram</SelectItem>
                    <SelectItem value="X / Twitter">From X / Twitter</SelectItem>
                    <SelectItem value="Threads">From Threads</SelectItem>
                    <SelectItem value="Transcript">Video Transcript</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                rows={7}
                placeholder="Paste the post you want to repurpose here..."
                value={rawText}
                onChange={(e) => {
                  setRawText(e.target.value);
                  setSourceLanguage(originalLanguageName(e.target.value));
                }}
              />
              {sourceLanguage && (
                <p className="text-xs text-muted-foreground">
                  Original language: {sourceLanguage}. Repurposed posts stay in
                  this language.
                </p>
              )}
            </div>

            <div className="space-y-3 rounded-lg border p-3.5 bg-muted/20">
              <div className="flex items-center justify-between gap-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Brand Voice Preset
                </Label>
                <Select onValueChange={(v) => typeof v === "string" && applyPreset(v)}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue placeholder="Choose preset..." />
                  </SelectTrigger>
                  <SelectContent>
                    {presets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Brand Voice</Label>
                <Input
                  value={brandVoice}
                  onChange={(e) => setBrandVoice(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Target Audience</Label>
                <Input
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Default CTA</Label>
                  <Input
                    value={ctaPreference}
                    onChange={(e) => setCtaPreference(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Brand Handle</Label>
                  <Input
                    value={brandHandle}
                    onChange={(e) => setBrandHandle(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {ideationError && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {ideationError}
            </p>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3">
            <p className="text-xs text-muted-foreground">
              Model {TEXT_MODEL}
            </p>
            <Button
              onClick={handleIdeate}
              disabled={
                ideating ||
                loadingUrl ||
                (rawText.trim().length < 10 && !sourceUrl.trim())
              }
              className="gap-2"
            >
              {ideating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Lightbulb className="h-4 w-4" />
              )}
              {ideating ? "Analyzing Post..." : "Generate Repurpose Ideas"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Step 2: Ideation Angles & Style Selection */}
      {ideation && (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  2
                </span>
                Choose an Angle & Repurpose Style
              </CardTitle>
              {ideation.usedMock ? (
                <Badge variant="outline" className="text-xs">
                  Smart Local Mode (Add OPENROUTER_API_KEY or OPENAI_API_KEY for LLM)
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-xs">
                  Written by your language model
                </Badge>
              )}
            </div>
            <CardDescription>
              <strong>Hook Pattern:</strong>{" "}
              {ideation.sourceAnalysis.coreHookPattern} •{" "}
              <strong>Key Insight:</strong>{" "}
              {ideation.sourceAnalysis.keyInsight}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <p className="text-sm text-muted-foreground">
              Tap an angle to write the reel script and both carousels in the
              style below. Changing the writing style rewrites them.
            </p>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {ideation.ideas.map((idea) => {
                const isSelected = selectedIdea?.id === idea.id;
                return (
                  <button
                    key={idea.id}
                    type="button"
                    onClick={() =>
                      handleGenerateFormats(
                        ["reel", "ig_carousel", "li_carousel"],
                        idea
                      )
                    }
                    className={`text-left rounded-xl border p-4 transition-all space-y-2 ${
                      isSelected
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "hover:border-primary/40 hover:bg-muted/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant={isSelected ? "default" : "secondary"}>
                        {idea.angleType}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">
                        Reel {idea.formatFit.reel}% • IG{" "}
                        {idea.formatFit.igCarousel}% • LI{" "}
                        {idea.formatFit.liCarousel}%
                      </span>
                    </div>
                    <h3 className="font-semibold text-sm">{idea.title}</h3>
                    <p className="text-xs font-medium text-foreground/90">
                      “{idea.hook}”
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {idea.summary}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr] items-end">
              <WritingStyleControls
                value={writingStyle}
                onChange={(next) => {
                  const styleChanged = next.styleId !== writingStyle.styleId;
                  setWritingStyle(next);
                  if (styleChanged && selectedIdea) {
                    void handleGenerateFormats(
                      ["reel", "ig_carousel", "li_carousel"],
                      selectedIdea,
                      next
                    );
                  }
                }}
              />

              <div className="rounded-lg border bg-muted/20 p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Carousel Visual Template</Label>
                    <Select
                      value={defaultTemplateId}
                      onValueChange={(v) => v && setDefaultTemplateId(v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((t) => (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Carousel Aspect Ratio</Label>
                    <Select
                      value={defaultAspectRatio}
                      onValueChange={(v) =>
                        setDefaultAspectRatio(v as AspectRatio)
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
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleGenerateFormats(["reel"])}
                    disabled={generating || !selectedIdea}
                    className="w-full gap-2"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Video className="h-4 w-4" />
                    )}
                    Generate Reel Script
                  </Button>
                  <Button
                    type="button"
                    onClick={() =>
                      handleGenerateFormats([
                        "reel",
                        "ig_carousel",
                        "li_carousel",
                      ])
                    }
                    disabled={generating || !selectedIdea}
                    className="w-full gap-2"
                  >
                    {generating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    {generating ? "Writing content..." : "Generate All 3 Formats"}
                  </Button>
                </div>
                {generateError && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
                    {generateError}
                  </p>
                )}
                {generating && (
                  <p className="text-xs text-muted-foreground">
                    Writing the script and carousel copy for the selected angle.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Multi-Format Content Studio */}
      {(reel || igCarousel || liCarousel) && (
        <Card id="content-studio">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                  3
                </span>
                Content Studio
              </CardTitle>
              <CardDescription>
                Fine-tune each format, switch writing or visual styles, export
                1080×1350 slides, and schedule to Buffer.
              </CardDescription>
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={handleSaveDraft}
              disabled={savingDraft}
              className="gap-1.5"
            >
              {savedToast ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : (
                <BookmarkPlus className="h-4 w-4" />
              )}
              {savedToast
                ? "Saved to Library"
                : savingDraft
                  ? "Saving..."
                  : "Save Draft"}
            </Button>
          </CardHeader>

          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={(v) => setActiveTab(v as ContentFormat)}
            >
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="reel" className="gap-1.5">
                  <Video className="h-4 w-4" />
                  Instagram Reel
                </TabsTrigger>
                <TabsTrigger value="ig_carousel" className="gap-1.5">
                  <Sparkles className="h-4 w-4" />
                  Instagram Carousel
                </TabsTrigger>
                <TabsTrigger value="li_carousel" className="gap-1.5">
                  <Columns3 className="h-4 w-4" />
                  LinkedIn Carousel
                </TabsTrigger>
              </TabsList>

              <TabsContent value="reel">
                {reel && (
                  <ReelEditor
                    reel={reel}
                    onChange={setReel}
                    onRegenerateStyle={(style) =>
                      handleRegenerateSingleFormat("reel", style)
                    }
                    regenerating={regeneratingFormat === "reel"}
                    onOpenSchedule={(text, mediaUrl, mediaFileName) =>
                      openSchedule("reel", text, mediaUrl, mediaFileName)
                    }
                  />
                )}
              </TabsContent>

              <TabsContent value="ig_carousel">
                {igCarousel && (
                  <CarouselEditor
                    carousel={igCarousel}
                    templates={templates}
                    onChange={setIgCarousel}
                    onRegenerateStyle={(style) =>
                      handleRegenerateSingleFormat("ig_carousel", style)
                    }
                    regenerating={regeneratingFormat === "ig_carousel"}
                    onOpenTemplateImporter={() => setImporterOpen(true)}
                    onSaveAsNewTemplate={handleSaveNewTemplate}
                    onOpenSchedule={(text) => openSchedule("ig_carousel", text)}
                  />
                )}
              </TabsContent>

              <TabsContent value="li_carousel">
                {liCarousel && (
                  <CarouselEditor
                    carousel={liCarousel}
                    templates={templates}
                    onChange={setLiCarousel}
                    onRegenerateStyle={(style) =>
                      handleRegenerateSingleFormat("li_carousel", style)
                    }
                    regenerating={regeneratingFormat === "li_carousel"}
                    onOpenTemplateImporter={() => setImporterOpen(true)}
                    onSaveAsNewTemplate={handleSaveNewTemplate}
                    onOpenSchedule={(text) => openSchedule("li_carousel", text)}
                  />
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      <TemplateImporterDialog
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onTemplateSaved={(saved) => {
          setTemplates((prev) => [
            ...prev.filter((t) => t.id !== saved.id),
            saved,
          ]);
          if (activeTab === "ig_carousel" && igCarousel) {
            setIgCarousel({ ...igCarousel, visualTemplateId: saved.id });
          } else if (activeTab === "li_carousel" && liCarousel) {
            setLiCarousel({ ...liCarousel, visualTemplateId: saved.id });
          }
          setDefaultTemplateId(saved.id);
        }}
      />

      <BufferScheduleDialog
        open={scheduleOpen}
        onOpenChange={setScheduleOpen}
        format={scheduleFormat}
        defaultText={scheduleText}
        mediaUrl={scheduleMediaUrl}
        mediaFileName={scheduleMediaFileName}
        draftId={draftId}
      />
    </div>
  );
}
