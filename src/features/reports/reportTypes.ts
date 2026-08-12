export type MedicalReportKind =
  | 'blood_test'
  | 'urine_test'
  | 'scan_report'
  | 'prescription'
  | 'discharge_summary'
  | 'other';

export type MedicalReportExtractionStatus =
  | 'not_started'
  | 'queued'
  | 'processing'
  | 'needs_confirmation'
  | 'confirmed'
  | 'failed'
  | 'not_available';

export type MedicalReportSummary = {
  id: string;
  reportKind: MedicalReportKind;
  reportDate: string | null;
  providerName: string | null;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  uploadState: 'pending' | 'uploaded';
  extractionStatus: MedicalReportExtractionStatus;
  uploadedAt: string | null;
  confirmedAt: string | null;
  createdAt: string;
  proposedFacts: number;
  confirmedFacts: number;
};

export type MedicalReportFact = {
  id: string;
  extractionId: string | null;
  factKind: 'lab_result' | 'measurement' | 'medication' | 'diagnosis_note' | 'appointment' | 'other';
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
  sourceLocator: Record<string, unknown>;
  reviewStatus: 'proposed' | 'confirmed' | 'corrected' | 'rejected';
  reviewedAt: string | null;
};

export type MedicalReportDetail = MedicalReportSummary & {
  pregnancyId: string;
  storagePath: string;
  facts: MedicalReportFact[];
  extractions: {
    id: string;
    attemptNumber: number;
    status: 'processing' | 'completed' | 'failed';
    provider: string | null;
    model: string | null;
    parserVersion: string | null;
    errorCode: string | null;
    startedAt: string;
    completedAt: string | null;
  }[];
};

export const REPORT_KIND_OPTIONS: readonly (readonly [MedicalReportKind, string])[] = [
  ['blood_test', 'Blood test'],
  ['urine_test', 'Urine test'],
  ['scan_report', 'Scan / ultrasound'],
  ['prescription', 'Prescription'],
  ['discharge_summary', 'Discharge summary'],
  ['other', 'Other report'],
];

export function reportKindLabel(kind: MedicalReportKind): string {
  return REPORT_KIND_OPTIONS.find(([value]) => value === kind)?.[1] ?? 'Medical report';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringOrNull(value: unknown): string | null {
  return typeof value === 'string' && value.length ? value : null;
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function parseSummary(value: unknown): MedicalReportSummary | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.originalFileName !== 'string') return null;
  const kind = REPORT_KIND_OPTIONS.some(([candidate]) => candidate === value.reportKind)
    ? value.reportKind as MedicalReportKind
    : 'other';
  const uploadState = value.uploadState === 'uploaded' ? 'uploaded' : 'pending';
  const extractionStatuses: MedicalReportExtractionStatus[] = [
    'not_started', 'queued', 'processing', 'needs_confirmation', 'confirmed', 'failed', 'not_available',
  ];
  const extractionStatus = typeof value.extractionStatus === 'string'
    && extractionStatuses.includes(value.extractionStatus as MedicalReportExtractionStatus)
    ? value.extractionStatus as MedicalReportExtractionStatus
    : 'not_started';
  return {
    id: value.id,
    reportKind: kind,
    reportDate: stringOrNull(value.reportDate),
    providerName: stringOrNull(value.providerName),
    originalFileName: value.originalFileName,
    mimeType: typeof value.mimeType === 'string' ? value.mimeType : 'application/octet-stream',
    fileSizeBytes: numberOrZero(value.fileSizeBytes),
    uploadState,
    extractionStatus,
    uploadedAt: stringOrNull(value.uploadedAt),
    confirmedAt: stringOrNull(value.confirmedAt),
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date(0).toISOString(),
    proposedFacts: numberOrZero(value.proposedFacts),
    confirmedFacts: numberOrZero(value.confirmedFacts),
  };
}

export function parseMedicalReportList(value: unknown): MedicalReportSummary[] {
  if (!Array.isArray(value)) return [];
  return value.map(parseSummary).filter((item): item is MedicalReportSummary => Boolean(item));
}

function parseFact(value: unknown): MedicalReportFact | null {
  if (!isRecord(value) || typeof value.id !== 'string' || typeof value.displayLabel !== 'string') return null;
  const reviewStatus = value.reviewStatus === 'confirmed' || value.reviewStatus === 'corrected' || value.reviewStatus === 'rejected'
    ? value.reviewStatus
    : 'proposed';
  const factKinds = ['lab_result', 'measurement', 'medication', 'diagnosis_note', 'appointment', 'other'] as const;
  const factKind = typeof value.factKind === 'string' && (factKinds as readonly string[]).includes(value.factKind)
    ? value.factKind as MedicalReportFact['factKind']
    : 'other';
  return {
    id: value.id,
    extractionId: stringOrNull(value.extractionId),
    factKind,
    factKey: stringOrNull(value.factKey),
    displayLabel: value.displayLabel,
    extractedValue: stringOrNull(value.extractedValue),
    extractedUnit: stringOrNull(value.extractedUnit),
    extractedReferenceRange: stringOrNull(value.extractedReferenceRange),
    confirmedValue: stringOrNull(value.confirmedValue),
    confirmedUnit: stringOrNull(value.confirmedUnit),
    confirmedReferenceRange: stringOrNull(value.confirmedReferenceRange),
    observedOn: stringOrNull(value.observedOn),
    confidence: typeof value.confidence === 'number' && Number.isFinite(value.confidence) ? value.confidence : null,
    sourcePage: typeof value.sourcePage === 'number' && Number.isFinite(value.sourcePage) ? value.sourcePage : null,
    sourceExcerpt: stringOrNull(value.sourceExcerpt),
    sourceLocator: isRecord(value.sourceLocator) ? value.sourceLocator : {},
    reviewStatus,
    reviewedAt: stringOrNull(value.reviewedAt),
  };
}

export function parseMedicalReportDetail(value: unknown): MedicalReportDetail | null {
  const summary = parseSummary(value);
  if (!summary || !isRecord(value) || typeof value.pregnancyId !== 'string' || typeof value.storagePath !== 'string') return null;
  const facts = Array.isArray(value.facts)
    ? value.facts.map(parseFact).filter((item): item is MedicalReportFact => Boolean(item))
    : [];
  const extractions = Array.isArray(value.extractions)
    ? value.extractions.flatMap((entry) => {
      if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.attemptNumber !== 'number') return [];
      return [{
        id: entry.id,
        attemptNumber: entry.attemptNumber,
        status: entry.status === 'completed' || entry.status === 'failed' ? entry.status : 'processing' as const,
        provider: stringOrNull(entry.provider),
        model: stringOrNull(entry.model),
        parserVersion: stringOrNull(entry.parserVersion),
        errorCode: stringOrNull(entry.errorCode),
        startedAt: typeof entry.startedAt === 'string' ? entry.startedAt : new Date(0).toISOString(),
        completedAt: stringOrNull(entry.completedAt),
      }];
    })
    : [];
  return {
    ...summary,
    pregnancyId: value.pregnancyId,
    storagePath: value.storagePath,
    facts,
    extractions,
  };
}
