import { supabase } from '@/lib/supabase';

export type SupportedLanguage = 'en' | 'te' | 'hi';
export type MedicationKind = 'medication' | 'supplement';

export type CareMedication = {
  id: string;
  pregnancy_id: string;
  mother_id: string;
  kind: MedicationKind;
  name: string;
  strength: string | null;
  schedule_text: string | null;
  clinician_instructions: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PrivateCareContext = {
  pregnancy_id: string;
  preferred_language: SupportedLanguage;
  region_preference: string | null;
  broader_clinician_instructions: string | null;
  relevant_medical_history: string | null;
  previous_pregnancy_history: string | null;
  share_care_timeline_with_partner: boolean;
  share_pregnancy_progress_with_partner: boolean;
  medications: CareMedication[];
};

type RpcError = { message: string };
type RpcResponse<T> = PromiseLike<{ data: T | null; error: RpcError | null }>;
type ProfileRpc = <T>(fn: string, args: Record<string, unknown>) => RpcResponse<T>;
const profileRpc = supabase.rpc as unknown as ProfileRpc;

export async function loadPrivateCareContext(pregnancyId: string): Promise<PrivateCareContext> {
  const { data, error } = await profileRpc<PrivateCareContext>('get_own_private_care_context', {
    p_pregnancy_id: pregnancyId,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not load your care context.');
  return data;
}

export async function savePrivateCareContext(
  pregnancyId: string,
  input: Omit<PrivateCareContext, 'pregnancy_id' | 'medications'>,
): Promise<PrivateCareContext> {
  const { data, error } = await profileRpc<PrivateCareContext>('save_own_private_care_context', {
    p_pregnancy_id: pregnancyId,
    p_context: input,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not save your care context.');
  return data;
}

export async function saveCareMedication(
  pregnancyId: string,
  input: Partial<CareMedication> & Pick<CareMedication, 'kind' | 'name' | 'active'>,
): Promise<CareMedication> {
  const { data, error } = await profileRpc<CareMedication>('save_own_care_medication', {
    p_pregnancy_id: pregnancyId,
    p_medication: input,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not save this medication or supplement.');
  return data;
}

export async function deleteCareMedication(pregnancyId: string, medicationId: string): Promise<void> {
  const { error } = await profileRpc<null>('delete_own_care_medication', {
    p_pregnancy_id: pregnancyId,
    p_medication_id: medicationId,
  });
  if (error) throw new Error(error.message);
}
