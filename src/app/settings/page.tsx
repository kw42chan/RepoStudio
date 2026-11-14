"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, PlugZap, Save, Unplug } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
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

  async function load() {
    const [sRes, pRes] = await Promise.all([
      fetch("/api/buffer/status"),
      fetch("/api/presets"),
    ]);
    if (sRes.ok) setStatus(await sRes.json());
    if (pRes.ok) {
      const p = await pRes.json();
      setPresets(p.presets || []);
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
    if (!newPresetName.trim()) return;
    const preset: BrandVoicePreset = {
      id: `preset-${Date.now()}`,
      name: newPresetName.trim(),
      voice: newPresetVoice.trim() || "Direct and practical",
      audience: newPresetAudience.trim() || "Founders and creators",
      cta: newPresetCta.trim() || "Save & follow for more",
      handle: newPresetHandle.trim() || "@yourbrand",
      defaultWritingStyle: "educational",
    };
    const res = await fetch("/api/presets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preset }),
    });
    if (res.ok) {
      setNewPresetName("");
      setNewPresetVoice("");
      setNewPresetAudience("");
      setNewPresetCta("");
      await load();
    }
  }

  const mode = status?.connection.mode || "disconnected";

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your one-click Buffer connection and reusable Brand Voice
          presets.
        </p>
      </div>

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Brand Voice Presets</CardTitle>
          <CardDescription>
            Quickly load your voice, target audience, and CTA in the Repurpose
            Studio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {presets.map((p) => (
              <div key={p.id} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{p.name}</span>
                  <Badge variant="outline" className="text-[11px]">
                    {p.handle}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">{p.voice}</p>
                <p className="text-xs text-muted-foreground">
                  Audience: {p.audience}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-lg border p-3.5 space-y-3 bg-muted/20">
            <p className="text-sm font-medium">Add New Preset</p>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                placeholder="Preset Name (e.g. SaaS Founder)"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
              />
              <Input
                placeholder="Handle (e.g. @acme)"
                value={newPresetHandle}
                onChange={(e) => setNewPresetHandle(e.target.value)}
              />
              <Input
                placeholder="Brand Voice"
                value={newPresetVoice}
                onChange={(e) => setNewPresetVoice(e.target.value)}
              />
              <Input
                placeholder="Target Audience"
                value={newPresetAudience}
                onChange={(e) => setNewPresetAudience(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Default CTA"
                value={newPresetCta}
                onChange={(e) => setNewPresetCta(e.target.value)}
              />
              <Button onClick={addPreset} className="gap-1.5 shrink-0">
                <Save className="h-4 w-4" />
                Save Preset
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
