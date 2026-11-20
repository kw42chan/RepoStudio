---
type: project-spec
date: 2026-11-20
status: active
tags: [repostudio, carousel-contracts, phase-4]
---

## Phase 4.0 pattern field matrix

Source of truth: `src/lib/carousel-templates/manifest.v1.json`. Stable identifiers remain `templateId`. All new patterns are reference-only, excluded from selection, with a rendered fallback. First release selects nine patterns. Deferred rows preserve the remainder of both reference documents.

Counts use Unicode code points including punctuation and spaces. Limits are proposed upper bounds; Phase 4.3 must confirm measured fit. Minimum item counts are structural requirements. No minimum headline length is enforced.

| Identifier / family | Release / intent | Required; optional fields | Limits: heading/body; items; item title/body | Image slots (ratio, fit, required) | Modes / renderer |
| --- | --- | --- | --- | --- | --- |
| `signal-statement` / editorial-signal | first / claim | headline; body | 46/38; 0-0; 9/15 | None | light, dark / reference-only |
| `signal-numbered-list` / editorial-signal | first / parallel-list | headline, items; body | 42/34; 3-3; 9/15 | None | light, dark / reference-only |
| `signal-vertical-timeline` / editorial-signal | first / sequence | headline, items; body | 42/34; 2-6; 21/21 | None | light, dark / reference-only |
| `signal-horizontal-timeline` / editorial-signal | first / sequence-summary | headline, items; body, outcome | 42/34; 3-5; 7/13 | timeline-1 (1, cover, optional); timeline-2 (1, cover, optional); timeline-3 (1, cover, optional); timeline-4 (1, cover, optional); timeline-5 (1, cover, optional) | light, dark / reference-only |
| `spec-ab-comparison` / specification-editorial | first / comparison | headline, items; body, recommendation | 42/38; 2-2; 18/60 | example-a (1.33, contain, optional); example-b (1.33, contain, optional) | light, dark / reference-only |
| `signal-metric-evidence` / editorial-signal | first / metric | headline, metric, items; body, unit | 42/38; 2-4; 18/30 | evidence-left (1, contain, required) | light, dark / reference-only |
| `signal-collage-cover` / editorial-signal | first / cover | headline, items; body, badge | 42/34; 2-4; 18/30 | hero-right (0.8, contain, required); support-bottom-center (1.33, contain, optional); support-bottom-right (1.33, contain, optional) | light, dark / reference-only |
| `story-prompt-outcome` / warm-storyboard | first / transformation | headline, prompt, items; body, takeaway | 42/38; 4-4; 12/26 | result-preview (1.6, contain, required) | light, dark / reference-only |
| `signal-cta` / editorial-signal | first / cta | headline, action; none | 32/1; 0-0; 12/20 | None | light, dark / reference-only |
| `signal-three-node-flow` / editorial-signal | deferred / flow | headline, items; body | 42/38; 3-3; 12/26 | None | light, dark / reference-only |
| `spec-audit-checklist` / specification-editorial | deferred / audit | headline, items; body, question | 42/38; 3-6; 22/30 | None | light, dark / reference-only |
| `spec-design-panel` / specification-editorial | deferred / specification | headline, items; body, question | 42/38; 3-5; 30/45 | None | light, dark / reference-only |
| `spec-command-playbook` / specification-editorial | deferred / command | headline, command, items; body, question | 42/38; 2-5; 18/45 | None | light, dark / reference-only |
| `story-value-chain` / warm-storyboard | deferred / flow | headline, items; body, question | 42/38; 3-3; 18/40 | stage-1 (1, cover, required); stage-2 (1, cover, required); stage-3 (1, cover, required) | light, dark / reference-only |
| `midnight-dual-system` / midnight-contrast | deferred / comparison | headline, items; body, quote | 42/38; 2-2; 18/60 | left-panel (1.33, contain, optional); right-panel (1.33, contain, optional) | dark / reference-only |

## Fixtures and visual references

Fixture decks cover Traditional Chinese, English, mixed copy, maximum permitted content, over-limit headings, missing images, and twelve slides. The fixture contract is semantic preparation data, not persisted application drafts. All assigned fixture images use a synthetic evidence card; no external assets are required.

Golden PNGs under `docs/carousel-phase-4-0/golden/` are 1080 × 1350 design references, generated from the first-release manifest contracts by `npm run carousel:references`. They are not captures of production renderers. Phase 4.3 must compare actual rendered output against them before enabling selection. Every reference has an SVG source and behavior entry in `golden/index.json`. The maximum-content cases remain contract fixtures; measured overflow checks belong to Phase 4.6.

Reference typography: 48 px / 700 family headings, 72–80 px display statements, 36 px / 500 body copy, and 24–32 px metadata; the evidence metric uses 150 px / 800. Arial is the default with Microsoft JhengHei fallback for Traditional Chinese. Specification Editorial and Warm Storyboard use Georgia family headings. Exact sizes live in each SVG. These system-font references establish geometry; Phase 4.1 supplies the curated, licensed font library. Gray cards are synthetic image placeholders; the index records intended contain/cover behavior, optional-slot absence, and required-slot blocking for production. The references do not implement real media cropping.

Verification: all nine images were visually reviewed as a contact sheet. There are 36 passing focused tests; TypeScript and changed-file ESLint pass. The full suite has 53 passes and one existing Windows permissions failure in `store-save.test.ts`. No application UI or generation flow changed in this phase.

Related: [[Projects/RepoStudio/docs/carousel-next-phase-development-plan|Development plan]], [[Projects/RepoStudio/docs/isaac-editorial-carousel-patterns|Editorial Signal]], [[Projects/RepoStudio/docs/structured-editorial-carousel-patterns|Structured Editorial]].
