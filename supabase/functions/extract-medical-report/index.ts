import { createClient } from "@supabase/supabase-js";

import {
  type CorsHeaders,
  corsHeadersFor,
  jsonResponse,
  readJsonBody,
  RequestBodyError,
} from "../_shared/http.ts";

const PARSER_VERSION = "janani-report-v1";
const MAX_REPORT_BYTES = 15 * 1024 * 1024;
const MAX_FACTS = 100;
const PROVIDER_TIMEOUT_MS = 55_000;
const FACT_KINDS = new Set([
  "lab_result",
  "measurement",
  "medication",
  "diagnosis_note",
  "appointment",
  "other",
]);

const EXTRACTION_PROMPT = `You are a careful medical-document transcription engine for Janani, a maternal-support application.

Your task is extraction only. Do not diagnose, infer disease, recommend treatment, calculate risk, interpret whether a result is normal/abnormal, or give medical advice.

Rules:
1. Extract only information explicitly visible in the uploaded document/image.
2. Never invent missing values, units, reference ranges, dates, medicine doses, findings, or page numbers.
3. Preserve the report's wording for written findings. A written diagnosis/finding may be transcribed as diagnosis_note, but do not strengthen or reinterpret it.
4. For prescriptions, transcribe medicine/supplement names, stated dose/strength and written instructions only. Do not recommend taking, stopping or changing anything.
5. If the upload is primarily a raw medical image (for example an ultrasound image) and has no written report text, do not interpret anatomy, fetal development, abnormalities or other visual medical findings. Extract only clearly printed/typed text.
6. Never determine, infer, extract or communicate fetal/foetal sex or gender from prenatal reports or imagery.
7. Reference ranges must come from the uploaded document itself. If not printed, use null.
8. observedOn must be YYYY-MM-DD only when a date is explicitly tied to the test/fact; otherwise null.
9. confidence is your transcription confidence from 0 to 1, not a medical confidence score.
10. sourceExcerpt should be a short exact fragment that helps the mother verify the value. Keep it under 300 characters.
11. Return at most 100 useful facts. Prefer clinically relevant structured values over addresses, billing, identifiers, decorative text or administrative boilerplate.

Return JSON only with this shape:
{
  "facts": [
    {
      "factKind": "lab_result|measurement|medication|diagnosis_note|appointment|other",
      "factKey": "short_machine_key_or_null",
      "displayLabel": "human readable label",
      "value": "exact visible value/text",
      "unit": "visible unit or null",
      "referenceRange": "visible printed range or null",
      "observedOn": "YYYY-MM-DD or null",
      "confidence": 0.0,
      "sourcePage": 1,
      "sourceExcerpt": "short visible fragment or null"
    }
  ]
}`;

type ProviderName = "gemini" | "openai_responses";

type Claim = {
  extractionId: string;
  attemptNumber: number;
  reportId: string;
  pregnancyId: string;
  motherId: string;
  storagePath: string;
  mimeType: string;
  fileSizeBytes: number;
  originalFileName: string;
  reportKind: string;
  reportDate: string | null;
};

type NormalizedFact = {
  factKind: string;
  factKey: string | null;
  displayLabel: string;
  value: string;
  unit: string | null;
  referenceRange: string | null;
  observedOn: string | null;
  confidence: number | null;
  sourcePage: number | null;
  sourceExcerpt: string | null;
  sourceLocator: Record<string, unknown>;
};

type ProviderResult = {
  text: string;
  usage: Record<string, unknown>;
};

class PublicError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly code = "request_failed",
  ) {
    super(message);
    this.name = "PublicError";
  }
}

class ExtractionError extends Error {
  constructor(readonly code: string, message: string) {
    super(message);
    this.name = "ExtractionError";
  }
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new PublicError(503, "Automatic report reading is not configured yet.", "provider_not_configured");
  return value;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function stringValue(value: unknown, maximum: number): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  if (!normalized) return null;
  return normalized.slice(0, maximum);
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseClaim(value: unknown): Claim | null {
  const row = asObject(value);
  if (!row) return null;
  const requiredStrings = [
    "extractionId",
    "reportId",
    "pregnancyId",
    "motherId",
    "storagePath",
    "mimeType",
    "originalFileName",
    "reportKind",
  ];
  if (requiredStrings.some((key) => typeof row[key] !== "string")) return null;
  if (typeof row.attemptNumber !== "number" || typeof row.fileSizeBytes !== "number") return null;
  return {
    extractionId: row.extractionId as string,
    attemptNumber: row.attemptNumber,
    reportId: row.reportId as string,
    pregnancyId: row.pregnancyId as string,
    motherId: row.motherId as string,
    storagePath: row.storagePath as string,
    mimeType: row.mimeType as string,
    fileSizeBytes: row.fileSizeBytes,
    originalFileName: row.originalFileName as string,
    reportKind: row.reportKind as string,
    reportDate: typeof row.reportDate === "string" ? row.reportDate : null,
  };
}

function toBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    const chunk = bytes.subarray(offset, Math.min(offset + chunkSize, bytes.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

async function sha256Hex(bytes: Uint8Array): Promise<string> {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  return Array.from(digest).map((value) => value.toString(16).padStart(2, "0")).join("");
}

function stripJsonFence(text: string): string {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  }
  return trimmed;
}

function parseProviderJson(text: string): unknown {
  const unfenced = stripJsonFence(text);
  try {
    return JSON.parse(unfenced);
  } catch {
    const first = unfenced.indexOf("{");
    const last = unfenced.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(unfenced.slice(first, last + 1));
      } catch {
        // Fall through to the public extraction error below.
      }
    }
  }
  throw new ExtractionError("provider_invalid_json", "The extraction provider did not return valid structured data");
}

function safeDate(value: unknown): string | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return null;
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return parsed.getTime() <= todayUtc ? value : null;
}

function fetalSexDisclosure(row: Record<string, unknown>): boolean {
  const label = `${row.factKey ?? ""} ${row.displayLabel ?? ""}`.toLowerCase();
  const value = `${row.value ?? ""}`.toLowerCase();
  const sexLabel = /(fetal|foetal|fetus|foetus|baby).{0,20}(sex|gender)|(sex|gender).{0,20}(fetal|foetal|fetus|foetus|baby)|\bgender\b|\bfetal sex\b|\bfoetal sex\b/.test(label);
  const sexValue = /^(male|female|boy|girl|m|f)$/i.test(value.trim());
  return sexLabel || (sexValue && /sex|gender|fetal|foetal|baby/.test(label));
}

function normalizeFacts(value: unknown): NormalizedFact[] {
  const root = asObject(value);
  const source = Array.isArray(root?.facts) ? root.facts : [];
  const facts: NormalizedFact[] = [];
  const seen = new Set<string>();

  for (let index = 0; index < source.length && facts.length < MAX_FACTS; index += 1) {
    const row = asObject(source[index]);
    if (!row || fetalSexDisclosure(row)) continue;

    const displayLabel = stringValue(row.displayLabel, 120);
    const extractedValue = stringValue(row.value, 500);
    if (!displayLabel || !extractedValue) continue;

    const factKind = typeof row.factKind === "string" && FACT_KINDS.has(row.factKind)
      ? row.factKind
      : "other";
    const factKeyCandidate = stringValue(row.factKey, 100);
    const factKey = factKeyCandidate && /^[a-z0-9_\-.]+$/i.test(factKeyCandidate)
      ? factKeyCandidate
      : null;
    const unit = stringValue(row.unit, 80);
    const referenceRange = stringValue(row.referenceRange, 160);
    const observedOn = safeDate(row.observedOn);
    const confidence = typeof row.confidence === "number" && Number.isFinite(row.confidence)
      ? Math.min(1, Math.max(0, row.confidence))
      : null;
    const sourcePage = typeof row.sourcePage === "number" && Number.isInteger(row.sourcePage)
      && row.sourcePage >= 1 && row.sourcePage <= 5000
      ? row.sourcePage
      : null;
    const sourceExcerpt = stringValue(row.sourceExcerpt, 800);
    const dedupeKey = [displayLabel, extractedValue, unit ?? "", sourcePage ?? ""].join("|").toLowerCase();
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);

    facts.push({
      factKind,
      factKey,
      displayLabel,
      value: extractedValue,
      unit,
      referenceRange,
      observedOn,
      confidence,
      sourcePage,
      sourceExcerpt,
      sourceLocator: {
        origin: "machine_extraction",
        provider_fact_index: index,
      },
    });
  }

  return facts;
}

function providerNameFromEnvironment(): ProviderName {
  const raw = requiredEnvironment("JANANI_REPORT_EXTRACTOR_PROVIDER").toLowerCase();
  if (raw === "gemini" || raw === "openai_responses") return raw;
  throw new PublicError(503, "Automatic report reading is not configured yet.", "provider_not_configured");
}

async function extractWithGemini(
  bytesBase64: string,
  mimeType: string,
  model: string,
  apiKey: string,
): Promise<ProviderResult> {
  const configuredUrl = Deno.env.get("JANANI_REPORT_EXTRACTOR_API_URL")?.trim();
  const apiUrl = configuredUrl || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (configuredUrl) headers["x-goog-api-key"] = apiKey;

  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers,
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({
      contents: [{
        role: "user",
        parts: [
          { inlineData: { mimeType, data: bytesBase64 } },
          { text: EXTRACTION_PROMPT },
        ],
      }],
      generationConfig: {
        temperature: 0,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!upstream.ok) {
    throw new ExtractionError(`provider_http_${upstream.status}`, "The extraction provider is temporarily unavailable");
  }
  const payload = await upstream.json().catch(() => null);
  const root = asObject(payload);
  const candidates = Array.isArray(root?.candidates) ? root.candidates : [];
  const firstCandidate = asObject(candidates[0]);
  const content = asObject(firstCandidate?.content);
  const parts = Array.isArray(content?.parts) ? content.parts : [];
  const text = parts.map((part) => asObject(part)?.text).filter((part): part is string => typeof part === "string").join("\n").trim();
  if (!text) throw new ExtractionError("provider_empty_response", "The extraction provider returned no structured text");
  const usage = asObject(root?.usageMetadata) ?? {};
  return { text, usage };
}

function openAiOutputText(payload: unknown): string {
  const root = asObject(payload);
  if (typeof root?.output_text === "string") return root.output_text.trim();
  const output = Array.isArray(root?.output) ? root.output : [];
  const chunks: string[] = [];
  for (const item of output) {
    const message = asObject(item);
    const content = Array.isArray(message?.content) ? message.content : [];
    for (const part of content) {
      const object = asObject(part);
      if (object?.type === "output_text" && typeof object.text === "string") chunks.push(object.text);
    }
  }
  return chunks.join("\n").trim();
}

async function extractWithOpenAiResponses(
  bytesBase64: string,
  mimeType: string,
  fileName: string,
  model: string,
  apiKey: string,
): Promise<ProviderResult> {
  const apiUrl = Deno.env.get("JANANI_REPORT_EXTRACTOR_API_URL")?.trim() || "https://api.openai.com/v1/responses";
  const media = mimeType === "application/pdf"
    ? {
      type: "input_file",
      filename: fileName,
      file_data: bytesBase64,
    }
    : {
      type: "input_image",
      image_url: `data:${mimeType};base64,${bytesBase64}`,
      detail: "high",
    };

  const upstream = await fetch(apiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    body: JSON.stringify({
      model,
      input: [{
        role: "user",
        content: [
          { type: "input_text", text: EXTRACTION_PROMPT },
          media,
        ],
      }],
      temperature: 0,
      max_output_tokens: 5000,
    }),
  });

  if (!upstream.ok) {
    throw new ExtractionError(`provider_http_${upstream.status}`, "The extraction provider is temporarily unavailable");
  }
  const payload = await upstream.json().catch(() => null);
  const text = openAiOutputText(payload);
  if (!text) throw new ExtractionError("provider_empty_response", "The extraction provider returned no structured text");
  const usage = asObject(asObject(payload)?.usage) ?? {};
  return { text, usage };
}

function safeErrorCode(error: unknown): string {
  if (error instanceof ExtractionError) return error.code.slice(0, 120);
  const object = asObject(error);
  const code = typeof object?.code === "string" ? object.code : "extraction_failed";
  return code.slice(0, 120);
}

function logFailure(requestId: string, stage: string, error: unknown): void {
  console.error(JSON.stringify({
    request_id: requestId,
    stage,
    code: safeErrorCode(error),
  }));
}

Deno.serve(async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const cors = corsHeadersFor(request);

  if (!cors) {
    return jsonResponse({ error: "Origin is not allowed" }, 403, {} as CorsHeaders, requestId);
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, cors, requestId);

  let admin: ReturnType<typeof createClient> | null = null;
  let claim: Claim | null = null;
  let sourceManifest: Record<string, unknown> = {};

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.match(/^Bearer\s+\S+$/i)) {
      throw new PublicError(401, "Authentication required", "authentication_required");
    }

    const body = asObject(await readJsonBody(request));
    const reportId = typeof body?.report_id === "string" ? body.report_id.trim() : "";
    if (!isUuid(reportId)) throw new PublicError(422, "A valid report is required", "invalid_report_id");

    // Validate provider configuration before claiming the report so a missing
    // deployment secret never leaves the mother's report stuck in processing.
    const provider = providerNameFromEnvironment();
    const providerKey = requiredEnvironment("JANANI_REPORT_EXTRACTOR_API_KEY");
    const model = requiredEnvironment("JANANI_REPORT_EXTRACTOR_MODEL");
    const supabaseUrl = requiredEnvironment("SUPABASE_URL");
    const anonKey = requiredEnvironment("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");

    const userClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new PublicError(401, "Authentication required", "authentication_required");

    admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });

    const claimed = await admin.rpc("claim_medical_report_extraction", {
      p_report_id: reportId,
      p_mother_id: userData.user.id,
      p_provider: provider,
      p_model: model,
      p_parser_version: PARSER_VERSION,
    });
    if (claimed.error) {
      const message = claimed.error.message || "This report cannot be read right now";
      const status = claimed.error.code === "42501" ? 404
        : claimed.error.code === "55P03" || claimed.error.code === "55000" ? 409
        : 422;
      throw new PublicError(status, message, claimed.error.code || "claim_failed");
    }
    claim = parseClaim(claimed.data);
    if (!claim) throw new ExtractionError("invalid_claim", "Invalid extraction claim");

    const downloaded = await admin.storage.from("medical-reports").download(claim.storagePath);
    if (downloaded.error || !downloaded.data) throw new ExtractionError("storage_download_failed", "Private report file could not be loaded");
    const bytes = new Uint8Array(await downloaded.data.arrayBuffer());
    if (bytes.byteLength < 1 || bytes.byteLength > MAX_REPORT_BYTES || bytes.byteLength !== claim.fileSizeBytes) {
      throw new ExtractionError("file_integrity_failed", "Report file size does not match its private record");
    }

    const fileSha256 = await sha256Hex(bytes);
    sourceManifest = {
      parser_version: PARSER_VERSION,
      provider,
      model,
      mime_type: claim.mimeType,
      file_size_bytes: bytes.byteLength,
      sha256: fileSha256,
      attempt_number: claim.attemptNumber,
    };
    const encoded = toBase64(bytes);

    const providerResult = provider === "gemini"
      ? await extractWithGemini(encoded, claim.mimeType, model, providerKey)
      : await extractWithOpenAiResponses(encoded, claim.mimeType, claim.originalFileName, model, providerKey);

    const parsed = parseProviderJson(providerResult.text);
    const facts = normalizeFacts(parsed);

    const completed = await admin.rpc("complete_medical_report_extraction", {
      p_report_id: claim.reportId,
      p_extraction_id: claim.extractionId,
      p_facts: facts,
      p_source_manifest: sourceManifest,
      p_provider_payload: {
        normalized_fact_count: facts.length,
        usage: providerResult.usage,
      },
    });
    if (completed.error) throw new ExtractionError("completion_failed", completed.error.message);

    return jsonResponse({
      ok: true,
      report_id: claim.reportId,
      extraction_status: facts.length ? "needs_confirmation" : "not_available",
      proposed_fact_count: facts.length,
    }, 200, cors, requestId);
  } catch (error) {
    if (admin && claim) {
      const errorCode = safeErrorCode(error);
      const failed = await admin.rpc("fail_medical_report_extraction", {
        p_report_id: claim.reportId,
        p_extraction_id: claim.extractionId,
        p_error_code: errorCode,
        p_source_manifest: sourceManifest,
      });
      if (failed.error) logFailure(requestId, "mark-extraction-failed", failed.error);
    }

    if (error instanceof RequestBodyError) {
      return jsonResponse({ error: error.message }, error.status, cors, requestId);
    }
    if (error instanceof PublicError) {
      return jsonResponse({ error: error.message, code: error.code }, error.status, cors, requestId);
    }

    logFailure(requestId, "extract-medical-report", error);
    return jsonResponse({
      error: "Janani could not read this report automatically. The original report is still safe, and you can add important values manually.",
      code: safeErrorCode(error),
    }, 502, cors, requestId);
  }
});
