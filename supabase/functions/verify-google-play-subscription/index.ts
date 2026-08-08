import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const jsonHeaders = { 'content-type': 'application/json' };
const PACKAGE_NAME = 'com.mkraja826.janani';
const ALLOWED_PRODUCTS = new Set(['janani_care_plus_monthly', 'janani_care_plus_annual']);

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function compactString(value: unknown, max = 4096): string | null {
  if (typeof value !== 'string') return null;
  const next = value.trim().slice(0, max);
  return next || null;
}

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const binary = atob(body);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

async function getGoogleAccessToken(clientEmail: string, privateKey: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claim = b64url(JSON.stringify({
    iss: clientEmail,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claim}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(privateKey),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    key,
    new TextEncoder().encode(signingInput),
  );
  const assertion = `${signingInput}.${b64url(new Uint8Array(signature))}`;

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });
  if (!response.ok) throw new Error('google_oauth_failed');
  const body = await response.json();
  if (typeof body.access_token !== 'string') throw new Error('google_oauth_missing_token');
  return body.access_token;
}

function mapEntitlementState(state: string, expiryTime: string | null): 'active' | 'grace_period' | 'expired' | 'revoked' {
  if (state === 'SUBSCRIPTION_STATE_ACTIVE') return 'active';
  if (state === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD') return 'grace_period';
  if (state === 'SUBSCRIPTION_STATE_EXPIRED') return 'expired';
  if (state === 'SUBSCRIPTION_STATE_CANCELED' && expiryTime && new Date(expiryTime).getTime() > Date.now()) return 'active';
  return 'revoked';
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return respond(405, { error: 'method_not_allowed' });

  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return respond(401, { error: 'authentication_required' });

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const googleClientEmail = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL');
  const googlePrivateKey = Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !googleClientEmail || !googlePrivateKey) {
    return respond(503, { error: 'play_verification_not_configured' });
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) return respond(401, { error: 'invalid_session' });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return respond(400, { error: 'invalid_json' }); }
  const purchaseToken = compactString(body.purchaseToken, 4096);
  const expectedProductId = compactString(body.productId, 160);
  if (!purchaseToken || !expectedProductId || !ALLOWED_PRODUCTS.has(expectedProductId)) {
    return respond(400, { error: 'invalid_purchase_payload' });
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const { data: existingToken } = await admin
    .from('google_play_subscription_purchases')
    .select('user_id')
    .eq('purchase_token', purchaseToken)
    .maybeSingle();
  if (existingToken && existingToken.user_id !== userData.user.id) {
    return respond(409, { error: 'purchase_token_already_owned' });
  }

  let accessToken: string;
  try { accessToken = await getGoogleAccessToken(googleClientEmail, googlePrivateKey); }
  catch { return respond(503, { error: 'google_authorization_failed' }); }

  const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
  const playResponse = await fetch(verifyUrl, { headers: { authorization: `Bearer ${accessToken}` } });
  if (!playResponse.ok) return respond(422, { error: 'purchase_verification_failed' });
  const purchase = await playResponse.json();

  const lineItems = Array.isArray(purchase.lineItems) ? purchase.lineItems : [];
  const matchingItem = lineItems.find((item: Record<string, unknown>) => item?.productId === expectedProductId);
  if (!matchingItem) return respond(422, { error: 'product_mismatch' });

  const subscriptionState = compactString(purchase.subscriptionState, 100) ?? 'SUBSCRIPTION_STATE_UNSPECIFIED';
  const acknowledgementState = compactString(purchase.acknowledgementState, 100);
  const expiryTime = compactString(matchingItem.expiryTime, 80);
  const basePlanId = compactString((matchingItem.offerDetails as Record<string, unknown> | undefined)?.basePlanId, 160);
  const linkedPurchaseToken = compactString(purchase.linkedPurchaseToken, 4096);
  const entitlementStatus = mapEntitlementState(subscriptionState, expiryTime);

  if (linkedPurchaseToken) {
    const { data: linked } = await admin
      .from('google_play_subscription_purchases')
      .select('user_id')
      .eq('purchase_token', linkedPurchaseToken)
      .maybeSingle();
    if (linked?.user_id && linked.user_id !== userData.user.id) {
      return respond(409, { error: 'linked_purchase_owned_by_another_user' });
    }
    await admin
      .from('google_play_subscription_purchases')
      .update({ subscription_state: 'SUBSCRIPTION_STATE_REPLACED', updated_at: new Date().toISOString() })
      .eq('purchase_token', linkedPurchaseToken)
      .eq('user_id', userData.user.id);
  }

  const purchaseRecord = {
    purchase_token: purchaseToken,
    user_id: userData.user.id,
    package_name: PACKAGE_NAME,
    product_id: expectedProductId,
    base_plan_id: basePlanId,
    latest_order_id: compactString(purchase.latestOrderId, 200),
    subscription_state: subscriptionState,
    acknowledgement_state: acknowledgementState,
    linked_purchase_token: linkedPurchaseToken,
    start_time: compactString(purchase.startTime, 80),
    expiry_time: expiryTime,
    raw_region_code: compactString(purchase.regionCode, 10),
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  const { error: purchaseWriteError } = await admin
    .from('google_play_subscription_purchases')
    .upsert(purchaseRecord, { onConflict: 'purchase_token' });
  if (purchaseWriteError) return respond(503, { error: 'purchase_record_failed' });

  const planCode = expectedProductId === 'janani_care_plus_annual' ? 'care_plus_annual' : 'care_plus_monthly';
  const { error: entitlementError } = await admin.from('care_plus_entitlements').upsert({
    user_id: userData.user.id,
    status: entitlementStatus,
    plan_code: planCode,
    source: 'google_play',
    source_entitlement_id: purchaseToken,
    current_period_end: expiryTime,
    verified_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (entitlementError) return respond(503, { error: 'entitlement_update_failed' });

  return respond(200, {
    verified: true,
    active: entitlementStatus === 'active' || entitlementStatus === 'grace_period',
    status: entitlementStatus,
    planCode,
    currentPeriodEnd: expiryTime,
    acknowledgementState,
  });
});
