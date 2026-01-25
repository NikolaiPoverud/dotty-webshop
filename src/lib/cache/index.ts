// Re-export all cache utilities
export * from './kv-cache';

// Re-export local cache for backwards compatibility
export {
  get as localGet,
  set as localSet,
  del as localDel,
  clear as localClear,
  getOrSet as localGetOrSet,
  invalidatePrefix as localInvalidatePrefix,
  CACHE_KEYS as LOCAL_CACHE_KEYS,
  CACHE_TTL as LOCAL_CACHE_TTL,
} from '../cache';
