---
type: project-spec
date: 2026-11-20
status: active
tags: [repostudio, slide-media, image-storage]
---

## Slide image behavior

[[Projects/RepoStudio/docs/carousel-next-phase-development-plan|Phase 4.4]] adds upload, replacement, reuse, removal, focal point, zoom, and image descriptions for declared layout slots. Text-only layouts show no image controls. Optional empty slots produce no image frame; required empty slots block export with an explanation.

PNG, JPEG, and WebP uploads are capped at 10 MB and 40 megapixels, decoded, oriented, resized within 4096 × 4096, and normalized to WebP. Invalid image contents are rejected even when the filename or MIME label claims PNG. The bounded request reader also caps chunked multipart bodies. Files use generated identifiers under `.data/images`, or the configured `REPOSTUDIO_DATA_DIR`. Metadata lives separately in the existing application store; slide JSON contains asset IDs and crop settings only.

Screenshots use contain and photos/icons use their declared cover behavior. Focus is clamped to 0–1; zoom is clamped to 1–3. Preview and export use the same image frame and crop math. Saved draft media survives reload. Explicit zoom can crop a contained screenshot; zoom 1 preserves its full contents.

Removing an image from a slide, deleting a slide, or replacing an upload retains the file for reuse. Explicit asset deletion is refused while any saved carousel slide references it. Unattached uploads remain available in the library; automatic garbage collection is deferred. Files require persistent local storage in production, matching the existing upload adapter. No hosted-storage deployment was performed in this development phase.

Verification: browser checks cover upload, invalid contents, crop focus, draft persistence, required-image export blocking, and refusal to delete a shared asset. Public-interface tests cover optional/required slots, unsupported text-only layouts, and coordinate/zoom clamping.
