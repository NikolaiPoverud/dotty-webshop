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

/**
 * SEC-008: Rate limiting with fail-safe behavior
 *
 * In production, if Redis is unavailable, we return a "rate limited" response
 * rather than silently falling back to ineffective in-memory limiting.
 * This prevents rate limit bypass in serverless environments where memory
 * isn't shared across instances.
 *
 * In development, we allow memory fallback for convenience.
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isKvConfigured()) {
    try {
      return await checkRateLimitWithKv(key, config, now);
    } catch (error) {
      console.error('Redis rate limit error:', error);

      // SEC-008: In production, fail closed - treat Redis errors as rate limited
      // This prevents bypass when Redis is unavailable
      if (isProduction) {
        console.warn('SEC-008: Rate limit fail-safe triggered - denying request');
        return {
          success: false,
          remaining: 0,
          resetTime: now + config.windowMs,
        };
      }
      // In development, allow memory fallback
      console.warn('Development mode: falling back to memory rate limiting');
    }
  }

  // Only use memory store in development or when KV is not configured
  if (isProduction && !isKvConfigured()) {
    console.warn('SEC-008: KV not configured in production - rate limiting disabled for this request');
    // Still allow through but log warning - this should be fixed by configuring KV
  }

  return checkRateLimitWithMemory(key, config, now);
}

/**
 * SEC-007: Get client IP with proper proxy handling
 *
 * When behind Vercel/CDN, the rightmost IP in x-forwarded-for is the most reliable
 * as it's the IP that Vercel saw. Leftmost can be spoofed by malicious clients.
 *
 * Priority order:
 * 1. x-real-ip (set by Vercel edge, most reliable)
 * 2. Rightmost x-forwarded-for IP (closest to our edge)
 * 3. 'unknown' fallback
 */
export function getClientIp(request: Request): string {
  // x-real-ip is set by Vercel and is the most reliable
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Take rightmost IP from x-forwarded-for chain (closest to our edge)
  // This prevents attackers from spoofing IPs via the header
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim()).filter(Boolean);
    // Rightmost IP is the one that connected to Vercel
    return ips[ips.length - 1] || 'unknown';
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
