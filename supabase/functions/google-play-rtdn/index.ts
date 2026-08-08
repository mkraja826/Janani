import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const PACKAGE_NAME = 'com.mkraja826.janani';
const jsonHeaders = { 'content-type': 'application/json' };

function respond(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: jsonHeaders });
}

function b64url(input: Uint8Array | string): string {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
function pemToArrayBuffer(pem: string): ArrayBuffer {
  const body = pem.replace(/-----BEGIN PRIVATE KEY-----/g, '').replace(/-----END PRIVATE KEY-----/g, '').replace(/\s/g, '');
  const binary = atob(body); const bytes = new Uint8Array(binary.length);
  for (let i=0;i<binary.length;i+=1) bytes[i]=binary.charCodeAt(i); return bytes.buffer;
}
async function getGoogleAccessToken(clientEmail:string, privateKey:string):Promise<string>{
  const now=Math.floor(Date.now()/1000); const header=b64url(JSON.stringify({alg:'RS256',typ:'JWT'}));
  const claim=b64url(JSON.stringify({iss:clientEmail,scope:'https://www.googleapis.com/auth/androidpublisher',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600}));
  const input=`${header}.${claim}`;
  const key=await crypto.subtle.importKey('pkcs8',pemToArrayBuffer(privateKey),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
  const sig=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input));
  const response=await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${input}.${b64url(new Uint8Array(sig))}`})});
  if(!response.ok) throw new Error('google_oauth_failed'); const body=await response.json(); return body.access_token;
}
function mapState(state:string, expiry:string|null):'active'|'grace_period'|'expired'|'revoked'{
  if(state==='SUBSCRIPTION_STATE_ACTIVE') return 'active';
  if(state==='SUBSCRIPTION_STATE_IN_GRACE_PERIOD') return 'grace_period';
  if(state==='SUBSCRIPTION_STATE_CANCELED' && expiry && new Date(expiry).getTime()>Date.now()) return 'active';
  if(state==='SUBSCRIPTION_STATE_EXPIRED') return 'expired';
  return 'revoked';
}

Deno.serve(async (request)=>{
  if(request.method!=='POST') return respond(405,{error:'method_not_allowed'});
  const url=new URL(request.url); const supplied=url.searchParams.get('secret'); const expected=Deno.env.get('GOOGLE_PLAY_RTDN_SHARED_SECRET');
  if(!expected || !supplied || supplied!==expected) return respond(401,{error:'invalid_rtdn_secret'});
  const supabaseUrl=Deno.env.get('SUPABASE_URL'); const serviceRole=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const email=Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_EMAIL'); const key=Deno.env.get('GOOGLE_PLAY_SERVICE_ACCOUNT_PRIVATE_KEY')?.replace(/\\n/g,'\n');
  if(!supabaseUrl||!serviceRole||!email||!key) return respond(503,{error:'not_configured'});
  let envelope:any; try{ envelope=await request.json(); }catch{return respond(400,{error:'invalid_json'});}
  const messageId=String(envelope?.message?.messageId??''); const data=String(envelope?.message?.data??'');
  if(!messageId||!data) return respond(400,{error:'invalid_pubsub_message'});
  let event:any; try{ event=JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(data),c=>c.charCodeAt(0)))); }catch{return respond(400,{error:'invalid_rtdn_payload'});}
  const notification=event?.subscriptionNotification; const purchaseToken=notification?.purchaseToken ? String(notification.purchaseToken) : null;
  const notificationType=Number(notification?.notificationType??0); const packageName=String(event?.packageName??'');
  const admin=createClient(supabaseUrl,serviceRole,{auth:{persistSession:false}});
  const {data:existing}=await admin.from('google_play_rtdn_events').select('message_id,status').eq('message_id',messageId).maybeSingle();
  if(existing?.status==='processed'||existing?.status==='ignored') return respond(200,{ok:true,deduplicated:true});
  await admin.from('google_play_rtdn_events').upsert({message_id:messageId,purchase_token:purchaseToken,notification_type:notificationType,event_time_millis:Number(event?.eventTimeMillis??0),package_name:packageName,status:'received'},{onConflict:'message_id'});
  if(packageName!==PACKAGE_NAME || !purchaseToken){
    await admin.from('google_play_rtdn_events').update({status:'ignored',processed_at:new Date().toISOString()}).eq('message_id',messageId);
    return respond(200,{ok:true,ignored:true});
  }
  const {data:known}=await admin.from('google_play_subscription_purchases').select('user_id,product_id').eq('purchase_token',purchaseToken).maybeSingle();
  if(!known?.user_id){
    await admin.from('google_play_rtdn_events').update({status:'ignored',error_code:'unknown_purchase_token',processed_at:new Date().toISOString()}).eq('message_id',messageId);
    return respond(200,{ok:true,ignored:true});
  }
  try{
    const access=await getGoogleAccessToken(email,key);
    const verifyUrl=`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PACKAGE_NAME}/purchases/subscriptionsv2/tokens/${encodeURIComponent(purchaseToken)}`;
    const play=await fetch(verifyUrl,{headers:{authorization:`Bearer ${access}`}}); if(!play.ok) throw new Error(`play_${play.status}`);
    const purchase=await play.json(); const items=Array.isArray(purchase.lineItems)?purchase.lineItems:[];
    const item=items.find((x:any)=>x?.productId===known.product_id)??items[0]; const expiry=item?.expiryTime?String(item.expiryTime):null;
    const state=String(purchase.subscriptionState??'SUBSCRIPTION_STATE_UNSPECIFIED'); const entitlement=mapState(state,expiry);
    await admin.from('google_play_subscription_purchases').update({subscription_state:state,acknowledgement_state:purchase.acknowledgementState??null,latest_order_id:purchase.latestOrderId??null,expiry_time:expiry,verified_at:new Date().toISOString(),updated_at:new Date().toISOString()}).eq('purchase_token',purchaseToken).eq('user_id',known.user_id);
    await admin.from('care_plus_entitlements').upsert({user_id:known.user_id,status:entitlement,plan_code:known.product_id==='janani_care_plus_annual'?'care_plus_annual':'care_plus_monthly',source:'google_play',source_entitlement_id:purchaseToken,current_period_end:expiry,verified_at:new Date().toISOString(),updated_at:new Date().toISOString()},{onConflict:'user_id'});
    await admin.from('google_play_rtdn_events').update({status:'processed',processed_at:new Date().toISOString()}).eq('message_id',messageId);
    return respond(200,{ok:true,status:entitlement});
  }catch(error){
    await admin.from('google_play_rtdn_events').update({status:'failed',error_code:error instanceof Error?error.message:'reconcile_failed',processed_at:new Date().toISOString()}).eq('message_id',messageId);
    return respond(500,{error:'reconciliation_failed'});
  }
});
