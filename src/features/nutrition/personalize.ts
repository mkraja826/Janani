import type { HealthProfile } from '@/features/health/healthProfile';
import type { NutritionTopic } from '@/features/nutrition/content';
import { getConditionRulePack } from '@/features/nutrition/conditionRulePacks';

export type NutritionContext = {
  trimester: 1 | 2 | 3 | null;
  profile: HealthProfile | null;
};

export type NutritionPersonalization = {
  visibleTopics: NutritionTopic[];
  notices: string[];
  blockedPersonalization: boolean;
};

function normalize(values: string[]): string[] {
  return values.map((value) => value.trim().toLowerCase()).filter(Boolean);
}

export function personalizeNutrition(
  topics: NutritionTopic[],
  context: NutritionContext,
): NutritionPersonalization {
  const { trimester, profile } = context;
  const notices: string[] = [];

  const visibleTopics = topics.filter((topic) => {
    if (topic.trimester === 'all') return true;
    return trimester === null || topic.trimester === trimester;
  });

  if (!profile) {
    notices.push('Complete your private health profile to let Janani apply diet preference and allergy safety filters.');
    return { visibleTopics, notices, blockedPersonalization: true };
  }

  const allergies = normalize(profile.allergies);
  const avoided = normalize(profile.foods_avoided);

  if (profile.dietary_pattern !== 'no_preference') {
    notices.push(`Food pattern saved: ${profile.dietary_pattern.replace('_', ' ')}.`);
  }
  if (profile.cuisine_preferences.length) {
    notices.push(`Cuisine preferences: ${profile.cuisine_preferences.join(', ')}.`);
  }
  if (allergies.length) {
    notices.push(`Allergy/intolerance filter active: ${profile.allergies.join(', ')}. Janani will not deliberately recommend these foods in future personalised meal suggestions.`);
  }
  if (avoided.length) {
    notices.push(`Foods avoided: ${profile.foods_avoided.join(', ')}.`);
  }
  if (profile.clinician_dietary_instructions) {
    notices.push('Clinician instructions are saved and must take priority over generic Janani guidance.');
  }

  let blockedPersonalization = false;
  const activeConditions = profile.conditions.filter((condition) => condition.status !== 'pregnancy_history');

  for (const condition of activeConditions) {
    const requiresReviewedRules = [
      'preexisting_diabetes',
      'gestational_diabetes',
      'hypothyroidism',
      'hyperthyroidism',
      'chronic_hypertension',
      'pregnancy_hypertension',
      'anemia',
    ].includes(condition.condition_code);

    if (!requiresReviewedRules) continue;

    const pack = getConditionRulePack(condition.condition_code);
    if (!pack) {
      blockedPersonalization = true;
      notices.push('Condition-specific meal advice remains disabled because a reviewed Janani rule pack is not yet available. Continue following your maternity team or dietitian.');
      continue;
    }

    if (!pack.enabledForPersonalization || pack.status !== 'approved') {
      blockedPersonalization = true;
      notices.push('A condition-specific Janani guidance pack has been prepared but is still awaiting clinical approval. Personalised meal advice remains disabled until that review is complete.');
      continue;
    }

    notices.push('A clinically reviewed condition guidance pack is available. Your clinician-entered instructions and targets still take priority.');
  }

  return {
    visibleTopics,
    notices,
    blockedPersonalization,
  };
}
