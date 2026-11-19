"use client";

import { useState } from "react";
import { Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatGraphicsStyleLabel, listGraphicsStylesForPlatform } from "@/lib/carousel-templates";
import type { UserLayoutPack } from "@/lib/types";

interface LayoutPackListProps {
  packs: UserLayoutPack[];
  onChange: (packs: UserLayoutPack[]) => void;
}

export function LayoutPackList({ packs, onChange }: LayoutPackListProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function save(pack: UserLayoutPack) {
    setBusyId(pack.id);
    setError("");
    try {
      const res = await fetch("/api/layout-packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not update that pack.");
        return;
      }
      onChange(packs.map((item) => (item.id === pack.id ? data.pack : item)));
    } catch {
      setError("Could not update that pack.");
    } finally {
      setBusyId(null);
    }
  }

  async function remove(id: string) {
    setBusyId(id);
    setError("");
    try {
      const res = await fetch("/api/layout-packs", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) {
        setError("Could not delete that pack.");
        return;
      }
      onChange(packs.filter((pack) => pack.id !== id));
    } catch {
      setError("Could not delete that pack.");
    } finally {
      setBusyId(null);
    }
  }

  if (packs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No saved layout packs yet. In Content Studio, open a carousel and
        choose Save current slide sequence as pack.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      {packs.map((pack) => {
        const styles = listGraphicsStylesForPlatform(pack.platform);
        const items = styles.map((style) => ({
          value: style.templateId,
          label: formatGraphicsStyleLabel(style),
        }));
        return (
          <div key={pack.id} className="rounded-lg border p-3 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{pack.name}</p>
                <p className="text-xs text-muted-foreground">
                  {pack.platform === "instagram" ? "Instagram" : "LinkedIn"} ·{" "}
                  {pack.slideTemplateIds.length} slides · catalog{" "}
                  {pack.catalogVersion}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-destructive"
                disabled={busyId === pack.id}
                onClick={() => remove(pack.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </Button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pack.slideTemplateIds.map((templateId, index) => (
                <div key={`${pack.id}-${index}`} className="space-y-1">
                  <p className="text-xs text-muted-foreground">Slide {index + 1}</p>
                  <Select
                    value={templateId}
                    items={
                      items.some((item) => item.value === templateId)
                        ? items
                        : [{ value: templateId, label: `${templateId} (unknown)` }, ...items]
                    }
                    onValueChange={(value) => {
                      if (!value || value === templateId) return;
                      const nextIds = pack.slideTemplateIds.slice();
                      nextIds[index] = value;
                      void save({ ...pack, slideTemplateIds: nextIds });
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {items.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {busyId === pack.id ? (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving
              </p>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
