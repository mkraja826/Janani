import { supabase } from '@/lib/supabase';

export type AppointmentType = 'doctor_visit' | 'scan' | 'lab_test' | 'procedure' | 'vaccination' | 'other';
export type AppointmentStatus = 'scheduled' | 'completed' | 'cancelled';

export type CareAppointment = {
  id: string;
  pregnancy_id: string;
  mother_id: string;
  appointment_type: AppointmentType;
  scheduled_at: string;
  provider_name: string | null;
  facility_name: string | null;
  purpose: string | null;
  questions: string[];
  notes_after: string | null;
  tests_prescribed: string[];
  next_followup_at: string | null;
  status: AppointmentStatus;
  created_at: string;
  updated_at: string;
};

type RpcError = { message: string };
type RpcResponse<T> = PromiseLike<{ data: T | null; error: RpcError | null }>;
type CareRpc = <T>(fn: string, args: Record<string, unknown>) => RpcResponse<T>;
const careRpc = supabase.rpc as unknown as CareRpc;

export const APPOINTMENT_TYPES: ReadonlyArray<{ value: AppointmentType; label: string }> = [
  { value: 'doctor_visit', label: 'Doctor visit' },
  { value: 'scan', label: 'Scan' },
  { value: 'lab_test', label: 'Lab test' },
  { value: 'procedure', label: 'Procedure' },
  { value: 'vaccination', label: 'Vaccination' },
  { value: 'other', label: 'Other' },
];

export async function listCareAppointments(pregnancyId: string): Promise<CareAppointment[]> {
  const { data, error } = await careRpc<CareAppointment[]>('list_own_care_appointments', { p_pregnancy_id: pregnancyId });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function saveCareAppointment(
  pregnancyId: string,
  appointment: Partial<CareAppointment> & Pick<CareAppointment, 'appointment_type' | 'scheduled_at' | 'status'>,
): Promise<CareAppointment> {
  const { data, error } = await careRpc<CareAppointment>('save_own_care_appointment', {
    p_pregnancy_id: pregnancyId,
    p_appointment: appointment,
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error('Janani could not save this care timeline entry.');
  return data;
}

export async function deleteCareAppointment(pregnancyId: string, appointmentId: string): Promise<void> {
  const { error } = await careRpc<null>('delete_own_care_appointment', {
    p_pregnancy_id: pregnancyId,
    p_appointment_id: appointmentId,
  });
  if (error) throw new Error(error.message);
}

export function splitLines(value: string): string[] {
  return [...new Set(value.split('\n').map((item) => item.trim()).filter(Boolean))].slice(0, 20);
}
