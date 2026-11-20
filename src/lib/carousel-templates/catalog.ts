import manifest from "./manifest.v1.json";
import { parseCarouselTemplateManifest } from "./schema";
export const validatedCatalog = parseCarouselTemplateManifest(manifest);
