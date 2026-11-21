---
type: project-test-log
date: 2026-11-20
status: complete
tags: [repostudio, desktop-qa, carousel-phase-4]
---

## Outcome

Reusable cases and future-run instructions now live in [[Projects/RepoStudio/docs/testing/regression-smoke|the regression smoke suite]]. This dated report preserves the original execution and its evidence.

Installed the requested agent-desktop skills and Windows CLI, then exercised [[Projects/RepoStudio/README|RepoStudio]] through native Windows UI Automation. **All 15 defined desktop cases passed within the scope below.** The initial run passed nine cases; after the user confirmed the test tab would remain untouched, the follow-up completed upload, PDF inspection, typography persistence, reference approval, demo brief creation and PNG downloads.

Captured **12 desktop screenshots**, **209 command records**, and **two HTML traces containing 1,336 events**. Native exports include five 1080 x 1350 PNGs and a nine-page Chinese PDF. Chrome saved these in its existing `Downloads/.cursor` directory; copies are retained with the evidence. Setting a custom Save As path through accessibility did not commit that path, so arbitrary download-location automation remains a tooling limitation, not a passed assertion.

Separately, a fresh rerun passed **70 Vitest tests across 16 files** and **16 Playwright tests**. These automated results supplement the independently observed desktop cases. See [[Projects/RepoStudio/docs/carousel-release-verification|the release verification report]] and [[Projects/RepoStudio/docs/carousel-next-phase-development-plan|the development plan]].

## Installation and environment

- Skill source: https://github.com/vercel-labs/agent-desktop.git, pinned to `e8934a5e95e1d212c74ead95cd3e4701c04eca31`.
- Installed `agent-desktop`, `agent-desktop-windows`, and `agent-desktop-linux` under `C:/Users/curab/.codex/skills/`; project `.agents/skills/` junctions point to them. The Linux guide was read to satisfy the project instructions; Windows rules governed this run.
- Installed runtime with `npm install -g agent-desktop`: version **1.3.1**, JSON envelope protocol **2.6**. The Node launcher works; npm did not approve its optional native-link postinstall, adding launcher overhead. No reinstall was needed for operation.
- Runtime status: Windows accessibility granted; automation and screen-recording permissions reported `not_required`.
- Application: local development server at `http://localhost:3100`; disposable `/dev/carousel-fixtures` page. Application commit `2549b07`, branch `feature/carousel-phase-4-0`. No application implementation changed during this test session.
- Native sessions: `run-1795158256325-20864-0` and follow-up `run-1795159610805-19480-0`, both ended after captures. Actions used semantic accessibility calls, fresh references and readbacks. The follow-up also used normal foreground-gated `press` commands for Enter, reload and download history. No `--headed` fallback, pointer coordinates or CDP automation was used.
- Times in `commands.jsonl` are UTC; this session occurred on 2026-11-20 in Asia/Hong_Kong.

## Desktop cases and evidence

Evidence numbers below are command-label prefixes in [the chronological command log](commands.jsonl). JSON snapshots and screenshots are local, gitignored artifacts under `private/`.

| ID | User action and expected result | Observed result | Status | Evidence |
| --- | --- | --- | --- | --- |
| D01 | Open a separate test tab and navigate to the fixture page. | Native omnibox SetValue and suggestion Click opened the local fixture editor; initial deck had five slides. | PASS | 010-015 |
| D02 | Duplicate slide 1; retain its copy and select the duplicate. | Deck increased from 5 to 6; selected slide 2 retained `Clear idea 1` and its body. | PASS | 016-018; [screenshot](private/duplicate.png) |
| D03 | Move that duplicate right. | Selection moved from slide 2 to slide 3; headline/body and six-slide count remained. | PASS | 019-020 |
| D04 | Delete the selected duplicate. | Count returned to 5; next selected content was `Clear idea 3`. | PASS | 021-022 |
| D05 | Add a slide. | Count increased to 6; inserted slide 4 contained `New takeaway` and supporting placeholder copy; CTA remained last. | PASS | 023-024 |
| D06 | Load a 12-slide deck; prevent exceeding the limit. | Twelve numbered slide buttons were present; Add Slide and Duplicate slide were disabled. | PASS | 051-052 |
| D07 | Load missing required images, then export PDF. | Export stopped with `Add an image to hero right before exporting.` This checks the displayed guard; the run did not monitor every possible filesystem destination. | PASS | 027-031; [screenshot](private/missing-image-block.png) |
| D08 | Load an overlong heading, then export PDF. | Inline validation and export alert both requested `Shorten the heading to 42 characters.` | PASS | 046-050; [screenshot](private/overflow-block.png) |
| D09 | Change a synthetic Chinese cover image's horizontal focus and zoom. | Focus changed 0.5 to 1; zoom changed 1 to 1.5, retained across fresh snapshots and scrolling. Screenshot shows the controls; final screenshot shows Chinese text and the cropped synthetic image. Pixel-level crop correctness remains covered by Playwright, rather than claimed from control readback alone. | PASS, controls/readback | 053-063; [controls](private/chinese-crop.png), [preview](private/final-desktop.png) |
| D10 | Export the nine-slide Chinese deck, locate its actual download and inspect the PDF. | Follow-up export completed; Chrome's Show in folder revealed `Downloads/.cursor/instagram-carousel-1080x1350 (1).pdf`, 39,372,806 bytes. Copied it into the evidence folder. PDF parsing confirmed nine 810 x 1012.5-point pages; all nine were rendered and visually reviewed. Custom destination entry did not commit and is excluded from this pass. | PASS, export and file inspection | 096-118; [PDF metadata](native-pdf-check.json), [PDF](private/desktop-chinese-verified.pdf), [rendered pages](private/native-pdf-pages/contact-sheet.png) |
| D11 | Upload the repository's synthetic proof image through the native file picker. | Follow-up opened the picker, set its filename text field to the repository fixture and submitted with foreground-gated Enter. The editor's saved-image selector then showed `carousel-proof.png`; crop controls reset for the new upload. This supersedes the interrupted initial attempt. | PASS | 078-093; [screenshot](private/upload-success.png) |
| D12 | Save/reload independent heading/body fonts through native controls. | Created `Desktop QA 2026-11-20`, chose Lora headings and Inter body text, saved, reloaded the browser, and verified both values persisted. The preview showed serif headings and sans body text. Removed only this temporary QA brand afterward. | PASS | 151-177; [screenshot](private/fonts-persisted.png) |
| D13 | Review and confirm reference traits before saving. | Uploaded the synthetic proof image. The local-palette review displayed abstract traits and warnings; Create carousels was disabled until explicit confirmation. Confirmation produced `Reviewed style saved and selected for this brief.` and enabled generation. Earlier API tests separately checked server enforcement and source-image exclusion. | PASS, local review flow | 135-150; [before](private/reference-review.png), [after](private/reference-confirmed.png) |
| D14 | Create both carousel formats from an Agent Chat brief. | Filled the factual QA brief, created demo carousels, observed both Instagram and LinkedIn tabs and `Created demo carousels. Connect a language model for generated content.` This validates local/demo creation, not live model quality. | PASS, demo flow | 123-134; [screenshot](private/brief-created.png) |
| D15 | Download a complete PNG deck and inspect its files. | Exported all five legacy slides through native Save As dialogs. Accepted Chrome's localhost multiple-download prompt. All five actual downloads were copied into evidence and verified at 1080 x 1350; the contact sheet was visually reviewed. Preview/PNG numerical parity and the nine-slide Chinese PNG deck retain supplementary Playwright coverage. | PASS, five-slide native deck | 178-209; [PNG metadata](native-png-check.json), [contact sheet](private/native-png-contact-sheet.png), [desktop](private/native-export-complete.png) |

## Interruptions and tool limits

1. Initial explicit trace-file commands were refused before delivery: `Trace path must be a private user-owned regular file with one link`. Switched to the CLI's supported private session tracing, without weakening filesystem permissions.
2. Automatic approval review rejected the dedicated Chrome-for-Testing launch with `blocked by policy`, without a further reason. That process launch was not retried through another tool. Existing Chrome's native New tab control was used instead.
3. Chrome state changed outside recorded actions: the initial new tab was replaced by another active page, and the file picker later closed with a different image selected. A stale action was not replayed blindly. The user was asked to leave the test tab untouched; the remainder used freshly loaded synthetic fixtures.
4. File-picker Open initially had duplicate native identities. The installed common skill says: `Never switch to headed mode to recover from a headless failure.` No headed fallback was attempted. The follow-up instead verified the filename field and used the CLI's normal foreground-gated Enter command. The upload then passed; an exact-focus refusal when another picker was already open prevented a key from reaching the wrong window.
5. Missing-image export's later screenshot showed slide 9 selected although validation identified the cover's missing image. The next action explicitly reselected the cover. Treat this as an observed selection change, not an independently diagnosed application defect.
6. The PDF and first PNG save dialogs' displayed custom paths did not establish delivery to those paths, including after targeting the nested text field. Chrome saved the original filenames in its existing `Downloads/.cursor` folder. Native download history and Show in folder established that location; filesystem checks and PDF/PNG inspection then verified the actual artifacts. Export passes; custom-path entry through this runtime remains unverified.
7. The first PNG triggered Chrome's multiple-download prompt. Semantic Allow left that button focused without dismissing the prompt. A normal foreground-gated Enter accepted it; the remaining four native save dialogs then completed. The localhost multiple-download permission remains allowed for subsequent carousel exports.
8. Expanding native font selectors and clicking observed option refs worked after an initial select command returned no matching item. The saved values were checked after browser reload, rather than inferred from a transient selector readback.

## Automated rerun and capture inventory

| Command | Result | Evidence |
| --- | --- | --- |
| `npx.cmd vitest run` | Exit 0; 70 tests, 16 files; 4.53 seconds. | [Vitest log](vitest.log) |
| `npx.cmd playwright test` | Exit 0; 16 tests; 34.4 seconds. | [Playwright log](playwright.log) |

The browser suite covered brand persistence, shared image retention, golden patterns, keyboard arrangement, maximum Chinese/English and mixed content, missing images, reference approval enforcement, brief creation, overflow blocking, large typography and both export formats. Preview/PNG mean channel differences were **0.1663198445** for legacy and **0.8168125286** for Chinese, below tolerance 1.5. The 27 existing golden images were checked without updating baselines. Build, deployed behavior, live provider quality and source-link gaps were not re-certified in this installation/test run.

- [Case results and assertions](results.json): 15 explicit desktop checks against saved snapshots and actual exported files, preserving initial statuses and evidence where a follow-up resolved them.
- [Command log](commands.jsonl): UTC time, CLI arguments, exit code, and raw-result location. Numbers 003-004 correspond to setup/rejected-launch work outside the successful wrapper log; gaps are intentional.
- [Initial HTML trace](private/desktop-trace.html): 518 events. [Follow-up HTML trace](private/desktop-followup-trace.html): 818 events. Both sessions were sealed; no automatic screenshots are embedded. Twelve separately captured desktop screenshots are linked above or listed in the inventory.
- [Artifact inventory](artifacts.json): SHA-256 and byte counts for screenshots, native outputs, trace, and copied automated exports.
- `private/automated/`: durable copies of the automated 14 PNG slides, two PDFs, preview captures and brand screenshot, originally produced in `test-results/`. Native downloads and rendered PDF pages are stored separately in `private/`.
- Raw whole-window captures may contain unrelated browser chrome. They remain local and gitignored; only the sanitized case log, command arguments and result summaries are intended for repository review. This is an action/screenshot log, not a video recording.

## Completion and limits

The 15 defined desktop cases are finished. This is a scoped local walkthrough supported by unit/API/browser tests, not exhaustive desktop fuzzing or a hosted rollout. Live model-provider quality, deployment, persistent hosted image storage and the previously documented source-link gaps remain release work in [[Context/todo|open tasks]]. The custom Save As path limitation above belongs to the desktop tooling and does not prevent verified exports through Chrome's existing folder.

Test state: the temporary QA brand was deleted. The synthetic uploaded proof asset and confirmed `Reviewed reference style` remain in the local library for review. The five native PNGs and two attempted native PDFs also remain in Chrome's existing download directory, with the verified files copied here. No real user brand was edited, no content was published, no application implementation or golden baseline changed, and no Git changes were pushed.
