import { supabase } from '@/lib/supabase';

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

// The connected database type snapshot predates the reconciled medical-report
// RPCs. Keep this compatibility shim local to the report feature until the
// generated database types are refreshed from production.
const reportRpc = supabase.rpc.bind(supabase) as unknown as ReportRpc;

function unwrapRpc<T>(data: unknown): T {
  return data as T;
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
