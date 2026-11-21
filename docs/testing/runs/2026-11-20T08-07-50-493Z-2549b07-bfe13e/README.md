---
type: regression-test-run
date: 2026-11-20
status: active
tags: [repostudio, regression, smoke-tests]
---

## Run outcome

Overall: **awaiting_desktop**. Automated success alone leaves desktop checks pending.

Specification: [[Projects/RepoStudio/docs/testing/regression-smoke|regression smoke suite]].

- Started (UTC): 2026-11-20T08:07:50.493Z
- Application base commit: 2549b077b86db2d877b6bc5455f80cbfae97adbd; branch: feature/carousel-phase-4-0
- Source/test fingerprint: `2a553c5038de18988f8fab80b4acfefd0fc599bd6daf6b9018c23f87652fb70a`
- Node: v22.23.2; platform: win32
- Fixture preflight: passed
- Vitest: passed; exit: 0; [log](private/vitest.log)
- Playwright: passed; exit: 0; [log](private/playwright.log)
- Validated: pending

## Desktop observations

| ID | Case | Status | Actual result | Evidence |
| --- | --- | --- | --- | --- |
| D01 | Open editor | not_run |  |  |
| D02 | Duplicate slide | not_run |  |  |
| D03 | Move slide | not_run |  |  |
| D04 | Delete slide | not_run |  |  |
| D05 | Insert slide | not_run |  |  |
| D06 | Slide limit | not_run |  |  |
| D07 | Required image guard | not_run |  |  |
| D08 | Long-copy guard | not_run |  |  |
| D09 | Image crop controls | not_run |  |  |
| D10 | Chinese PDF export | not_run |  |  |
| D11 | Native image upload | not_run |  |  |
| D12 | Font persistence | not_run |  |  |
| D13 | Reference approval | not_run |  |  |
| D14 | Brief creation | not_run |  |  |
| D15 | Complete PNG export | not_run |  |  |

## Run notes

- Test-tooling-only validation of the new reusable runner. App runtime behavior was unchanged; desktop cases were intentionally not rerun or imported from historical evidence.
- Automated validation passed 75 tests in 17 Vitest files and 16 Playwright tests. The five new gate tests cover valid evidence, pending cases, stale inputs, missing/outside artifacts, failed automation and duplicate IDs.
- Completion command correctly exited 1 for unrun D01; see private/completion-gate.log. Recorder refused an existing label before issuing a CLI command; see private/recorder-overwrite-refusal.log.
- The original completed native walkthrough remains separately documented in docs/testing/agent-desktop-2026-11-20/README.md. This new run remains awaiting_desktop and is not a new desktop certification.

Raw logs, screenshots, native traces, browser traces and exports belong in this run's gitignored `private/` directory. Record each desktop row in `results.json`, then run `npm run test:smoke:check -- docs/testing/runs/2026-11-20T08-07-50-493Z-2549b07-bfe13e` to validate and refresh this report. Historical passes do not fill pending rows.
