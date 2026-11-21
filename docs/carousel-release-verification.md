---
type: project-report
date: 2026-11-20
status: complete
tags: [repostudio, carousel-release, verification]
---

## Phase 4 local verification

The workflow in [[Projects/RepoStudio/docs/carousel-next-phase-development-plan|the development plan]] is implemented locally: saved brand typography, slide arrangement, nine graphics styles, image slots and crops, automatic pattern selection, reviewed reference traits, and content-fit checks before export.

| Check | Result |
| --- | --- |
| Vitest | 70 tests pass across 16 files. Includes manifest contracts, selection, deck commands, media, typography, migration defaults, storage fallback, and transcript generation. |
| Browser suite | 16 tests pass: brand save/reload, keyboard arrangement, image upload/crop/retention, pattern captures, maximum CJK/English and mixed content, missing images, reference confirmation, brief creation, overflow blocking, and export. |
| Golden captures | 27 actual 1080 × 1350 browser captures: nine default, nine light, and nine dark. Contact sheets were visually reviewed. The earlier Phase 4.0 SVG/PNG references remain design targets. |
| Large typography | Maximum-content slides fit after bounded adaptation; measured body text stays at least 32 px. |
| Export files | Five legacy PNGs and a five-page PDF, plus nine Chinese pattern PNGs and a nine-page PDF. PNG dimensions are 1080 × 1350. PDF page boxes are 810 × 1012.5 points, corresponding to that geometry at 96 dpi. |
| Preview to PNG | Mean absolute channel difference: 0.166 for the legacy cover and 0.817 for the Chinese cover, on a 0–255 scale. Both are below the test tolerance of 1.5; this allows rasterization differences and is not a claim of identical pixels. |
| PNG to PDF | All 14 displayed PDF page images were extracted and compared with their PNG exports: total channel difference zero. Chinese PDF pages were rasterized for visual review. |
| TypeScript | Pass. |
| ESLint | Changed files have no errors. Image-element warnings remain where direct image elements are needed for capture. |
| Production build | Pass; migration script reports nothing to do. Runtime data files are excluded from build-time tracing. |
| Production smoke | Home and presets return 200; the development fixture page returns 404; no hydration or page errors were observed on the home page. |

## Content fitting and compatibility

The editor and export measure rendered text boxes for clipping and overlap. New patterns use strict Chinese line breaking and bounded spacing/type adjustments. Changes to fit are reported in the editor; fitting does not rewrite the saved brand. If content still overflows, export stops with an explanation and the editor offers a compatible lower-density layout when one preserves the required fields. Chinese punctuation and orphan lines are checked in both copy and rendered lines.

Fonts and images finish loading before capture. Export embeds actual computed font families and only Unicode subsets needed by the slide, including Traditional Chinese. Both file formats use the same full-resolution DOM and crop resolver.

Old presets and drafts receive versioned typography defaults; serif drafts retain a serif heading choice. Source content, slide IDs/media, and old layout-pack sequences remain intact. Editorial headings support safe `**phrase**` highlighting; source markup is escaped. Font settings normalize unsupported weights before saving.

The former Windows permissions test now uses a blocked directory path rather than platform-dependent `chmod`, while still verifying the actual storage fallback. Transcript content is normalized before generation so timestamp markers do not enter beats or carousel copy.

## Desktop-skill follow-up — 2026-11-20

**Earlier attempt, before the installation and partial native walkthrough recorded below.**

The requested desktop walkthrough is **blocked by the desktop runtime**, not passed. Neither `.agents/skills/agent-desktop/SKILL.md` nor `.agents/skills/agent-desktop-linux/SKILL.md` is installed, and `agent-desktop` is absent from PATH. The available Windows computer-use skill initialized, but `sky.list_apps()` could not reach its native helper. The alternate desktop-surface inventory failed with the same error:

```text
Computer Use native pipe is unavailable: failed to connect native pipe: The system cannot find the file specified. (os error 2)
```

No app-window clicks, typing, or visible desktop walkthrough were performed. Once native desktop control is available, repeat the visible typography save/reload, slide arrangement, image-slot/crop, reference review, overflow, and export walkthrough.

The existing automated strategy was rerun separately: **70 unit/contract tests passed across 16 files, and all 16 Playwright browser tests passed in 33.4 seconds**. The browser rerun included both export scenarios and retained preview/PNG mean channel differences of 0.166 and 0.817. These are automated-browser results and do not count as desktop-skill validation.

## Installed agent-desktop follow-up - 2026-11-20

The requested skills are now installed from `vercel-labs/agent-desktop` at `e8934a5e95e1d212c74ead95cd3e4701c04eca31`, together with the working Windows CLI version 1.3.1. Project skill junctions resolve to the global installation. This supersedes the earlier missing-skills/CLI blocker; the separate built-in computer-use helper was not repaired or needed for these native actions.

The completed walkthrough passed all 15 defined local desktop cases. The first run passed nine cases; after the user confirmed an uncontended test tab, the follow-up verified native file upload, typography save/reload, reference approval, demo brief creation, a nine-page Chinese PDF and all five legacy PNG downloads. Captured 12 desktop screenshots, 209 commands and two HTML traces with 1,336 events. Font settings persisted as Lora headings and Inter body text after reload; the temporary QA brand was then removed. Local reference approval disabled generation until confirmation; brief creation clearly reported demo output.

A fresh supplementary rerun passed **70 Vitest tests across 16 files in 4.53 seconds and all 16 Playwright tests in 34.4 seconds**. No golden baselines changed. The case-by-case actions, expected/actual results, interruptions, screenshots, command log, artifact hashes and copied automated exports are in [[Projects/RepoStudio/docs/testing/agent-desktop-2026-11-20/README|the agent-desktop test log]]. All defined desktop cases are now finished; local development completion is unchanged. The desktop runtime did not commit custom Save As paths. Chrome saved in `Downloads/.cursor`; native download history located the actual files, which were copied into evidence and inspected. The PDF contains nine 810 x 1012.5-point pages, all rendered for review; all five native PNGs measure 1080 x 1350 and were visually reviewed. This tooling limitation is documented separately from successful application export.

## Remaining release checks

- Live text/vision provider quality and credential-dependent behavior were not independently certified by this run. Demo/local palette paths remain labeled in the interface.
- Hosted deployment was not performed. Image files need persistent storage, as documented in [[Projects/RepoStudio/docs/carousel-image-assets|image storage and retention]].
- [[Projects/RepoStudio/docs/standard-manual-test|The source-flow checklist]] records passes for X, LinkedIn, and pasted transcripts, and existing failures for Instagram caption loading, Threads profile loading, and the YouTube transcript link. These source-fetch gaps remain open; pasted source text is available.
- The new pattern library is verified primarily at 1080 × 1350. Square output remains available, with measured fit checks that may ask for shorter copy or another layout.

Reproduce with `npx vitest run`, `npx playwright test` against the local server on port 3100, and `npm run build`. Golden updates require explicit `--update-snapshots`; review changed captures before accepting them. The source checklist can be rerun with `node scripts/check-source-flow.mjs`.


## OpenRouter settings follow-up ? 20 November 2026

The local enhancement is finished: Settings now accepts a private OpenRouter API key and separate text/reference-image model IDs, supports a no-generation connection check, applies saved configuration without a restart, and can remove the saved configuration. Keys are encrypted in the private data directory, excluded from API status responses, and never prefilled into the browser. Environment configuration remains available. The studio displays the current model/configuration link, and a failed configured generation reports the demo fallback explicitly.

[[Projects/RepoStudio/docs/testing/runs/2026-11-20T11-35-30-845Z-2549b07-28ae21/README|OpenRouter regression run]] passed the mandatory completion gate with **90 Vitest tests across 18 files, all 17 Playwright tests in 40.1 seconds and all 16 fresh native cases**. The new tests cover saved-key consumer routing into ideation and both carousel formats, private persistence/redaction, blank-key model updates, environment fallback, auth/origin/input checks and mocked provider success/error branches. `npx tsc --noEmit`, focused ESLint and `npx next build` passed; no database migration was required or run for this change. Golden images were not updated.

The native walkthrough used only a synthetic key and removed it afterward. Both model IDs persisted through reload while the key field displayed its empty saved-key placeholder; removal returned the app to demo mode. The temporary QA brand was removed. A synthetic proof image and an explicitly reviewed reference style remain locally. Actual exports include five visually reviewed 1080 ? 1350 PNGs and a nine-page Chinese PDF with 810 ? 1012.5-point pages, all rendered and reviewed. The run retains 1,038 trace events, raw commands, screenshots and export inspections. Initial interrupted/failed/stale attempts are retained separately; they are not counted as passes.

No real credential, live paid generation, hosted persistence, PR merge or deployment was verified. All code remains local and uncommitted on the existing feature branch. The real-key and source-flow release checks above remain open.
