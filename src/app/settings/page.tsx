"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronRight, Loader2, PlugZap, Unplug } from "lucide-react";
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
import { withBrandColors } from "@/lib/presets";
import { BrandVoicePreset } from "@/lib/types";

export default function SettingsPage() {
  const router = useRouter();
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
  const [newPresetHandle, setNewPresetHandle] = useState("@yourbrand");
  const [savingNew, setSavingNew] = useState(false);
  const [brandError, setBrandError] = useState<string | null>(null);

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
    setSavingNew(true);
    setBrandError(null);
    try {
      const preset: BrandVoicePreset = {
        id: `preset-${Date.now()}`,
        name,
        voice: "Direct and practical",
        audience: "Founders and creators",
        cta: "Save and follow for more",
        handle,
        primaryColor: "#1D4ED8",
        secondaryColor: "#F59E0B",
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
      router.push(`/settings/brands/${preset.id}`);
    } finally {
      setSavingNew(false);
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
            Pick a brand to edit its voice, audience, and call to action.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {brandError && (
            <p className="text-sm text-destructive">{brandError}</p>
          )}
          {presets.length === 0 ? (
            <p className="text-sm text-muted-foreground">No brands yet.</p>
          ) : (
            <div className="divide-y overflow-hidden rounded-lg border">
              {presets.map((p) => (
                <Link
                  key={p.id}
                  href={`/settings/brands/${p.id}`}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 hover:bg-muted/40"
                >
                  <span className="font-semibold text-sm">{p.name}</span>
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <Badge variant="outline" className="text-[11px]">
                      {p.handle}
                    </Badge>
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              ))}
            </div>
          )}

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
            </div>
            <Button
              type="button"
              onClick={addPreset}
              disabled={savingNew}
              className="gap-1.5"
            >
              {savingNew ? "Adding..." : "Add brand"}
            </Button>
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
