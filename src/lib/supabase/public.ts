import 'server-only';

import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

/**
 * Creates a public Supabase client for read-only operations that don't need auth.
 *
 * IMPORTANT: We disable fetch caching to ensure fresh data is fetched on each
 * revalidation cycle. The page-level `revalidate` setting controls how often
 * the page is regenerated, and we want fresh DB data each time.
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

  return createClient(supabaseUrl, anonKey, {
    global: {
      fetch: (url, options) => {
        // Disable Next.js fetch caching for Supabase requests
        // This ensures we get fresh data on each page revalidation
        return fetch(url, {
          ...options,
          cache: 'no-store',
        });
      },
    },
  });
}
