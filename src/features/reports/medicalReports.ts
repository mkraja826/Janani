import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const MAX_REPORT_BYTES = 15 * 1024 * 1024;
const ALLOWED_REPORT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

export type MedicalReportSummary = {
  id: string;
  reportKind: string;
  reportDate: string | null;
  providerName: string | null;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadState: string;
  extractionStatus: string;
  uploadedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  proposedFacts: number;
  confirmedFacts: number;
};

export type MedicalReportFact = {
  id: string;
  factKind: string;
  factKey: string | null;
  displayLabel: string;
  extractedValue: string | null;
  extractedUnit: string | null;
  extractedReferenceRange: string | null;
  confirmedValue: string | null;
  confirmedUnit: string | null;
  confirmedReferenceRange: string | null;
  observedOn: string | null;
  confidence: number | null;
  sourcePage: number | null;
  sourceExcerpt: string | null;
  reviewStatus: 'proposed' | 'confirmed' | 'corrected' | 'rejected';
};

export type MedicalReportDetail = MedicalReportSummary & {
  pregnancyId: string;
  storagePath: string;
  facts: MedicalReportFact[];
};

export type MedicalReportFactReview = {
  id: string;
  decision: 'confirmed' | 'corrected' | 'rejected';
  value?: string;
  unit?: string | null;
  referenceRange?: string | null;
};

type ReportRpcResult = {
  data: unknown;
  error: unknown;
};

type ReportRpc = (
  functionName: string,
  args?: Record<string, unknown>,
) => PromiseLike<ReportRpcResult>;

type CreatedMedicalReport = {
  id: string;
  storagePath: string;
  uploadState: string;
  extractionStatus: string;
};

// The connected database type snapshot predates the reconciled medical-report
// RPCs. Keep this compatibility shim local to the report feature until the
// generated database types are refreshed from production.
const reportRpc = supabase.rpc.bind(supabase) as unknown as ReportRpc;

function unwrapRpc<T>(data: unknown): T {
  return data as T;
}

function inferMimeType(fileName: string, reportedType: string | null): string {
  const normalized = reportedType?.trim().toLowerCase();
  if (normalized && ALLOWED_REPORT_MIME_TYPES.has(normalized)) return normalized;
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return normalized ?? '';
}

export async function listOwnMedicalReports(pregnancyId: string): Promise<MedicalReportSummary[]> {
  const { data, error } = await reportRpc('list_own_medical_reports', { p_pregnancy_id: pregnancyId });
  if (error) throw error;
  return unwrapRpc<MedicalReportSummary[]>(data ?? []);
}

export async function getOwnMedicalReport(reportId: string): Promise<MedicalReportDetail> {
  const { data, error } = await reportRpc('get_own_medical_report', { p_report_id: reportId });
  if (error) throw error;
  return unwrapRpc<MedicalReportDetail>(data);
}

export async function reviewOwnMedicalReportFacts(reportId: string, reviews: MedicalReportFactReview[]): Promise<MedicalReportDetail> {
  const { data, error } = await reportRpc('review_own_medical_report_facts', { p_report_id: reportId, p_reviews: reviews });
  if (error) throw error;
  return unwrapRpc<MedicalReportDetail>(data);
}

export async function pickAndUploadWrittenMedicalReport(pregnancyId: string): Promise<string | null> {
  if (Platform.OS !== 'android') {
    throw new Error('Report upload is currently release-validated on Android only.');
  }

  let picked: File | File[];
  try {
    picked = await File.pickFileAsync();
  } catch (error) {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    if (message.includes('cancel')) return null;
    throw error;
  }

  const file = Array.isArray(picked) ? picked[0] : picked;
  if (!file) return null;

  const fileInfo = file as File & { name?: string };
  const originalFileName = (fileInfo.name?.trim() || file.uri.split('/').pop()?.trim() || 'medical-report').slice(0, 180);
  const mimeType = inferMimeType(originalFileName, file.type);
  const fileSizeBytes = file.size ?? 0;

  if (!ALLOWED_REPORT_MIME_TYPES.has(mimeType)) {
    throw new Error('Choose a PDF or a clear JPG, PNG, WebP, HEIC or HEIF photo of a written medical report.');
  }
  if (fileSizeBytes < 1 || fileSizeBytes > MAX_REPORT_BYTES) {
    throw new Error('Report files must be 15 MB or smaller.');
  }

  const createdResult = await reportRpc('create_own_medical_report', {
    p_pregnancy_id: pregnancyId,
    p_original_file_name: originalFileName,
    p_mime_type: mimeType,
    p_file_size_bytes: fileSizeBytes,
    p_report_kind: 'other',
    p_report_date: null,
    p_provider_name: null,
    p_client_mutation_id: null,
  });
  if (createdResult.error) throw createdResult.error;
  const created = unwrapRpc<CreatedMedicalReport>(createdResult.data);

  const bytes = await file.bytes();
  if (bytes.byteLength !== fileSizeBytes) {
    throw new Error('The selected report changed while it was being prepared. Please choose it again.');
  }

  const upload = await supabase.storage
    .from('medical-reports')
    .upload(created.storagePath, bytes, { contentType: mimeType, upsert: false });
  if (upload.error) throw upload.error;

  const marked = await reportRpc('mark_own_medical_report_uploaded', { p_report_id: created.id });
  if (marked.error) throw marked.error;

  const queued = await reportRpc('queue_own_medical_report_extraction', { p_report_id: created.id });
  if (queued.error) throw queued.error;

  const extraction = await supabase.functions.invoke('extract-medical-report', {
    body: { report_id: created.id },
  });
  if (extraction.error) {
    // The private upload is still valid and remains visible for retry/manual review.
    console.warn('Medical report extraction did not start', extraction.error.message);
  }

  return created.id;
}
