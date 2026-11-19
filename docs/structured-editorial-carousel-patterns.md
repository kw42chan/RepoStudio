---
type: project-spec
date: 2026-11-19
status: proposed
tags: [repostudio, carousel-design, graphics-styles]
---

## Shared design grammar

Generalized from the supplied carousel samples. Preserve the layout logic and visual rhythm, not the original creator identity, copy, screenshots, or footer labels.

These families follow the shared [[Projects/RepoStudio/DESIGN|RepoStudio carousel design system]]. The family descriptions select a visual voice; the shared system remains authoritative for typography roles, safe areas, accent limits, image handling, and overflow behavior.

- Editorial hierarchy: small utility metadata, a large serif-led thesis, structured proof, then a conversational question.
- Mixed typography: display serif for the main idea, clean sans for explanations, and mono for technical labels, commands, or specifications.
- Restrained accent: one rust, brown, peach, or lavender accent marks keywords, borders, step labels, and calls to action. A single carousel never mixes these accent families.
- Persistent chrome: context label at top-left, slide count at top-right, thin footer rule, brand at bottom-left, and navigation cue at bottom-right.
- Content shape controls layout choice. Checklists, comparisons, specifications, commands, processes, and illustrated concepts each use a distinct structure.

## Family A: Specification Editorial

Warm off-white, black ink, rust accent, high-contrast serif display type, sans body, and mono metadata. Best for teaching design, AI, systems, standards, and technical workflows.

### 1. Audit checklist

- Intent: diagnose a page, workflow, product, or piece of content against a known set of signals.
- Slots: section label, headline, highlighted phrase, three-to-six checklist rows, optional measurement at row-right, closing question, footer.
- Row shape: checkbox, short rule, optional evidence count or status.
- Images: none.
- LLM cues: “features,” “signs,” “mistakes,” “audit,” “check whether,” “how many,” or a falsifiable checklist.

### 2. A/B evidence comparison

- Intent: contrast a weak/default option with a deliberate/recommended option.
- Slots: step label, headline, A panel, B panel, panel annotations, highlighted recommendation, closing question, footer.
- Panel shape: label chip, example headline, one-to-three explanatory lines.
- Images: optional `example-a` and `example-b`; text-only panels remain valid.
- LLM cues: before/after, wrong/right, generic/specific, old/new, weak/strong, default/custom, or two competing approaches.

### 3. Design-spec panel

- Intent: turn principles or constraints into a compact specification.
- Slots: step label, headline, dark inset panel, three-to-five specification rows, emphasized translation for each row, question, footer.
- Row shape: technical rule followed by its plain-language meaning.
- Images: none.
- LLM cues: design rules, requirements, constraints, banned choices, implementation guidance, prompt specification, or “do this, avoid that.”

### 4. Command playbook

- Intent: combine installation commands with the sequence for using them.
- Slots: headline with two numeric highlights, command block, short transition line, two-to-five action cards, final wide action card, question, footer.
- Row shape: step number, action label, command or short detail.
- Images: none.
- LLM cues: installation, CLI commands, setup, configuration, exact steps, copyable snippets, or a tool stack.

## Family B: Warm Storyboard

Warm sand canvas, dark brown ink, ochre accent, editorial serif headings, soft shadows, and product-story illustrations. Best for explaining a service, workflow, customer journey, or business model.

### 5. Prompt-to-outcome storyboard

- Intent: show a user request transforming into a tangible result.
- Slots: context label, topic label, headline, prompt bubble, vertical connector, browser/product mockup, success badge, four-step journey, takeaway, footnote, footer.
- Images: `result-preview` inside the mock browser window.
- LLM cues: “tell AI what you need,” transformation, generated result, brief-to-output, prototype, or request-to-deliverable story.

### 6. Illustrated value chain

- Intent: explain three connected business or operational stages with a central visual metaphor.
- Slots: context label, topic label, headline, three linked illustrations, three supporting columns, diagnostic question, CTA note, footer.
- Images: `stage-1`, `stage-2`, `stage-3`; supplied illustrations or photos are cropped into the declared stage frames.
- LLM cues: build/promote/monetize, create/distribute/sell, input/process/output, or three dependent stages.

## Family C: Midnight Contrast

Deep navy or black canvas, ivory display serif, lavender accent, subtle oversized numerals, and restrained technical cards. Best for conceptual distinctions, AI-versus-human comparisons, and strategic reframing.

### 7. Dual-system comparison

- Intent: explain the difference between two actors, approaches, or modes of work.
- Slots: context label, oversized background number, headline with accent phrase, two comparison panels, pull quote, closing question, footer.
- Panel shape: actor label, example input, example output or status, supporting sentence.
- Images: optional `left-panel` and `right-panel`; default is structured text/UI fragments.
- LLM cues: machine/human, assistant/employee, tool/system, answer/deliverable, draft/finished work, or a conceptual two-column distinction.

## LLM routing pattern

1. Detect whether the content is diagnostic, comparative, prescriptive, procedural, transformational, sequential, or conceptual.
2. Choose the style whose required structured fields are present; do not invent screenshots, metrics, commands, or comparison evidence merely to satisfy a layout.
3. Route diagnostic criteria to Audit checklist; two alternatives to A/B evidence; explicit rules to Design-spec; commands to Command playbook.
4. Route request-to-result narratives to Prompt-to-outcome; three dependent stages to Illustrated value chain; conceptual dualities to Midnight comparison.
5. Use a statement layout from [[Projects/RepoStudio/docs/isaac-editorial-carousel-patterns|Editorial Signal]] when the content lacks enough structure for these patterns.
6. Keep one accent family throughout a carousel. Light and dark variants may alternate, but typography, chrome, spacing, and accent hue stay consistent.
7. Avoid adjacent dense panels. Follow a checklist, command, or comparison slide with a simpler statement or visual slide.

## Suggested rhythms

- Technical tutorial: `Statement → Audit → A/B comparison → Design spec → Command playbook → Statement → CTA`
- Product story: `Cover → Problem statement → Prompt-to-outcome → Illustrated value chain → Evidence → CTA`
- Strategic comparison: `Cover → Statement → Dual-system comparison → Evidence → Principle → CTA`

## Pattern contract for implementation

Each style definition should declare `intentTags`, `requiredSlots`, `optionalSlots`, `imageSlots`, `contentLimits`, `lightDarkMode`, and `selectionGuidance`. Every `imageSlot` also declares `aspectRatio`, `fit`, `focalPoint`, and `required`. The generation prompt exposes these declarations to the LLM; runtime validation rejects incompatible structures and falls back to the nearest statement style.
