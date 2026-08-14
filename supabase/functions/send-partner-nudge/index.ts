import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { EdgeDatabase } from "../_shared/database.ts";
import {
  type CorsHeaders,
  corsHeadersFor,
  jsonResponse,
  readJsonBody,
  RequestBodyError,
} from "../_shared/http.ts";
import { partnerPushCopy } from "../_shared/pushLocale.ts";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const EXPO_BATCH_SIZE = 100;

type JananiSupabaseClient = SupabaseClient<EdgeDatabase>;
type PushTarget = { expo_push_token: string; locale_code: string };

type NudgeRow = {
  id: string;
  recipient_id: string;
};

type PushTicket = {
  status?: string;
  details?: { error?: string };
};

class PublicError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "PublicError";
  }
}

function requiredEnvironment(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

function asObject(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function normalizeNudge(value: unknown): NudgeRow | null {
  const candidate = Array.isArray(value) ? value[0] : value;
  const row = asObject(candidate);
  return row && typeof row.id === "string" &&
      typeof row.recipient_id === "string"
    ? { id: row.id, recipient_id: row.recipient_id }
    : null;
}

function safeDatabaseError(error: { code?: string }): PublicError {
  if (error.code === "28000") return new PublicError(401, "Authentication required");
  if (error.code === "42501") return new PublicError(403, "This request is not permitted");
  if (error.code === "22023") return new PublicError(400, "The message request is invalid");
  if (error.code === "P0001") return new PublicError(429, "Please wait before sending another message");
  return new PublicError(500, "The message could not be saved");
}

function logFailure(requestId: string, stage: string, error: unknown): void {
  const code = asObject(error)?.code;
  console.error(JSON.stringify({
    request_id: requestId,
    stage,
    code: typeof code === "string" ? code : undefined,
  }));
}

async function sendPushNotifications(
  admin: JananiSupabaseClient,
  targets: PushTarget[],
  nudge: NudgeRow,
  requestId: string,
): Promise<number> {
  let acceptedByExpo = 0;
  const invalidTokens = new Set<string>();
  const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN");

  for (let offset = 0; offset < targets.length; offset += EXPO_BATCH_SIZE) {
    const targetChunk = targets.slice(offset, offset + EXPO_BATCH_SIZE);
    const payloads = targetChunk.map((target) => {
      const copy = partnerPushCopy(target.locale_code);
      return {
        to: target.expo_push_token,
        sound: "default",
        channelId: "janani-partner-messages",
        title: copy.title,
        body: copy.body,
        data: { screen: "/thinking-of-you", nudgeId: nudge.id },
      };
    });
    const headers: Record<string, string> = {
      "Accept": "application/json",
      "Content-Type": "application/json",
    };
    if (expoAccessToken) headers.Authorization = `Bearer ${expoAccessToken}`;

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(payloads),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) throw new Error(`Expo push status ${response.status}`);

      const responseBody = asObject(await response.json());
      const responseData = responseBody?.data;
      const tickets = Array.isArray(responseData)
        ? responseData as PushTicket[]
        : responseData
        ? [responseData as PushTicket]
        : [];

      tickets.forEach((ticket, index) => {
        if (ticket?.status === "ok") acceptedByExpo += 1;
        if (ticket?.details?.error === "DeviceNotRegistered") {
          const invalidToken = targetChunk[index]?.expo_push_token;
          if (invalidToken) invalidTokens.add(invalidToken);
        }
      });
    } catch (error) {
      logFailure(requestId, "expo-push", error);
    }
  }

  if (invalidTokens.size > 0) {
    const { error } = await admin
      .from("device_push_tokens")
      .update({ is_active: false, last_seen_at: new Date().toISOString() })
      .in("expo_push_token", [...invalidTokens]);
    if (error) logFailure(requestId, "deactivate-push-token", error);
  }

  return acceptedByExpo;
}

async function claimPushAttempt(
  admin: JananiSupabaseClient,
  nudge: NudgeRow,
): Promise<boolean> {
  const { data, error } = await admin
    .from("partner_nudges")
    .update({ push_dispatched_at: new Date().toISOString() })
    .eq("id", nudge.id)
    .eq("recipient_id", nudge.recipient_id)
    .is("push_dispatched_at", null)
    .select("id")
    .maybeSingle();
  if (error) throw error;
  return Boolean(data);
}

Deno.serve(async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const cors = corsHeadersFor(request);

  if (!cors) {
    return jsonResponse({ error: "Origin is not allowed" }, 403, {} as CorsHeaders, requestId);
  }
  if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
  if (request.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405, cors, requestId);

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.match(/^Bearer\s+\S+$/i)) throw new PublicError(401, "Authentication required");

    const body = asObject(await readJsonBody(request));
    const message = typeof body?.message === "string" ? body.message.trim() : "";
    if (message.length < 1 || message.length > 120) {
      throw new PublicError(400, "Message must be between 1 and 120 characters");
    }

    const suppliedMutationId = body?.client_mutation_id ?? body?.clientMutationId ?? request.headers.get("idempotency-key");
    if (
      suppliedMutationId !== null && suppliedMutationId !== undefined &&
      (typeof suppliedMutationId !== "string" || !UUID_PATTERN.test(suppliedMutationId))
    ) {
      throw new PublicError(400, "Idempotency key must be a UUID");
    }
    const mutationId = typeof suppliedMutationId === "string" ? suppliedMutationId : crypto.randomUUID();

    const supabaseUrl = requiredEnvironment("SUPABASE_URL");
    const anonKey = requiredEnvironment("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
    const userClient = createClient<EdgeDatabase>(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) throw new PublicError(401, "Authentication required");

    const { data: nudgeData, error: nudgeError } = await userClient.rpc(
      "send_partner_nudge",
      { p_message: message, p_client_mutation_id: mutationId },
    );
    if (nudgeError) throw safeDatabaseError(nudgeError);

    const nudge = normalizeNudge(nudgeData);
    if (!nudge) throw new Error("RPC returned an invalid nudge");

    const admin = createClient<EdgeDatabase>(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false },
    });

    const pushClaimed = await claimPushAttempt(admin, nudge);
    if (!pushClaimed) {
      return jsonResponse({ ok: true, nudge_id: nudge.id, delivered_to: 0, accepted_by_expo: 0, push_attempted: false }, 200, cors, requestId);
    }

    const { data: tokenRows, error: tokenError } = await admin
      .from("device_push_tokens")
      .select("expo_push_token,locale_code")
      .eq("user_id", nudge.recipient_id)
      .eq("is_active", true)
      .gte("last_seen_at", new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
      .limit(20);
    if (tokenError) logFailure(requestId, "load-push-tokens", tokenError);

    const targets = (tokenRows ?? [])
      .filter((row): row is PushTarget => typeof row.expo_push_token === "string")
      .map((row) => ({ expo_push_token: row.expo_push_token, locale_code: typeof row.locale_code === "string" ? row.locale_code : "en" }));
    const acceptedByExpo = tokenError ? 0 : await sendPushNotifications(admin, targets, nudge, requestId);

    return jsonResponse({
      ok: true,
      nudge_id: nudge.id,
      delivered_to: 0,
      accepted_by_expo: acceptedByExpo,
      push_attempted: true,
    }, 200, cors, requestId);
  } catch (error) {
    if (error instanceof RequestBodyError || error instanceof PublicError) {
      return jsonResponse({ error: error.message }, error.status, cors, requestId);
    }
    logFailure(requestId, "unhandled", error);
    return jsonResponse({ error: "The message could not be sent" }, 500, cors, requestId);
  }
});
