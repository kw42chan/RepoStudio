import {
  BrandVoicePreset,
  VisualTemplate,
  WritingStyleId,
} from "./types";

export const WRITING_STYLES: {
  id: WritingStyleId;
  label: string;
  description: string;
}[] = [
  {
    id: "educational",
    label: "Educational / How-To",
    description: "Clear frameworks, step-by-step teaching, and high-save takeaways.",
  },
  {
    id: "contrarian",
    label: "Contrarian / Hot Take",
    description: "Challenges common industry wisdom with a sharp, defensible point of view.",
  },
  {
    id: "storytelling",
    label: "Storytelling / Founder Journey",
    description: "Narrative arc with tension, turning point, and hard-won lesson.",
  },
  {
    id: "tactical",
    label: "Tactical Checklist",
    description: "Actionable bullets, exact scripts, and zero-fluff execution steps.",
  },
  {
    id: "myth-buster",
    label: "Myth-Buster",
    description: "Debunks a popular misconception side-by-side with what actually works.",
  },
  {
    id: "minimalist",
    label: "Punchy / Minimalist",
    description: "Ultra-short lines, high whitespace, and high-impact one-liners.",
  },
  {
    id: "custom",
    label: "Custom Style",
    description: "Define your own custom writing style and tone instructions.",
  },
];

export const BUILT_IN_VISUAL_TEMPLATES: VisualTemplate[] = [
  {
    id: "minimal-light",
    name: "Minimal Light",
    description: "Crisp off-white editorial canvas with sharp ink typography.",
    isBuiltIn: true,
    backgroundColor: "#F8F7F4",
    surfaceColor: "#FFFFFF",
    textColor: "#141413",
    mutedColor: "#63625E",
    accentColor: "#2563EB",
    fontStyle: "sans",
    layoutMood: "clean",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "editorial-dark",
    name: "Editorial Dark",
    description: "Deep charcoal studio look with warm gold highlights.",
    isBuiltIn: true,
    backgroundColor: "#111317",
    surfaceColor: "#1A1D24",
    textColor: "#F4F4F5",
    mutedColor: "#A1A1AA",
    accentColor: "#F59E0B",
    fontStyle: "sans",
    layoutMood: "editorial",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "bold-accent",
    name: "Bold Accent",
    description: "High-energy cobalt/violet deck built to stop the scroll.",
    isBuiltIn: true,
    backgroundColor: "#1E1B4B",
    surfaceColor: "#2E2975",
    textColor: "#FFFFFF",
    mutedColor: "#C7D2FE",
    accentColor: "#38BDF8",
    fontStyle: "bold-display",
    layoutMood: "bold",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "soft-gradient",
    name: "Soft Gradient",
    description: "Warm cream-to-peach gradient with modern card framing.",
    isBuiltIn: true,
    backgroundColor: "#FFF7ED",
    surfaceColor: "#FFFFFF",
    textColor: "#1F2937",
    mutedColor: "#6B7280",
    accentColor: "#EA580C",
    fontStyle: "sans",
    layoutMood: "gradient",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "newsletter-serif",
    name: "Newsletter Serif",
    description: "Classic long-form publication feel with serif headlines.",
    isBuiltIn: true,
    backgroundColor: "#FAF6EE",
    surfaceColor: "#F2EADF",
    textColor: "#1C1917",
    mutedColor: "#78716C",
    accentColor: "#B91C1C",
    fontStyle: "serif",
    layoutMood: "editorial",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
  {
    id: "high-contrast",
    name: "High-Contrast",
    description: "Pure black & neon lime technical aesthetic for builders.",
    isBuiltIn: true,
    backgroundColor: "#09090B",
    surfaceColor: "#18181B",
    textColor: "#FAFAFA",
    mutedColor: "#A1A1AA",
    accentColor: "#A3E635",
    fontStyle: "mono",
    layoutMood: "card",
    createdAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DEFAULT_BRAND_PRESETS: BrandVoicePreset[] = [
  {
    id: "founder-operator",
    name: "Founder / Operator",
    voice: "Direct, practical, data-backed, zero corporate jargon",
    audience: "B2B founders, solo builders, and growth operators",
    cta: "Save this for your next launch & follow for weekly playbooks",
    handle: "@yourbrand",
    primaryColor: "#1D4ED8",
    secondaryColor: "#0F766E",
    defaultWritingStyle: "educational",
    defaultTone: "Confident, crisp, and grounded in real metrics",
  },
  {
    id: "creator-educator",
    name: "Creator / Educator",
    voice: "Warm, clear, punchy, easy for beginners to apply today",
    audience: "Creators, freelancers, and digital marketers",
    cta: "Comment 'GUIDE' and I will send the full checklist",
    handle: "@creatorstudio",
    primaryColor: "#2563EB",
    secondaryColor: "#F59E0B",
    defaultWritingStyle: "tactical",
    defaultTone: "Encouraging, punchy, and conversational",
  },
];

export function withBrandColors(preset: BrandVoicePreset): BrandVoicePreset {
  const known = DEFAULT_BRAND_PRESETS.find((item) => item.id === preset.id);
  return {
    ...preset,
    primaryColor: preset.primaryColor || known?.primaryColor || "#1D4ED8",
    secondaryColor: preset.secondaryColor || known?.secondaryColor || "#F59E0B",
  };
}

export const SAMPLE_SOURCE_POSTS = [
  {
    label: "SaaS Growth Post",
    platform: "LinkedIn",
    text: `Most startups don't have a traffic problem. They have an activation problem.

Last quarter we paused all new paid ads for 30 days and focused 100% on the first 5 minutes after signup:
- Cut onboarding from 7 steps to 2
- Replaced empty states with pre-filled templates
- Sent a 1-question welcome email from the founder

Result: Trial-to-paid jumped from 11% to 24% without spending an extra dollar on acquisition.

Before buying more top-of-funnel, fix the leaky bucket.`,
  },
  {
    label: "Creator Hook Breakdown",
    platform: "Instagram",
    text: `Stop starting your Reels with "Hey guys, today I want to talk about..."

You lose 65% of viewers in the first 2.5 seconds.

Instead, use one of these 3 openers:
1. Show the final result first ("Here's how I automated 12 hours of content in 20 minutes")
2. Call out a painful mistake ("If your carousels get views but zero saves, watch this")
3. Start mid-action with bold on-screen text.`,
  },
];
