/**
 * Simple in-memory cache with TTL support
 *
 * For production with multiple instances, consider upgrading to:
 * - Vercel KV (Redis-compatible)
 * - Upstash Redis
 * - Node-cache with Redis adapter
 *
 * This implementation is suitable for:
 * - Single instance deployments
 * - Serverless with warm containers (Vercel Edge/Lambda)
 * - Development/staging environments
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

// Default TTL: 5 minutes
const DEFAULT_TTL_MS = 5 * 60 * 1000;

/**
 * Get a cached value
 */
export function get<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }

  return entry.value;
}

/**
 * Set a cached value with optional TTL
 */
export function set<T>(key: string, value: T, ttlMs: number = DEFAULT_TTL_MS): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

/**
 * Delete a cached value
 */
export function del(key: string): boolean {
  return cache.delete(key);
}

/**
 * Clear all cached values
 */
export function clear(): void {
  cache.clear();
}

/**
 * Get or set pattern - fetch from cache or execute getter and cache result
 */
export async function getOrSet<T>(
  key: string,
  getter: () => Promise<T>,
  ttlMs: number = DEFAULT_TTL_MS
): Promise<T> {
  const cached = get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await getter();
  set(key, value, ttlMs);
  return value;
}

/**
 * Invalidate cache entries matching a prefix
 */
export function invalidatePrefix(prefix: string): number {
  let count = 0;
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) {
      cache.delete(key);
      count++;
    }
  }
  return count;
}

// Cache key helpers
export const CACHE_KEYS = {
  collections: () => 'collections:all',
  collection: (slug: string) => `collections:${slug}`,
  products: (query?: string) => `products:${query || 'all'}`,
  featuredProducts: () => 'products:featured',
} as const;

// TTL constants
export const CACHE_TTL = {
  COLLECTIONS: 5 * 60 * 1000,    // 5 minutes
  PRODUCTS: 60 * 1000,           // 1 minute
  FEATURED: 2 * 60 * 1000,       // 2 minutes
} as const;
