---
type: regression-test-run
date: 2026-11-20
status: active
tags: [repostudio, regression, smoke-tests]
---

## Run outcome

Overall: **awaiting_desktop**. Automated success alone leaves desktop checks pending.

Specification: [[Projects/RepoStudio/docs/testing/regression-smoke|regression smoke suite]].

- Started (UTC): 2026-11-20T11:32:40.801Z
- Application base commit: 2549b077b86db2d877b6bc5455f80cbfae97adbd; branch: feature/carousel-phase-4-0
- Source/test fingerprint: `9c5bc0db5580eb536e8ddd42f22ec5223f3ee10e6b3978e9fe81ba915222a0b6`
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
| D16 | OpenRouter settings | not_run |  |  |

## Run notes

Record tool limits, environment, visual review and test-data cleanup in results.json notes.

Raw logs, screenshots, native traces, browser traces and exports belong in this run's gitignored `private/` directory. Record each desktop row in `results.json`, then run `npm run test:smoke:check -- docs/testing/runs/2026-11-20T11-32-40-801Z-2549b07-13ef96` to validate and refresh this report. Historical passes do not fill pending rows.
