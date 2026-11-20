---
type: project-plan
date: 2026-11-20
status: active
tags: [repostudio, carousel-design, development-plan]
---

## Outcome

Prepare RepoStudio’s next carousel phase so a user can generate a coherent deck from a prompt or uploaded reference, apply a saved brand system, choose or let the LLM choose suitable graphic patterns, rearrange the narrative, and place photos only in layouts designed to accept them.

This phase builds on the completed Phase 3 capabilities: per-slide graphics styles, per-slide surfaces, user layout packs, add/delete slide controls, and pack-default reset. It implements the design contract in [[Projects/RepoStudio/DESIGN|RepoStudio Carousel System]] and the pattern families in [[Projects/RepoStudio/docs/isaac-editorial-carousel-patterns|Editorial Signal]] and [[Projects/RepoStudio/docs/structured-editorial-carousel-patterns|Structured Editorial Patterns]].

## Product acceptance scenario

1. The user selects a saved brand with independent heading and body fonts, weights, and size scales.
2. The user enters a topic or attaches a sample carousel in Agent Chat.
3. RepoStudio extracts reusable visual traits without copying the source’s creator identity or wording.
4. The LLM produces 5–10 structured slides and chooses compatible patterns using each pattern’s declared intent, fields, density, and image requirements.
5. The user can add, delete, and reorder slides without corrupting slide numbers, roles, or layout-pack state.
6. Image controls appear only for declared image slots. The user can upload, replace, reposition, or remove an image and see the same crop in preview and export.
7. Overflow validation either adapts within allowed bounds or offers a less dense compatible pattern; it never silently shrinks text below the design-system minimum.
8. PNG and PDF exports match the editor at 1080 × 1350.

## Architecture direction

Create five deep modules at stable seams. Callers should not understand manifest internals, typography fallback rules, crop math, or LLM scoring.

| Module | Small interface | Complexity hidden behind the interface |
| --- | --- | --- |
| Brand system | `resolveBrandTheme(preset, visualTemplate): ResolvedBrandTheme` | Font availability, CJK fallbacks, weights, size scales, palette derivation, legacy preset defaults |
| Pattern registry | `listPatterns(context)` and `applyPattern(slide, patternId)` | Manifest parsing, required fields, content limits, image-slot declarations, renderer mapping, fallbacks |
| Deck operations | `applyDeckCommand(carousel, command): CarouselContent` | Add, delete, reorder, duplicate, renumber, cover/CTA invariants, active-slide remapping |
| Slide media | `resolveSlideMedia(slide, pattern): ResolvedMediaSlot[]` | Upload metadata, slot compatibility, focal points, crop/contain behavior, optional-slot empty states |
| Pattern selection | `selectPattern(slideIntent, registry, context): SelectionResult` | LLM candidates, deterministic validation, scoring, deck rhythm, warnings, fallback selection |

The preview and export paths must consume the same resolved theme, pattern, and media results. Avoid separate “editor” and “export” design logic.

## Proposed data contracts

### Brand typography

Extend `BrandVoicePreset` with a versioned optional design block so old presets continue to load:

```ts
interface BrandDesignSettingsV1 {
  version: 1;
  heading: {
    fontId: BuiltInFontId;
    weight: 500 | 600 | 700 | 800;
    sizeScale: number; // constrained to 0.85–1.2
  };
  body: {
    fontId: BuiltInFontId;
    weight: 400 | 500 | 600;
    sizeScale: number; // constrained to 0.9–1.15
  };
}
```

Use stable `fontId` values rather than storing CSS stacks. A font registry owns display names, Next.js font loading, Latin/CJK coverage, fallback stacks, and allowed weights. First release target: 8–12 curated families, including at least two Traditional Chinese sans choices, two Traditional Chinese serif choices, two Latin grotesks, one modern Latin serif, and one mono family.

### Pattern declaration

Evolve the current template manifest without creating a parallel catalog:

```ts
interface CarouselPatternDefinition {
  id: string;
  familyId: string;
  intentTags: SlideIntent[];
  requiredSlots: ContentSlotDefinition[];
  optionalSlots: ContentSlotDefinition[];
  imageSlots: ImageSlotDefinition[];
  contentLimits: ContentLimits;
  density: "light" | "balanced" | "dense";
  supportedModes: Array<"light" | "dark">;
  rendererVariant: string;
  selectionGuidance: string;
}

interface ImageSlotDefinition {
  id: string;
  purpose: "photo" | "screenshot" | "illustration" | "icon";
  aspectRatio: number;
  fit: "cover" | "contain";
  required: boolean;
  defaultFocalPoint: { x: number; y: number };
}
```

Keep `templateId` as the persisted pattern identifier during this phase to avoid a risky full migration. Rename it only in a future schema version if the terminology remains confusing.

### Slide media

```ts
interface SlideMediaPlacement {
  slotId: string;
  assetId: string;
  focalPoint: { x: number; y: number };
  zoom: number;
  altText?: string;
}

interface CarouselSlide {
  media?: SlideMediaPlacement[];
}
```

Store uploaded files in the existing application storage adapter, but add an image-specific upload path and validation. Persist asset metadata separately from the slide so replacing a crop does not duplicate the underlying file.

### Generation result

The LLM returns semantic content and intent, not raw JSX or arbitrary geometry:

```ts
interface GeneratedSlideDraft {
  role: "cover" | "body" | "cta";
  intent: SlideIntent;
  headline: string;
  body?: string;
  structuredContent?: Record<string, unknown>;
  preferredPatternIds?: string[];
}
```

The deterministic pattern-selection module validates the candidates against actual fields, images, content limits, platform, and adjacent-slide rhythm. Invalid LLM choices produce warnings and a compatible fallback.

## Delivery phases

### What this means for users

Phase 4.0 prepared the foundation. Phase 4.1 now lets users save separate heading and body typography with a brand, apply it to carousels, and carry the same settings into exports. The nine new layouts are now selectable, with editable structured content and image slots.

The preparation defines how much text each layout accepts, how many items it supports, and where images belong. Chinese, English, mixed-language, long-heading, and missing-image examples give development concrete cases to check. Each first-release layout also has a visual reference, so its appearance has a clear target.

The intended workflow after the remaining phases is: **choose a brand style → generate content → receive suitable layouts → arrange slides → add images → export consistently**.

| Phase | Change the user will experience when delivered |
| --- | --- |
| 4.0 — Finished | Preparation only: agreed layout rules, test examples, and visual references. |
| 4.1 — Finished | Set separate heading and body fonts, weights, and sizes; save them with a brand. |
| 4.2 — Finished | Move, duplicate, add, and delete slides while keeping the deck organized. |
| 4.3 — Finished | Choose from the nine new layout types in the editor. |
| 4.4 — Finished | Add images to supported positions and adjust their crops. |
| 4.5 — Planned | Get layouts selected for the content and use an uploaded sample to guide a reusable style. |
| 4.6 — Planned | Get clearer content-fit warnings and more consistent preview, PNG, and PDF output. |

For each future phase, record its user-visible result and verification when marking it finished. A useful release note states what the user can now do and any remaining limits.

### Implementation status — 2026-11-20

Phase 4.0 is finished as of 2026-11-20 in commit `c6e8a63` on `feature/carousel-phase-4-0`: load-time manifest validation, contracts for all 15 documented patterns, nine first-release selections, seven fixture decks, and nine 1080 × 1350 PNG/SVG design references. See [[Projects/RepoStudio/docs/carousel-phase-4-0|Phase 4.0 field matrix and verification]]. Nine first-release patterns are now rendered; six deferred patterns remain reference-only. Phase 4.0 references remain design targets and `e2e/goldens/` holds actual renderer captures.

| Phase | Status |
| --- | --- |
| 4.0 — Development preparation and golden fixtures | Finished — 2026-11-20, `c6e8a63` |
| 4.1 — Brand typography and built-in font library | Finished — 2026-11-20, `8b39a58` |
| 4.2 — Deck operations and narrative arrangement | Finished — 2026-11-20, `ccb759e` |
| 4.3 — Pattern registry and production renderers | Finished — 2026-11-20, `f4f0f75` |
| 4.4 — Image assets and declared slot controls | Finished — 2026-11-20, `f4f0f75` |
| 4.5 — LLM pattern routing and reference-style ingestion | In progress |
| 4.6 — Content fit, export parity, and release hardening | Not started |

Validation: 36 focused tests pass; TypeScript and changed-file ESLint pass. The full suite has 53 passes and the existing Windows read-only-directory store test failure (`chmod(0555)` does not prevent the write). Phase 4.1 typography is finished; Phase 4.2 deck operations is finished; Phases 4.3 and 4.4 are finished; Phase 4.5 routing and reference analysis is in progress.

### Phase 4.0 — Development preparation and golden fixtures

Status: **Finished** — 2026-11-20. Implementation commit: `c6e8a63`.

Purpose: lock the contracts before UI expansion.

- [x] Convert the two pattern documents into a manifest field matrix: identifier, family, intent tags, slots, limits, image slots, light/dark support, renderer status.
- [x] Add typed manifest validation with Zod at load time so malformed pattern definitions fail in tests rather than during editing.
- [x] Create representative fixture decks for Traditional Chinese, English, mixed-language, long headings, missing images, and maximum slide count.
- [x] Generate one 1080 × 1350 design reference per first-release pattern and record the expected typography and image-slot behavior. Production-renderer captures follow in Phase 4.3.
- [x] Decide the first-release pattern subset: statement, numbered list, vertical timeline, horizontal timeline, A/B comparison, metric evidence, collage cover, prompt-to-outcome, and CTA.

Exit gate: **Met** — manifest validation passes; every selected pattern has a fixture, a reference image, and explicit content limits. Verification results and the existing unrelated Windows test failure are recorded above.

### Phase 4.1 — Brand typography and built-in font library

Status: **Finished** — 2026-11-20. Implementation commit: `8b39a58`.

Users can select eight fonts, set heading and body weights and size scales independently, save and reload a brand, and apply it to both carousel platforms. The same resolver is used by normal, grid, and Edward AI slides in preview and export. Details: [[Projects/RepoStudio/docs/carousel-font-library|Font library and migration defaults]].

Verification: four typography contract/render tests, 17 related style/theme regression tests, and one real-browser persistence check pass. TypeScript passes; changed-file ESLint reports no errors and three image/unused-parameter warnings. The brand-editor screenshot was visually reviewed. Pixel-level export regression checks continue in Phase 4.6.

Purpose: make brand settings real in preview and export before adding many layouts.

- [x] Add `BrandDesignSettingsV1` and backward-compatible defaults in `src/lib/types.ts`, `src/lib/presets.ts`, and `src/lib/store.ts`.
- [x] Create `src/lib/carousel-fonts.ts` as the font registry and resolver.
- [x] Load curated fonts through `next/font` where supported; document any locally hosted font licenses and files.
- [x] Add separate heading/body font, weight, and size controls to brand preset editing.
- [x] Pass one `ResolvedBrandTheme` into both `carousel-preview.tsx` and `edwardai-slide-layouts.tsx`; remove local hard-coded font selection from render branches.
- [x] Ensure draft and saved-preset migration fills defaults without rewriting unrelated fields.

Exit gate: **Met for shared typography settings** — heading/body isolation and reload persistence pass; preview and both export formats consume identical resolved font settings. Final pixel and content-fit stress checks remain in Phase 4.6.

### Phase 4.2 — Deck operations and narrative arrangement

Status: **Finished** — 2026-11-20. Implementation commit: `ccb759e`.

Users can add, delete, duplicate, and move slides with keyboard-accessible buttons. Focus follows stable slide IDs; counts stay within 3–12; content stays with its slide; a warning explains per-slide overrides. Instagram Default retains its cover layout and light appearance after semantic roles are normalized.

Verification: three command tests (including 100 mixed command sequences), ten related theme/pack regressions, TypeScript, and one keyboard browser test pass.

Purpose: make slide-count changes safe before LLM regeneration and media placement depend on stable slide identity.

- [x] Create `src/lib/carousel-deck-operations.ts` with add, delete, move, duplicate, and normalize commands.
- [x] Replace editor-local add/delete logic with the module interface.
- [x] Add Move left/right controls first; add drag-and-drop only after keyboard-accessible commands work.
- [x] Preserve stable slide ids and media assignments during reorder; recompute only `slideNumber`.
- [x] Define invariants: 3–12 editable slides, exactly one cover at the beginning, at most one CTA at the end, and safe conversion when either is moved or deleted.
- [x] Reconcile custom layout packs after slide-count changes by warning that the deck now has per-slide overrides rather than silently rewriting the saved pack.

Exit gate: **Met** — unit tests cover every command and invariant; keyboard users can reorder; undo can be added later without changing the command shape.

### Phase 4.3 — Pattern registry and production renderers

Status: **Finished** — 2026-11-20. Implementation commit: `f4f0f75`.

Users can select all nine first-release graphics styles and edit their structured points and evidence fields. The manifest registry drives the picker and rendering; six deferred layouts remain unavailable. Verification: 37 related contract/render/picker/pack tests pass; all nine maximum-content CJK portrait fixtures fit measured bounds; nine real browser golden captures were reviewed. Copy limits for collage, comparison, and metric layouts were tightened after overflow was observed.

Purpose: turn the documented families into selectable, testable renderers.

- [x] Extend `manifest.v1.json` and its TypeScript types with the declared pattern contract.
- [x] Implement renderer variants in small family files under `src/components/studio/carousel-patterns/`; keep the dispatcher shallow.
- [x] Build shared primitives for slide chrome, highlighted text, evidence frame, numbered node, connector, and image frame.
- [x] Implement the first-release subset in increasing complexity: statement → numbered list → vertical timeline → horizontal timeline → A/B comparison → metric evidence → collage cover → prompt-to-outcome.
- [x] Use the same pattern registry for the graphics-style picker, pack reset, generation validation, preview, and export.
- [x] Mark non-rendered patterns as reference-only so the LLM and picker cannot select them prematurely.

Exit gate: **Met** — all first-release patterns render at 1080 × 1350 with their maximum permitted content and pass golden-image review.

### Phase 4.4 — Image assets and declared slot controls

Status: **Finished** — 2026-11-20. Implementation commit: `f4f0f75`.

Users can upload, reuse, replace, crop, zoom, describe, and remove images in declared slots. Required missing images block export; optional empty slots disappear. Files are stored separately from slide JSON and shared saved assets cannot be deleted accidentally. Verification: browser upload, invalid-image, crop, reload, required-slot blocking, and shared-asset retention checks pass, alongside resolver tests. Persistent local storage is required for deployment; automatic orphan cleanup is deferred. See [[Projects/RepoStudio/docs/carousel-image-assets|Image storage and retention]].

Purpose: support photos and screenshots without allowing arbitrary, fragile placement.

- [x] Add an image upload endpoint or generalize the current upload adapter with MIME-specific limits for PNG, JPEG, and WebP.
- [x] Create asset metadata persistence and deletion rules; do not store base64 images inside carousel JSON.
- [x] Add `media` to `CarouselSlide` and implement the slide-media resolver.
- [x] Show slot controls only for the active pattern’s `imageSlots`.
- [x] Add upload, replace, remove, focal-point, and zoom controls with immediate crop preview.
- [x] Keep optional slots visually absent when empty. A required empty slot blocks export or offers a text-safe pattern fallback.
- [x] Start with screenshot `contain` and photo `cover`; postpone freeform masking and background removal.

Exit gate: **Met** — supported patterns preserve crops across reload and export; unsupported patterns show no upload control; deleting a slide does not accidentally delete an asset used elsewhere.

### Phase 4.5 — LLM pattern routing and reference-style ingestion

Purpose: let Agent Chat generalize a supplied sample and choose patterns without giving the model unchecked layout authority.

- Expose a compact pattern-registry summary to generation prompts: intent tags, required fields, limits, image requirements, and selection guidance.
- Add semantic slide intents such as `cover`, `claim`, `metric`, `parallel-list`, `comparison`, `flow`, `sequence`, `sequence-summary`, `evidence`, and `cta`.
- Implement deterministic candidate validation and deck-level rhythm scoring after LLM output.
- Extend reference ingestion to produce a `StyleAnalysisDraft`: palette, type roles, spacing character, chrome, pattern candidates, and image treatment.
- Require user confirmation before saving an analyzed sample as a reusable style family or brand preset.
- Strip creator handles, copied wording, logos, and unverified claims from imported references.
- Record why a pattern was chosen and surface a concise explanation in the editor for debugging.

Exit gate: the same generated semantic deck routes consistently across repeated runs; invalid pattern choices fall back with visible warnings; uploaded references never become unreviewed executable layout definitions.

### Phase 4.6 — Content fit, export parity, and release hardening

Purpose: prevent a larger style library from producing fragile output.

- Add a content-fit evaluator using measured rendered bounds, not character count alone.
- Apply bounded adaptations in order: permitted line wrapping → small spacing adjustment → allowed size-scale reduction → compatible lower-density pattern suggestion.
- Add Traditional Chinese punctuation and orphan-line checks.
- Verify preview/export parity with fixed fonts loaded before capture.
- Add visual regression coverage for light/dark mode, long copy, missing optional media, maximum items, and mixed CJK/Latin text.
- Add store migration tests for old drafts, old presets, and old layout packs.

Exit gate: no first-release golden fixture clips, overlaps, or exports with a missing font; existing saved drafts still open.

## File-level preparation map

| Area | Primary files |
| --- | --- |
| Contracts | `src/lib/types.ts`, `src/lib/ai.ts`, `src/lib/carousel-templates/index.ts`, `src/lib/carousel-templates/manifest.v1.json` |
| Brand theme | `src/lib/presets.ts`, `src/lib/store.ts`, new `src/lib/carousel-fonts.ts`, new `src/lib/carousel-brand-theme.ts` |
| Deck commands | new `src/lib/carousel-deck-operations.ts`, `src/components/studio/carousel-editor.tsx` |
| Pattern rendering | `src/components/studio/carousel-preview.tsx`, `src/components/studio/edwardai-slide-layouts.tsx`, new `src/components/studio/carousel-patterns/` |
| Image assets | new image upload route, store migration, new slide-media resolver and controls |
| Generation | `src/lib/ai.ts`, `src/app/api/generate/route.ts`, style-extraction route or a new reference-analysis route |
| Verification | Vitest suites beside each module, golden fixtures under a dedicated test fixture directory, manual export checklist |

## Testing strategy

Test through each module’s public interface.

- Contract tests: manifest entries parse and every rendered pattern maps to a renderer.
- Property-style deck tests: any command sequence preserves ids, numbering, and cover/CTA invariants.
- Theme tests: every font id resolves to an installed family plus a CJK-safe fallback.
- Media tests: slot compatibility, required/optional behavior, focal-point clamping, shared-asset retention.
- Selection tests: structured data selects the expected family; invalid LLM candidates fall back deterministically.
- Render tests: maximum-content fixtures at 1080 × 1350, then PNG/PDF parity checks.
- Regression tests: the Instagram Default pack continues making every slide use the slide-1 cover layout and light appearance while retaining each slide’s content.

## Recommended implementation slices

Keep pull requests independently reviewable:

1. Pattern schema, manifest validator, and fixtures.
2. Font registry plus brand typography persistence.
3. Shared brand-theme resolver wired into existing renderers.
4. Deck command module plus reorder controls.
5. Shared pattern primitives and four text-only patterns.
6. Image asset persistence and slot controls.
7. Four image-capable patterns.
8. LLM intent and deterministic pattern selection.
9. Reference-style analysis and confirmation flow.
10. Content-fit evaluator, golden review, and migration hardening.

## Risks and controls

| Risk | Control |
| --- | --- |
| Manifest becomes a second programming language | Keep declarations descriptive; renderer variants remain typed code and are referenced by a stable id. |
| LLM output couples directly to visual implementation | Accept semantic intent and structured content; validate pattern choice deterministically. |
| Font library increases bundle or export failures | Curate the library, load only selected families, wait for `document.fonts.ready` before export. |
| Images make drafts too large | Persist files/assets separately; store only asset ids and crop metadata on slides. |
| Reordering breaks pack defaults | Preserve slide ids, treat the result as an override, and make Reset explicit. |
| More patterns multiply overflow bugs | Require limits, maximum-content fixtures, and golden review before a pattern becomes selectable. |
| Imported samples copy another creator | Extract abstract traits only and require confirmation before saving; remove identity and copied content. |

## Development-ready definition

Implementation may begin when all of the following are agreed or recorded:

- First-release pattern subset and stable identifiers.
- Curated font list with confirmed loading method and licensing.
- Editable slide-count range; recommendation is 3–12 while generated output remains 5–10 initially.
- Image upload size/type limits and storage retention policy.
- Golden fixtures for Traditional Chinese, English, and mixed-language decks.
- Migration defaults for existing brand presets and carousel drafts.
- The Phase 4.0 manifest validator and fixtures land before new production patterns.

## Recommended starting point

Begin with Phase 4.0 and Phase 4.1. The manifest contract prevents renderer drift, while the brand-theme resolver removes hard-coded typography before new patterns multiply it. Slide reordering can follow in parallel only after the deck command interface and invariants are fixed.
