import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { generateWithConfiguredProvider } from './provider.ts';
import { CONDITION_SENSITIVE_CATEGORIES, isAiCategory, isUrgentInput, validateGeneratedText } from './policy.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const jsonHeaders = { ...corsHeaders, 'Content-Type': 'application/json' };

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}
function compactString(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const next = value.trim().slice(0, max);
  return next || null;
}
function compactArray(value: unknown, maxItems: number, maxChars = 120): string[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, maxItems).map((item) => compactString(item, maxChars)).filter((item): item is string => Boolean(item));
}
function compactMedications(value: unknown) {
  if (!Array.isArray(value)) return [];
  return value.filter((item: any) => item?.active !== false).slice(0, 30).map((item: any) => ({
    kind: compactString(item?.kind, 20),
    name: compactString(item?.name, 160),
    strength: compactString(item?.strength, 120),
    schedule: compactString(item?.schedule_text, 500),
    clinicianInstructions: compactString(item?.clinician_instructions, 700),
  }));
}

const SYSTEM_PROMPT = `You are Janani Care+, a calm maternal-support assistant. Use only the supplied Janani context and general supportive knowledge.
Rules:
- Never diagnose, prescribe, recommend medication/supplement doses, change medication, or set glucose/BP/thyroid targets.
- Never claim that a mother or baby is safe, normal, or free of a condition.
- Clinician instructions in the supplied context always take priority.
- Do not invent missing readings, appointments, conditions, allergies, test results, medication details, pregnancy history, or clinician instructions.
- Recorded medications and supplements are context only; never infer a dose change, interaction, indication, or adherence from them.
- For health trends, summarize recorded data without deciding whether values are medically safe.
- For appointments, help organize recorded information and questions; do not decide which tests or scans are required.
- For nutrition, respect recorded allergies, avoided foods, diet pattern, region preference, and clinician instructions. Do not provide condition-specific personalization unless the server supplied an approved clinical rule version.
- Respond in the recorded preferred language when possible, while preserving medical-safety meaning.
- Keep responses concise, warm, practical, and pregnancy-focused.
- If the supplied request suggests urgent symptoms, do not continue with ordinary AI advice.`;

function selectContext(
  category: string,
  pregnancy: Record<string, unknown>,
  profile: Record<string, unknown>,
  tracker: Record<string, unknown>,
  care: unknown[],
  privateCare: Record<string, unknown>,
  approvedRulePacks: unknown[],
) {
  const base = {
    pregnancy: {
      dueDate: compactString(pregnancy.due_date, 40),
      pregnancyType: compactString(profile.pregnancy_type, 40),
    },
    preferences: {
      language: compactString(privateCare.preferred_language, 35) ?? 'en',
      region: compactString(privateCare.region_preference, 120),
    },
    conditions: Array.isArray(profile.conditions) ? profile.conditions.slice(0, 20) : [],
    approvedClinicalRulePacks: approvedRulePacks,
    clinicianInstructions: compactString(privateCare.broader_clinician_instructions, 1200),
  };
  const nutrition = {
    dietaryPattern: compactString(profile.dietary_pattern, 40),
    cuisinePreferences: compactArray(profile.cuisine_preferences, 10, 80),
    allergies: compactArray(profile.allergies, 20, 80),
    foodsAvoided: compactArray(profile.foods_avoided, 20, 80),
    regionPreference: compactString(privateCare.region_preference, 120),
    clinicianDietaryInstructions: compactString(profile.clinician_dietary_instructions, 700),
  };
  const trends = {
    latestWeight: Array.isArray(tracker.weight) ? tracker.weight.slice(0, 1) : [],
    bloodPressure: Array.isArray(tracker.blood_pressure) ? tracker.blood_pressure.slice(0, 14) : [],
    glucose: Array.isArray(tracker.glucose) ? tracker.glucose.slice(0, 20) : [],
    labs: Array.isArray(tracker.labs) ? tracker.labs.slice(0, 12) : [],
    symptoms: Array.isArray(tracker.symptoms) ? tracker.symptoms.slice(0, 20) : [],
  };
  const appointments = care.slice(0, 20).map((item: any) => ({
    appointmentType: compactString(item?.appointment_type, 40),
    scheduledAt: compactString(item?.scheduled_at, 50),
    provider: compactString(item?.provider_name, 120),
    facility: compactString(item?.facility_name, 160),
    purpose: compactString(item?.purpose, 500),
    questions: compactArray(item?.questions, 20, 240),
    notesAfter: compactString(item?.notes_after, 1200),
    testsPrescribed: compactArray(item?.tests_prescribed, 20, 200),
    nextFollowupAt: compactString(item?.next_followup_at, 50),
    status: compactString(item?.status, 30),
  }));
  const medications = compactMedications(privateCare.medications);
  const history = {
    relevantMedicalHistory: compactString(privateCare.relevant_medical_history, 1200),
    previousPregnancyHistory: compactString(privateCare.previous_pregnancy_history, 1200),
  };

  if (category === 'weekly_meal_ideas' || category === 'meal_alternative') return { ...base, nutrition, medications };
  if (category === 'appointment_summary') return { ...base, history, medications, appointments, trends: { symptoms: trends.symptoms, bloodPressure: trends.bloodPressure, glucose: trends.glucose } };
  if (category === 'health_trend_summary') return { ...base, history, medications, trends };
  if (category === 'daily_summary') return { ...base, medications, nutrition, trends, appointments: appointments.slice(0, 5) };
  return { ...base, history, medications, nutrition, trends: { symptoms: trends.symptoms.slice(0, 8) }, appointments: appointments.slice(0, 5) };
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond(405, { error: 'method_not_allowed' });

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond(401, { error: 'authentication_required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!supabaseUrl || !anonKey || !serviceKey) return respond(503, { error: 'gateway_not_configured' });

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }, auth: { persistSession: false },
  });
  const serviceClient = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return respond(401, { error: 'invalid_session' });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return respond(400, { error: 'invalid_json' }); }
  const pregnancyId = compactString(body.pregnancyId, 80);
  const category = body.category;
  const userText = compactString(body.userText, 1200) ?? '';
  if (!pregnancyId) return respond(400, { error: 'pregnancy_id_required' });
  if (!isAiCategory(category)) return respond(400, { error: 'unsupported_category' });

  if (userText && isUrgentInput(userText)) {
    return respond(200, {
      text: 'This could need urgent medical attention. Please contact your maternity care team or local emergency service now rather than waiting for Janani Care+ to assess it.',
      safety: 'urgent',
    });
  }

  const { data: entitlement, error: entitlementError } = await userClient.rpc('get_own_care_plus_status');
  if (entitlementError) return respond(503, { error: 'entitlement_check_failed' });
  if (!entitlement?.active) return respond(402, { error: 'care_plus_required' });

  const [pregnancyResult, profileResult, trackerResult, careResult, privateCareResult] = await Promise.all([
    userClient.from('pregnancies').select('id,due_date,status').eq('id', pregnancyId).maybeSingle(),
    userClient.rpc('get_own_health_profile', { p_pregnancy_id: pregnancyId }),
    userClient.rpc('get_own_health_tracker', { p_pregnancy_id: pregnancyId }),
    userClient.rpc('list_own_care_appointments', { p_pregnancy_id: pregnancyId }),
    userClient.rpc('get_own_private_care_context', { p_pregnancy_id: pregnancyId }),
  ]);
  if (pregnancyResult.error || !pregnancyResult.data || profileResult.error || !profileResult.data || privateCareResult.error || !privateCareResult.data) {
    return respond(403, { error: 'mother_profile_unavailable' });
  }
  if (trackerResult.error || careResult.error) return respond(503, { error: 'context_load_failed' });

  const profile = profileResult.data as Record<string, unknown>;
  const activeConditions = Array.isArray(profile.conditions)
    ? profile.conditions
        .filter((item: any) => item?.status !== 'pregnancy_history')
        .map((item: any) => compactString(item?.condition_code, 80))
        .filter((value: string | null): value is string => Boolean(value))
    : [];

  let approvedRulePacks: Array<Record<string, unknown>> = [];
  if (activeConditions.length > 0) {
    const { data: approved, error: approvalError } = await serviceClient.rpc('get_active_clinical_rule_packs_server', {
      p_condition_codes: activeConditions,
    });
    if (approvalError) return respond(503, { error: 'clinical_rule_registry_unavailable' });
    approvedRulePacks = Array.isArray(approved) ? approved : [];
  }
  const approvedCodes = new Set(
    approvedRulePacks
      .map((item) => compactString(item?.conditionCode, 80))
      .filter((value): value is string => Boolean(value)),
  );
  const blockedConditions = activeConditions.filter((condition) => !approvedCodes.has(condition));
  if (CONDITION_SENSITIVE_CATEGORIES.has(category) && blockedConditions.length > 0) {
    return respond(409, { error: 'condition_rule_pack_not_approved', blockedConditions, safety: 'blocked' });
  }

  if (Deno.env.get('JANANI_AI_ENABLED') !== 'true') {
    return respond(503, { error: 'ai_temporarily_unavailable', gatewayReady: true });
  }
  if ((Deno.env.get('JANANI_AI_PROVIDER') ?? 'disabled') === 'disabled') {
    return respond(503, { error: 'ai_provider_disabled', gatewayReady: true });
  }

  const context = selectContext(
    category,
    pregnancyResult.data as Record<string, unknown>,
    profile,
    (trackerResult.data ?? {}) as Record<string, unknown>,
    Array.isArray(careResult.data) ? careResult.data : [],
    privateCareResult.data as Record<string, unknown>,
    approvedRulePacks,
  );
  const userPrompt = JSON.stringify({ category, context, request: userText || null });
  const estimatedInput = Math.min(12000, Math.ceil((SYSTEM_PROMPT.length + userPrompt.length) / 4));
  const estimatedOutput = 700;

  const { data: generationId, error: reserveError } = await serviceClient.rpc('reserve_care_plus_ai_request_server', {
    p_user_id: userData.user.id,
    p_pregnancy_id: pregnancyId,
    p_category: category,
    p_estimated_input_tokens: estimatedInput,
    p_estimated_output_tokens: estimatedOutput,
  });
  if (reserveError || !generationId) return respond(429, { error: 'care_plus_quota_unavailable' });

  try {
    const result = await generateWithConfiguredProvider({ systemPrompt: SYSTEM_PROMPT, userPrompt });
    const safety = validateGeneratedText(result.text);
    if (!safety.ok) {
      await serviceClient.rpc('finalize_care_plus_ai_request_server', {
        p_generation_id: generationId,
        p_status: 'rejected',
        p_actual_input_tokens: result.inputTokens,
        p_actual_output_tokens: result.outputTokens,
        p_refund_usage: true,
      });
      return respond(422, { error: 'unsafe_ai_output_rejected', safety: 'blocked' });
    }
    await serviceClient.rpc('finalize_care_plus_ai_request_server', {
      p_generation_id: generationId,
      p_status: 'completed',
      p_actual_input_tokens: result.inputTokens,
      p_actual_output_tokens: result.outputTokens,
      p_refund_usage: false,
    });
    return respond(200, { text: result.text, safety: 'generated', usage: { inputTokens: result.inputTokens, outputTokens: result.outputTokens } });
  } catch {
    await serviceClient.rpc('finalize_care_plus_ai_request_server', {
      p_generation_id: generationId,
      p_status: 'provider_error',
      p_actual_input_tokens: 0,
      p_actual_output_tokens: 0,
      p_refund_usage: true,
    });
    return respond(503, { error: 'ai_temporarily_unavailable' });
  }
});
