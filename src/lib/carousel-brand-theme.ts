import { normalizeBrandDesign, resolveFont } from "./carousel-fonts";
import type { BrandVoicePreset, VisualTemplate } from "./types";

export function resolveBrandTheme(preset: Pick<BrandVoicePreset, "design"> | undefined, template: Pick<VisualTemplate, "fontStyle">) {
  const design = normalizeBrandDesign(preset?.design, template.fontStyle);
  const resolve = (role: typeof design.heading | typeof design.body) => {
    const font = resolveFont(role.fontId);
    // Lora has no 800 master. Resolve to a real weight rather than synthetic bold.
    return { ...role, weight: Math.min(role.weight, Math.max(...font.weights)), fontFamily: font.css };
  };
  return { heading: resolve(design.heading), body: resolve(design.body) };
}
export type ResolvedBrandTheme = ReturnType<typeof resolveBrandTheme>;
