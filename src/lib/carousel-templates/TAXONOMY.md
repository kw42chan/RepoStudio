# Carousel slide layout taxonomy (v1)

This taxonomy aligns with `CarouselSlideLayout` in `src/lib/types.ts` (`default` | `grid-2x3`) and the templates in `manifest.v1.json`.

## Categories

| Category | Template id(s) | `layout` key | When to use |
| --- | --- | --- | --- |
| **hook-cover** | `hook-scroll-cover` | `default` (omitted on slide) | First slide / `role: cover` — eyebrow + headline that stops the scroll. |
| **body-narrative** | `body-narrative-default` | `default` | Middle `body` slides — problem, shift, detail, how-to on alternating grounds. |
| **body-grid** | `body-tool-grid-2x3` | `grid-2x3` | One slide per LinkedIn-style listicle: six numbered tool cards under a short header. Requires `gridCells` (6 items). |
| **cta-close** | `cta-action-close` | `default` | Last slide / `role: cta` — single action on gradient ground. |

## Pipeline hook

```
LLM slide JSON → ensureLinkedInGridSlide (LI listicles) → normalizeCarouselSlideTemplates
  → pickTemplateForSlide + applyTemplateLayoutToSlide → carousel-preview (1080×1350 DOM) → PNG export
```

Selection logic lives in `pickTemplateForSlide` (`src/lib/carousel-templates/index.ts`). Generation calls `normalizeCarouselSlideTemplates` from `generateContent` in `src/lib/ai.ts` after carousel JSON is parsed (and after the LinkedIn grid fallback).

## Extending the library

1. Add a template object to `manifest.v1.json` (or bump to `manifest.v2.json` and update the import in `index.ts`).
2. Teach `pickTemplateForSlide` when to return the new `id`.
3. If the layout is new, extend `CarouselSlideLayout` and branch in `carousel-preview.tsx`.
4. Add vitest cases in `carousel-templates.test.ts`.

Project-level notes for adding templates from reference carousels: `/cursor/stores/self/docs/carousel-template-library.md`.