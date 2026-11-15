const CUE_LINE =
  /^(?:WEBVTT|\d+|\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\s+-->\s+\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?)$/;

const LEADING_TIMESTAMP =
  /^\[?\d{1,2}:\d{2}(?::\d{2})?(?:[.,]\d{1,3})?\]?\s+/;

export function spokenTextFromTranscript(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !CUE_LINE.test(line))
    .map((line) => line.replace(LEADING_TIMESTAMP, "").trim())
    .filter((line) => line.length > 0)
    .join("\n");
}
