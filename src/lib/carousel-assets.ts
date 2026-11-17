import toolsManifest from "../../public/carousel-assets/tools.manifest.json";

export interface ToolManifestEntry {
  id: string;
  label: string;
  logo: string;
}

const toolById = new Map<string, ToolManifestEntry>(
  toolsManifest.tools.map((tool) => [tool.id, tool])
);

const FALLBACK_LOGO = "/carousel-assets/logos/generic.svg";

export function getToolLogo(toolId: string): { src: string; label: string } {
  const entry = toolById.get(toolId);
  if (!entry) {
    return { src: FALLBACK_LOGO, label: toolId };
  }
  return {
    src: `/carousel-assets/${entry.logo}`,
    label: entry.label,
  };
}

export function listManifestTools(): ToolManifestEntry[] {
  return toolsManifest.tools;
}