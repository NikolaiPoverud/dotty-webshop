/**
 * Rate limiter with Vercel KV (Redis) backend for serverless environments.
 * Falls back to in-memory for development/testing.
 */

import { kv } from '@vercel/kv';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetTime: number;
}

const memoryStore = new Map<string, { count: number; resetTime: number }>();

function isKvConfigured(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

async function checkRateLimitWithKv(
  key: string,
  config: RateLimitConfig,
  now: number
): Promise<RateLimitResult> {
  const windowSeconds = Math.ceil(config.windowMs / 1000);
  const current = await kv.get<number>(key);

  if (current === null) {
    await kv.set(key, 1, { ex: windowSeconds });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  if (current < config.maxRequests) {
    await kv.incr(key);
    return {
      success: true,
      remaining: config.maxRequests - current - 1,
      resetTime: now + config.windowMs,
    };
  }

  const ttl = await kv.ttl(key);
  const resetOffset = ttl > 0 ? ttl * 1000 : config.windowMs;
  return {
    success: false,
    remaining: 0,
    resetTime: now + resetOffset,
  };
}

function checkRateLimitWithMemory(
  key: string,
  config: RateLimitConfig,
  now: number
): RateLimitResult {
  const entry = memoryStore.get(key);
  const resetTime = now + config.windowMs;

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime,
    };
  }

  if (entry.count < config.maxRequests) {
    entry.count++;
    return {
      success: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  return {
    success: false,
    remaining: 0,
    resetTime: entry.resetTime,
  };
}

export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;

  if (isKvConfigured()) {
    try {
      return await checkRateLimitWithKv(key, config, now);
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error);
    }
  }

  return checkRateLimitWithMemory(key, config, now);
}

export function getClientIp(request: Request): string {
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

function cleanupMemoryStore(): void {
  const now = Date.now();
  for (const [key, entry] of memoryStore.entries()) {
    if (now > entry.resetTime) {
      memoryStore.delete(key);
    }
  }
}

if (typeof setInterval !== 'undefined') {
  setInterval(cleanupMemoryStore, 60000);
}
