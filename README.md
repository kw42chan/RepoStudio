# RepoStudio — Social Content Repurposing & Buffer Automation

RepoStudio turns copied social media posts into fresh repurposing angles and production-ready **Instagram Reels**, **Instagram Carousels**, and **LinkedIn Carousels**, with `1080 × 1350` slide export (PNG & PDF) and one-click **Buffer** scheduling.

## Features

- **Brand typography:** Eight font families with separate heading/body weights and sizes, including Traditional Chinese choices.
- **Carousel arrangement:** Add, delete, duplicate, and move slides with stable content and keyboard controls.
- **Nine graphics styles and image slots:** Edit structured points, upload and reuse images, and preserve focal points and zoom in exports.
- **Agent Chat and reviewed reference styles:** Create both carousel formats from a brief; let validated pattern selection choose layouts and review sample traits before saving them.
- **Content-fit checks:** See overflow warnings and bounded fitting adjustments; exports wait for fonts/images and block clipped output. See [[Projects/RepoStudio/docs/carousel-release-verification|Phase 4 verification and remaining release checks]].

- **Source Post Ideation**: Paste any copied post from LinkedIn, Instagram, X, or Threads to extract its hook pattern, core insight, and 5 scored repurposing angles.
- **Custom Writing Style & Tone**: Choose from preset writing styles (*Educational*, *Contrarian*, *Storytelling*, *Tactical Checklist*, *Myth-Buster*, *Minimalist*) or provide custom writing style and tone overrides per format.
- **1080 × 1350 Carousel Studio & Template Importer**:
  - Live interactive slide preview (`1080 × 1350` `4:5` default or `1080 × 1080` `1:1`).
  - Upload a reference template image or paste a **template URL** to extract its palette, typography feel, and layout mood, then save it as a reusable template.
  - Export slides as individual **PNGs** (Instagram) or a multi-page **PDF** (LinkedIn).
- **One-Click Buffer Integration**:
  - Supports Buffer OAuth 2.0 (`Connect with Buffer`), an instant one-click Demo Buffer Workspace when OAuth env vars aren't configured, or an optional personal access token.
  - Schedule directly to Instagram or LinkedIn channels (`Add to Queue`, `Share Now`, or `Custom Date & Time`).

## Running Locally

Carousel enhancement progress: [[Projects/RepoStudio/docs/carousel-next-phase-development-plan|Phase 4 development plan]] and [[Projects/RepoStudio/docs/carousel-phase-4-0|Phase 4.0 contracts, fixtures, and reference images]]. Regenerate the nine design references with `npm run carousel:references`.

```bash
npm install
cp .env.example .env.local # optional: add OPENROUTER_API_KEY (or OPENAI_API_KEY) and Buffer OAuth credentials
npm run dev -- --port 3100
```

Open `http://localhost:3100` in your browser. Without API keys configured, the app runs out-of-the-box using its built-in local generator and Demo Buffer Workspace.

## Configure the language model locally

Open **Settings ? Language model ? OpenRouter**, paste your API key, and choose the text and reference-image model IDs. **Test connection** checks key acceptance and model availability without generating content. **Save OpenRouter settings** applies the configuration to Agent Chat, ideation, carousel/reel generation and reference analysis immediately; no restart is needed. Save alone does not validate the key or guarantee a paid generation will succeed. The studio shows the active model and links back to Settings.

The key field clears after saving and is never populated with the saved key. Leave it blank to keep the current key when changing models. **Remove saved connection** removes the saved key/models and restores environment configuration or demo mode. Test connection does not save edits; save them separately. OpenRouter handles provider routing automatically for the selected model.

Saved credentials are encrypted with AES-256-GCM in `.data/secrets/openrouter.json`, separate from the application store. The local master key is in `.data/secrets/master.key`; protect and persist this directory with the server's account/filesystem controls. Anyone with access to both files can decrypt the key. `.data/` is Git-ignored; no credentials are stored in browser storage or returned by the settings API. For a hosted deployment, set `REPOSTUDIO_DATA_DIR` to a private durable volume shared by the app instances, or use environment credentials; ephemeral instances do not provide durable settings storage. All authenticated workspace users share this app's connection, just as they share its Buffer connection.

Environment setup still works: create `.env.local` from `.env.example` and set `OPENROUTER_API_KEY`, optionally `OPENROUTER_MODEL` and `OPENROUTER_VISION_MODEL`. Saved OpenRouter settings take precedence. Alternatively set `OPENAI_API_KEY` for direct OpenAI; its model is `gpt-4o-mini`. Environment changes require restarting the development server. The reference model uses its own image-capable default rather than inheriting a potentially text-only model.

If generation fails after configuration, Agent Chat labels the demo fallback and directs you to Settings. Live generation and provider credit/model permissions must be verified separately with your real key.

## Where to find the Phase 4 controls

- On the home page, expand **Agent Chat - create carousels from a brief**. Enter the topic/facts, optionally upload a style reference and confirm its traits, then create the carousels.
- After creating content or opening a draft, select **Instagram Carousel** or **LinkedIn Carousel**. Select a slide and open **Graphics style** for the new patterns: Collage cover, Statement, Numbered list, Vertical timeline, Horizontal timeline, A/B comparison, Metric evidence, Prompt to outcome and Simple CTA.
- Changing a graphics style exposes its structured **Layout content** fields. Complete the required fields and image slots for that pattern. For example, Metric evidence needs a supported numeric metric, two to four points and an evidence image. Picking a style alone does not invent those facts or supply an image.
- Use **Add Slide**, **Duplicate slide**, **Move left** and **Move right** above the slide editor to arrange the deck.
- Open **Settings**, then a brand, for separate **Heading font** and **Body font** settings, weights and sizes. Save the brand and select it in the studio.
- Image upload and crop controls appear on patterns with declared image slots. Fit/required-content warnings explain what needs fixing before export.

The home-page headline and existing selected layouts remain familiar. A previously saved Scroll cover stays selected until changed; automatic selection preserves a compatible standard layout when the available copy/images cannot satisfy a new pattern. For a local visual check with synthetic content, use `http://localhost:3100/dev/carousel-fixtures`.

A PR is not required to see code already present in the checkout serving the local development server. GitHub review/merging and hosted deployment are separate delivery steps. The [[Projects/RepoStudio/docs/testing/phase-4-visibility-2026-11-20/README|local feature-visibility check]] records the observed running checkout and live style options.

## Regression smoke tests

After every app change, run [[Projects/RepoStudio/docs/testing/regression-smoke|the regression smoke suite]]: `npm run test:smoke` runs the automated checks and creates a fresh report with 15 pending desktop cases. Complete those cases with agent-desktop, then run `npm run test:smoke:check -- docs/testing/runs/<run-id>` before marking the change smoke-verified. Reports and evidence are kept separately for each run; previous passes are historical evidence.
