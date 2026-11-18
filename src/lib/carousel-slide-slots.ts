import {
  getCarouselTemplate,
  getCarouselTemplateRenderVariant,
} from "./carousel-templates";
import type {
  CarouselSlide,
  CheatsheetRow,
  ListItem,
  MetricCell,
} from "./types";

function parseNumberedLines(body: string, maxItems: number): ListItem[] {
  const lines = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const items: ListItem[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d+)[.)]\s*(.+)$/);
    if (match) {
      const rest = match[2];
      const colon = rest.indexOf(":");
      if (colon > 0 && colon < 48) {
        items.push({
          number: Number(match[1]),
          title: rest.slice(0, colon).trim(),
          description: rest.slice(colon + 1).trim(),
        });
      } else {
        const parts = rest.split(/\s+—\s+|\s+-\s+/);
        items.push({
          number: Number(match[1]),
          title: parts[0]?.trim() || rest,
          description: parts.slice(1).join(" — ").trim() || rest,
        });
      }
    } else if (items.length < maxItems && line.length > 8) {
      items.push({
        number: items.length + 1,
        title: line.slice(0, 64),
        description: line,
      });
    }
    if (items.length >= maxItems) break;
  }
  return items;
}

function defaultListItems(slide: CarouselSlide, count: number): ListItem[] {
  const parsed = parseNumberedLines(slide.body, count);
  if (parsed.length >= count) {
    return parsed.slice(0, count);
  }

  const seeds = [
    { title: "Anchor the reference", description: slide.body.slice(0, 120) || slide.headline },
    {
      title: "Lock the structure",
      description: "Keep geometry and quantity words fixed across scenes.",
    },
    {
      title: "Ship one proof slide",
      description: "Show the same asset in a new context before the CTA.",
    },
    {
      title: "Setting four",
      description: "One-line payoff from the source post.",
    },
    {
      title: "Setting five",
      description: "Second concrete switch from the angle.",
    },
    {
      title: "Setting six",
      description: "Tie back to the reader workflow.",
    },
    { title: "Setting seven", description: slide.headline },
  ];

  const merged = [...parsed];
  for (const seed of seeds) {
    if (merged.length >= count) break;
    if (merged.some((item) => item.title === seed.title)) continue;
    merged.push({
      number: merged.length + 1,
      title: seed.title,
      description: seed.description,
    });
  }
  return merged.slice(0, count);
}

function defaultMetricCells(slide: CarouselSlide): MetricCell[] {
  if (slide.metricCells?.length) return slide.metricCells;
  const fromNumbers = [...slide.body.matchAll(/(\d{1,3})\+?\s+([A-Za-z][\w\s]{2,24})/g)];
  if (fromNumbers.length >= 2) {
    return fromNumbers.slice(0, 4).map((m) => ({
      value: m[1],
      label: m[2].trim(),
    }));
  }
  return [
    { value: "3×", label: "faster drafts" },
    { value: "51", label: "roles tuned" },
    { value: "14", label: "connectors" },
  ];
}

function defaultCheatsheetRows(slide: CarouselSlide): CheatsheetRow[] {
  if (slide.cheatsheetRows?.length) return slide.cheatsheetRows;
  const parsed = parseNumberedLines(slide.body, 5).map((item) => ({
    scenario: item.title,
    agent: item.description.split(/[.:]/)[0]?.trim() || "Hire",
    note: item.description,
  }));
  if (parsed.length >= 3) return parsed;
  return [
    { scenario: "Fast research", agent: "Perplexity", note: "When speed beats depth" },
    { scenario: "Long-form build", agent: "Claude", note: "When context window wins" },
    { scenario: "UI + code", agent: "Cursor", note: "When you ship in one session" },
  ];
}

export function hydrateSlideStructuredSlots(slide: CarouselSlide): CarouselSlide {
  const templateId = slide.templateId;
  if (!templateId) return slide;

  if (!getCarouselTemplateRenderVariant(templateId)) {
    return slide;
  }

  const template = getCarouselTemplate(templateId);
  if (!template) {
    return slide;
  }

  const listCount = template.structure?.listItems?.count;
  if (
    listCount &&
    (template.category === "body-list" || templateId.includes("tip-lock") || templateId.includes("switches"))
  ) {
    const listItems =
      slide.listItems?.length === listCount
        ? slide.listItems
        : defaultListItems(slide, listCount);
    return { ...slide, listItems };
  }

  if (template.category === "body-stats" || templateId.includes("metrics")) {
    return { ...slide, metricCells: defaultMetricCells(slide) };
  }

  if (template.category === "body-cheatsheet" || templateId.includes("cheatsheet")) {
    return { ...slide, cheatsheetRows: defaultCheatsheetRows(slide) };
  }

  return slide;
}