import type { BrandDesignSettingsV1 } from "./carousel-fonts";
import type { SlideIntent } from "./carousel-pattern-selection";
import type { StyleAnalysisDraft } from "./carousel-reference-style";
export type { BrandDesignSettingsV1, BuiltInFontId } from "./carousel-fonts";
export type ContentFormat = "reel" | "ig_carousel" | "li_carousel";

export type WritingStyleId =
  | "educational"
  | "contrarian"
  | "storytelling"
  | "tactical"
  | "myth-buster"
  | "minimalist"
  | "custom";

export interface WritingStyleConfig {
  styleId: WritingStyleId;
  customStyle?: string;
  customTone?: string;
}

export type AspectRatio = "4:5" | "1:1";

export type VisualFontStyle = "sans" | "serif" | "mono" | "bold-display";
export type VisualLayoutMood =
  | "clean"
  | "editorial"
  | "bold"
  | "gradient"
  | "card";

export interface VisualTemplate {
  referenceStyle?: StyleAnalysisDraft;
  id: string;
  name: string;
  description: string;
  isBuiltIn: boolean;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  mutedColor: string;
  accentColor: string;
  fontStyle: VisualFontStyle;
  layoutMood: VisualLayoutMood;
  customStyleNotes?: string;
  customToneNotes?: string;
  backdropImageUrl?: string;
  backdropOpacity?: number;
  sourceUrl?: string;
  createdAt: string;
}

export interface SourcePost {
  id: string;
  rawText: string;
  sourcePlatform?: string;
  sourceUrl?: string;
  brandVoice: string;
  targetAudience: string;
  ctaPreference: string;
  createdAt: string;
}

export interface RepurposeIdea {
  id: string;
  angleType: string;
  title: string;
  hook: string;
  summary: string;
  rationale: string;
  formatFit: {
    reel: number;
    igCarousel: number;
    liCarousel: number;
  };
}

export interface IdeationResult {
  sourceAnalysis: {
    coreHookPattern: string;
    keyInsight: string;
    structureBreakdown: string;
  };
  ideas: RepurposeIdea[];
  usedMock: boolean;
}

export interface ReelBeat {
  id: string;
  timeframe: string;
  spokenLine: string;
  onScreenText: string;
  visualCue: string;
}

export interface ReelContent {
  hook: string;
  estimatedDuration: string;
  beats: ReelBeat[];
  caption: string;
  hashtags: string[];
  writingStyle: WritingStyleConfig;
  videoUrl?: string;
  videoFileName?: string;
  videoSizeBytes?: number;
}

export type CarouselSlideLayout = "default" | "grid-2x3";

export interface GridCell {
  number: number;
  title: string;
  toolIds: string[];
  description: string;
}

export interface ListItem {
  number: number;
  title: string;
  description: string;
}

export interface MetricCell {
  value: string;
  label: string;
}

export interface CheatsheetRow {
  scenario: string;
  agent: string;
  note?: string;
}

/** Per-slide background. Omitted or `inherit` uses the visual template and layout defaults. */
export type SlideSurface =
  | { kind: "inherit" }
  | { kind: "solid"; color: string }
  | {
      kind: "gradient";
      angle?: number;
      stops: { color: string; at: number }[];
    };

export interface CarouselSlide {
  intent?: SlideIntent;
  preferredPatternIds?: string[];
  selectionReason?: string;
  media?: SlideMediaPlacement[];
  patternContent?: {
    items?: Array<{ title: string; body: string }>;
    metric?: string; unit?: string; action?: string; prompt?: string;
    outcome?: string; recommendation?: string; badge?: string; takeaway?: string;
  };
  id: string;
  slideNumber: number;
  role: "cover" | "body" | "cta";
  eyebrow?: string;
  headline: string;
  body: string;
  visualDirection: string;
  /** Library template id from `src/lib/carousel-templates/` (set during normalize). */
  templateId?: string;
  layout?: CarouselSlideLayout;
  gridCells?: GridCell[];
  listItems?: ListItem[];
  metricCells?: MetricCell[];
  cheatsheetRows?: CheatsheetRow[];
  /** Background override. Missing means inherit. */
  surface?: SlideSurface;
  /** Optional accent / mint / CTA color for this slide. */
  accentOverride?: string;
}

export type CarouselLayoutPackId =
  | "auto-patterns"
  | "default"
  | "instagram-edwardai-ref"
  | "linkedin-pm-grid"
  | "linkedin-edwardai-ref";

export interface LayoutPackIds {
  instagram?: CarouselLayoutPackId | string;
  linkedin?: CarouselLayoutPackId | string;
}

export interface CarouselContent {
  design?: BrandDesignSettingsV1;
  platform: "instagram" | "linkedin";
  title: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  writingStyle: WritingStyleConfig;
  visualTemplateId: string;
  aspectRatio: AspectRatio;
  brandHandle: string;
  /** Layout pack used when normalizing slide templates (pre-generate choice). */
  layoutPackId?: string;
  /** Notes from the layout pack pipeline, such as an unknown graphics style. */
  layoutWarnings?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  accentColorOverride?: string;
}

export interface ContentDraft {
  id: string;
  title: string;
  sourcePost: SourcePost;
  idea: RepurposeIdea;
  reel?: ReelContent;
  igCarousel?: CarouselContent;
  liCarousel?: CarouselContent;
  bufferStatus?: "draft" | "queued" | "scheduled" | "published";
  createdAt: string;
  updatedAt: string;
}

export interface BrandVoicePreset {
  design?: BrandDesignSettingsV1;
  id: string;
  name: string;
  voice: string;
  audience: string;
  cta: string;
  handle: string;
  primaryColor: string;
  secondaryColor: string;
  defaultWritingStyle: WritingStyleId;
  defaultTone?: string;
}

export interface UserLayoutPack {
  id: string;
  name: string;
  platform: "instagram" | "linkedin";
  /** Graphics style ids, one per slide. */
  slideTemplateIds: string[];
  slideRoles?: Array<CarouselSlide["role"]>;
  createdAt: string;
  /** Manifest version the styles were chosen from. */
  catalogVersion: string;
  basedOnPackId?: string;
}

export interface BufferConnection {
  mode: "disconnected" | "demo" | "oauth" | "token";
  accessToken?: string;
  organizationName?: string;
  connectedAt?: string;
}

export interface BufferChannel {
  id: string;
  service: "instagram" | "linkedin";
  formattedUsername: string;
  avatar?: string;
  timezone: string;
  isMock: boolean;
}

export type BufferScheduleMode = "addToQueue" | "shareNow" | "customScheduled";

export interface ScheduledPost {
  id: string;
  draftId?: string;
  format: ContentFormat;
  channelId: string;
  channelName: string;
  service: "instagram" | "linkedin";
  text: string;
  mediaUrl?: string;
  mediaFileName?: string;
  mode: BufferScheduleMode;
  scheduledAt?: string;
  status: "queued" | "sent" | "scheduled";
  createdAt: string;
  isMock: boolean;
}

export interface AppStoreData {
  imageAssets?: SlideImageAsset[];
  drafts: ContentDraft[];
  brandPresets: BrandVoicePreset[];
  visualTemplates: VisualTemplate[];
  layoutPacks: UserLayoutPack[];
  bufferConnection: BufferConnection;
  mockQueue: ScheduledPost[];
}

export interface SlideImageAsset {
  id: string; url: string; fileName: string; mimeType: "image/png" | "image/jpeg" | "image/webp";
  width: number; height: number; sizeBytes: number; createdAt: string;
}
export interface SlideMediaPlacement {
  slotId: string; assetId: string; focalPoint: { x: number; y: number }; zoom: number; altText?: string;
}
