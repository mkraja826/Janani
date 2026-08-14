export type JananiResponseLanguage = "en" | "te" | "hi";

const LANGUAGE_NAMES: Record<JananiResponseLanguage, string> = {
  en: "English",
  te: "Telugu",
  hi: "Hindi",
};

export function resolveResponseLanguage(value: unknown): JananiResponseLanguage {
  if (typeof value !== "string") return "en";
  const normalized = value.trim().toLowerCase().split(/[-_]/)[0];
  return normalized === "te" || normalized === "hi" ? normalized : "en";
}

export function responseLanguageInstruction(language: JananiResponseLanguage): string {
  const name = LANGUAGE_NAMES[language];
  return `RESPONSE_LANGUAGE=${language} (${name}). Respond in ${name} using natural, easy-to-understand wording. Do not translate or alter clinical thresholds, medicine instructions, urgency, safety actions, report values, units or proper names. If a safe accurate translation is uncertain, keep that specific medical term in English and explain it simply rather than guessing.`;
}
