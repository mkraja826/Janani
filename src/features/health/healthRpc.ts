import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type RpcResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type HealthRpcName =
  | 'get_own_health_profile'
  | 'save_own_health_profile'
  | 'get_own_private_care_context';

type LiveHealthRpc = <T>(
  fn: HealthRpcName,
  args: Record<string, unknown>,
) => PromiseLike<RpcResult<T>>;

// The live Janani project already contains the health RPCs introduced after
// the repository's last generated Database snapshot. Keep the compatibility
// boundary in one typed adapter until the full generated file is refreshed.
const liveHealthRpc = supabase.rpc.bind(supabase) as unknown as LiveHealthRpc;

export function getOwnHealthProfile(pregnancyId: string): PromiseLike<RpcResult<unknown>> {
  return liveHealthRpc('get_own_health_profile', { p_pregnancy_id: pregnancyId });
}

export function getOwnPrivateCareContext(pregnancyId: string): PromiseLike<RpcResult<unknown>> {
  return liveHealthRpc('get_own_private_care_context', { p_pregnancy_id: pregnancyId });
}

export function saveOwnHealthProfile({
  pregnancyId,
  profile,
  conditions,
}: {
  pregnancyId: string;
  profile: Record<string, unknown>;
  conditions: { condition_code: string; status: string }[];
}): PromiseLike<RpcResult<unknown>> {
  return liveHealthRpc('save_own_health_profile', {
    p_pregnancy_id: pregnancyId,
    p_profile: profile,
    p_conditions: conditions,
  });
}
