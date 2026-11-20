---
type: project-spec
date: 2026-11-20
status: active
tags: [repostudio, pattern-selection, reference-analysis]
---

## Creation workflow

[[Projects/RepoStudio/docs/carousel-next-phase-development-plan|Phase 4.5]] adds an Automatic patterns layout pack and an Agent Chat entry for a topic brief. The brief creates both carousel formats using the current brand settings. An optional sample can be analyzed, reviewed, and saved before it guides layout choices. The existing source-post workflow and Instagram Default pack remain available.

The model returns semantic content, intent, structured fields, and preferred pattern IDs. The deterministic selector checks role, platform, required fields, declared copy limits, available images, and deck rhythm. Invalid suggestions produce visible warnings and a compatible fallback. No JSX, arbitrary coordinates, or executable layout definitions are accepted. The selector records a concise reason on each slide.

Reference analysis returns only palettes, typography roles, spacing, chrome, image treatment, and known pattern candidates. Source images, copied wording, creator handles, logos, and claims are excluded from saved styles. Every new reference save requires an explicit confirmation in the interface and a confirmation flag at the endpoint. The normal template importer also uses this review flow.

With a configured vision provider, structured trait extraction uses the installed AI SDK's `generateText` and `Output.object`. Without one, the app extracts an actual local image palette and labels typography/layout suggestions as defaults requiring review. Brief generation uses the existing demo generator when no text model is configured, and the chat displays that status.

Verification: deterministic routing and reference-contract tests pass. Real-browser checks confirm both carousel formats are created from a brief, analysis excludes the source image, and unconfirmed reference saves are rejected. Live text/vision provider calls were not verified in this local run. The standard source-flow checklist separately records existing Instagram, Threads, and YouTube loading gaps.
