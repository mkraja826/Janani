import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type { EdgeDatabase } from "../_shared/database.ts";
import {
  type CorsHeaders,
  corsHeadersFor,
  jsonResponse,
  readJsonBody,
  RequestBodyError,
} from "../_shared/http.ts";

const MAX_STORAGE_OBJECTS = 10_000;
const STORAGE_DELETE_BATCH_SIZE = 100;
const STORAGE_DELETE_ATTEMPTS = 3;
const BACKGROUND_RETRY_DELAYS_MS = [2_000, 5_000, 15_000, 30_000];

declare const EdgeRuntime: {
  waitUntil(promise: Promise<unknown>): void;
};

type JananiSupabaseClient = SupabaseClient<EdgeDatabase>;

type StorageObject = {
  bucket_id: string;
  object_name: string;
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

function logFailure(
  requestId: string,
  stage: string,
  error: unknown,
): void {
  const code = asObject(error)?.code;
  console.error(JSON.stringify({
    request_id: requestId,
    stage,
    code: typeof code === "string" ? code : undefined,
  }));
}

function normalizeStorageObjects(value: unknown): StorageObject[] {
  if (!Array.isArray(value)) throw new Error("Invalid storage listing");
  return value.map((candidate) => {
    const row = asObject(candidate);
    if (
      !row ||
      typeof row.bucket_id !== "string" ||
      typeof row.object_name !== "string"
    ) {
      throw new Error("Invalid storage object");
    }
    return {
      bucket_id: row.bucket_id,
      object_name: row.object_name,
    };
  });
}

async function loadOwnedStorageObjects(
  userClient: JananiSupabaseClient,
): Promise<StorageObject[]> {
  const { data, error } = await userClient.rpc(
    "list_own_storage_objects_for_account_deletion",
    { p_limit: MAX_STORAGE_OBJECTS + 1 },
  );
  if (error) throw error;

  const objects = normalizeStorageObjects(data);
  if (objects.length > MAX_STORAGE_OBJECTS) {
    throw new PublicError(
      409,
      "This account has too many stored files for automatic deletion. Contact support.",
    );
  }
  return objects;
}

async function removeStorageObjects(
  admin: JananiSupabaseClient,
  objects: StorageObject[],
): Promise<number> {
  let removedCount = 0;
  const pathsByBucket = new Map<string, string[]>();
  for (const object of objects) {
    const paths = pathsByBucket.get(object.bucket_id) ?? [];
    paths.push(object.object_name);
    pathsByBucket.set(object.bucket_id, paths);
  }

  for (const [bucketId, paths] of pathsByBucket) {
    for (
      let offset = 0;
      offset < paths.length;
      offset += STORAGE_DELETE_BATCH_SIZE
    ) {
      const pathBatch = paths.slice(offset, offset + STORAGE_DELETE_BATCH_SIZE);
      let lastError: unknown;
      for (let attempt = 0; attempt < STORAGE_DELETE_ATTEMPTS; attempt += 1) {
        const { error } = await admin.storage.from(bucketId).remove(pathBatch);
        if (!error) {
          lastError = undefined;
          break;
        }
        lastError = error;
      }
      if (lastError) throw lastError;
      removedCount += pathBatch.length;
    }
  }

  return removedCount;
}

async function processOnePendingCleanup(
  admin: JananiSupabaseClient,
  requestId: string,
): Promise<void> {
  const { data: requests, error } = await admin
    .from("account_deletion_requests")
    .select("user_id,status,storage_objects,last_error")
    .order("updated_at")
    .limit(10);
  if (error) {
    logFailure(requestId, "load-pending-storage-cleanup", error);
    return;
  }
  for (const deletionRequest of requests ?? []) {
    if (await processDeletionRequest(admin, deletionRequest, requestId)) return;
  }
}

type DeletionRequest = {
  last_error: string | null;
  status: string;
  storage_objects: unknown;
  user_id: string;
};

async function processDeletionRequest(
  admin: JananiSupabaseClient,
  deletionRequest: DeletionRequest,
  requestId: string,
): Promise<boolean> {
  let authDeleted = deletionRequest.status === "auth_deleted" ||
    deletionRequest.last_error === "storage_cleanup_pending";

  if (!authDeleted) {
    const { data: authUser, error: authLookupError } = await admin.auth.admin
      .getUserById(deletionRequest.user_id);
    if (!authLookupError && authUser.user) return false;
    if (
      authLookupError &&
      authLookupError.status !== 404 &&
      authLookupError.status !== 422
    ) {
      logFailure(requestId, "verify-pending-auth-deletion", authLookupError);
      return false;
    }
    authDeleted = true;
  }

  if (!authDeleted) return false;

  const { error: statusError } = await admin
    .from("account_deletion_requests")
    .update({
      status: "auth_deleted",
      last_error: null,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", deletionRequest.user_id);
  if (statusError) {
    logFailure(requestId, "recover-auth-deleted-status", statusError);
  }

  try {
    const objects = normalizeStorageObjects(deletionRequest.storage_objects);
    await removeStorageObjects(admin, objects);
    const { error: deleteRequestError } = await admin
      .from("account_deletion_requests")
      .delete()
      .eq("user_id", deletionRequest.user_id);
    if (deleteRequestError) {
      logFailure(
        requestId,
        "complete-pending-storage-cleanup",
        deleteRequestError,
      );
      return false;
    }
    return true;
  } catch (cleanupError) {
    logFailure(requestId, "pending-storage-cleanup", cleanupError);
    await admin
      .from("account_deletion_requests")
      .update({
        status: "auth_deleted",
        last_error: "storage_cleanup_pending",
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", deletionRequest.user_id);
    return false;
  }
}

function scheduleDeletionRecovery(
  admin: JananiSupabaseClient,
  userId: string,
  requestId: string,
): void {
  EdgeRuntime.waitUntil((async () => {
    for (const delay of BACKGROUND_RETRY_DELAYS_MS) {
      await new Promise((resolve) => setTimeout(resolve, delay));
      const { data, error } = await admin
        .from("account_deletion_requests")
        .select("user_id,status,storage_objects,last_error")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) {
        logFailure(requestId, "background-load-deletion-request", error);
        continue;
      }
      if (!data) return;
      if (await processDeletionRequest(admin, data, requestId)) return;
    }
  })());
}

Deno.serve(async (request: Request): Promise<Response> => {
  const requestId = crypto.randomUUID();
  const cors = corsHeadersFor(request);

  if (!cors) {
    return jsonResponse(
      { error: "Origin is not allowed" },
      403,
      {} as CorsHeaders,
      requestId,
    );
  }

  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: cors });
  }

  if (request.method !== "POST") {
    return jsonResponse(
      { error: "Method not allowed" },
      405,
      cors,
      requestId,
    );
  }

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.match(/^Bearer\s+\S+$/i)) {
      throw new PublicError(401, "Authentication required");
    }

    const body = asObject(await readJsonBody(request));
    if (body?.confirmation !== "DELETE") {
      throw new PublicError(
        422,
        "Type DELETE to confirm account deletion",
      );
    }
    const currentPassword = typeof body?.current_password === "string"
      ? body.current_password
      : "";
    if (currentPassword.length < 1 || currentPassword.length > 256) {
      throw new PublicError(
        422,
        "Enter your current password to confirm account deletion",
      );
    }

    const supabaseUrl = requiredEnvironment("SUPABASE_URL");
    const anonKey = requiredEnvironment("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredEnvironment("SUPABASE_SERVICE_ROLE_KEY");
    const userClient = createClient<EdgeDatabase>(supabaseUrl, anonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
      global: { headers: { Authorization: authorization } },
    });
    const { data: userData, error: userError } = await userClient.auth
      .getUser();
    if (userError || !userData.user) {
      throw new PublicError(401, "Authentication required");
    }
    if (!userData.user.email) {
      throw new PublicError(
        409,
        "This account cannot be reauthenticated with a password",
      );
    }

    // Destructive account deletion requires fresh proof of the user's current
    // password. The short-lived verification session is revoked immediately.
    const verificationClient = createClient<EdgeDatabase>(
      supabaseUrl,
      anonKey,
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
    const { data: verification, error: verificationError } =
      await verificationClient.auth.signInWithPassword({
        email: userData.user.email,
        password: currentPassword,
      });
    if (
      verificationError ||
      verification.user?.id !== userData.user.id ||
      !verification.session
    ) {
      throw new PublicError(403, "The current password is incorrect");
    }
    const { error: verificationSignOutError } = await verificationClient.auth
      .signOut({ scope: "local" });
    if (verificationSignOutError) {
      logFailure(
        requestId,
        "revoke-reauthentication-session",
        verificationSignOutError,
      );
      throw new PublicError(500, "Account deletion could not be started");
    }

    const admin = createClient<EdgeDatabase>(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
    await processOnePendingCleanup(admin, requestId);

    let storageObjects: StorageObject[];
    try {
      storageObjects = await loadOwnedStorageObjects(userClient);
    } catch (error) {
      if (error instanceof PublicError) throw error;
      logFailure(requestId, "storage-inventory", error);
      throw new PublicError(
        500,
        "Account deletion could not safely inventory stored files",
      );
    }

    const now = new Date().toISOString();
    const { error: requestError } = await admin
      .from("account_deletion_requests")
      .upsert({
        user_id: userData.user.id,
        status: "pending",
        storage_objects: storageObjects,
        last_error: null,
        updated_at: now,
      });
    if (requestError) {
      logFailure(requestId, "record-deletion-request", requestError);
      throw new PublicError(500, "Account deletion could not be started");
    }

    // Database write guards are now active for this user. Delete Auth before
    // removing files, so a transient Auth failure never destroys live data.
    // The background worker recovers even if this request ends after Auth has
    // accepted the deletion but before the synchronous cleanup completes.
    scheduleDeletionRecovery(admin, userData.user.id, requestId);
    const { error: deleteError } = await admin.auth.admin.deleteUser(
      userData.user.id,
    );
    if (deleteError) {
      logFailure(requestId, "auth-delete", deleteError);
      await admin
        .from("account_deletion_requests")
        .update({
          last_error: "auth_delete_failed",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user.id);
      throw new PublicError(500, "Account deletion could not be completed");
    }

    const { error: statusError } = await admin
      .from("account_deletion_requests")
      .update({
        status: "auth_deleted",
        last_error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userData.user.id);
    if (statusError) logFailure(requestId, "mark-auth-deleted", statusError);

    let removedStorageObjects = 0;
    let storageCleanupComplete = storageObjects.length === 0;
    try {
      removedStorageObjects = await removeStorageObjects(admin, storageObjects);
      storageCleanupComplete = true;
      const { error: completionError } = await admin
        .from("account_deletion_requests")
        .delete()
        .eq("user_id", userData.user.id);
      if (completionError) {
        logFailure(requestId, "complete-deletion-request", completionError);
      }
    } catch (cleanupError) {
      logFailure(requestId, "storage-cleanup-after-auth-delete", cleanupError);
      await admin
        .from("account_deletion_requests")
        .update({
          last_error: "storage_cleanup_pending",
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", userData.user.id);
    }

    return jsonResponse(
      {
        ok: true,
        removed_storage_objects: removedStorageObjects,
        storage_cleanup_complete: storageCleanupComplete,
      },
      200,
      cors,
      requestId,
    );
  } catch (error) {
    if (error instanceof RequestBodyError || error instanceof PublicError) {
      return jsonResponse(
        { error: error.message },
        error.status,
        cors,
        requestId,
      );
    }

    logFailure(requestId, "unhandled", error);
    return jsonResponse(
      { error: "Account deletion could not be completed" },
      500,
      cors,
      requestId,
    );
  }
});
