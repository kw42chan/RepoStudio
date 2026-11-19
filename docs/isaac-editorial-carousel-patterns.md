---
type: project-spec
date: 2026-11-19
status: proposed
tags: [repostudio, carousel-design, graphics-styles]
---

## Visual system: Editorial Signal

Generalized from the supplied carousel samples. Preserve the visual grammar, not the original creator identity, wording, screenshots, or footer labels.

This family follows the shared [[Projects/RepoStudio/DESIGN|RepoStudio carousel design system]]. The rules below specialize that system; they do not override its typography roles, one-accent rule, safe area, image-slot contract, or content-fit requirements.

- Canvas: 4:5 portrait, rounded corners, generous safe area.
- Palette: warm ivory background, charcoal ink, and one signal accent. Dark slides use midnight navy and ivory while retaining the same accent.
- Typography: extra-bold grotesk heading with tight line height; medium or semibold sans body. Traditional Chinese and Latin may share a line. Orange highlights one phrase, number, or keyword.
- Chrome: brand handle at top-left, slide count at top-right, optional section label and thin divider. Footer holds a series label, progress dots, and forward arrow.
- Composition: one dominant idea per slide, strong alignment, limited decorative elements, high contrast, and deliberate empty space.

## Reusable graphic styles

### 1. Editorial collage cover

Use for a cover that promises a concrete result and benefits from product proof.

- Slots: handle, count, two-to-four-line headline, highlighted phrase, short deck, three compact benefit rows, optional badge, one large screenshot, up to two overlapping supporting screenshots, footer identity, arrow.
- Image positions: `hero-right`, `support-bottom-center`, `support-bottom-right`.
- Content limits: headline 28–42 CJK characters, deck 18–34, benefit rows 2–4.
- Selection cues: named tools, tutorials, workflows, demos, before/after results, or a concrete time/quantity promise.

### 2. Metric with evidence panel

Use when one number is the proof and a screenshot or excerpt explains it.

- Slots: section label, count, oversized metric, unit, two-line claim, rounded evidence panel, evidence image on the left, three short outcome bars on the right, supporting note, footer.
- Image position: `evidence-left`.
- Content limits: one metric, one claim, two-to-four evidence labels.
- Selection cues: duration, percentage, revenue, speed, conversion, experiment result, benchmark, or measured improvement.

### 3. Statement slide

Use for the strongest claim, transition, insight, myth, or reframing. Provide light and dark variants from the same structure.

- Slots: handle, count, large statement, one orange-highlighted phrase, optional supporting paragraph, footer and arrow.
- Image positions: none.
- Content limits: headline 22–46 CJK characters; optional body 18–38 characters.
- Selection cues: contrarian claim, problem statement, key lesson, section opener, or a sentence that should be remembered verbatim.

### 4. Numbered card list

Use for three compact rules, fixes, checks, or examples.

- Slots: step tag, count, headline, short intro, three stacked dark cards, number badge, item title, one-line explanation, optional closing note, footer.
- Image positions: none.
- Content limits: exactly three items; titles under 10 CJK characters; descriptions under 16.
- Selection cues: exactly three parallel points with equal importance and no required sequence.

### 5. Three-stage flow

Use when the content describes entities or stages connected left-to-right.

- Slots: handle, count, headline, supporting sentence, three bordered tiles, icon or optional image per tile, arrow connectors, footer.
- Image positions: `flow-1`, `flow-2`, `flow-3`; each accepts an icon or image.
- Content limits: exactly three stages; tile labels under 8 CJK characters.
- Selection cues: input-to-output process, funnel, cause chain, product/channel/outcome, or three concepts with directional relationships.

### 6. Vertical timeline checklist

Use for ordered instructions, a schedule, or a multi-step method.

- Slots: handle, count, headline with highlighted phrase, two-to-six numbered nodes, connector line, step text, footer.
- Image positions: none.
- Content limits: two-to-six steps; each step under 22 CJK characters.
- Selection cues: ordered sequence, days or phases, chronological method, setup instructions, or dependencies between actions.

### 7. Horizontal timeline checklist

Use for a compact journey whose full sequence should be understood at a glance.

- Slots: handle, count, headline, short supporting sentence, horizontal progress rail, three-to-five numbered nodes, compact step labels staggered above and below the rail, optional final outcome badge, footer.
- Image positions: optional `timeline-1` through `timeline-5`; each accepts a small icon or cropped thumbnail. The style remains valid without images.
- Content limits: three-to-five ordered steps; titles under 8 CJK characters; descriptions under 14 CJK characters; one optional outcome under 12 CJK characters.
- Layout behavior: three or four steps use equal-width columns; five steps use smaller nodes and alternating labels. Labels may stagger vertically but the reading order always remains left-to-right.
- Selection cues: a short customer journey, production pipeline, maturity path, before-to-after progression, or ordered phases where comparison across the whole sequence matters more than detailed instructions.
- Do not select when any step needs more than two short lines; use the vertical timeline checklist for denser instructions.

## LLM selection pattern

1. Classify the slide intent: `cover`, `claim`, `metric`, `parallel-list`, `flow`, `sequence`, `sequence-summary`, `cta`.
2. Match required structured data before visual preference. A metric needs a numeric value; a flow needs three related nodes; a timeline needs ordered steps. Use the horizontal timeline only for three-to-five concise steps that benefit from being compared in one row.
3. Choose an image-capable style only when the slide has a usable uploaded image assigned to a supported slot. Each slot must declare aspect ratio, crop mode, focal point, and required/optional status.
4. Prefer the statement style for text that does not satisfy a structured pattern.
5. Alternate light and dark statement variants for pacing, while keeping adjacent structured slides visually distinct.
6. Use the collage cover once, the metric panel at most once, and reserve dense patterns for the middle of the carousel.
7. Keep the final CTA visually simple; reuse the statement structure with one action and no supporting paragraph.
8. Reject any selection whose copy exceeds the pattern limits; route to a less dense structure instead of shrinking body text below the shared minimum.

## Suggested carousel rhythm

`Collage cover → Statement → Flow or horizontal timeline → Metric evidence → Numbered cards → Statement → CTA`

For a ten-slide carousel, insert additional statement or structured slides based on the source content. Do not repeat the same dense structure on adjacent slides.
