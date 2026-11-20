import type { CarouselContent, CarouselSlide } from "./types";

export type DeckCommand =
  | { type: "normalize" }
  | { type: "add"; slide: CarouselSlide; afterId?: string }
  | { type: "delete"; id: string }
  | { type: "move"; id: string; toIndex: number }
  | { type: "duplicate"; id: string; newId: string };

export const MIN_SLIDES = 3;
export const MAX_SLIDES = 12;
const overrideWarning = "Slide order or count changed. This deck has per-slide overrides; the saved layout pack is unchanged. Use Reset explicitly to restore a pack layout.";

/** Moves keep content, IDs, and media together; roles follow their position. */
export function applyDeckCommand(carousel: CarouselContent, command: DeckCommand): CarouselContent {
  let slides = [...carousel.slides];
  const find = (id: string) => slides.findIndex(s => s.id === id);
  if (command.type === "add") {
    if (slides.length >= MAX_SLIDES || find(command.slide.id) !== -1) return carousel;
    const after = command.afterId ? find(command.afterId) : slides.length - (slides.at(-1)?.role === "cta" ? 2 : 1);
    if (command.afterId && after === -1) return carousel;
    slides.splice(after + 1, 0, command.slide);
  } else if (command.type === "delete") {
    if (slides.length <= MIN_SLIDES || find(command.id) === -1) return carousel;
    slides = slides.filter(s => s.id !== command.id);
  } else if (command.type === "move") {
    const from = find(command.id);
    if (from === -1 || !Number.isInteger(command.toIndex)) return carousel;
    const to = Math.max(0, Math.min(slides.length - 1, command.toIndex));
    if (from === to) return carousel;
    const [slide] = slides.splice(from, 1);
    slides.splice(to, 0, slide);
  } else if (command.type === "duplicate") {
    const from = find(command.id);
    if (from === -1 || slides.length >= MAX_SLIDES || find(command.newId) !== -1) return carousel;
    const original = slides[from];
    slides.splice(from + 1, 0, { ...structuredClone(original), id: command.newId, role: "body" });
  }
  if (slides.length < MIN_SLIDES || slides.length > MAX_SLIDES || new Set(slides.map(s => s.id)).size !== slides.length) {
    throw new Error("A carousel needs 3–12 uniquely identified slides.");
  }
  const hasCta = slides.some(s => s.role === "cta");
  slides = slides.map((s, index) => ({ ...s, slideNumber: index + 1, role: index === 0 ? "cover" : hasCta && index === slides.length - 1 ? "cta" : "body" }));
  return { ...carousel, slides, layoutWarnings: command.type === "normalize" ? carousel.layoutWarnings : [...new Set([...(carousel.layoutWarnings ?? []), overrideWarning])] };
}

/** Keep focus on the same stable slide; after deletion choose the nearest survivor. */
export function activeSlideIndex(previous: CarouselContent, next: CarouselContent, activeId: string) {
  const surviving = next.slides.findIndex(s => s.id === activeId);
  return surviving >= 0 ? surviving : Math.max(0, Math.min(next.slides.length - 1, previous.slides.findIndex(s => s.id === activeId)));
}
