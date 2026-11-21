"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { PublicAiSettings } from "@/lib/ai-settings";

export function ModelConnectionStatus() {
  const [status, setStatus] = useState<PublicAiSettings | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    const load = () => fetch("/api/settings/ai", { cache: "no-store" }).then(async response => {
      if (!response.ok) throw new Error(); const data = await response.json(); if (active) { setStatus(data); setFailed(false); }
    }).catch(() => { if (active) setFailed(true); });
    load(); window.addEventListener("focus", load); window.addEventListener("ai-settings-changed", load);
    return () => { active = false; window.removeEventListener("focus", load); window.removeEventListener("ai-settings-changed", load); };
  }, []);
  return <Link href="/settings#openrouter" className="text-xs text-muted-foreground underline">{failed ? "Check language model settings" : !status ? "Loading language model…" : status.configured ? `Model: ${status.textModel}` : "Demo mode · Connect OpenRouter in Settings"}</Link>;
}
