const LANGUAGE_NAMES: Record<string, string> = {
  ja: "Japanese",
  en: "English",
  zh: "Chinese",
  ko: "Korean",
  es: "Spanish",
  fr: "French",
  de: "German",
  pt: "Portuguese",
};

export function languageNameFromCode(code: string | undefined): string | null {
  if (!code) return null;
  const name = LANGUAGE_NAMES[code.toLowerCase().slice(0, 2)];
  return name || null;
}

export function originalLanguageName(text: string): string | null {
  const kana = (text.match(/[\u3040-\u30ff]/g) || []).length;
  const hangul = (text.match(/[\uac00-\ud7af]/g) || []).length;
  const han = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (kana >= 4) return "Japanese";
  if (hangul >= 4) return "Korean";
  if (han >= 4) return "Chinese";
  return null;
}

export function sameLanguageRule(source: string): string {
  const language = detectLanguageName(source);
  return `Write every natural-language field in ${language}. This is the language of the source post. Do not translate it. Do not write in Japanese unless the source post itself is Japanese.`;
}

function detectLanguageName(text: string): string {
  const kana = (text.match(/[\u3040-\u30ff]/g) || []).length;
  const hangul = (text.match(/[\uac00-\ud7af]/g) || []).length;
  const han = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  if (kana >= 4) return "Japanese";
  if (hangul >= 4) return "Korean";
  if (han >= 4) return "Chinese";
  return "the same language as the source post";
}
