export const AI_CATEGORIES = [
  'daily_summary',
  'weekly_meal_ideas',
  'appointment_summary',
  'health_trend_summary',
  'explain_guidance',
  'meal_alternative',
] as const;

export type AiCategory = typeof AI_CATEGORIES[number];

export const CONDITION_SENSITIVE_CATEGORIES = new Set<AiCategory>([
  'daily_summary',
  'weekly_meal_ideas',
  'health_trend_summary',
  'explain_guidance',
  'meal_alternative',
]);

// Rule packs are deliberately not approved merely because a source-grounded
// draft exists in the repository. Add a condition here only after the pack's
// clinical review state is changed to approved through the review process.
export const SERVER_APPROVED_CONDITION_PACKS = new Set<string>();

const UNSAFE_OUTPUT_PATTERNS: RegExp[] = [
  /\b(stop|start|increase|decrease|double|halve|skip)\b.{0,35}\b(medication|medicine|insulin|dose|dosage|tablet|supplement)\b/i,
  /\byou (definitely|certainly) (have|do not have)\b/i,
  /\b(no need|do not need) to (see|contact|call) (a |your )?(doctor|clinician|care team|hospital)\b/i,
  /\b(your baby|the baby|you) (is|are) (completely )?safe\b/i,
  /\bguarantee(d)?\b.{0,30}\b(safe|healthy|normal)\b/i,
];

export function isAiCategory(value: unknown): value is AiCategory {
  return typeof value === 'string' && (AI_CATEGORIES as readonly string[]).includes(value);
}

export function validateGeneratedText(text: string): { ok: true } | { ok: false; code: string } {
  if (!text.trim()) return { ok: false, code: 'empty_output' };
  if (text.length > 8000) return { ok: false, code: 'output_too_long' };
  if (UNSAFE_OUTPUT_PATTERNS.some((pattern) => pattern.test(text))) {
    return { ok: false, code: 'prohibited_medical_claim' };
  }
  return { ok: true };
}
