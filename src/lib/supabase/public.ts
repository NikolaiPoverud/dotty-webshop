import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a public Supabase client for read-only operations that don't need auth.
 * Allows pages to be statically cached (ISR) instead of dynamic.
 */
export function createPublicClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    const missing = [
      !supabaseUrl && 'NEXT_PUBLIC_SUPABASE_URL',
      !anonKey && 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    ].filter(Boolean);

    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }

  return createClient(supabaseUrl, anonKey);
}
