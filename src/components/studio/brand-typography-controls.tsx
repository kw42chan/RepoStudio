"use client";
import { CAROUSEL_FONTS, normalizeBrandDesign, resolveFont, type BrandDesignSettingsV1 } from "@/lib/carousel-fonts";

export function BrandTypographyControls({ value, onChange }: { value?: BrandDesignSettingsV1; onChange: (value: BrandDesignSettingsV1) => void }) {
  const design = normalizeBrandDesign(value);
  return <fieldset className="rounded-lg border p-4 space-y-3">
    <legend className="px-1 text-sm font-medium">Carousel typography</legend>
    {(["heading", "body"] as const).map(role => {
      const current = design[role];
      const patch = (next: Partial<typeof current>) => {
        const candidate = { ...current, ...next };
        candidate.weight = Math.min(candidate.weight, Math.max(...resolveFont(candidate.fontId).weights)) as typeof candidate.weight;
        onChange(normalizeBrandDesign({ ...design, [role]: candidate }));
      };
      return <div key={role} className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs space-y-1">{role === "heading" ? "Heading font" : "Body font"}
          <select className="block w-full rounded border bg-background p-2" value={current.fontId} onChange={e => patch({ fontId: e.target.value as typeof current.fontId })}>
            {CAROUSEL_FONTS.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}
          </select>
        </label>
        <label className="text-xs space-y-1">Weight
          <select className="block w-full rounded border bg-background p-2" value={current.weight} onChange={e => patch({ weight: Number(e.target.value) as typeof current.weight })}>
            {(role === "heading" ? [500,600,700,800] : [400,500,600]).filter(w => resolveFont(current.fontId).weights.includes(w)).map(w => <option key={w} value={w}>{w}</option>)}
          </select>
        </label>
        <label className="text-xs space-y-1">Size ({Math.round(current.sizeScale * 100)}%)
          <input className="block w-full" type="range" min={role === "heading" ? .85 : .9} max={role === "heading" ? 1.2 : 1.15} step="0.05" value={current.sizeScale} onChange={e => patch({ sizeScale: Number(e.target.value) })}/>
        </label>
      </div>;
    })}
    <p style={{ fontFamily: resolveFont(design.heading.fontId).css, fontWeight: design.heading.weight, fontSize: 24 * design.heading.sizeScale }}>Make your ideas clear / 讓想法更清晰</p>
    <p style={{ fontFamily: resolveFont(design.body.fontId).css, fontWeight: design.body.weight, fontSize: 16 * design.body.sizeScale }}>A consistent voice, on every slide. 每一頁都有一致的品牌風格。</p>
  </fieldset>;
}
