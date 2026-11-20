import type { resolveSlideMedia } from "@/lib/carousel-slide-media";
import { MissingImage } from "./primitives";
export function ImageFrame({ media }: { media: ReturnType<typeof resolveSlideMedia>[number] }) {
  if (!media.asset) return media.slot.required ? <MissingImage label={media.slot.id}/> : null;
  return <div data-image-slot={media.slot.id} style={{ width: "100%", height: "100%", aspectRatio: media.slot.aspectRatio, minHeight: 0, maxHeight: "100%", borderRadius: 22, overflow: "hidden", position: "relative" }}>
    <img src={media.asset.url} alt={media.altText} style={{ display: "block", position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: media.slot.fit, objectPosition: `${media.focalPoint.x*100}% ${media.focalPoint.y*100}%`, transform: `scale(${media.zoom})`, transformOrigin: `${media.focalPoint.x*100}% ${media.focalPoint.y*100}%` }}/>
  </div>;
}
