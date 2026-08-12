import type { PostgrestError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';

type RpcResult<T> = {
  data: T | null;
  error: PostgrestError | null;
};

type ReportRpcName =
  | 'create_own_medical_report'
  | 'mark_own_medical_report_uploaded'
  | 'queue_own_medical_report_extraction'
  | 'list_own_medical_reports'
  | 'get_own_medical_report'
  | 'review_own_medical_report_facts'
  | 'add_own_manual_report_fact'
  | 'delete_own_medical_report_record';

type LiveReportRpc = <T>(
  fn: ReportRpcName,
  args: Record<string, unknown>,
) => PromiseLike<RpcResult<T>>;

// The live Janani schema contains Milestone 4 RPCs newer than the repository's
// generated Database snapshot. Keep that temporary schema-version boundary in
// one adapter rather than weakening typing across the Reports UI.
const liveReportRpc = supabase.rpc.bind(supabase) as unknown as LiveReportRpc;

export function createOwnMedicalReport(args: {
  pregnancyId: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  reportKind: string;
  reportDate?: string | null;
  providerName?: string | null;
}): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('create_own_medical_report', {
    p_pregnancy_id: args.pregnancyId,
    p_original_file_name: args.originalFileName,
    p_mime_type: args.mimeType,
    p_file_size_bytes: args.fileSizeBytes,
    p_report_kind: args.reportKind,
    p_report_date: args.reportDate ?? null,
    p_provider_name: args.providerName ?? null,
    p_client_mutation_id: null,
  });
}

export function markOwnMedicalReportUploaded(reportId: string): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('mark_own_medical_report_uploaded', { p_report_id: reportId });
}

export function queueOwnMedicalReportExtraction(reportId: string): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('queue_own_medical_report_extraction', { p_report_id: reportId });
}

export function listOwnMedicalReports(pregnancyId: string): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('list_own_medical_reports', { p_pregnancy_id: pregnancyId });
}

export function getOwnMedicalReport(reportId: string): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('get_own_medical_report', { p_report_id: reportId });
}

export function reviewOwnMedicalReportFacts(args: {
  reportId: string;
  reviews: {
    id: string;
    decision: 'confirmed' | 'corrected' | 'rejected';
    value?: string;
    unit?: string;
    referenceRange?: string;
  }[];
}): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('review_own_medical_report_facts', {
    p_report_id: args.reportId,
    p_reviews: args.reviews,
  });
}

export function addOwnManualReportFact(args: {
  reportId: string;
  displayLabel: string;
  value: string;
  factKind?: string;
  unit?: string | null;
  referenceRange?: string | null;
  observedOn?: string | null;
}): PromiseLike<RpcResult<string>> {
  return liveReportRpc('add_own_manual_report_fact', {
    p_report_id: args.reportId,
    p_display_label: args.displayLabel,
    p_value: args.value,
    p_fact_kind: args.factKind ?? 'other',
    p_unit: args.unit ?? null,
    p_reference_range: args.referenceRange ?? null,
    p_observed_on: args.observedOn ?? null,
  });
}

export function deleteOwnMedicalReportRecord(reportId: string): PromiseLike<RpcResult<unknown>> {
  return liveReportRpc('delete_own_medical_report_record', { p_report_id: reportId });
}
