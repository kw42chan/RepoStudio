"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TEXT_MODEL, VISION_MODEL } from "@/lib/models";
import type { PublicAiSettings } from "@/lib/ai-settings";

export function OpenRouterSettings() {
  const [status, setStatus] = useState<PublicAiSettings | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [textModel, setTextModel] = useState(TEXT_MODEL);
  const [visionModel, setVisionModel] = useState(VISION_MODEL);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  function apply(data: PublicAiSettings) {
    setStatus(data);
    // OpenAI uses unprefixed model IDs; keep usable OpenRouter defaults when switching.
    setTextModel(data.provider === "openai" ? TEXT_MODEL : data.textModel);
    setVisionModel(data.provider === "openai" ? VISION_MODEL : data.visionModel);
  }
  useEffect(() => {
    let active = true;
    fetch("/api/settings/ai", { cache: "no-store" }).then(async response => {
      const data = await response.json(); if (!response.ok) throw new Error(data.error || "Could not load connection settings.");
      if (active) apply(data);
    }).catch(() => { if (active) setError("Could not load connection settings. Reload to try again."); });
    return () => { active = false; };
  }, []);
  async function submit(method: "PUT" | "POST" | "DELETE") {
    setBusy(true); setMessage(""); setError("");
    try {
      const response = await fetch("/api/settings/ai", {
        method, headers: { "Content-Type": "application/json" },
        ...(method !== "DELETE" ? { body: JSON.stringify({ apiKey: apiKey.trim(), textModel, visionModel }) } : {}),
      });
      const data = await response.json();
      if (!response.ok || data.ok === false) throw new Error(data.error || data.message || "Could not update connection.");
      if (method === "POST") setMessage(data.message);
      else {
        apply(data); setApiKey("");
        setMessage(method === "PUT" ? "OpenRouter settings saved. Your next creation will use these models. Save does not check the key; use Test connection to verify it." : "Saved OpenRouter connection removed. Environment settings apply if available; otherwise demo mode is active.");
        window.dispatchEvent(new Event("ai-settings-changed"));
      }
    } catch (error) { setError(error instanceof Error ? error.message : "Could not update connection."); }
    finally { setBusy(false); }
  }
  return <Card id="openrouter">
    <CardHeader>
      <CardTitle className="text-base">Language model · OpenRouter</CardTitle>
      <CardDescription>Generate original carousel copy and analyze reference images with your own OpenRouter account.</CardDescription>
    </CardHeader>
    <CardContent className="space-y-4">
      <p className="text-sm" data-testid="ai-connection-status">{!status ? "Loading connection…" : status.provider === "demo" ? "Demo mode · no language model connected" : `${status.provider === "openrouter" ? "OpenRouter" : "OpenAI"} configured · ${status.source === "settings" ? "saved in Settings" : "from server environment"}`}</p>
      <div className="space-y-2">
        <Label htmlFor="openrouter-api-key">OpenRouter API key</Label>
        <Input id="openrouter-api-key" type="password" autoComplete="new-password" spellCheck={false} value={apiKey} onChange={event => { setApiKey(event.target.value); setMessage(""); }} placeholder={status?.hasOpenRouterKey ? "Key saved — leave blank to keep it" : "sk-or-v1-…"} disabled={busy || !status} />
        <p className="text-xs text-muted-foreground">Stored on this app&apos;s server. Your saved key is never sent back to the browser. <a href="https://openrouter.ai/settings/keys" target="_blank" rel="noreferrer" className="underline">Get an OpenRouter key</a>.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="openrouter-text-model">Text model ID</Label><Input id="openrouter-text-model" list="openrouter-models" value={textModel} onChange={event => { setTextModel(event.target.value); setMessage(""); }} disabled={busy || !status} /><p className="text-xs text-muted-foreground">Used for ideas and carousel copy.</p></div>
        <div className="space-y-2"><Label htmlFor="openrouter-vision-model">Reference image model ID</Label><Input id="openrouter-vision-model" list="openrouter-models" value={visionModel} onChange={event => { setVisionModel(event.target.value); setMessage(""); }} disabled={busy || !status} /><p className="text-xs text-muted-foreground">Choose a model that accepts images.</p></div>
      </div>
      <datalist id="openrouter-models"><option value={TEXT_MODEL} /><option value={VISION_MODEL} /><option value="openai/gpt-4o-mini" /></datalist>
      <p className="text-xs text-muted-foreground">Test connection checks your key and model availability without generating content. Creating content uses your OpenRouter credits.</p>
      <div className="flex flex-wrap gap-2">
        <Button disabled={busy || !status || (!apiKey.trim() && !status.hasOpenRouterKey)} onClick={() => submit("PUT")}>Save OpenRouter settings</Button>
        <Button variant="outline" disabled={busy || !status || (!apiKey.trim() && !status.hasOpenRouterKey)} onClick={() => submit("POST")}>{busy ? "Working…" : "Test connection"}</Button>
        {status?.source === "settings" && <Button variant="ghost" disabled={busy} onClick={() => submit("DELETE")}>Remove saved connection</Button>}
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    </CardContent>
  </Card>;
}
