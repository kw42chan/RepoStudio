---
type: test-specification
date: 2026-11-20
status: active
tags: [repostudio, regression, smoke-tests]
---

## When this suite runs

Run this suite after every completed change to [[Projects/RepoStudio/README|RepoStudio]] runtime behavior, UI, styles, assets, dependencies or application configuration, before reporting the change verified or handing it off for review. Batch related edits into one run against the final working tree. Changes confined to documentation or test tooling need checks appropriate to those files; they do not require repeating an unchanged desktop workflow.

This is the reusable specification. Store each execution separately under `docs/testing/runs/<run-id>/`. The [[Projects/RepoStudio/docs/testing/agent-desktop-2026-11-20/README|20 November desktop walkthrough]] is historical evidence, not a result to copy into a new run. The [[Projects/RepoStudio/CLAUDE|project rules]] make this suite mandatory for app changes.

## Run order and completion gate

1. Start the current checkout's development server on port 3100: `npm run dev -- --port 3100`. Confirm it is the checkout being tested. The development fixture page must be available; a production server's expected fixture 404 is unsuitable for this suite.
2. Run `npm run test:smoke`. It checks the fixture page, runs all Vitest and Playwright tests without updating golden baselines, and creates a new run directory with logs, available exports, a source fingerprint, a report and 16 pending desktop rows. Read the printed path. Exit zero means the **automated stage** passed; the full suite is pending desktop checks.
3. Read the installed `agent-desktop` common skill and the guide matching the current OS. Run the 16 cases below in a dedicated, uncontended test tab. Use fresh observations and refs. Capture actions, screenshots and actual exports in that new run. Read values after changes and reloads; verify files on disk after downloads.
4. Update that run's `results.json`: each desktop row needs `status: "passed"`, a specific `observed` result, and one or more relative `evidence` file paths inside the run. Use `failed`, `blocked` or `not_run` when appropriate. Record a tool workaround and its actual scope; API/browser results supplement desktop evidence rather than substituting for it.
5. Export the desktop trace, end the session, and remove only the temporary QA brand created by this run. Record retained synthetic assets/styles and any browser permission change. Run `npm run test:smoke:check -- docs/testing/runs/<run-id>`.
6. The check command must pass before describing an app change as smoke-verified. It rejects missing/failed automation, pending desktop cases, missing evidence and changed source inputs. It regenerates the report and marks the full run passed only after validation. If app inputs changed, run again. If tooling or credentials block a required step, save the exact blocker and report verification as incomplete.

For source loading, ideation, reel or carousel-generation changes, also execute [[Projects/RepoStudio/docs/standard-manual-test|the source-flow checklist]] and update its last-run table. Existing Instagram, Threads and YouTube gaps remain failures until their pass conditions are met. This additional coverage does not become green merely because the local carousel smoke suite passes.

## Preconditions

- Dependencies and Playwright Chromium are installed. Test the local/demo flow; make live-provider quality a separate, explicitly labeled check.
- Settings writes use a synthetic key only on a demo-only QA instance. If a real saved/environment connection exists, preserve it and use a separate instance/data directory for D16. Never overwrite a real key for regression testing. The automated settings case skips configured instances; report that skip explicitly and run it on the isolated QA instance before claiming its coverage.
- Use `/dev/carousel-fixtures`, `public/fixtures/carousel-proof.png`, and a uniquely named temporary QA brand. Preserve existing user brands, drafts and library assets.
- Initial fixture: five slides, `Clear idea 1` through `Clear idea 5`, with cover first and CTA last. Reload the fixture page whenever a case requires a clean deck.
- Wait for fonts/images and asynchronous UI completion. For exports, locate Chrome's actual download directory through native UI if needed. An accessibility filename readback or a successful click alone does not prove a saved file.

## Desktop regression cases

Run D01-D05 in sequence. Reset fixtures as specified for the remaining cases.

| ID | Case | Actions | Pass condition |
| --- | --- | --- | --- |
| D01 | Open editor | Open the fixture page in the test tab. | Editor loads with five slides and the initial cover content; preview is available. |
| D02 | Duplicate slide | Duplicate slide 1. | Six slides; selected duplicate is slide 2 with the original headline/body; cover remains first and CTA last. |
| D03 | Move slide | Move that duplicate right. | Selected content moves to position 3; headline/body remain intact; count stays six. |
| D04 | Delete slide | Delete the selected duplicate. | Count returns to five; the following slide is selected and has its own content. |
| D05 | Insert slide | Add a slide. | Six slides; new editable body slide is selected with `New takeaway`; cover/CTA positions remain valid. |
| D06 | Slide limit | Load `maximum-slide-count`. | Twelve numbered slides; Add Slide and Duplicate slide are disabled. |
| D07 | Required image guard | Load `missing-images`; click Export PDF. | Export displays a required-image error identifying the hero slot; no successful export is claimed. |
| D08 | Long-copy guard | Load `long-headings`; click Export PDF. | Heading-length/fit warning and export error explain what needs shortening; clipped output is not silently accepted. |
| D09 | Image crop controls | Load `zh-Hant`; set hero horizontal focus to 1 and zoom to 1.5; move away and back. | Values persist on fresh readback; Chinese text and synthetic image remain visible. Capture controls and preview. Pixel-level crop correctness is additionally checked by the browser suite. |
| D10 | Chinese PDF export | Reset with `zh-Hant`; export PDF; complete the save flow and locate the actual file. | Actual PDF has nine pages with 810 x 1012.5-point page boxes; render and review all pages for clipping, missing glyphs/images and overlap. Retain the file and rendered evidence. |
| D11 | Native image upload | Select the cover and upload `carousel-proof.png` into `hero-right` through the native file picker. | Saved-image selector shows that file and the image appears in preview; crop controls are present. Record the actual picker submission and app result. |
| D12 | Font persistence | Create a uniquely named QA brand; choose Lora headings and Inter body; save and reload the browser. | Both choices persist after reload and the preview visibly distinguishes heading/body typography. Capture proof, then remove only this QA brand. |
| D13 | Reference approval | In Agent Chat, enter a valid brief and upload the synthetic proof as a style reference; review traits, then confirm. | Review shows traits and local/vision provenance; creation is disabled before approval. Explicit confirmation reports the style saved and enables creation. API tests separately verify confirmation enforcement and source-image exclusion. |
| D14 | Brief creation | Enter a factual synthetic brief of at least ten characters; create carousels. | Created status and both Instagram and LinkedIn result tabs appear. Record whether output is demo or live; a demo pass does not certify live generation quality. |
| D15 | Complete PNG export | Reload the default five-slide fixture; export PNGs and complete every native save dialog. Handle the localhost multiple-download prompt if present. | Five actual PNG files exist, each 1080 x 1350. Copy them into the run and visually review all five, including their own content and sequence. Automated parity checks remain additional evidence. |

| D16 | OpenRouter settings | Open Settings; save a synthetic OpenRouter-format key, reload, change model IDs with the key blank, reload, then remove the saved connection. Do not send the synthetic key to OpenRouter. | Configured status and model IDs persist; saved key field stays blank; removal restores the initial demo/environment status. Capture redacted UI evidence. Mocked API tests separately cover Test connection success, invalid keys, unsupported models and network failure. |

Suggested D14 brief: `Explain three ways to make a project brief clearer: define the audience, state the outcome, and show evidence. Use only these facts. End with a save reminder.`

## Evidence recording

The runner's `README.md` is the run report and `results.json` is its editable result record. Keep raw snapshots, screenshots, traces and binary exports under the run's gitignored `private/` directory. Keep summary observations free of personal browser data.

On Windows, point the command recorder at the **new** run, then create a fresh session:

```powershell
$env:REPOSTUDIO_QA_LOG_DIR = 'docs/testing/runs/<run-id>'
Remove-Item Env:AGENT_DESKTOP_SESSION -ErrorAction SilentlyContinue
python scripts/desktop-qa.py session-start session start --name repostudio-regression
$env:AGENT_DESKTOP_SESSION = (Get-Content "$env:REPOSTUDIO_QA_LOG_DIR/private/session-start.json" -Raw | ConvertFrom-Json).data.session_id
```

Use the recorder for each command, with a new label such as `d01-before`, `d02-duplicate` or `d12-after-reload`. It captures the official CLI JSON and a timestamped command record, not a video. It refuses reused labels and completed run directories. On other platforms, the same environment variables and Python recorder work; follow the platform skill for the actual GUI commands.

Export and seal the session through the recorder, with the output path inside the current run:

```powershell
python scripts/desktop-qa.py trace-export trace export --out "$env:REPOSTUDIO_QA_LOG_DIR/private/desktop-trace.html" --limit 0
python scripts/desktop-qa.py session-end session end
```

Record per case, for example:

```json
{
  "id": "D12",
  "title": "Font persistence",
  "status": "passed",
  "observed": "QA brand retained Lora headings and Inter body after browser reload; QA brand then removed.",
  "evidence": ["private/d12-after-reload.json", "private/fonts-after-reload.png"]
}
```

The validator checks revision consistency, statuses and artifact existence; the operator is responsible for the observations and visual review. The completed run should link from the change's development/verification notes. Expand this specification when a new regression needs permanent coverage; preserve historical run reports.
