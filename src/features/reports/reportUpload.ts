import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import {
  createOwnMedicalReport,
  deleteOwnMedicalReportRecord,
  markOwnMedicalReportUploaded,
} from '@/features/reports/reportRpc';
import type { MedicalReportKind } from '@/features/reports/reportTypes';

const REPORT_BUCKET = 'medical-reports';
const MAX_REPORT_BYTES = 15 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);

type PreparedReport = {
  asset: DocumentPicker.DocumentPickerAsset;
  file: File;
  mimeType: string;
  size: number;
};

type CreatedReport = {
  id: string;
  storagePath: string;
};

export class ReportUploadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReportUploadError';
  }
}

function mimeFromName(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.endsWith('.pdf')) return 'application/pdf';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.heic')) return 'image/heic';
  if (lower.endsWith('.heif')) return 'image/heif';
  return null;
}

function parseCreatedReport(value: unknown): CreatedReport | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const candidate = value as Record<string, unknown>;
  if (typeof candidate.id !== 'string' || typeof candidate.storagePath !== 'string') return null;
  return { id: candidate.id, storagePath: candidate.storagePath };
}

export async function pickPrivateMedicalReport(): Promise<PreparedReport | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets[0]) return null;

  const asset = result.assets[0];
  const file = new File(asset.uri);
  const size = typeof asset.size === 'number' && asset.size > 0 ? asset.size : file.size;
  const mimeType = asset.mimeType && ALLOWED_MIME_TYPES.has(asset.mimeType)
    ? asset.mimeType
    : file.type && ALLOWED_MIME_TYPES.has(file.type)
      ? file.type
      : mimeFromName(asset.name);

  if (!mimeType || !ALLOWED_MIME_TYPES.has(mimeType)) {
    throw new ReportUploadError('Choose a PDF, JPG, PNG, WebP, HEIC or HEIF medical report.');
  }
  if (!Number.isFinite(size) || size < 1) {
    throw new ReportUploadError('Janani could not read this file. Please choose the report again.');
  }
  if (size > MAX_REPORT_BYTES) {
    throw new ReportUploadError('This report is larger than 15 MB. Choose a smaller file.');
  }

  return { asset, file, mimeType, size };
}

export async function uploadPrivateMedicalReport({
  pregnancyId,
  prepared,
  reportKind,
  reportDate,
  providerName,
}: {
  pregnancyId: string;
  prepared: PreparedReport;
  reportKind: MedicalReportKind;
  reportDate?: string | null;
  providerName?: string | null;
}): Promise<{ reportId: string }> {
  const created = await createOwnMedicalReport({
    pregnancyId,
    originalFileName: prepared.asset.name,
    mimeType: prepared.mimeType,
    fileSizeBytes: prepared.size,
    reportKind,
    reportDate: reportDate ?? null,
    providerName: providerName?.trim() || null,
  });
  if (created.error) throw new ReportUploadError(created.error.message);
  const report = parseCreatedReport(created.data);
  if (!report) throw new ReportUploadError('Janani could not prepare a private report record.');

  try {
    const bytes = await prepared.file.arrayBuffer();
    if (bytes.byteLength !== prepared.size) {
      throw new ReportUploadError('The report changed while Janani was preparing it. Please select it again.');
    }

    const upload = await supabase.storage
      .from(REPORT_BUCKET)
      .upload(report.storagePath, bytes, {
        contentType: prepared.mimeType,
        upsert: false,
        cacheControl: '3600',
      });

    if (upload.error) {
      // A lost client response can look like an upload failure even if Storage
      // persisted the object. Let the database verify the canonical path first.
      const recovered = await markOwnMedicalReportUploaded(report.id);
      if (!recovered.error) return { reportId: report.id };
      throw new ReportUploadError(upload.error.message);
    }

    const finalized = await markOwnMedicalReportUploaded(report.id);
    if (finalized.error) throw new ReportUploadError(finalized.error.message);
    return { reportId: report.id };
  } catch (error) {
    // Best-effort cleanup. The record RPC refuses to delete while an object
    // still exists, so this cannot orphan an accessible file by deleting only
    // its ownership metadata.
    await supabase.storage.from(REPORT_BUCKET).remove([report.storagePath]).catch(() => undefined);
    await deleteOwnMedicalReportRecord(report.id).catch(() => undefined);
    if (error instanceof ReportUploadError) throw error;
    throw new ReportUploadError('The report could not be uploaded. Check your connection and try again.');
  }
}

export async function deletePrivateMedicalReport(reportId: string, storagePath: string): Promise<void> {
  const removed = await supabase.storage.from(REPORT_BUCKET).remove([storagePath]);
  if (removed.error) throw new ReportUploadError(removed.error.message);
  const deleted = await deleteOwnMedicalReportRecord(reportId);
  if (deleted.error) throw new ReportUploadError(deleted.error.message);
}
