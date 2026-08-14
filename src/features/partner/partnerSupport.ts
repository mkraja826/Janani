import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type RpcResult<T> = { data: T | null; error: PostgrestError | null };

type PartnerRpcName =
  | 'get_current_partner_support_context'
  | 'get_current_own_partner_sharing'
  | 'set_current_own_partner_sharing';

type LivePartnerRpc = <T>(
  fn: PartnerRpcName,
  args?: Record<string, unknown>,
) => PromiseLike<RpcResult<T>>;

const partnerRpc = supabase.rpc.bind(supabase) as unknown as LivePartnerRpc;

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

export type PartnerAppointment = {
  appointmentType: string;
  scheduledAt: string;
};

export type PartnerSupportContext = {
  familyName: string;
  pregnancyProgressShared: boolean;
  careTimelineShared: boolean;
  pregnancy: { dueDate: string; status: string } | null;
  upcomingAppointments: PartnerAppointment[];
};

export type PartnerSharing = {
  pregnancyId: string;
  sharePregnancyProgress: boolean;
  shareCareTimeline: boolean;
};

export function parsePartnerSupportContext(value: unknown): PartnerSupportContext | null {
  const row = asObject(value);
  if (!row) return null;
  const pregnancyRow = asObject(row.pregnancy);
  const appointments = Array.isArray(row.upcomingAppointments)
    ? row.upcomingAppointments.map((candidate) => {
        const item = asObject(candidate);
        if (!item || typeof item.appointmentType !== 'string' || typeof item.scheduledAt !== 'string') return null;
        return { appointmentType: item.appointmentType, scheduledAt: item.scheduledAt };
      }).filter((item): item is PartnerAppointment => Boolean(item)).slice(0, 3)
    : [];
  return {
    familyName: typeof row.familyName === 'string' ? row.familyName : 'Our little family',
    pregnancyProgressShared: row.pregnancyProgressShared === true,
    careTimelineShared: row.careTimelineShared === true,
    pregnancy: pregnancyRow && typeof pregnancyRow.dueDate === 'string'
      ? { dueDate: pregnancyRow.dueDate, status: typeof pregnancyRow.status === 'string' ? pregnancyRow.status : 'active' }
      : null,
    upcomingAppointments: appointments,
  };
}

export function parsePartnerSharing(value: unknown): PartnerSharing | null {
  const row = asObject(value);
  if (!row || typeof row.pregnancyId !== 'string') return null;
  return {
    pregnancyId: row.pregnancyId,
    sharePregnancyProgress: row.sharePregnancyProgress === true,
    shareCareTimeline: row.shareCareTimeline === true,
  };
}

export function getCurrentPartnerSupportContext(): PromiseLike<RpcResult<unknown>> {
  return partnerRpc('get_current_partner_support_context');
}

export function getCurrentOwnPartnerSharing(): PromiseLike<RpcResult<unknown>> {
  return partnerRpc('get_current_own_partner_sharing');
}

export function setCurrentOwnPartnerSharing(input: {
  sharePregnancyProgress: boolean;
  shareCareTimeline: boolean;
}): PromiseLike<RpcResult<unknown>> {
  return partnerRpc('set_current_own_partner_sharing', {
    p_share_pregnancy_progress: input.sharePregnancyProgress,
    p_share_care_timeline: input.shareCareTimeline,
  });
}
