import 'server-only';

import { kv } from '@vercel/kv';

/**
 * Distributed cache layer using Vercel KV (Redis)
 * Survives deployments and scales across instances
 */

export const CACHE_PREFIXES = {
  product: 'product:',
  productsList: 'products:list:',
  facetCounts: 'facets:counts',
  sitemapSlugs: 'sitemap:slugs:',
  seoTemplate: 'seo:template:',
  collections: 'collections:',
  availableYears: 'facets:years',
} as const;

export const CACHE_TTL = {
  // Short TTL for frequently changing data
  productsList: 60,        // 1 minute
  facetCounts: 300,        // 5 minutes

  // Medium TTL for moderately stable data
  product: 3600,           // 1 hour
  collections: 3600,       // 1 hour
  availableYears: 3600,    // 1 hour

  // Long TTL for stable data
  seoTemplate: 86400,      // 24 hours
  sitemapSlugs: 3600,      // 1 hour (refreshed by cron)
} as const;

// Check if KV is configured
function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// In-memory fallback for development
const memoryFallback = new Map<string, { value: unknown; expiresAt: number }>();

/**
 * Get a value from the distributed cache
 */
export async function kvGet<T>(key: string): Promise<T | null> {
  if (!isKvConfigured()) {
    const entry = memoryFallback.get(key);
    if (!entry || Date.now() > entry.expiresAt) {
      memoryFallback.delete(key);
      return null;
    }
    return entry.value as T;
  }

  try {
    return await kv.get<T>(key);
  } catch (error) {
    console.error(`KV get error for key ${key}:`, error);
    return null;
  }
}

/**
 * Set a value in the distributed cache
 */
export async function kvSet<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  if (!isKvConfigured()) {
    memoryFallback.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    });
    return;
  }

  try {
    await kv.set(key, value, { ex: ttlSeconds });
  } catch (error) {
    console.error(`KV set error for key ${key}:`, error);
  }
}

/**
 * Delete a key from the distributed cache
 */
export async function kvDel(key: string): Promise<void> {
  if (!isKvConfigured()) {
    memoryFallback.delete(key);
    return;
  }

  try {
    await kv.del(key);
  } catch (error) {
    console.error(`KV delete error for key ${key}:`, error);
  }
}

/**
 * Delete all keys matching a pattern (prefix)
 */
export async function kvDelByPrefix(prefix: string): Promise<number> {
  if (!isKvConfigured()) {
    let count = 0;
    for (const key of memoryFallback.keys()) {
      if (key.startsWith(prefix)) {
        memoryFallback.delete(key);
        count++;
      }
    }
    return count;
  }

  try {
    const keys = await kv.keys(`${prefix}*`);
    if (keys.length > 0) {
      await kv.del(...keys);
    }
    return keys.length;
  } catch (error) {
    console.error(`KV delete by prefix error for ${prefix}:`, error);
    return 0;
  }
}

/**
 * Get or set with automatic caching
 * This is the primary interface for cached data fetching
 */
export async function getOrSetCached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number
): Promise<T> {
  // Try to get from cache first
  const cached = await kvGet<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Cache miss - fetch fresh data
  const value = await fetcher();

  // Store in cache (fire and forget)
  kvSet(key, value, ttlSeconds).catch(console.error);

  return value;
}

/**
 * Get multiple values from cache
 */
export async function kvMGet<T>(...keys: string[]): Promise<(T | null)[]> {
  if (!isKvConfigured()) {
    return keys.map((key) => {
      const entry = memoryFallback.get(key);
      if (!entry || Date.now() > entry.expiresAt) {
        memoryFallback.delete(key);
        return null;
      }
      return entry.value as T;
    });
  }

  try {
    return await kv.mget<T[]>(...keys);
  } catch (error) {
    console.error('KV mget error:', error);
    return keys.map(() => null);
  }
}

/**
 * Build cache keys with consistent naming
 */
export const cacheKeys = {
  product: (slug: string) => `${CACHE_PREFIXES.product}${slug}`,
  productsList: (params: string) => `${CACHE_PREFIXES.productsList}${params}`,
  facetCounts: () => CACHE_PREFIXES.facetCounts,
  sitemapSlugs: (type: string) => `${CACHE_PREFIXES.sitemapSlugs}${type}`,
  seoTemplate: (locale: string, facetType: string, facetValue: string) =>
    `${CACHE_PREFIXES.seoTemplate}${locale}:${facetType}:${facetValue}`,
  collection: (slug: string) => `${CACHE_PREFIXES.collections}${slug}`,
  availableYears: () => CACHE_PREFIXES.availableYears,
} as const;

/**
 * Invalidate product-related caches when a product changes
 */
export async function invalidateProductCaches(slug?: string): Promise<void> {
  const promises: Promise<unknown>[] = [
    kvDel(CACHE_PREFIXES.facetCounts),
    kvDelByPrefix(CACHE_PREFIXES.productsList),
    kvDelByPrefix(CACHE_PREFIXES.sitemapSlugs),
  ];

  if (slug) {
    promises.push(kvDel(cacheKeys.product(slug)));
  }

  await Promise.all(promises);
}

/**
 * Warm up the cache with commonly accessed data
 */
export async function warmCache(
  data: {
    facetCounts?: unknown;
    availableYears?: number[];
    topProducts?: Array<{ slug: string; data: unknown }>;
  }
): Promise<void> {
  const promises: Promise<void>[] = [];

  if (data.facetCounts) {
    promises.push(kvSet(cacheKeys.facetCounts(), data.facetCounts, CACHE_TTL.facetCounts));
  }

  if (data.availableYears) {
    promises.push(kvSet(cacheKeys.availableYears(), data.availableYears, CACHE_TTL.availableYears));
  }

  if (data.topProducts) {
    for (const product of data.topProducts) {
      promises.push(kvSet(cacheKeys.product(product.slug), product.data, CACHE_TTL.product));
    }
  }

  await Promise.all(promises);
}
