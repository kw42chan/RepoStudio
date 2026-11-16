"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Layers,
  Library,
  Settings,
  Sparkles,
  CheckCircle2,
  PlugZap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BufferStatusResponse {
  connection: {
    mode: "disconnected" | "demo" | "oauth" | "token";
    organizationName?: string;
  };
  oauthConfigured: boolean;
}

export function AppNav() {
  const pathname = usePathname();
  const [bufferStatus, setBufferStatus] =
    useState<BufferStatusResponse | null>(null);
  const [connecting, setConnecting] = useState(false);

  async function refreshStatus() {
    try {
      const res = await fetch("/api/buffer/status");
      if (res.ok) {
        setBufferStatus(await res.json());
      }
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    refreshStatus();
  }, [pathname]);

  async function handleOneClickConnect() {
    if (bufferStatus?.oauthConfigured) {
      window.location.href = "/api/buffer/oauth/start";
      return;
    }
    setConnecting(true);
    try {
      await fetch("/api/buffer/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "demo" }),
      });
      await refreshStatus();
    } finally {
      setConnecting(false);
    }
  }

  const mode = bufferStatus?.connection.mode ?? "disconnected";
  const isConnected = mode !== "disconnected";

  const navLinks = [
    { href: "/", label: "Studio", icon: Sparkles },
    { href: "/library", label: "Library", icon: Library },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Layers className="h-4 w-4" />
            </div>
            <span className="tracking-tight">RepoStudio</span>
          </Link>

          <nav className="flex items-center gap-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {isConnected ? (
            <Link href="/settings">
              <Badge
                variant="secondary"
                className="gap-1.5 px-2.5 py-1 text-xs font-medium"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Buffer:{" "}
                {mode === "demo"
                  ? "Demo Connected"
                  : mode === "oauth"
                    ? "Connected"
                    : "Token Active"}
              </Badge>
            </Link>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleOneClickConnect}
              disabled={connecting}
              className="gap-1.5"
            >
              <PlugZap className="h-3.5 w-3.5" />
              {connecting ? "Connecting..." : "Connect Buffer"}
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
