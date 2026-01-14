/**
 * Collection service with caching
 */

import { createPublicClient } from '@/lib/supabase/public';
import { getOrSet, CACHE_KEYS, CACHE_TTL, invalidatePrefix } from '@/lib/cache';
import type { Collection, CollectionCard } from '@/types';

const COLLECTION_FIELDS = 'id, name, slug, description, display_order';

/**
 * Get all active collections (cached)
 */
export async function getCollections(): Promise<CollectionCard[]> {
  return getOrSet(
    CACHE_KEYS.collections(),
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_FIELDS)
        .is('deleted_at', null)
        .order('display_order', { ascending: true });

      if (error) {
        console.error('Failed to fetch collections:', error);
        return [];
      }

      return data ?? [];
    },
    CACHE_TTL.COLLECTIONS
  );
}

/**
 * Get a single collection by slug (cached)
 */
export async function getCollectionBySlug(slug: string): Promise<CollectionCard | null> {
  return getOrSet(
    CACHE_KEYS.collection(slug),
    async () => {
      const supabase = createPublicClient();
      const { data, error } = await supabase
        .from('collections')
        .select(COLLECTION_FIELDS)
        .eq('slug', slug)
        .is('deleted_at', null)
        .single();

      if (error || !data) {
        return null;
      }

      return data;
    },
    CACHE_TTL.COLLECTIONS
  );
}

/**
 * Invalidate collection cache (call after mutations)
 */
export function invalidateCollectionCache(): void {
  invalidatePrefix('collections:');
}
