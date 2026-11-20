import { z } from "zod";
import { FIRST_RELEASE_PATTERN_IDS } from "./carousel-templates/pattern-ids";
const hex = z.string().regex(/^#[0-9a-f]{6}$/i);
export const styleTraitsSchema = z.object({
  palette: z.object({ background: hex, surface: hex, ink: hex, muted: hex, accent: hex }).strict(),
  headingStyle: z.enum(["sans","serif","bold-display"]), bodyStyle: z.literal("sans"),
  spacing: z.enum(["generous","balanced","compact"]), chrome: z.enum(["minimal","editorial-rule","numbered"]),
  imageTreatment: z.enum(["none","framed-screenshot","photo-cover","collage"]),
  patternCandidates: z.array(z.enum(FIRST_RELEASE_PATTERN_IDS)).max(9),
}).strict();
export const styleAnalysisSchema = styleTraitsSchema.extend({ version: z.literal(1), method: z.enum(["vision","local-palette"]), warnings: z.array(z.string()).max(5) }).strict();
export type StyleAnalysisDraft = z.infer<typeof styleAnalysisSchema>;

/** An enum-and-palette contract deliberately has no creator, quote, logo, or geometry fields. */
export function referenceTemplate(analysis: StyleAnalysisDraft, name: string) {
  const safeName = name.replace(/https?:\/\/\S+|@[\w.]+/g, "").trim().slice(0,64) || "Reference style";
  return {
    id: `tpl-${crypto.randomUUID()}`, name: safeName, description: "Reviewed palette, typography roles and layout traits from a reference.",
    isBuiltIn: false, backgroundColor: analysis.palette.background, surfaceColor: analysis.palette.surface,
    textColor: analysis.palette.ink, mutedColor: analysis.palette.muted, accentColor: analysis.palette.accent,
    fontStyle: analysis.headingStyle, layoutMood: analysis.chrome === "editorial-rule" ? "editorial" as const : "clean" as const,
    customStyleNotes: `Spacing: ${analysis.spacing}. Chrome: ${analysis.chrome}. Images: ${analysis.imageTreatment}.`,
    referenceStyle: analysis, createdAt: new Date().toISOString(),
  };
}
