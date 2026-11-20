---
type: project-spec
date: 2026-11-20
status: active
tags: [repostudio, typography, font-library]
---

## Curated families

[[Projects/RepoStudio/docs/carousel-next-phase-development-plan|Phase 4.1]] uses eight families through `next/font/google`: Epilogue and Inter (Latin sans), Lora (Latin serif), JetBrains Mono (code and metadata), Noto Sans TC and Noto Sans HK (Traditional Chinese sans), and Noto Serif TC and Noto Serif HK (Traditional Chinese serif).

Next.js downloads and self-hosts the files at build time. The application loads variable weights and avoids preloading the additional families. Browser Unicode ranges request the needed glyph subsets; the registry adds a Traditional Chinese fallback to every stack. No manually copied font files or custom font licenses are added to this repository. Upstream font distributions and their license files live in the Google Fonts repository under `ofl/epilogue`, `ofl/inter`, `ofl/lora`, `ofl/jetbrainsmono`, `ofl/notosanstc`, `ofl/notosanshk`, `ofl/notoseriftc`, and `ofl/notoserifhk`.

Lora resolves weight 800 to its actual 700 master. Headings support 500–800 and scales 85–120%; body supports 400–600 and scales 90–115%. Invalid legacy design settings receive version-1 defaults. The preset endpoint rejects malformed new settings. Legacy serif/mono drafts retain their corresponding font role when migrated; unrelated draft content stays intact.

The same resolved theme reaches normal slides, grids, and Edward AI renderers in both preview and export. PNG and PDF capture wait for `document.fonts.ready`. Exact pixel parity and content-fit stress checks continue in Phase 4.6.
