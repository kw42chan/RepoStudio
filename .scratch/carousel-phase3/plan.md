# Carousel Phase 3 — Per-slide control (A, B, C)

Plan for RepoStudio carousel: **explorable graphics styles per slide (A)**, **per-slide color/gradient (B)**, and **user-defined layout packs (C)**.

## Status

| Phase | Status |
| --- | --- |
| **3A** | Merged (`9ccb0bc`). |
| **3B** | Merged (`5bb522b`). Per-slide surface and accent via `resolveSlideColors`. Grid cell colors deferred. |
| **3C** | Implemented: saved sequences in the app store, Step 2 “My packs”, and Content Studio save-as-pack. Unknown style ids fall back to Narrative. |

Repo context: manifest `src/lib/carousel-templates/manifest.v1.json`, renderers `src/components/studio/carousel-preview.tsx` + `src/components/studio/edwardai-slide-layouts.tsx`, editor `src/components/studio/carousel-editor.tsx`.

---

## Phase 3A — Per-slide graphics style (extensible catalog)

**Goal:** In Content Studio, each slide has a **Graphics style** control. You can explore styles from a catalog that **grows by adding manifest entries** (and optionally a renderer), without rewriting the whole UI each time.

### User-facing model

| Concept | Maps to in code |
| --- | --- |
| **Graphics style** (label in UI) | `templateId` on `CarouselSlide` |
| **Category** (group in dropdown) | `category` on manifest template (`hook-cover`, `hook-hero`, `body-list`, …) |
| **Preview thumb** | `templates[].preview.thumbnailPath` or SVG under `public/carousel-templates/refs/` |
| **Pack default** | Step 2 layout pack still sets the *initial* sequence; per-slide overrides win after generate |

### Data: `graphicsStyles` catalog (manifest v1.3+)

Add a top-level array (or derive from `templates[]` with a flag) so the UI does not hardcode ids:

```json
{
  "graphicsStyleCatalog": {
    "version": 1,
    "groups": [
      { "id": "hooks", "label": "Hooks", "categories": ["hook-cover", "hook-hero"] },
      { "id": "body", "label": "Body", "categories": ["body-narrative", "body-list", "body-stats", "body-cheatsheet", "body-profile", "body-grid"] },
      { "id": "close", "label": "Close", "categories": ["cta-close"] }
    ],
    "styles": [
      {
        "templateId": "ref-edwardai-hook-hero-showcase",
        "label": "Hero showcase (dark stage)",
        "tags": ["edwardai", "dark", "hero"],
        "experimental": false,
        "platforms": ["instagram"]
      }
    ]
  }
}
```

**Rule:** Any `templates[]` entry with `implementationStatus: "rendered"` and optional `showInStylePicker: true` appears in the catalog. Tags enable future search/filter (“dark”, “list”, “grid”).

**Adding a new style while exploring (your workflow):**

1. Sketch structure → SVG wireframe in `public/carousel-templates/refs/`.
2. Add `templates[]` row (metadata + `preview.thumbnailPath`).
3. Either map to existing renderer via `src/lib/carousel-templates/render-variants.ts`, or add a variant branch in `edwardai-slide-layouts.tsx` / `carousel-preview.tsx`.
4. Set `showInStylePicker: true` and optional `tags` — **no React change** if it reuses an existing render variant.
5. Vitest: `applyTemplateLayoutToSlide` + `hydrateSlideStructuredSlots` for required slots.

### Code changes (A)

| Area | Work |
| --- | --- |
| `src/lib/carousel-templates/index.ts` | `listGraphicsStylesForPlatform(platform)`, `applyGraphicsStyleToSlide(slide, templateId)` → `applyTemplateLayoutToSlide` + `hydrateSlideStructuredSlots` |
| `src/components/studio/carousel-editor.tsx` | Active slide panel: **Graphics style** `Select` (grouped by catalog), show thumb + one-line description; on change, call apply helper and `onChange` |
| `src/components/studio/graphics-style-picker.tsx` (new) | Optional combobox with thumbnails for exploration |
| `src/lib/types.ts` | No new field required if `templateId` is source of truth; optional `graphicsStyleLabel` cache for export metadata only |
| Tests | Editor logic: changing style on slide 4 sets `templateId` + `listItems` length; preview `data-carousel-template` updates |

### UX notes

- Show current style under live preview: `Slide 3 · Scene compare (Edward)`.
- **Reset slide to pack default** button when `layoutPackId` is set (re-run `pickTemplateForSlide` for that index only).
- Mark `experimental: true` styles with “(preview)” in the label so you can ship wireframes before final polish.

### Out of scope for A (defer to B)

- Per-slide custom hex gradients (only global visual template + Edward baked-in greens).

---

## Phase 3B — Per-slide color and gradient

**Goal:** Override background, accent, and optional gradient **per slide** without breaking export or brand defaults.

### Data model

```ts
export type SlideSurface =
  | { kind: "inherit" }  // use visual template + layout defaults
  | { kind: "solid"; color: string }
  | { kind: "gradient"; angle?: number; stops: { color: string; at: number }[] };

export interface CarouselSlide {
  // existing fields…
  surface?: SlideSurface;
  accentOverride?: string;  // optional mint/CTA override
}
```

- Zod: extend `carouselSlideSchema` in `src/lib/ai.ts` (optional; LLM usually omits — user sets in UI).
- **Inherit** is default so Edward + PM slides behave as today.

### Renderer contract

1. `slideGround()` / Edward palette: resolve `resolveSlideColors(slide, visualTemplate, primaryColor, secondaryColor)` → `{ background, ink, muted, accent }`.
2. `edwardai-slide-layouts.tsx` and default `SlideCanvas`: use resolved colors for `background` and hero stage fills.
3. Export path (`export-carousel.ts` / full-res `SlideCanvas`) must use same resolver (single module `src/lib/carousel-slide-theme.ts`).

### UI (Content Studio, active slide)

| Control | Binds to |
| --- | --- |
| Surface | `inherit` / solid / gradient |
| Color pickers | `surface` or `accentOverride` |
| “Copy from slide 1” / “Apply to all slides” | bulk patch |
| Preset chips | “Edward dark”, “Brand gradient”, “Light card” (local presets JSON) |

### Persistence

- Stored on draft in existing carousel JSON (`/api/drafts` if applicable) — verify draft schema accepts new fields.
- Visual template row remains **carousel-wide fallback**.

### Tests

- Unit: `resolveSlideColors` for inherit vs solid vs 2-stop gradient.
- One screenshot/visual test: slide 2 gradient does not affect slide 3 when inherit.

### Risks / order

- Depends on **A** being stable (`templateId` known per slide).
- Gradient on **grid-2x3** may need separate card colors — phase B.1 = narrative + Edward only; B.2 = grid cells.

---

## Phase 3C — Custom layout packs (save your own sequences)

**Goal:** Save and reuse a **7-slide (or N-slide) template sequence** like `instagram-edwardai-ref`, without editing manifest JSON.

### Data model

```ts
export interface UserLayoutPack {
  id: string;           // uuid
  name: string;
  platform: "instagram" | "linkedin";
  slideTemplateIds: string[];  // graphics style ids
  slideRoles?: CarouselSlide["role"][];
  createdAt: string;
  basedOnPackId?: string;  // e.g. clone from instagram-edwardai-ref
}
```

**Storage (pick one):**

| Option | Pros |
| --- | --- |
| **Brand store** (`src/lib/store.ts` / Postgres on published app) | Syncs across devices on same account |
| **Local presets API** (`/api/presets` pattern) | Matches existing templates/presets UX |
| **Export/import JSON file** | Fastest MVP, no migration |

Recommended: **presets API + Library page** section “My layout packs”.

### UI flows

1. **Step 2:** Dropdown includes built-in packs + **My packs** (from store).
2. **Content Studio:** “Save current slide sequence as pack…” → name + platform → writes `UserLayoutPack`.
3. **Pack editor (light):** Table slide # → graphics style dropdown (same catalog as A); drag-reorder slide roles optional v2.

### Pipeline

- `effectiveLayoutPackId` resolves built-in id **or** `user-pack:<uuid>` → load from store → pass `slideTemplateIds` into `normalizeCarouselSlideTemplates` the same way as manifest `layoutPacks[]`.
- Refactor: `getLayoutPack(packId)` reads manifest **or** user store.

### Migration

- No change to built-in manifest packs.
- Version user packs with `catalogVersion: manifest.version` for forward compatibility when styles are renamed.

### Tests

- Save pack from carousel with mixed template ids → re-select pack on new generate → same `templateId` sequence.
- Invalid template id in saved pack → fallback to `body-narrative-default` + UI warning.

---

## Suggested implementation order

```mermaid
flowchart LR
  A[3A Graphics catalog + per-slide picker]
  B[3B Slide surface colors]
  C[3C User layout packs]
  A --> B
  A --> C
  B -. optional polish .-> C
```

| Phase | Outcome you get |
| --- | --- |
| **3A** | Explore/add graphics types; pick per slide; catalog grows via manifest |
| **3B** | Fine-tune color/gradient per slide |
| **3C** | Save “my Instagram arc” and reuse in Step 2 |

### Rough scope (for prioritization, not calendar estimates)

| Phase | Main touchpoints | Involvement |
| --- | --- | --- |
| 3A | manifest, `carousel-templates/index.ts`, `carousel-editor.tsx`, new picker component, tests | Medium |
| 3B | `types`, `carousel-slide-theme.ts`, both renderers, editor color UI, draft API | Medium–high |
| 3C | store/presets API, Step 2 select, pack CRUD UI, `getLayoutPack` refactor | Medium |

---

## References

- Taxonomy: `src/lib/carousel-templates/TAXONOMY.md`
- Render variants: `src/lib/carousel-templates/render-variants.ts`
- Issue tracker: `docs/agents/issue-tracker.md` (this file lives at `.scratch/carousel-phase3/plan.md`)

Implement **3A** first: catalog-driven graphics style picker, then thumbnails. **3B** and **3C** follow once per-slide `templateId` is editable.
