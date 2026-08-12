import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const AI_CONTEXT_CONSENT_VERSION = 'janani-ai-context-v1' as const;

export type AiPersonalizationConsent = {
  pregnancyId: string;
  enabled: boolean;
  consentVersion: string | null;
  consentedAt: string | null;
  revokedAt: string | null;
  currentConsentVersion: typeof AI_CONTEXT_CONSENT_VERSION;
};

type RpcResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type AiConsentRpcName =
  | 'get_current_own_ai_personalization_consent'
  | 'set_own_ai_personalization_consent';

type LiveAiConsentRpc = <T>(
  fn: AiConsentRpcName,
  args?: Record<string, unknown>,
) => PromiseLike<RpcResult<T>>;

const liveAiConsentRpc = supabase.rpc.bind(supabase) as unknown as LiveAiConsentRpc;

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export function parseAiPersonalizationConsent(value: unknown): AiPersonalizationConsent | null {
  const row = asObject(value);
  if (!row || typeof row.pregnancyId !== 'string') return null;
  return {
    pregnancyId: row.pregnancyId,
    enabled: row.enabled === true,
    consentVersion: typeof row.consentVersion === 'string' ? row.consentVersion : null,
    consentedAt: typeof row.consentedAt === 'string' ? row.consentedAt : null,
    revokedAt: typeof row.revokedAt === 'string' ? row.revokedAt : null,
    currentConsentVersion: AI_CONTEXT_CONSENT_VERSION,
  };
}

export function getCurrentAiPersonalizationConsent(): PromiseLike<RpcResult<unknown>> {
  return liveAiConsentRpc('get_current_own_ai_personalization_consent');
}

export function setAiPersonalizationConsent(
  pregnancyId: string,
  enabled: boolean,
): PromiseLike<RpcResult<unknown>> {
  return liveAiConsentRpc('set_own_ai_personalization_consent', {
    p_pregnancy_id: pregnancyId,
    p_enabled: enabled,
    p_consent_version: AI_CONTEXT_CONSENT_VERSION,
  });
}
