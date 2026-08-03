import type { RealtimeChannel } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

export const FAMILY_INVALIDATION_ENTITIES = [
  'family_members',
  'families',
  'pregnancies',
  'journal_entries',
  'reminders',
  'reminder_logs',
  'partner_nudges',
] as const;

export type FamilyInvalidationEntity = (typeof FAMILY_INVALIDATION_ENTITIES)[number];

const FAMILY_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ENTITY_SET = new Set<string>(FAMILY_INVALIDATION_ENTITIES);

type BroadcastEnvelope = {
  payload?: unknown;
};

function readEntity(value: unknown): FamilyInvalidationEntity | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const keys = Object.keys(value);
  if (keys.length !== 1 || keys[0] !== 'entity') return null;
  const entity = (value as { entity?: unknown }).entity;
  return typeof entity === 'string' && ENTITY_SET.has(entity)
    ? entity as FamilyInvalidationEntity
    : null;
}

export function familyInvalidationTopic(familyId: string): string | null {
  const normalizedFamilyId = familyId.trim().toLowerCase();
  return FAMILY_ID_PATTERN.test(normalizedFamilyId)
    ? `janani-family:${normalizedFamilyId}`
    : null;
}

export function subscribeToFamilyInvalidations({
  familyId,
  accessToken,
  onInvalidate,
  onConnectionIssue,
}: {
  familyId: string;
  accessToken: string;
  onInvalidate: (entity: FamilyInvalidationEntity) => void;
  onConnectionIssue?: () => void;
}): () => void {
  const topic = familyInvalidationTopic(familyId);
  if (!topic || !accessToken) return () => undefined;

  let disposed = false;
  let channel: RealtimeChannel | null = null;

  void (async () => {
    try {
      await supabase.realtime.setAuth(accessToken);
    } catch {
      if (!disposed) onConnectionIssue?.();
      return;
    }
    if (disposed) return;

    channel = supabase
      .channel(topic, { config: { private: true } })
      .on('broadcast', { event: 'invalidate' }, (message: BroadcastEnvelope) => {
        const entity = readEntity(message.payload);
        if (entity) onInvalidate(entity);
      })
      .subscribe((status) => {
        if (
          !disposed
          && (
            status === 'CHANNEL_ERROR'
            || status === 'TIMED_OUT'
            || status === 'CLOSED'
          )
        ) {
          onConnectionIssue?.();
        }
      });
  })();

  return () => {
    disposed = true;
    if (channel) void supabase.removeChannel(channel);
  };
}
