# RepoStudio — Social Content Repurposing & Buffer Automation

RepoStudio turns copied social media posts into fresh repurposing angles and production-ready **Instagram Reels**, **Instagram Carousels**, and **LinkedIn Carousels**, with `1080 × 1350` slide export (PNG & PDF) and one-click **Buffer** scheduling.

## Features

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

```bash
npm install
cp .env.example .env.local # optional: add OPENAI_API_KEY or Buffer OAuth credentials
npm run dev -- --port 3100
```

Open `http://localhost:3100` in your browser. Without API keys configured, the app runs out-of-the-box using its built-in local generator and Demo Buffer Workspace.
