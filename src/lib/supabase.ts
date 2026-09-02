import 'react-native-url-polyfill/auto';

import { createClient } from '@supabase/supabase-js';

import { encryptedAuthStorage } from '@/lib/secureAuthStorage';
import type { Database } from '@/types/databaseExtended';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Missing Janani Supabase environment variables.');
}

const jananiSupabaseUrl: string = supabaseUrl;
const jananiSupabasePublishableKey: string = supabasePublishableKey;

export const supabase = createClient<Database>(jananiSupabaseUrl, jananiSupabasePublishableKey, {
  auth: {
    storage: encryptedAuthStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

export function createSessionBoundSupabaseClient(accessToken: string) {
  return createClient<Database>(jananiSupabaseUrl, jananiSupabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
    global: {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  });
}
