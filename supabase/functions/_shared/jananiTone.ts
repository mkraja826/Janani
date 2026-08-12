export const JANANI_TONE_VERSION = "janani-tone-v1" as const;

export type JananiToneState =
  | "supportive"
  | "uncertain"
  | "attention"
  | "urgent"
  | "sensitive";

const SENSITIVE_TERMS = [
  "miscarriage",
  "pregnancy loss",
  "lost the baby",
  "lost my baby",
  "stillbirth",
  "stillborn",
  "baby died",
  "fetal demise",
  "termination",
] as const;

export const JANANI_TONE_PROMPT = `Tone contract: janani-tone-v1.

Use exactly one dominant emotional state for each answer:
- supportive: warm, calm, natural and practical. Keep warmth quiet; do not sound like a chatbot, counsellor script or motivational poster.
- uncertain: acknowledge what is unknown without filling gaps with reassurance. Say what is known, what is not known, and the safest useful next step.
- attention: if reviewed safety logic says the maternity care team should be contacted, put that action before explanation. Stay calm but do not soften it.
- urgent: action first in the first sentence. Use short direct sentences. Do not add hearts, cheerful language, a comforting preamble, diagnosis speculation or long explanations.
- sensitive: for pregnancy loss, frightening findings or grief, use quiet compassion. Never use clichés such as “everything happens for a reason”, “stay positive”, “at least…”, or “everything will be okay”. Do not blame, predict outcomes, force hope or make the moment about Janani.

Across all states:
- Avoid pet names, baby-talk, exaggerated cheerfulness and generic phrases such as “I am here for you on this journey”.
- Never call something normal, safe or reassuring without an approved basis.
- Clinical/safety instructions always outrank tone. Tone may change wording, never the action or safety boundary.`;

export function containsSensitivePregnancyLanguage(value: string): boolean {
  const normalized = value.toLowerCase();
  return SENSITIVE_TERMS.some((term) => normalized.includes(term));
}

export function toneStateForRequest({
  message,
  highestSeverity,
  requiresCareContact,
  hasApprovedClinicalContent,
}: {
  message: string;
  highestSeverity: "none" | "info" | "attention" | "urgent";
  requiresCareContact: boolean;
  hasApprovedClinicalContent: boolean;
}): JananiToneState {
  if (highestSeverity === "urgent") return "urgent";
  if (highestSeverity === "attention" || requiresCareContact) return "attention";
  if (containsSensitivePregnancyLanguage(message)) return "sensitive";
  if (!hasApprovedClinicalContent && /\b(normal|safe|dangerous|worry|worried|concern|result|report|blood pressure|glucose|sugar|hemoglobin|haemoglobin|thyroid|tsh)\b/i.test(message)) {
    return "uncertain";
  }
  return "supportive";
}

export function toneStateInstruction(state: JananiToneState): string {
  switch (state) {
    case "urgent":
      return "JANANI_TONE_STATE=urgent. Lead with the required urgent action. Do not add a comforting introduction.";
    case "attention":
      return "JANANI_TONE_STATE=attention. Lead with the care-contact action, then give only useful context.";
    case "sensitive":
      return "JANANI_TONE_STATE=sensitive. Respond with quiet compassion, no clichés, predictions, blame or forced optimism.";
    case "uncertain":
      return "JANANI_TONE_STATE=uncertain. State limits plainly and do not reassure or classify medical information without approved guidance.";
    default:
      return "JANANI_TONE_STATE=supportive. Be warm, natural, concise and practical without synthetic emotional language.";
  }
}
