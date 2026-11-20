"use client";

import { useState } from "react";
import { ImagePlus, Link2, Loader2, Save, Sparkles } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisualFontStyle, VisualLayoutMood, VisualTemplate } from "@/lib/types";

interface TemplateImporterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTemplateSaved: (template: VisualTemplate) => void;
}

export function TemplateImporterDialog({
  open,
  onOpenChange,
  onTemplateSaved,
}: TemplateImporterDialogProps) {
  const [sourceTab, setSourceTab] = useState<"upload" | "url">("upload");
  const [name, setName] = useState("");
  const [templateUrl, setTemplateUrl] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string>("");
  const [customStyleNotes, setCustomStyleNotes] = useState("");
  const [customToneNotes, setCustomToneNotes] = useState("");

  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draftTemplate, setDraftTemplate] = useState<VisualTemplate | null>(
    null
  );

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10*1024*1024 || !["image/png","image/jpeg","image/webp"].includes(file.type)) { setError("Choose a PNG, JPEG or WebP within 10 MB."); return; }
    setDraftTemplate(null);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImageDataUrl(reader.result);

      }
    };
    reader.readAsDataURL(file);
  }

  async function handleExtract() {
    setError(null);
    setExtracting(true);
    try {
      const res = await fetch("/api/style-extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          imageDataUrl: sourceTab === "upload" ? imageDataUrl : undefined,
          templateUrl: sourceTab === "url" ? templateUrl : undefined,
          customStyleNotes,
          customToneNotes,

        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to extract style");
      }
      setDraftTemplate(data.template);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to extract style");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSaveTemplate() {
    if (!draftTemplate) return;
    setError(null);
    setSaving(true);
    try {
      const res = await fetch("/api/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: draftTemplate, confirmReference: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save template");
      }
      onTemplateSaved(data.template);
      onOpenChange(false);
      setDraftTemplate(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import & Save Visual Template</DialogTitle>
          <DialogDescription>
            Upload a reference carousel image or paste a template URL to extract
            its palette, typography, and mood—then save it as a reusable
            template.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>Template Name</Label>
            <Input
              placeholder="e.g. Clean Notion Deck, Bold Dark Brand"
              value={draftTemplate ? draftTemplate.name : name}
              onChange={(e) => {
                setName(e.target.value);
                if (draftTemplate) {
                  setDraftTemplate({ ...draftTemplate, name: e.target.value });
                }
              }}
            />
          </div>

          <Tabs
            value={sourceTab}
            onValueChange={(v) => setSourceTab(v as "upload" | "url")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upload" className="gap-1.5">
                <ImagePlus className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
              <TabsTrigger value="url" className="gap-1.5">
                <Link2 className="h-4 w-4" />
                From URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-3 pt-2">
              <Input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileChange}
              />
              {imageDataUrl && (
                <div className="rounded-lg border p-2 bg-muted/30">
                  <img
                    src={imageDataUrl}
                    alt="Uploaded template preview"
                    className="max-h-40 mx-auto rounded object-contain"
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="url" className="space-y-2 pt-2">
              <Label>Image URL or Reference Page URL</Label>
              <Input
                type="url"
                placeholder="https://example.com/carousel-template.png"
                value={templateUrl}
                onChange={(e) => setTemplateUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Supports direct image URLs (PNG/JPG/WebP) or webpage URLs (extracts
                OpenGraph preview & theme color).
              </p>
            </TabsContent>
          </Tabs>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Optional Custom Visual Style</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Swiss editorial grid, generous whitespace"
                value={customStyleNotes}
                onChange={(e) => setCustomStyleNotes(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Optional Custom Visual Tone</Label>
              <Textarea
                rows={2}
                placeholder="e.g. Warm, premium, high-contrast"
                value={customToneNotes}
                onChange={(e) => setCustomToneNotes(e.target.value)}
              />
            </div>
          </div>

          <p className="text-xs text-muted-foreground">Only palette and layout traits are saved. The source image, creator identity, logos, and wording are excluded.</p>

          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2"
            onClick={handleExtract}
            disabled={
              extracting ||
              (sourceTab === "upload" ? !imageDataUrl : !templateUrl.trim())
            }
          >
            {extracting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {extracting ? "Extracting Visual Style..." : "Extract Visual Style"}
          </Button>

          {error && (
            <p className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          {draftTemplate && (
            <div className="space-y-3 rounded-lg border p-4 bg-muted/20">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Reference traits ? review before saving
                </p>
                <span className="text-xs text-muted-foreground">
                  {draftTemplate.description}
                </span>
              </div>

              {draftTemplate.referenceStyle?.warnings.map(warning => <p key={warning} className="text-xs text-amber-800">{warning}</p>)}
              <p className="text-xs text-muted-foreground">Layout candidates: {draftTemplate.referenceStyle?.patternCandidates.join(", ")}</p>
              <div className="grid grid-cols-5 gap-2">
                {(
                  [
                    ["backgroundColor", "Bg"],
                    ["surfaceColor", "Surface"],
                    ["textColor", "Text"],
                    ["mutedColor", "Muted"],
                    ["accentColor", "Accent"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="space-y-1">
                    <Label className="text-xs">{label}</Label>
                    <Input
                      type="color"
                      value={draftTemplate[key]}
                      onChange={(e) =>
                        setDraftTemplate({
                          ...draftTemplate,
                          [key]: e.target.value,
                        })
                      }
                      className="h-9 p-1 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs">Typography</Label>
                  <Select
                    value={draftTemplate.fontStyle}
                    onValueChange={(v) =>
                      setDraftTemplate({
                        ...draftTemplate,
                        fontStyle: v as VisualFontStyle,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Modern Sans</SelectItem>
                      <SelectItem value="serif">Editorial Serif</SelectItem>
                      <SelectItem value="bold-display">Bold Display</SelectItem>
                      <SelectItem value="mono">Technical Mono</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Layout Mood</Label>
                  <Select
                    value={draftTemplate.layoutMood}
                    onValueChange={(v) =>
                      setDraftTemplate({
                        ...draftTemplate,
                        layoutMood: v as VisualLayoutMood,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="clean">Clean</SelectItem>
                      <SelectItem value="editorial">Editorial</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="gradient">Soft Gradient</SelectItem>
                      <SelectItem value="card">Framed Card</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                type="button"
                className="w-full gap-2"
                onClick={handleSaveTemplate}
                disabled={saving}
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {saving ? "Saving..." : "Confirm & save reference style"}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
