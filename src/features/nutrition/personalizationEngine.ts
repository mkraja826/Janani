import type { HealthConditionCode } from '@/features/health/healthProfile';
import type { NutritionTopic } from '@/features/nutrition/content';
import { nutritionTopics } from '@/features/nutrition/content';
import { isConditionPersonalizationApproved } from '@/features/clinical/conditionRegistry';

export type NutritionPersonalizationInput = {
  trimester: 1 | 2 | 3 | null;
  dietaryPattern: string;
  allergies: string[];
  foodsAvoided: string[];
  activeConditions: HealthConditionCode[];
  clinicianInstructions: string | null;
};

export type NutritionPersonalizationResult = {
  topics: NutritionTopic[];
  blockedConditionCodes: HealthConditionCode[];
  clinicianInstructionsPresent: boolean;
  safetyNotes: string[];
};

function appliesToTrimester(topic: NutritionTopic, trimester: 1 | 2 | 3 | null) {
  return topic.trimester === 'all' || trimester === null || topic.trimester === trimester;
}

function appliesToDiet(topic: NutritionTopic, dietaryPattern: string) {
  const dietTags = new Set(['vegetarian', 'eggetarian', 'non_vegetarian', 'vegan']);
  const topicDietTags = topic.tags.filter((tag) => dietTags.has(tag));
  return topicDietTags.length === 0 || dietaryPattern === 'no_preference' || topicDietTags.includes(dietaryPattern);
}

export function personalizeNutrition(input: NutritionPersonalizationInput): NutritionPersonalizationResult {
  const blockedConditionCodes = input.activeConditions.filter((code) => !isConditionPersonalizationApproved(code));
  const topics = nutritionTopics.filter((topic) => appliesToTrimester(topic, input.trimester) && appliesToDiet(topic, input.dietaryPattern));

  const safetyNotes: string[] = [];
  if (input.allergies.length > 0) safetyNotes.push('Known allergies or intolerances must take priority over generic food ideas.');
  if (input.foodsAvoided.length > 0) safetyNotes.push('Foods the mother has chosen to avoid should not be suggested.');
  if (input.clinicianInstructions?.trim()) safetyNotes.push('Clinician instructions take priority over Janani guidance.');
  if (blockedConditionCodes.length > 0) safetyNotes.push('Condition-specific nutrition personalization is disabled until the matching clinical rule pack is approved.');

  return {
    topics,
    blockedConditionCodes,
    clinicianInstructionsPresent: Boolean(input.clinicianInstructions?.trim()),
    safetyNotes,
  };
}
