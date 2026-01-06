import 'server-only';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Public client for read-only operations that don't need auth
// This allows pages to be statically cached (ISR) instead of dynamic
export function createPublicClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
