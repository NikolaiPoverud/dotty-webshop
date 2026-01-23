interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();
const DEFAULT_TTL_MS = 5 * 60 * 1000;

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

export function set<T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void {
  cache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function del(key: string): boolean {
  return cache.delete(key);
}

export function clear(): void {
  cache.clear();
}

export async function getOrSet<T>(
  key: string,
  getter: () => Promise<T>,
  ttlMs = DEFAULT_TTL_MS
): Promise<T> {
  const cached = get<T>(key);
  if (cached !== null) {
    return cached;
  }

  const value = await getter();
  set(key, value, ttlMs);
  return value;
}

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

export const CACHE_KEYS = {
  collections: () => 'collections:all',
  collection: (slug: string) => `collections:${slug}`,
  products: (query?: string) => `products:${query || 'all'}`,
  featuredProducts: () => 'products:featured',
} as const;

export const CACHE_TTL = {
  COLLECTIONS: 5 * 60 * 1000,
  PRODUCTS: 60 * 1000,
  FEATURED: 2 * 60 * 1000,
} as const;
