---
type: project-plan
date: 2026-11-20
status: complete
tags: [repostudio, carousel-design, development-plan]
---

## Outcome

RepoStudio now supports local carousel creation from a brief or source post, saved brand typography, validated automatic layout choices, safe slide arrangement, declared image slots and crops, reviewed reference styles, and measured content-fit checks before PNG/PDF export. Development Phases 4.0–4.6 are finished; hosted deployment and live-provider checks remain separate release work.

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

## Implemented module interfaces

The implementation uses shared modules so the editor, generation path, preview and export consume the same contracts. Content fitting adds a measured browser check before capture.

| Module | Small interface | Complexity hidden behind the interface |
| --- | --- | --- |
| Brand system | `resolveBrandTheme(preset, visualTemplate): ResolvedBrandTheme` | Font availability, CJK fallbacks, weights, size scales, palette derivation, legacy preset defaults |
| Pattern registry | `listPatterns(context)` and `applyPattern(slide, patternId)` | Manifest parsing, required fields, content limits, image-slot declarations, renderer mapping, fallbacks |
| Deck operations | `applyDeckCommand(carousel, command): CarouselContent` | Add, delete, reorder, duplicate, renumber, cover/CTA invariants, active-slide remapping |
| Slide media | `resolveSlideMedia(slide, assets)` | Upload metadata, slot compatibility, focal points, crop/contain behavior, optional-slot empty states |
| Pattern selection | `selectPattern(slide, context)` | LLM candidates, deterministic validation, scoring, deck rhythm, warnings, fallback selection |

The preview and export paths must consume the same resolved theme, pattern, and media results. Avoid separate “editor” and “export” design logic.

## Current contract notes

### Brand typography

`BrandVoicePreset.design` and `CarouselContent.design` use the optional versioned design block below. Legacy records receive compatible defaults:

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

The existing manifest remains the catalog. New definitions carry a typed `pattern` block, validated with Zod at load time; `templateId` remains the persisted identifier. Nine first-release variants are rendered and six deferred variants remain reference-only with production fallbacks.

The block declares family, intent tags, required/optional content fields, image slots, copy limits (including field-specific limits), density, supported modes, a known renderer variant, and selection guidance. The authoritative types are in `src/lib/carousel-templates/schema.ts`; the current field matrix is [[Projects/RepoStudio/docs/carousel-phase-4-0|the pattern field matrix]].

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
  intent?: SlideIntent;
  headline: string;
  body: string;
  patternContent?: CarouselSlide["patternContent"];
  preferredPatternIds?: string[];
}
```

The deterministic pattern-selection module validates the candidates against actual fields, images, content limits, platform, and adjacent-slide rhythm. Invalid LLM choices produce warnings and a compatible fallback.

## Delivery phases

### What this means for users

Phase 4.0 prepared the foundation. Phase 4.1 now lets users save separate heading and body typography with a brand, apply it to carousels, and carry the same settings into exports. The nine new layouts are now selectable, with editable structured content and image slots.

The preparation defines how much text each layout accepts, how many items it supports, and where images belong. Chinese, English, mixed-language, long-heading, and missing-image examples give development concrete cases to check. Each first-release layout also has a visual reference, so its appearance has a clear target.

The local creation workflow is now: **choose a brand style → generate content → receive suitable layouts → arrange slides → add images → export consistently**.

| Phase | Available user-facing behavior |
| --- | --- |
| 4.0 — Finished | Preparation only: agreed layout rules, test examples, and visual references. |
| 4.1 — Finished | Set separate heading and body fonts, weights, and sizes; save them with a brand. |
| 4.2 — Finished | Move, duplicate, add, and delete slides while keeping the deck organized. |
| 4.3 — Finished | Choose from the nine new layout types in the editor. |
| 4.4 — Finished | Add images to supported positions and adjust their crops. |
| 4.5 — Finished | Get layouts selected for the content and use an uploaded sample to guide a reusable style. |
| 4.6 — Finished | Get clearer content-fit warnings and more consistent preview, PNG, and PDF output. |

For each future phase, record its user-visible result and verification when marking it finished. A useful release note states what the user can now do and any remaining limits.

### Implementation status — 2026-11-20

Development Phases 4.0–4.6 are finished locally on `feature/carousel-phase-4-0`. Each row records its implementation commit. The branch remains for review; no hosted deployment or merge was performed. [[Projects/RepoStudio/docs/carousel-release-verification|Release verification]] records the current checks and remaining limits.

| Phase | Status |
| --- | --- |
| 4.0 — Development preparation and golden fixtures | Finished — 2026-11-20, `c6e8a63` |
| 4.1 — Brand typography and built-in font library | Finished — 2026-11-20, `8b39a58` |
| 4.2 — Deck operations and narrative arrangement | Finished — 2026-11-20, `ccb759e` |
| 4.3 — Pattern registry and production renderers | Finished — 2026-11-20, `f4f0f75` |
| 4.4 — Image assets and declared slot controls | Finished — 2026-11-20, `f4f0f75` |
| 4.5 — LLM pattern routing and reference-style ingestion | Finished — 2026-11-20, `a78d51b` |
| 4.6 — Content fit, export parity, and release hardening | Finished — 2026-11-20, `6c4c827` |

Current validation: **70 unit/contract tests and 16 browser tests pass**, TypeScript and changed-file ESLint have no errors, and the production build succeeds. Twenty-seven actual golden captures were reviewed. Legacy and Chinese PNG/PDF downloads were checked; all 14 PDF page images exactly match their corresponding PNG exports. Preview/PNG comparisons allow a small documented rasterization tolerance.

Remaining release work: verify live text/vision providers and persistent hosted image storage, review the branch, and resolve the existing Instagram/Threads/YouTube source-loading gaps recorded in [[Projects/RepoStudio/docs/standard-manual-test|the source checklist]]. These are not marked as verified by local development.

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

Status: **Finished** — 2026-11-20. Implementation commit: `a78d51b`.

Users can create both carousel formats from an Agent Chat brief, choose Automatic patterns, inspect layout-selection reasons, and confirm an analyzed sample before saving reusable visual traits. Reference palettes and spacing guide supported layouts while brand typography stays independent. See [[Projects/RepoStudio/docs/carousel-pattern-routing|Routing and reference workflow]].

Verification: routing/reference contract tests and real-browser brief/reference confirmation checks pass. Demo text generation and local palette analysis were exercised; live external text/vision provider calls remain unverified.

Purpose: let Agent Chat generalize a supplied sample and choose patterns without giving the model unchecked layout authority.

- [x] Expose a compact pattern-registry summary to generation prompts: intent tags, required fields, limits, image requirements, and selection guidance.
- [x] Add semantic slide intents such as `cover`, `claim`, `metric`, `parallel-list`, `comparison`, `flow`, `sequence`, `sequence-summary`, `evidence`, and `cta`.
- [x] Implement deterministic candidate validation and deck-level rhythm scoring after LLM output.
- [x] Extend reference ingestion to produce a `StyleAnalysisDraft`: palette, type roles, spacing character, chrome, pattern candidates, and image treatment.
- [x] Require user confirmation before saving an analyzed sample as a reusable style family or brand preset.
- [x] Strip creator handles, copied wording, logos, and unverified claims from imported references.
- [x] Record why a pattern was chosen and surface a concise explanation in the editor for debugging.

Exit gate: **Met for the implemented contracts and local workflow** — the same generated semantic deck routes consistently across repeated runs; invalid pattern choices fall back with visible warnings; uploaded references never become unreviewed executable layout definitions.

### Phase 4.6 — Content fit, export parity, and release hardening

Status: **Finished** — 2026-11-20. Implementation commit: `6c4c827`; final emphasis/font-weight polish: `92b3208`.

Users see measured clipping/overlap warnings, bounded fitting adjustments, compatible simpler-layout suggestions, and Chinese punctuation/orphan-line guidance. Exports wait for fonts/images and stop when text still does not fit. Body text in new patterns stays at least 32 px. Existing preset/draft/layout-pack migrations preserve unrelated data.

Verification: 70 unit/contract tests, 16 browser tests, TypeScript, changed-file ESLint, and the production build pass. Golden coverage includes default/light/dark modes, maximum CJK and English copy, mixed text, missing media, and large brand scales. Actual five-page legacy and nine-page Chinese PDF exports were rasterized and their displayed images compared against PNG downloads. See [[Projects/RepoStudio/docs/carousel-release-verification|the release verification report]] for numerical results and credential/deployment limits.

Purpose: prevent a larger style library from producing fragile output.

- [x] Add a content-fit evaluator using measured rendered bounds, not character count alone.
- [x] Apply bounded adaptations in order: permitted line wrapping → small spacing adjustment → allowed size-scale reduction → compatible lower-density pattern suggestion.
- [x] Add Traditional Chinese punctuation and orphan-line checks.
- [x] Verify preview/export parity with fixed fonts loaded before capture.
- [x] Add visual regression coverage for light/dark mode, long copy, missing optional media, maximum items, and mixed CJK/Latin text.
- [x] Add store migration tests for old drafts, old presets, and old layout packs.

Exit gate: **Met for local portrait rendering** — no first-release golden fixture clips, overlaps, or exports with a missing font; existing saved drafts still open.

## Implementation map

| Area | Primary files |
| --- | --- |
| Contracts | `src/lib/types.ts`, `src/lib/ai.ts`, `src/lib/carousel-templates/index.ts`, `src/lib/carousel-templates/manifest.v1.json` |
| Brand theme | `src/lib/presets.ts`, `src/lib/store.ts`, `src/lib/carousel-fonts.ts`, `src/lib/carousel-brand-theme.ts` |
| Deck commands | `src/lib/carousel-deck-operations.ts`, `src/components/studio/carousel-editor.tsx` |
| Pattern rendering | `src/components/studio/carousel-preview.tsx`, `src/components/studio/edwardai-slide-layouts.tsx`, `src/components/studio/carousel-patterns/` |
| Image assets | new image upload route, store migration, new slide-media resolver and controls |
| Generation | `src/lib/ai.ts`, `src/app/api/generate/route.ts`, style-extraction route or a new reference-analysis route |
| Verification | Vitest suites beside each module, golden fixtures under a dedicated test fixture directory, manual export checklist |

## Testing strategy

Test through each module’s public interface.

Ongoing app changes must pass [[Projects/RepoStudio/docs/testing/regression-smoke|the reusable regression smoke suite]]. Run `npm run test:smoke`, record all 15 desktop cases in the newly created run, and validate with `npm run test:smoke:check -- <run-directory>`. Historical walkthrough results below remain evidence for their original run.

Desktop follow-up completed on 2026-11-20: installed agent-desktop and Windows CLI 1.3.1; all 15 defined local desktop cases passed after the user confirmed the test tab could remain untouched. Verified native upload, slide commands and limits, export guards, crop controls, font persistence after reload, reference review/approval, demo brief creation, five native PNGs and a nine-page Chinese PDF. Retained 12 desktop screenshots, 209 command records and two HTML traces with 1,336 events. Chrome saved files in its existing download folder; custom Save As path entry through accessibility did not commit, so the actual downloads were located and copied into evidence. The supplementary automated rerun passed 70 unit/contract tests and 16 browser tests. Development phases and the scoped desktop walkthrough are finished; live provider and hosted release checks remain open. See [[Projects/RepoStudio/docs/testing/agent-desktop-2026-11-20/README|the case-by-case desktop test log]] and [[Projects/RepoStudio/docs/carousel-release-verification|the verification report]].

- Contract tests: manifest entries parse and every rendered pattern maps to a renderer.
- Property-style deck tests: any command sequence preserves ids, numbering, and cover/CTA invariants.
- Theme tests: every font id resolves to an installed family plus a CJK-safe fallback.
- Media tests: slot compatibility, required/optional behavior, focal-point clamping, shared-asset retention.
- Selection tests: structured data selects the expected family; invalid LLM candidates fall back deterministically.
- Render tests: maximum-content fixtures at 1080 × 1350, then PNG/PDF parity checks.
- Regression tests: the Instagram Default pack continues making every slide use the slide-1 cover layout and light appearance while retaining each slide’s content.

## Delivered implementation slices

The work was delivered in these implementation slices; their commits are recorded in the phase table.

1. [x] Pattern schema, manifest validator, and fixtures.
2. [x] Font registry plus brand typography persistence.
3. [x] Shared brand-theme resolver wired into existing renderers.
4. [x] Deck command module plus reorder controls.
5. [x] Shared pattern primitives and four text-only patterns.
6. [x] Image asset persistence and slot controls.
7. [x] Four image-capable patterns.
8. [x] LLM intent and deterministic pattern selection.
9. [x] Reference-style analysis and confirmation flow.
10. [x] Content-fit evaluator, golden review, and migration hardening.

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

## Development completion and release handoff

All planned local development phases are finished. The first release contains nine selectable patterns, eight curated fonts, a 3–12 editable-slide range, 10 MB PNG/JPEG/WebP uploads, reference confirmation, deterministic routing, and measured portrait export checks. The authoritative behavior and limits are recorded in the implementation and [[Projects/RepoStudio/docs/carousel-release-verification|verification report]].

The next work is review and deployment verification: configure and exercise live model providers, provide persistent storage for image files, and resolve the source-fetch gaps. Square-format decks remain available with fit warnings; the new library's primary verified geometry is 1080 × 1350. Do not interpret finished development as a completed hosted rollout.


## Finished follow-up: OpenRouter settings ? 20 November 2026

Status: **finished locally**. Implemented on `feature/carousel-phase-4-0` against base commit `2549b07`; these follow-up changes are uncommitted and unpublished. No PR merge or hosted rollout is implied.

- [x] Add Settings controls to save, replace, test and remove an OpenRouter key, with independent writing and reference-image model IDs.
- [x] Store credentials privately on the server, encrypted separately from the app store; return safe connection status only and keep the saved password field empty.
- [x] Apply saved settings immediately to ideation, Agent Chat/content generation and reference analysis; preserve environment fallback on removal.
- [x] Display the active model/configuration link instead of a static model constant; label configured-provider failures as demo fallbacks with guidance to Settings.
- [x] Remove the hard DeepSeek routing restriction and retain validated structured slide fields in OpenRouter output.
- [x] Add permanent D16 settings regression coverage and complete the full regression gate: **90 unit/contract tests, 17 browser tests and all 16 native desktop cases passed**. TypeScript, focused ESLint and the production build passed. Evidence: [[Projects/RepoStudio/docs/testing/runs/2026-11-20T11-35-30-845Z-2549b07-28ae21/README|OpenRouter regression run]].

### What this means for users

Open Settings, paste your OpenRouter key, choose the models, test the connection, then save. Your next carousel can use your account immediately without editing environment files or restarting the app. Writing and image-reference analysis can use different models. Leave the key blank to change models while keeping the saved key; remove the connection to restore the environment configuration or demo mode. A saved key is configured, not automatically validated; Test connection checks key acceptance and model availability without generating content.

Real-key acceptance, credit permissions and live text/vision quality remain release checks because no real key was supplied. For hosted settings, persist the private data directory on a durable server volume or use environment credentials. Existing source-loading gaps remain recorded in [[Projects/RepoStudio/docs/standard-manual-test|the source-flow checklist]].


### 21 November 2026 regression attempt

The current working tree's automated smoke stage was attempted before commit. Fixture preflight passed; Vitest had 88 passes and 2 timeout failures (store-save and 	ranscript-ideation), while Playwright had 15 passes and 1 Agent Chat generation failure. The desktop cases were not run and the validation gate remains incomplete. Evidence: [[Projects/RepoStudio/docs/testing/runs/2026-11-21T08-36-13-601Z-2549b07-18520d/README|21 November smoke run]]. Retry after resolving the failures; do not treat the prior OpenRouter run's results as verification of this working tree.
