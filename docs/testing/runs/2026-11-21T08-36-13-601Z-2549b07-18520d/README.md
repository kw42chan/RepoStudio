---
type: regression-test-run
date: 2026-11-21
status: active
tags: [repostudio, regression, smoke-tests]
---

## Run outcome

Overall: **failed**. Automated success alone leaves desktop checks pending.

Specification: [[Projects/RepoStudio/docs/testing/regression-smoke|regression smoke suite]].

- Started (UTC): 2026-11-21T08:36:13.601Z
- Application base commit: 2549b077b86db2d877b6bc5455f80cbfae97adbd; branch: feature/carousel-phase-4-0
- Source/test fingerprint: `a14a370c77744373200550110068e106bd1cecee8ef46f167a2ac89c2cc6fc97`
- Node: v22.23.2; platform: win32
- Fixture preflight: passed
- Vitest: failed; exit: 1; [log](private/vitest.log)
- Playwright: failed; exit: 1; [log](private/playwright.log)
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

Raw logs, screenshots, native traces, browser traces and exports belong in this run's gitignored `private/` directory. Record each desktop row in `results.json`, then run `npm run test:smoke:check -- docs/testing/runs/2026-11-21T08-36-13-601Z-2549b07-18520d` to validate and refresh this report. Historical passes do not fill pending rows.
