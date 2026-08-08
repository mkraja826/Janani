import { personalizeNutrition } from './personalize';
import { nutritionTopics } from './content';
import type { HealthProfile } from '@/features/health/healthProfile';

const baseProfile: HealthProfile = {
  pregnancy_id: 'pregnancy-1',
  current_weight_kg: 62,
  pregnancy_type: 'singleton',
  dietary_pattern: 'vegetarian',
  activity_level: 'moderate',
  cuisine_preferences: ['South Indian'],
  allergies: ['Peanut'],
  foods_avoided: ['Mushroom'],
  clinician_dietary_instructions: 'Follow my dietitian plan.',
  conditions: [],
};

describe('personalizeNutrition', () => {
  it('limits trimester-specific content to the current trimester', () => {
    const result = personalizeNutrition(nutritionTopics, { trimester: 2, profile: baseProfile });
    expect(result.visibleTopics.some((topic) => topic.id === 'nausea')).toBe(false);
  });

  it('surfaces saved allergy and clinician context without generating medical advice', () => {
    const result = personalizeNutrition(nutritionTopics, { trimester: 1, profile: baseProfile });
    expect(result.notices.some((notice) => notice.includes('Peanut'))).toBe(true);
    expect(result.notices.some((notice) => notice.includes('Clinician instructions'))).toBe(true);
  });

  it('fails closed when a condition-specific rule pack is required', () => {
    const result = personalizeNutrition(nutritionTopics, {
      trimester: 2,
      profile: {
        ...baseProfile,
        conditions: [{ condition_code: 'gestational_diabetes', status: 'doctor_diagnosed' }],
      },
    });
    expect(result.blockedPersonalization).toBe(true);
  });
});
