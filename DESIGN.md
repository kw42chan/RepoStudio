---
name: RepoStudio Carousel System
description: Editorial carousel layouts that turn structured ideas into legible, distinctive social graphics.
colors:
  paper-warm: "#F5F0E7"
  paper-clean: "#FBF8F2"
  ink-charcoal: "#171614"
  ink-muted: "#625E57"
  line-warm: "#D8D0C3"
  surface-raised: "#FFFFFF"
  signal-orange: "#E9501B"
  midnight-navy: "#0E1220"
  midnight-ivory: "#F2EEE6"
typography:
  display-sans:
    fontFamily: "Satoshi, Noto Sans TC, sans-serif"
    fontSize: "96px"
    fontWeight: 800
    lineHeight: 0.98
    letterSpacing: "-0.035em"
  display-serif:
    fontFamily: "Instrument Serif, Noto Serif TC, serif"
    fontSize: "88px"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Satoshi, Noto Sans TC, sans-serif"
    fontSize: "36px"
    fontWeight: 500
    lineHeight: 1.42
  metadata:
    fontFamily: "JetBrains Mono, Noto Sans Mono CJK TC, monospace"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.08em"
rounded:
  frame: "28px"
  panel: "22px"
  compact: "12px"
spacing:
  safe-x: "72px"
  safe-y: "64px"
  section: "48px"
  group: "24px"
  tight: "12px"
components:
  evidence-panel:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.ink-charcoal}"
    rounded: "{rounded.panel}"
    padding: "32px"
  dark-panel:
    backgroundColor: "{colors.ink-charcoal}"
    textColor: "{colors.midnight-ivory}"
    rounded: "{rounded.panel}"
    padding: "32px"
---

# Design System: RepoStudio Carousel System

## Overview

**Creative North Star: “The Editorial Field Guide”**

Every carousel should feel authored, useful, and immediately scannable: the confidence of an editorial spread combined with the clarity of a field guide. The visual system is moderately dense and deliberately asymmetric. One dominant idea leads each slide; supporting proof follows in a distinct spatial zone.

The uploaded references establish four compatible families—bold signal graphics, specification editorial, warm storyboard, and midnight contrast. They share structure and restraint, but they must not collapse into one repeated template. A carousel uses one typographic pairing and one accent hue, then varies composition according to content.

**Key characteristics:**

- 4:5 portrait canvas at 1080 × 1350 px with a 72 px horizontal safe area.
- Strong Traditional Chinese and Latin typesetting with separate heading and body controls.
- One accent color per carousel, occupying no more than roughly 12% of a slide.
- Persistent but quiet slide chrome; content remains the focal point.
- Structured, declared image slots rather than decorative photos placed behind text.

## Colors

The base palette is warm and physical. Each generated carousel chooses one approved accent; it does not mix accent families within a deck.

### Primary

- **Signal Orange** (#E9501B): highlighted phrase, active step, connector, or action cue. Never use it as a full-slide gradient.

### Neutral

- **Warm Paper** (#F5F0E7): default light canvas.
- **Clean Paper** (#FBF8F2): alternate light canvas and image mat.
- **Charcoal Ink** (#171614): primary light-mode text and dark panels; replaces pure black.
- **Muted Ink** (#625E57): supporting copy and metadata on light canvases.
- **Warm Line** (#D8D0C3): dividers and structural outlines.
- **Raised Surface** (#FFFFFF): evidence frames and screenshots, used sparingly.
- **Midnight Navy** (#0E1220): dark canvas for strategic or conceptual slides.
- **Midnight Ivory** (#F2EEE6): primary text on dark canvases.

**The One Signal Rule.** One slide may emphasize a number, a phrase, and a connector only when all three use the same accent. Never introduce a second saturated hue to create variety.

**Family variants.** A saved brand may replace Signal Orange with one sub-80%-saturation accent. The system derives a darkened outline and a 12% tint from that same hue; these are tonal variants, not additional accents.

## Typography

**Display Sans:** Satoshi with Noto Sans TC fallback  
**Display Serif:** Instrument Serif with Noto Serif TC fallback  
**Body:** Satoshi with Noto Sans TC fallback  
**Metadata / Code:** JetBrains Mono with Noto Sans Mono CJK TC fallback

Headings and body text are independent brand settings. A brand preset stores `headingFont`, `headingSizeScale`, `headingWeight`, `bodyFont`, `bodySizeScale`, and `bodyWeight`; changing one role never silently changes the other.

### Hierarchy

- **Hero sans** (800, 88–112 px, 0.94–1.02 line-height): bold covers, statement slides, metrics.
- **Hero serif** (600, 76–96 px, 1.00–1.08 line-height): specification and warm-story slides.
- **Section title** (700, 54–68 px, 1.08–1.16 line-height): structured slides with panels, lists, or timelines.
- **Body** (500, 32–40 px, 1.35–1.5 line-height): explanations; keep each text block to 18–30 CJK characters or about 45 Latin characters per line.
- **Label** (600, 22–28 px, 0.06–0.1em tracking): real metadata such as section, step, count, command, or measurement—not decorative filler.

**The Two-Voice Rule.** Use at most two proportional typefaces on one carousel: one display voice and one body voice. Mono is reserved for code, counts, measurements, and technical metadata.

**The Highlight Rule.** Emphasize the smallest meaningful phrase, normally 2–8 CJK characters. Do not color an entire paragraph or use gradient text.

## Layout

The canvas is a fixed 1080 × 1350 px. Keep essential content inside x=72–1008 and y=64–1286. The core grid has 12 columns, 24 px gutters, and an 8 px spacing base. Major groups use 48–72 px gaps; related label/body groups use 12–24 px gaps. Headings always receive more space above than below.

Every slide has three zones:

1. **Chrome:** optional context at top-left, actual slide count at top-right, and quiet series/brand information at the bottom.
2. **Thesis:** the dominant sentence, metric, or question. It owns the largest uninterrupted area.
3. **Proof:** list, comparison, timeline, screenshot, illustration, or supporting statement.

Composition follows content shape. Use a statement for one memorable idea, a timeline for sequence, a comparison for alternatives, and an evidence frame only when real evidence exists. Never force unrelated content into three equal cards.

### Carousel rhythm

- Do not repeat the same dense structure on adjacent slides.
- Alternate thesis-led and proof-led slides; alternate light and dark only when the palette remains consistent.
- A 7–10 slide deck should contain at least three layout archetypes but no more than two typography systems.
- The cover may be the most visually dense slide. The final action slide returns to one thesis and one action.

### Image placement

Images are accepted only by templates that declare `imageSlots`. Each slot defines an aspect ratio, crop behavior, focal point, and whether an image is required or optional.

- Screenshots use `contain` inside an evidence frame; never crop away navigation or the result being discussed.
- Photography uses `cover` with a user-adjustable focal point and a visible safe crop preview.
- Illustrations may use transparent alpha; do not fake subject cutouts with circles or geometric masks.
- Text never overlaps an image. A photo and its caption occupy separate zones.
- If a required image is missing, route to the nearest text-safe style instead of inventing a placeholder.

## Elevation & Depth

The system is flat by default. Hierarchy comes from scale, tint, dividers, and whitespace. Evidence panels may use one soft ambient shadow (`0 14px 40px rgba(40, 31, 20, 0.10)`) and a warm 1 px outline. Dark slides use tonal layering rather than glow. Overlapping screenshots are limited to collage covers where the overlap communicates a collection of real artifacts.

## Shapes

The slide frame uses a 28 px radius, major evidence panels 22 px, and compact labels 12 px. Avoid pill shapes unless the content is a status or compact action. Corners are consistent within one slide. Connector lines, arrows, and progress rails use a single 4–6 px stroke weight and the carousel accent.

## Components

### Slide chrome

Use real context only: handle or brand at top-left, `current / total` at top-right, optional series at bottom-left, and progress or direction at bottom-right. Chrome is 22–28 px and must remain quieter than body copy. Do not add “swipe” solely as decoration when the export platform already provides navigation.

### Evidence panels

An evidence panel contains one coherent proof unit: a screenshot with annotation, an A/B pair, a command block, or a compact result. Use 28–36 px internal padding. Nested panels require a distinct information level; never add an inner card only for visual depth.

### Lists and checklists

Numbering must communicate sequence or count. Parallel facts use bullets or checkboxes. A row contains one short title and at most one supporting line. When any row needs more than two lines, switch from a horizontal pattern to a vertical one.

### Timelines

Horizontal timelines support three to five concise stages. Labels may alternate above and below the rail while reading left-to-right. Vertical timelines support two to six denser steps. Both use the same numbered-node geometry and accent treatment so they feel related, not duplicated.

### Image slots

The editor shows only the slots supported by the selected graphic style. Each slot exposes Upload, Replace, Reposition, and Remove. Removing an optional image restores the template’s intentional text-only state; it never leaves an empty frame.

## Do's and Don'ts

### Do

- **Do** let the LLM choose a style from declared intent, required fields, density limits, and available image slots.
- **Do** preserve the selected brand’s separate heading and body typography across every slide.
- **Do** keep Traditional Chinese punctuation attached correctly and prevent single-character orphan lines.
- **Do** use real screenshots, photos, diagrams, counts, and commands supplied by the user or source.
- **Do** validate overflow at 1080 × 1350 before export and fall back to a less dense layout when content cannot fit.

### Don't

- **Don't** use pure black, neon glows, rainbow gradients, generic AI-purple, or emoji as an icon system.
- **Don't** place text over photography, manufacture fake metrics, or invent screenshots to satisfy a template.
- **Don't** treat rounded cards as the default container for every point.
- **Don't** use equal three-column cards unless the content genuinely contains three parallel items.
- **Don't** copy creator handles, wording, footer identity, or distinctive branded assets from reference uploads.
- **Don't** add web-style perpetual animation to exported slides. Editor transitions may use restrained transform and opacity, but the carousel artifact is static.
