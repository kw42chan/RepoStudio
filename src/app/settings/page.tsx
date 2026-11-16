"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, Save, Trash2, Unplug } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { withBrandColors } from "@/lib/presets";
import { BrandVoicePreset } from "@/lib/types";

export default function SettingsPage() {
  const [status, setStatus] = useState<{
    connection: {
      mode: string;
      organizationName?: string;
      connectedAt?: string;
    };
    oauthConfigured: boolean;
    envTokenConfigured: boolean;
  } | null>(null);
  const [tokenInput, setTokenInput] = useState("");
  const [busy, setBusy] = useState(false);

  const [presets, setPresets] = useState<BrandVoicePreset[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [newPresetVoice, setNewPresetVoice] = useState("");
  const [newPresetAudience, setNewPresetAudience] = useState("");
  const [newPresetCta, setNewPresetCta] = useState("");
  const [newPresetHandle, setNewPresetHandle] = useState("@yourbrand");
  const [newPrimary, setNewPrimary] = useState("#1D4ED8");
  const [newSecondary, setNewSecondary] = useState("#F59E0B");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [brandMessage, setBrandMessage] = useState<string | null>(null);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  async function load() {
    const [sRes, pRes] = await Promise.all([
      fetch("/api/buffer/status"),
      fetch("/api/presets"),
    ]);
    if (sRes.ok) setStatus(await sRes.json());
    if (pRes.ok) {
      const p = await pRes.json();
      setPresets((p.presets || []).map(withBrandColors));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function connectDemo() {
    setBusy(true);
    try {
      await fetch("/api/buffer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function connectToken() {
    if (!tokenInput.trim()) return;
    setBusy(true);
    try {
      await fetch("/api/buffer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "token", accessToken: tokenInput }),
      });
      setTokenInput("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function disconnect() {
    setBusy(true);
    try {
      await fetch("/api/buffer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "disconnect" }),
      });
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function addPreset() {
    const handle = newPresetHandle.trim() || "@yourbrand";
    const name =
      newPresetName.trim() || handle.replace(/^@/, "") || "New brand";
    setSavingId("new");
    setBrandError(null);
    setBrandMessage(null);
    try {
      const preset: BrandVoicePreset = {
        id: `preset-${Date.now()}`,
        name,
        voice: newPresetVoice.trim() || "Direct and practical",
        audience: newPresetAudience.trim() || "Founders and creators",
        cta: newPresetCta.trim() || "Save and follow for more",
        handle,
        primaryColor: newPrimary,
        secondaryColor: newSecondary,
        defaultWritingStyle: "educational",
      };
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBrandError(data?.error || "Could not save the brand.");
        return;
      }
      setNewPresetName("");
      setNewPresetVoice("");
      setNewPresetAudience("");
      setNewPresetCta("");
      setBrandMessage(`Saved ${name}.`);
      await load();
    } finally {
      setSavingId(null);
    }
  }

  function patchPreset(id: string, patch: Partial<BrandVoicePreset>) {
    setPresets((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item))
    );
  }

  async function savePreset(preset: BrandVoicePreset) {
    const name = preset.name.trim();
    if (!name) {
      setBrandError("Name the brand before saving.");
      return;
    }
    const handle = preset.handle.trim() || `@${name.replace(/\s+/g, "").toLowerCase()}`;
    const next = withBrandColors({
      ...preset,
      name,
      handle: handle.startsWith("@") ? handle : `@${handle}`,
      voice: preset.voice.trim() || "Direct and practical",
      audience: preset.audience.trim() || "Founders and creators",
      cta: preset.cta.trim() || "Save and follow for more",
    });
    setSavingId(preset.id);
    setBrandError(null);
    setBrandMessage(null);
    try {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preset: next }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBrandError(data?.error || "Could not save the brand.");
        return;
      }
      setBrandMessage(`Saved ${next.name}.`);
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function removePreset(preset: BrandVoicePreset) {
    setSavingId(preset.id);
    setBrandError(null);
    setBrandMessage(null);
    try {
      const res = await fetch("/api/presets", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: preset.id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setBrandError(data?.error || "Could not delete the brand.");
        return;
      }
      setPendingDeleteId(null);
      setBrandMessage(`Deleted ${preset.name}.`);
      await load();
    } finally {
      setSavingId(null);
    }
  }

  const mode = status?.connection.mode || "disconnected";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Set the brand guidelines first. Carousel templates use that primary
          and secondary color.
        </p>
      </div>


      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand guidelines</CardTitle>
          <CardDescription>
            Change the name, voice, and audience on a saved brand. Carousel
            templates follow its two colors.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {brandError && (
            <p className="text-sm text-destructive">{brandError}</p>
          )}
          {brandMessage && <p className="text-sm">{brandMessage}</p>}
          <div className="space-y-3">
            {presets.map((p) => (
              <div key={p.id} className="rounded-lg border p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <Badge variant="outline" className="text-[11px]">
                    {p.handle}
                  </Badge>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor={`${p.id}-name`}>Preset name</Label>
                    <Input
                      id={`${p.id}-name`}
                      value={p.name}
                      onChange={(e) =>
                        patchPreset(p.id, { name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor={`${p.id}-handle`}>Handle</Label>
                    <Input
                      id={`${p.id}-handle`}
                      value={p.handle}
                      onChange={(e) =>
                        patchPreset(p.id, { handle: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${p.id}-voice`}>Brand voice</Label>
                    <Textarea
                      id={`${p.id}-voice`}
                      value={p.voice}
                      onChange={(e) =>
                        patchPreset(p.id, { voice: e.target.value })
                      }
                      className="min-h-16"
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${p.id}-audience`}>Target audience</Label>
                    <Input
                      id={`${p.id}-audience`}
                      value={p.audience}
                      onChange={(e) =>
                        patchPreset(p.id, { audience: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor={`${p.id}-cta`}>Default CTA</Label>
                    <Input
                      id={`${p.id}-cta`}
                      value={p.cta}
                      onChange={(e) =>
                        patchPreset(p.id, { cta: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="space-y-1 text-xs" htmlFor={`${p.id}-primary`}>
                    Primary
                    <Input
                      id={`${p.id}-primary`}
                      type="color"
                      value={p.primaryColor}
                      onChange={(e) =>
                        patchPreset(p.id, { primaryColor: e.target.value })
                      }
                      className="h-9 w-16 p-1"
                    />
                  </label>
                  <label className="space-y-1 text-xs" htmlFor={`${p.id}-secondary`}>
                    Secondary
                    <Input
                      id={`${p.id}-secondary`}
                      type="color"
                      value={p.secondaryColor}
                      onChange={(e) =>
                        patchPreset(p.id, { secondaryColor: e.target.value })
                      }
                      className="h-9 w-16 p-1"
                    />
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    disabled={savingId === p.id}
                    aria-label={`Save ${p.name || "brand"}`}
                    onClick={() => savePreset(p)}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" />
                    {savingId === p.id ? "Saving..." : "Save brand"}
                  </Button>
                  {pendingDeleteId === p.id ? (
                    <>
                      <span className="text-xs text-muted-foreground">
                        Delete {p.name}?
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        disabled={savingId === p.id}
                        aria-label={`Confirm delete ${p.name}`}
                        onClick={() => removePreset(p)}
                      >
                        {savingId === p.id ? "Deleting..." : "Delete"}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={savingId === p.id}
                        onClick={() => setPendingDeleteId(null)}
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
                      aria-label={`Delete ${p.name}`}
                      onClick={() => {
                        setPendingDeleteId(p.id);
                        setBrandError(null);
                        setBrandMessage(null);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-sm font-medium">Add a brand</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="new-brand-name">Preset name</Label>
                <Input
                  id="new-brand-name"
                  placeholder="SaaS Founder"
                  value={newPresetName}
                  onChange={(e) => setNewPresetName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="new-brand-handle">Handle</Label>
                <Input
                  id="new-brand-handle"
                  placeholder="@acme"
                  value={newPresetHandle}
                  onChange={(e) => setNewPresetHandle(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-brand-voice">Brand voice</Label>
                <Input
                  id="new-brand-voice"
                  placeholder="Direct and practical"
                  value={newPresetVoice}
                  onChange={(e) => setNewPresetVoice(e.target.value)}
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="new-brand-audience">Target audience</Label>
                <Input
                  id="new-brand-audience"
                  placeholder="Founders and creators"
                  value={newPresetAudience}
                  onChange={(e) => setNewPresetAudience(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <div className="min-w-48 flex-1 space-y-1.5">
                <Label htmlFor="new-brand-cta">Default CTA</Label>
                <Input
                  id="new-brand-cta"
                  placeholder="Save and follow for more"
                  value={newPresetCta}
                  onChange={(e) => setNewPresetCta(e.target.value)}
                />
              </div>
              <label className="space-y-1 text-xs">
                Primary
                <Input
                  type="color"
                  value={newPrimary}
                  onChange={(e) => setNewPrimary(e.target.value)}
                  className="h-9 w-16 p-1"
                />
              </label>
              <label className="space-y-1 text-xs">
                Secondary
                <Input
                  type="color"
                  value={newSecondary}
                  onChange={(e) => setNewSecondary(e.target.value)}
                  className="h-9 w-16 p-1"
                />
              </label>
              <Button
                type="button"
                onClick={addPreset}
                disabled={savingId === "new"}
                aria-label="Save new brand"
                className="gap-1.5 shrink-0"
              >
                <Save className="h-4 w-4" />
                {savingId === "new" ? "Saving..." : "Save brand"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base">Buffer Connection</CardTitle>
              <CardDescription>
                Connect with one click via OAuth or the instant Demo Workspace.
              </CardDescription>
            </div>
            <Badge variant={mode === "disconnected" ? "outline" : "secondary"}>
              {mode === "disconnected" ? "Disconnected" : mode.toUpperCase()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode !== "disconnected" ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3.5 bg-muted/20">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>
                  Connected to{" "}
                  <strong>
                    {status?.connection.organizationName || "Buffer"}
                  </strong>
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={disconnect}
                disabled={busy}
                className="gap-1.5"
              >
                <Unplug className="h-3.5 w-3.5" />
                Disconnect
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {status?.oauthConfigured ? (
                <Button
                  onClick={() => {
                    window.location.href = "/api/buffer/oauth/start";
                  }}
                  className="gap-2"
                >
                  <PlugZap className="h-4 w-4" />
                  Connect with Buffer (OAuth)
                </Button>
              ) : (
                <Button
                  onClick={connectDemo}
                  disabled={busy}
                  className="gap-2"
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlugZap className="h-4 w-4" />
                  )}
                  One-Click Connect Demo Buffer
                </Button>
              )}
            </div>
          )}

          <div className="pt-2 border-t space-y-2">
            <Label className="text-xs text-muted-foreground">
              Optional: Connect with Personal Buffer Access Token
            </Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="Paste Buffer access token (optional)..."
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
              />
              <Button
                variant="secondary"
                onClick={connectToken}
                disabled={busy || !tokenInput.trim()}
              >
                Save Token
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
