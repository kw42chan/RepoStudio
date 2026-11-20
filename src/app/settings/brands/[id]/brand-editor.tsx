"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
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
import { withBrandColors } from "@/lib/presets";
import { BrandVoicePreset } from "@/lib/types";
import { BrandTypographyControls } from "@/components/studio/brand-typography-controls";

export function BrandEditor({ brandId }: { brandId: string }) {
  const router = useRouter();
  const [preset, setPreset] = useState<BrandVoicePreset | null>(null);
  const [missing, setMissing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch("/api/presets");
      if (!res.ok) {
        if (!cancelled) setMissing(true);
        return;
      }
      const data = await res.json();
      const found = (data.presets || [])
        .map(withBrandColors)
        .find((item: BrandVoicePreset) => item.id === brandId);
      if (cancelled) return;
      if (!found) {
        setMissing(true);
        return;
      }
      setPreset(found);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [brandId]);

  function patch(next: Partial<BrandVoicePreset>) {
    setPreset((current) => (current ? { ...current, ...next } : current));
  }

  async function save() {
    if (!preset) return;
    const name = preset.name.trim();
    if (!name) {
      setError("Name the brand before saving.");
      return;
    }
    const handle =
      preset.handle.trim() || `@${name.replace(/\s+/g, "").toLowerCase()}`;
    const next = withBrandColors({
      ...preset,
      name,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      voice: preset.voice.trim() || "Direct and practical",
      audience: preset.audience.trim() || "Founders and creators",
      cta: preset.cta.trim() || "Save and follow for more",
    });
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not save the brand.");
        return;
      }
      setPreset(withBrandColors(data.preset || next));
      setMessage(`Saved ${next.name}.`);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!preset) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/presets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setError(data?.error || "Could not delete the brand.");
        return;
      }
      router.push("/settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <div className="space-y-2">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All brands
        </Link>
        <h1 className="text-2xl font-bold tracking-tight">
          {preset?.name || "Brand"}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand details</CardTitle>
          <CardDescription>
            Voice, audience, and the call to action for this brand.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {missing && (
            <p className="text-sm text-muted-foreground">
              This brand is not in the list.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {message && <p className="text-sm">{message}</p>}
          {preset && (
            <>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="brand-name">Preset name</Label>
                  <Input
                    id="brand-name"
                    value={preset.name}
                    onChange={(e) => patch({ name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="brand-handle">Handle</Label>
                  <Input
                    id="brand-handle"
                    value={preset.handle}
                    onChange={(e) => patch({ handle: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="brand-voice">Brand voice</Label>
                  <Textarea
                    id="brand-voice"
                    value={preset.voice}
                    onChange={(e) => patch({ voice: e.target.value })}
                    className="min-h-24"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="brand-audience">Target audience</Label>
                  <Input
                    id="brand-audience"
                    value={preset.audience}
                    onChange={(e) => patch({ audience: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="brand-cta">Default CTA</Label>
                  <Input
                    id="brand-cta"
                    value={preset.cta}
                    onChange={(e) => patch({ cta: e.target.value })}
                  />
                </div>
              </div>
              <BrandTypographyControls value={preset.design} onChange={design => patch({ design })} />
              <div className="flex flex-wrap items-end gap-2">
                <label className="space-y-1 text-xs" htmlFor="brand-primary">
                  Primary
                  <Input
                    id="brand-primary"
                    type="color"
                    value={preset.primaryColor}
                    onChange={(e) => patch({ primaryColor: e.target.value })}
                    className="h-9 w-16 p-1"
                  />
                </label>
                <label className="space-y-1 text-xs" htmlFor="brand-secondary">
                  Secondary
                  <Input
                    id="brand-secondary"
                    type="color"
                    value={preset.secondaryColor}
                    onChange={(e) => patch({ secondaryColor: e.target.value })}
                    className="h-9 w-16 p-1"
                  />
                </label>
                <Button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="gap-1.5"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save brand"}
                </Button>
                {confirmDelete ? (
                  <>
                    <span className="text-xs text-muted-foreground">
                      Delete {preset.name}?
                    </span>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={saving}
                      onClick={remove}
                    >
                      Delete
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={saving}
                      onClick={() => setConfirmDelete(false)}
                    >
                      Keep
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => {
                      setConfirmDelete(true);
                      setError(null);
                      setMessage(null);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
