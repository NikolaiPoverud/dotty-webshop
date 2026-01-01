import 'server-only';
import { createClient } from '@supabase/supabase-js';

// Admin client with service role key - use only in server-side code
// This bypasses RLS policies
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables. Please check your .env.local file:\n' +
      `NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? 'set' : 'MISSING'}\n` +
      `SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'set' : 'MISSING'}`
    );
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
