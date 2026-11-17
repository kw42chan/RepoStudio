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

export interface CarouselSlide {
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
}

export interface CarouselContent {
  platform: "instagram" | "linkedin";
  title: string;
  slides: CarouselSlide[];
  caption: string;
  hashtags: string[];
  writingStyle: WritingStyleConfig;
  visualTemplateId: string;
  aspectRatio: AspectRatio;
  brandHandle: string;
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
  drafts: ContentDraft[];
  brandPresets: BrandVoicePreset[];
  visualTemplates: VisualTemplate[];
  bufferConnection: BufferConnection;
  mockQueue: ScheduledPost[];
}
