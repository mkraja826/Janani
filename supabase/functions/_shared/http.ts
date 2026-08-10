const ALLOWED_HEADERS =
  "authorization, apikey, content-type, idempotency-key, x-client-info";
const BUILT_IN_ALLOWED_ORIGINS = [
  "https://janani-account-deletion.pages.dev",
];

export type CorsHeaders = Record<string, string>;

export function corsHeadersFor(request: Request): CorsHeaders | null {
  const origin = request.headers.get("origin");
  const base: CorsHeaders = {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Max-Age": "86400",
    "Vary": "Origin",
  };

  if (!origin) return base;

  const allowedOrigins = new Set([
    ...BUILT_IN_ALLOWED_ORIGINS,
    ...(Deno.env.get("ALLOWED_ORIGINS") ?? "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  ]);

  if (!allowedOrigins.has(origin)) return null;
  return { ...base, "Access-Control-Allow-Origin": origin };
}

export function jsonResponse(
  body: Record<string, unknown>,
  status: number,
  corsHeaders: CorsHeaders,
  requestId: string,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Cache-Control": "no-store",
      "Content-Type": "application/json; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
      "X-Request-Id": requestId,
    },
  });
}

export async function readJsonBody(
  request: Request,
  maximumBytes = 4096,
): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > maximumBytes) {
    throw new RequestBodyError(413, "Request body is too large");
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > maximumBytes) {
    throw new RequestBodyError(413, "Request body is too large");
  }

  try {
    return JSON.parse(rawBody);
  } catch {
    throw new RequestBodyError(400, "Request body must be valid JSON");
  }
}

export class RequestBodyError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "RequestBodyError";
  }
}
