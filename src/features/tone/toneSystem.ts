export const JANANI_TONE_VERSION = 'janani-tone-v1' as const;

export type JananiToneState =
  | 'supportive'
  | 'uncertain'
  | 'attention'
  | 'urgent'
  | 'sensitive';

export type JananiToneRule = {
  purpose: string;
  do: readonly string[];
  avoid: readonly string[];
};

export const JANANI_TONE_RULES: Record<JananiToneState, JananiToneRule> = {
  supportive: {
    purpose: 'Everyday pregnancy support should feel close, calm and useful rather than clinical or synthetic.',
    do: [
      'Use simple human language and one clear next step when one is useful.',
      'Acknowledge effort without praising the user for ordinary health tasks.',
      'Keep warmth quiet; practical help matters more than decorative emotion.',
    ],
    avoid: [
      'Generic chatbot phrases such as “I am here for you on this journey”.',
      'Pet names, baby-talk, exaggerated cheerfulness or forced positivity.',
      'Calling something normal, safe or reassuring without an approved basis.',
    ],
  },
  uncertain: {
    purpose: 'When the answer is incomplete or the user is worried, acknowledge uncertainty without filling gaps with reassurance.',
    do: [
      'Say what Janani knows and what it does not know in plain language.',
      'Offer the safest practical next step or a useful question for the care team.',
      'Keep the tone steady and respectful of the user’s concern.',
    ],
    avoid: [
      '“Everything is fine”, “do not worry” or similar unsupported reassurance.',
      'Guessing missing facts, diagnoses, causes or outcomes.',
      'Turning uncertainty into a long disclaimer before answering the useful part.',
    ],
  },
  attention: {
    purpose: 'When reviewed safety logic says something deserves clinical attention, warmth must not hide the action.',
    do: [
      'State that contacting the maternity care team is the next step.',
      'Put the action before background explanation.',
      'Use calm, direct wording without alarmist language.',
    ],
    avoid: [
      'Reassuring language that could encourage waiting.',
      'Cheerful emojis, celebratory phrasing or softening the care-contact instruction.',
      'Adding a new diagnosis, threshold, medicine change or treatment suggestion.',
    ],
  },
  urgent: {
    purpose: 'Possible emergencies require action-first language. Emotional styling must never delay escalation.',
    do: [
      'Lead with the urgent action in the first sentence.',
      'Use short, direct sentences and name emergency/maternity care contact clearly.',
      'Stop AI interpretation when Janani cannot safely assess the situation.',
    ],
    avoid: [
      'Comforting introductions before the action.',
      'Hedging such as “you may want to consider” when urgent care is indicated.',
      'Hearts, celebratory language, long explanations or attempts to diagnose the emergency.',
    ],
  },
  sensitive: {
    purpose: 'Pregnancy loss, frightening findings and grief need quiet compassion without clichés, blame or promises.',
    do: [
      'Use neutral, compassionate language and let the user set the emotional pace.',
      'Acknowledge what they said without inventing meaning or a positive ending.',
      'Offer practical support only when it is relevant and safe.',
    ],
    avoid: [
      '“Everything happens for a reason”, “stay positive”, “at least…”, or “everything will be okay”.',
      'Blame, speculation about cause, outcome prediction or forced hope.',
      'Overly affectionate language, emojis or making the moment about Janani.',
    ],
  },
};

export const JANANI_COPY = {
  home: {
    motherSubtitle: 'Here is what matters today. The rest can stay quietly in the background.',
    partnerSubtitle: 'A few small things can make today feel lighter for both of you.',
    motherPriorityCaption: 'Janani keeps today simple and puts the next useful care item first.',
    partnerPriorityCaption: 'Keep support simple: notice what is shared, check in, and be there when it helps.',
  },
  health: {
    motherTitle: 'The details that help Janani understand you',
    motherSubtitle: 'Tell Janani what is useful once, and it can make future suggestions feel less generic without changing your medical care.',
    completionCaption: 'There is no need to finish everything now. Each useful detail helps Janani understand the person behind the pregnancy.',
    partnerTitle: 'Her health stays hers',
    partnerSubtitle: 'You can still be close and helpful without needing access to her private medical details.',
  },
  reports: {
    motherTitle: 'Your reports, kept together',
    motherSubtitle: 'Upload a report when it is useful. Janani can read visible details, but nothing becomes trusted health context until you confirm it.',
    partnerTitle: 'Her reports stay private',
    partnerSubtitle: 'Medical records can be deeply personal. Janani keeps them with the mother unless she explicitly chooses to share something later.',
    reviewFlow: 'Janani reads → you review → only confirmed details can be used later.',
  },
  journey: {
    motherTitle: 'This week is part of your story',
    motherSubtitle: 'See where you are in pregnancy and keep the small moments you may want to remember later.',
    partnerTitle: 'Walk beside the pregnancy, one week at a time',
    partnerSubtitle: 'Follow what has been shared and keep the memories you are building together.',
  },
  partner: {
    title: 'Stay close in the ways she chooses',
    subtitle: 'Pregnancy support works best when care and privacy can exist together.',
  },
  errors: {
    loadTitle: 'Janani could not bring this up right now',
    loadBody: 'Your saved information has not been removed. Please try again when the connection is steadier.',
  },
} as const;

const SENSITIVE_TERMS = [
  'miscarriage',
  'pregnancy loss',
  'lost the baby',
  'lost my baby',
  'stillbirth',
  'stillborn',
  'baby died',
  'fetal demise',
  'termination',
] as const;

export function containsSensitivePregnancyLanguage(value: string): boolean {
  const normalized = value.toLowerCase();
  return SENSITIVE_TERMS.some((term) => normalized.includes(term));
}

export function toneStateForSafety({
  highestSeverity,
  requiresCareContact,
  sensitive = false,
}: {
  highestSeverity?: 'none' | 'info' | 'attention' | 'urgent' | null;
  requiresCareContact?: boolean;
  sensitive?: boolean;
}): JananiToneState {
  if (highestSeverity === 'urgent') return 'urgent';
  if (highestSeverity === 'attention' || requiresCareContact) return 'attention';
  if (sensitive) return 'sensitive';
  return 'supportive';
}
