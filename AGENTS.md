<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Project policy

Read `CLAUDE.md` for the project policy. Before reporting an app change verified or handing it off for review, follow its mandatory regression smoke gate in `docs/testing/regression-smoke.md`.

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles, each label equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Desktop checks

See and operate the desktop with the agent-desktop skills. Do not use the computer-use subagent for GUI checks. Read `.agents/skills/agent-desktop/SKILL.md` and the matching platform guide: `agent-desktop-windows` on Windows, `agent-desktop-linux` on Linux. Follow their current instructions for Chromium accessibility and the existing desktop session. The CLI is `agent-desktop` on PATH, or `$HOME/.local/bin/agent-desktop` where installed there. Use the fresh run and evidence workflow in `docs/testing/regression-smoke.md`.

### Standard manual test

Before finishing a change to loading a post, generating ideas, or writing the reel and carousels, run `docs/standard-manual-test.md` and replace its last-run table with the new results. X, LinkedIn, Instagram, Threads, and the video transcript are all part of that run. A known gap stays a fail until the pass condition is met.
