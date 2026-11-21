---
type: regression-test-run
date: 2026-11-20
status: complete
tags: [repostudio, regression, smoke-tests]
---

## Run outcome

Overall: **passed**. Automated success alone leaves desktop checks pending.

Specification: [[Projects/RepoStudio/docs/testing/regression-smoke|regression smoke suite]].

- Started (UTC): 2026-11-20T11:35:30.845Z
- Application base commit: 2549b077b86db2d877b6bc5455f80cbfae97adbd; branch: feature/carousel-phase-4-0
- Source/test fingerprint: `a14a370c77744373200550110068e106bd1cecee8ef46f167a2ac89c2cc6fc97`
- Node: v22.23.2; platform: win32
- Fixture preflight: passed
- Vitest: passed; exit: 0; [log](private/vitest.log)
- Playwright: passed; exit: 0; [log](private/playwright.log)
- Validated: 2026-11-20T14:03:38.922Z

## Desktop observations

| ID | Case | Status | Actual result | Evidence |
| --- | --- | --- | --- | --- |
| D01 | Open editor | passed | Fixture editor loaded five slides with Clear idea 1 on the cover and live preview. | [artifact](<private/d01-fixture-state.json>) |
| D02 | Duplicate slide | passed | Duplicate produced six slides, selected body slide 2, preserving Clear idea 1 and its supporting sentence; cover and CTA remained at the ends. | [artifact](<private/d02-after.json>) |
| D03 | Move slide | passed | Move right retained six slides and moved the duplicate and its copy to selected position 3. | [artifact](<private/d03-after.json>) |
| D04 | Delete slide | passed | Delete returned to five slides and selected the following slide with Clear idea 3. | [artifact](<private/d04-after.json>) |
| D05 | Insert slide | passed | Add selected a new body slide at position 4 with New takeaway; six slides, cover first and CTA last. | [artifact](<private/d05-after.json>) |
| D06 | Slide limit | passed | Maximum-slide-count fixture displayed twelve slides; Add Slide and Duplicate slide were disabled. | [artifact](<private/d06-after.json>) |
| D07 | Required image guard | passed | Missing-images fixture blocked PDF export with Add an image to hero right before exporting. | [artifact](<private/d07-guard.json>) |
| D08 | Long-copy guard | passed | Long-headings fixture blocked PDF export with Shorten the heading to 42 characters. | [artifact](<private/d08-guard.json>) |
| D09 | Image crop controls | passed | Set horizontal focus to 1 and zoom to 1.5 on the Chinese hero; selected another slide then returned. Fresh native readback retained both values; screenshot shows Chinese copy and cropped synthetic preview. | [artifact](<private/d09-readback.json>), [artifact](<private/d09-crop.png>) |
| D10 | Chinese PDF export | passed | Saved the native Chinese PDF as instagram-carousel-1080x1350 (2).pdf in Chrome's existing Downloads/.cursor directory. Copied actual file; verified nine 810 x 1012.5-point pages and visually reviewed all rendered pages: readable Chinese, images present, no observed clipping or overlap. | [artifact](<private/d10-save-dialog.json>), [artifact](<private/d10-save.json>), [artifact](<private/native-exports/pdf-inspection.json>), [artifact](<private/native-exports/cjk-native.pdf>), [artifact](<private/native-exports/cjk-contact-sheet.png>) |
| D11 | Native image upload | passed | Submitted carousel-proof.png through the native Open picker. An initial forward-slash path was rejected as invalid; dismissed that alert and successfully submitted the Windows backslash path. App selector changed to carousel-proof.png, with preview and crop controls present. | [artifact](<private/d11-picker-correct.json>), [artifact](<private/d11-file-correct.json>), [artifact](<private/d11-submit-correct.json>), [artifact](<private/d11-upload-result.json>), [artifact](<private/d11-upload.png>) |
| D12 | Font persistence | passed | Created only OpenRouter QA 20261120, selected Lora headings and Inter body, saved and reloaded. Both font choices persisted and the preview visibly distinguished them. Deleted this QA brand with the inline confirmation; original brands remained. | [artifact](<private/d12-after-reload.json>), [artifact](<private/d12-fonts.png>), [artifact](<private/d12-delete-confirm-state.json>), [artifact](<private/d16-initial.json>) |
| D13 | Reference approval | passed | Uploaded the synthetic reference through native Open. Review identified locally extracted palette and default typography/layout provenance; creation was disabled before approval. Confirmation saved the reviewed style and enabled creation. | [artifact](<private/d13-review.json>), [artifact](<private/d13-reference-review.png>), [artifact](<private/d13-confirmed.json>) |
| D14 | Brief creation | passed | Created from the factual three-step brief. Both Instagram and LinkedIn tabs appeared; switched to LinkedIn and observed its post-copy editor. Status explicitly said Created demo carousels and linked configuration to Settings. This verifies demo output only. | [artifact](<private/d14-created.json>), [artifact](<private/d14-linkedin-state.json>), [artifact](<private/d14-brief-created.png>) |
| D15 | Complete PNG export | passed | Completed five native Save As dialogs for slides 01-05 with distinct (1) filenames, preserving earlier files. No multiple-download permission prompt appeared in this run. Copied five actual PNGs from Downloads/.cursor; each is 1080 x 1350. Visually reviewed all five: Clear idea 1-5, readable content, correct progress sequence and no observed clipping. | [artifact](<private/d15-save01-state.json>), [artifact](<private/d15-save02-state.json>), [artifact](<private/d15-save03-state.json>), [artifact](<private/d15-save04-state.json>), [artifact](<private/d15-save05-state.json>), [artifact](<private/d15-completed.json>), [artifact](<private/native-exports/png-inspection.json>), [artifact](<private/native-exports/png-contact-sheet.png>) |
| D16 | OpenRouter settings | passed | On the initially unconfigured demo app, saved a synthetic OpenRouter-format key. Reload showed saved configuration and an empty password field (placeholder visible). Changed both text and reference models to openai/gpt-4o-mini with key blank; saved and reloaded, retaining both IDs and saved-key status. Removed saved connection; native UI and API status returned to demo/no key. No synthetic key was sent to OpenRouter; Test connection network branches are covered by mocked contract/browser tests. | [artifact](<private/d16-initial.json>), [artifact](<private/d16-after-reload.json>), [artifact](<private/d16-models-persisted.json>), [artifact](<private/d16-settings.png>), [artifact](<private/d16-removed.json>), [artifact](<private/final-state.json>) |

## Run notes

- All 16 native cases completed after the user confirmed an uncontended Chrome window. Prior interrupted, failed and stale attempts remain separate historical run folders; no observations were copied from them.
- Fresh official agent-desktop Windows session captured semantic actions and foreground-gated key submissions. No headed-mode fallback or browser DOM was used for native cases. Native screenshot invocation first rejected an unsupported --out flag; positional output path succeeded. A picker-open screenshot attempt was refused because two Chrome instances existed; captured only after the picker closed.
- Production build (npx next build), TypeScript and focused ESLint passed. Unit/contract checks cover encrypted persistence, redaction, origin/auth/input guards, environment fallback, saved-key model routing into ideation and both carousel formats, structured slide retention and honest generation-failure notices.
- No real OpenRouter key was supplied. No paid generation or live credential acceptance is certified. OpenRouter public model catalog was consulted to confirm existing defaults. Connection checks use the documented GET /api/v1/key and model catalog; no completions request is made by Test connection.
- Cleanup: synthetic OpenRouter settings and temporary QA brand removed; original demo configuration restored. One synthetic uploaded image and one explicitly confirmed reference style remain in the local library. No content published, no commit/push/merge/deployment performed; test tab left on Settings.
- Native exports were saved to Chrome's existing Downloads/.cursor folder and copied into this run. This run did not attempt custom Save As paths or change browser permissions.
- Existing source-flow failures remain separate from local carousel smoke results: Instagram caption retrieval, Threads profile URL and YouTube transcript link. Source-flow observations are retained under private/source-flow.json.

Raw logs, screenshots, native traces, browser traces and exports belong in this run's gitignored `private/` directory. Record each desktop row in `results.json`, then run `npm run test:smoke:check -- docs/testing/runs/2026-11-20T11-35-30-845Z-2549b07-28ae21` to validate and refresh this report. Historical passes do not fill pending rows.
