import 'server-only';

import { createClient } from '@supabase/supabase-js';

/**
 * Creates a Supabase client for public (read-only) operations
 *
 * For cached operations, use the functions in @/lib/supabase/cached-public.ts
 * which leverage Next.js fetch caching and distributed KV caching.
 *
 * @param options.cached - Enable Next.js fetch caching (default: false for backwards compatibility)
 */
export function createPublicClient(options: { cached?: boolean } = {}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    throw new Error('Missing Supabase public credentials');
  }

  // Enable fetch caching for read operations when requested
  const fetchOptions = options.cached
    ? { next: { revalidate: 60 } }
    : { cache: 'no-store' as const };

  return createClient(supabaseUrl, anonKey, {
    global: {
      fetch: (url, fetchInit) => fetch(url, { ...fetchInit, ...fetchOptions }),
    },
  });
}

/**
 * Creates a cached Supabase client with Next.js fetch caching enabled
 * Use this for read-only operations that can be cached at the edge
 */
export function createCachedPublicClient() {
  return createPublicClient({ cached: true });
}
