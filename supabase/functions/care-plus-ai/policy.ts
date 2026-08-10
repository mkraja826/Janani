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

// Remains empty until clinical review formally approves each pack.
export const SERVER_APPROVED_CONDITION_PACKS = new Set<string>();

const URGENT_INPUT_PATTERNS = [
  'heavy bleeding','severe abdominal pain','severe stomach pain','trouble breathing','difficulty breathing',
  'seizure','fainted','fainting','loss of consciousness','unconscious','severe headache','blurred vision','vision changes',
];

const UNSAFE_OUTPUT_PATTERNS: RegExp[] = [
  /\b(stop|start|increase|decrease|double|halve|skip)\b.{0,35}\b(medication|medicine|insulin|dose|dosage|tablet|supplement)\b/i,
  /\b(take|use|inject)\b.{0,20}\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|units?|iu)\b/i,
  /\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|units?|iu)\b.{0,30}\b(insulin|medicine|medication|tablet|supplement|iron|folate|thyroid)\b/i,
  /\byou (definitely|certainly) (have|do not have)\b/i,
  /\b(no need|do not need) to (see|contact|call) (a |your )?(doctor|clinician|care team|hospital)\b/i,
  /\b(your baby|the baby|you) (is|are) (completely )?safe\b/i,
  /\bguarantee(d)?\b.{0,30}\b(safe|healthy|normal)\b/i,
];

export function isAiCategory(value: unknown): value is AiCategory {
  return typeof value === 'string' && (AI_CATEGORIES as readonly string[]).includes(value);
}

export function isUrgentInput(text: string): boolean {
  const lower = text.toLowerCase();
  return URGENT_INPUT_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function validateGeneratedText(text: string): { ok: true } | { ok: false; code: string } {
  if (!text.trim()) return { ok: false, code: 'empty_output' };
  if (text.length > 8000) return { ok: false, code: 'output_too_long' };
  if (UNSAFE_OUTPUT_PATTERNS.some((pattern) => pattern.test(text))) return { ok: false, code: 'prohibited_medical_claim' };
  return { ok: true };
}
