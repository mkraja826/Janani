import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import {
  CONDITION_SENSITIVE_CATEGORIES,
  SERVER_APPROVED_CONDITION_PACKS,
  isAiCategory,
} from './policy.ts';

const jsonHeaders = { 'content-type': 'application/json' };

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function compactString(value: unknown, max = 500): string | null {
  if (typeof value !== 'string') return null;
  const next = value.trim().slice(0, max);
  return next || null;
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond(405, { error: 'method_not_allowed' });

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond(401, { error: 'authentication_required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!supabaseUrl || !anonKey) return respond(503, { error: 'gateway_not_configured' });

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return respond(401, { error: 'invalid_session' });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return respond(400, { error: 'invalid_json' });
  }

  const pregnancyId = compactString(body.pregnancyId, 80);
  const category = body.category;
  const userText = compactString(body.userText, 1200);
  if (!pregnancyId) return respond(400, { error: 'pregnancy_id_required' });
  if (!isAiCategory(category)) return respond(400, { error: 'unsupported_category' });

  const { data: entitlement, error: entitlementError } = await supabase.rpc('get_own_care_plus_status');
  if (entitlementError) return respond(503, { error: 'entitlement_check_failed' });
  if (!entitlement?.active) return respond(402, { error: 'care_plus_required' });

  // This RPC verifies that the signed-in user owns the pregnancy as the mother.
  const { data: profile, error: profileError } = await supabase.rpc('get_own_health_profile', {
    p_pregnancy_id: pregnancyId,
  });
  if (profileError || !profile) return respond(403, { error: 'health_profile_unavailable' });

  const activeConditions = Array.isArray(profile.conditions)
    ? profile.conditions
        .filter((item: Record<string, unknown>) => item?.status !== 'pregnancy_history')
        .map((item: Record<string, unknown>) => compactString(item?.condition_code, 80))
        .filter((value: string | null): value is string => Boolean(value))
    : [];

  const unapprovedConditions = activeConditions.filter(
    (condition: string) => !SERVER_APPROVED_CONDITION_PACKS.has(condition),
  );

  if (CONDITION_SENSITIVE_CATEGORIES.has(category) && unapprovedConditions.length > 0) {
    return respond(409, {
      error: 'condition_rule_pack_not_approved',
      blockedConditions: unapprovedConditions,
    });
  }

  const minimalContext = {
    dietaryPattern: compactString(profile.dietary_pattern, 40),
    pregnancyType: compactString(profile.pregnancy_type, 40),
    cuisinePreferences: Array.isArray(profile.cuisine_preferences)
      ? profile.cuisine_preferences.slice(0, 10).map((item: unknown) => compactString(item, 80)).filter(Boolean)
      : [],
    allergies: Array.isArray(profile.allergies)
      ? profile.allergies.slice(0, 20).map((item: unknown) => compactString(item, 80)).filter(Boolean)
      : [],
    foodsAvoided: Array.isArray(profile.foods_avoided)
      ? profile.foods_avoided.slice(0, 20).map((item: unknown) => compactString(item, 80)).filter(Boolean)
      : [],
    clinicianDietaryInstructions: compactString(profile.clinician_dietary_instructions, 700),
    activeConditions,
  };

  // Keep the production switch closed until a provider has passed privacy,
  // clinical-safety, cost, and evaluation gates. No quota is reserved while
  // disabled, so users are not charged for unavailable AI.
  if (Deno.env.get('JANANI_AI_ENABLED') !== 'true') {
    return respond(503, {
      error: 'ai_temporarily_unavailable',
      gatewayReady: true,
      category,
    });
  }

  const provider = Deno.env.get('JANANI_AI_PROVIDER') ?? 'disabled';
  if (provider === 'disabled') {
    return respond(503, { error: 'ai_provider_disabled' });
  }

  // Provider adapters are intentionally not enabled in this milestone.
  // The next provider implementation must consume only this minimal context,
  // reserve quota immediately before the model call, validate output, and
  // record actual provider/model/token metadata server-side.
  void minimalContext;
  void userText;
  return respond(501, { error: 'provider_adapter_not_implemented' });
});
