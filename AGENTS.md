<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues and specs live as markdown files under `.scratch/<feature>/`. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default roles, each label equal to its name: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

### Desktop checks

See and operate the desktop with the agent-desktop skills. Do not use the computer-use subagent for GUI checks. Read `.agents/skills/agent-desktop/SKILL.md` and `.agents/skills/agent-desktop-linux/SKILL.md`, then follow them. The CLI is `agent-desktop` on PATH, or `$HOME/.local/bin/agent-desktop` when it is not. Join the existing XFCE session: take `DISPLAY` and `DBUS_SESSION_BUS_ADDRESS` from the `at-spi2-registr` process. Do not start a second accessibility bus. Chrome is invisible to the accessibility tree until it is launched with `--force-renderer-accessibility`.

### Standard manual test

Before finishing a change to loading a post, generating ideas, or writing the reel and carousels, run `docs/standard-manual-test.md` and replace its last-run table with the new results. X, LinkedIn, Instagram, Threads, and the video transcript are all part of that run. A known gap stays a fail until the pass condition is met.
