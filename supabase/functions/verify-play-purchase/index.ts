import { createClient } from '@supabase/supabase-js';

const PACKAGE_NAME = 'com.mkraja826.janani';
const SUBSCRIPTION_PRODUCT = 'pregalove_care_plus_monthly';
const TOPUP_PRODUCTS = new Set([
  'pregalove_care_credits_small',
  'pregalove_care_credits_medium',
  'pregalove_care_credits_large',
]);

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
}

function required(name: string): string {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function pemToBytes(pem: string): Uint8Array {
  const clean = pem.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '');
  const binary = atob(clean);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function googleAccessToken(): Promise<string> {
  const raw = required('GOOGLE_PLAY_SERVICE_ACCOUNT_JSON');
  const service = JSON.parse(raw) as { client_email: string; private_key: string; token_uri?: string };
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const claims = b64url(JSON.stringify({
    iss: service.client_email,
    scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: service.token_uri ?? 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }));
  const signingInput = `${header}.${claims}`;
  const key = await crypto.subtle.importKey(
    'pkcs8',
    pemToBytes(service.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(signingInput)));
  const assertion = `${signingInput}.${b64url(signature)}`;
  const tokenResponse = await fetch(service.token_uri ?? 'https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
  });
  if (!tokenResponse.ok) throw new Error(`Google OAuth failed: ${tokenResponse.status}`);
  const tokenBody = await tokenResponse.json() as { access_token?: string };
  if (!tokenBody.access_token) throw new Error('Google OAuth returned no access token');
  return tokenBody.access_token;
}

async function sha256Hex(value: string): Promise<string> {
  const bytes = new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) return json({ error: 'authentication_required' }, 401);

    const supabaseUrl = required('SUPABASE_URL');
    const anonKey = required('SUPABASE_ANON_KEY');
    const serviceRoleKey = required('SUPABASE_SERVICE_ROLE_KEY');
    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: 'authentication_required' }, 401);

    const body = await req.json() as { productId?: string; productType?: 'subs' | 'inapp'; purchaseToken?: string };
    const productId = body.productId?.trim();
    const purchaseToken = body.purchaseToken?.trim();
    if (!productId || !purchaseToken || !body.productType) return json({ error: 'invalid_purchase_payload' }, 400);
    if (body.productType === 'subs' && productId !== SUBSCRIPTION_PRODUCT) return json({ error: 'unsupported_subscription_product' }, 400);
    if (body.productType === 'inapp' && !TOPUP_PRODUCTS.has(productId)) return json({ error: 'unsupported_topup_product' }, 400);

    const accessToken = await googleAccessToken();
    const headers = { Authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' };

    if (body.productType === 'subs') {
      const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
      const response = await fetch(url, { headers });
      if (!response.ok) return json({ verified: false, error: 'google_subscription_verification_failed' }, 400);
      const purchase = await response.json() as {
        subscriptionState?: string;
        acknowledgementState?: string;
        latestOrderId?: string;
        lineItems?: Array<{ productId?: string; expiryTime?: string }>;
      };
      const line = purchase.lineItems?.find((item) => item.productId === productId);
      const activeStates = new Set(['SUBSCRIPTION_STATE_ACTIVE', 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD']);
      if (!line || !activeStates.has(purchase.subscriptionState ?? '')) return json({ verified: false, error: 'subscription_not_active' }, 409);

      await admin.from('care_plus_entitlements').upsert({
        user_id: userData.user.id,
        status: purchase.subscriptionState === 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD' ? 'grace_period' : 'active',
        plan_code: 'care_plus_monthly',
        source: 'google_play',
        source_entitlement_id: await sha256Hex(purchaseToken),
        current_period_end: line.expiryTime ?? null,
        verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' });

      if (purchase.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_PENDING') {
        const ackUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptions/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:acknowledge`;
        const ack = await fetch(ackUrl, { method: 'POST', headers, body: '{}' });
        if (!ack.ok) throw new Error(`Google subscription acknowledgement failed: ${ack.status}`);
      }

      const periodStart = new Date().toISOString().slice(0, 10);
      await admin.rpc('grant_monthly_care_credits_server', { p_user_id: userData.user.id, p_period_start: periodStart });
      return json({ verified: true, entitlement: 'care_plus_monthly' });
    }

    const productUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}`;
    const response = await fetch(productUrl, { headers });
    if (!response.ok) return json({ verified: false, error: 'google_product_verification_failed' }, 400);
    const purchase = await response.json() as { purchaseState?: number; consumptionState?: number; acknowledgementState?: number; orderId?: string };
    if (purchase.purchaseState !== 0) return json({ verified: false, error: 'product_not_purchased' }, 409);

    const tokenHash = await sha256Hex(purchaseToken);
    const { data: grant, error: grantError } = await admin.rpc('grant_verified_topup_care_credits_server', {
      p_user_id: userData.user.id,
      p_product_id: productId,
      p_purchase_token_hash: tokenHash,
      p_order_id: purchase.orderId ?? null,
    });
    if (grantError) throw grantError;

    if (purchase.consumptionState !== 1) {
      const consumeUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/products/${encodeURIComponent(productId)}/tokens/${encodeURIComponent(purchaseToken)}:consume`;
      const consume = await fetch(consumeUrl, { method: 'POST', headers });
      if (!consume.ok) throw new Error(`Google product consumption failed: ${consume.status}`);
    }

    const granted = grant as { credits?: number } | null;
    return json({ verified: true, creditsGranted: granted?.credits ?? undefined });
  } catch (error) {
    console.error('verify-play-purchase', error instanceof Error ? error.message : error);
    return json({ verified: false, error: 'purchase_verification_unavailable' }, 503);
  }
});
