import { z } from "zod";

export const FONT_IDS = ["epilogue", "inter", "lora", "jetbrains-mono", "noto-sans-tc", "noto-sans-hk", "noto-serif-tc", "noto-serif-hk"] as const;
export type BuiltInFontId = typeof FONT_IDS[number];
export const CAROUSEL_FONTS = [
  { id: "epilogue", name: "Epilogue", kind: "sans", cjk: false },
  { id: "inter", name: "Inter", kind: "sans", cjk: false },
  { id: "lora", name: "Lora", kind: "serif", cjk: false },
  { id: "jetbrains-mono", name: "JetBrains Mono", kind: "mono", cjk: false },
  { id: "noto-sans-tc", name: "Noto Sans TC", kind: "sans", cjk: true },
  { id: "noto-sans-hk", name: "Noto Sans HK", kind: "sans", cjk: true },
  { id: "noto-serif-tc", name: "Noto Serif TC", kind: "serif", cjk: true },
  { id: "noto-serif-hk", name: "Noto Serif HK", kind: "serif", cjk: true },
] as const;

export const brandDesignSchema = z.object({
  version: z.literal(1),
  heading: z.object({ fontId: z.enum(FONT_IDS), weight: z.union([z.literal(500),z.literal(600),z.literal(700),z.literal(800)]), sizeScale: z.number().min(.85).max(1.2) }).strict(),
  body: z.object({ fontId: z.enum(FONT_IDS), weight: z.union([z.literal(400),z.literal(500),z.literal(600)]), sizeScale: z.number().min(.9).max(1.15) }).strict(),
}).strict();
export type BrandDesignSettingsV1 = z.infer<typeof brandDesignSchema>;

export function normalizeBrandDesign(input: unknown, style = "sans"): BrandDesignSettingsV1 {
  const parsed = brandDesignSchema.safeParse(input);
  if (parsed.success) {
    const design=parsed.data;
    design.heading.weight=Math.min(design.heading.weight,Math.max(...resolveFont(design.heading.fontId).weights)) as typeof design.heading.weight;
    return design;
  }
  return { version: 1, heading: { fontId: style === "serif" ? "lora" : style === "mono" ? "jetbrains-mono" : "epilogue", weight: 700, sizeScale: 1 }, body: { fontId: "epilogue", weight: 500, sizeScale: 1 } };
}

export function resolveFont(fontId: BuiltInFontId) {
  const font = CAROUSEL_FONTS.find(f => f.id === fontId) ?? CAROUSEL_FONTS[0];
  const fallback = font.kind === "serif" ? 'var(--font-noto-serif-tc), "Noto Serif TC", serif' : 'var(--font-noto-sans-tc), "Noto Sans TC", sans-serif';
  return { ...font, css: `var(--font-${font.id}), ${fallback}`, weights: font.id === "lora" ? [400,500,600,700] : [400,500,600,700,800] };
}
