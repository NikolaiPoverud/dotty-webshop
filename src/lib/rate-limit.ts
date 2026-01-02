/**
 * Rate limiter with Vercel KV (Redis) backend for serverless environments
 * Falls back to in-memory for development/testing
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

// In-memory fallback for development (when KV is not configured)
const memoryStore = new Map<string, { count: number; resetTime: number }>();

/**
 * Check if a request should be rate limited
 * Uses Redis in production, in-memory in development
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const now = Date.now();
  const key = `ratelimit:${identifier}`;
  const windowSeconds = Math.ceil(config.windowMs / 1000);

  // Try Redis first (production)
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    try {
      const current = await kv.get<number>(key);

      if (current === null) {
        // First request in window
        await kv.set(key, 1, { ex: windowSeconds });
        return {
          success: true,
          remaining: config.maxRequests - 1,
          resetTime: now + config.windowMs,
        };
      }

      if (current < config.maxRequests) {
        // Under limit, increment
        await kv.incr(key);
        return {
          success: true,
          remaining: config.maxRequests - current - 1,
          resetTime: now + config.windowMs,
        };
      }

      // Rate limit exceeded
      const ttl = await kv.ttl(key);
      return {
        success: false,
        remaining: 0,
        resetTime: now + (ttl > 0 ? ttl * 1000 : config.windowMs),
      };
    } catch (error) {
      console.error('Redis rate limit error, falling back to memory:', error);
      // Fall through to memory store
    }
  }

  // In-memory fallback (development or Redis failure)
  const entry = memoryStore.get(key);

  if (!entry || now > entry.resetTime) {
    memoryStore.set(key, { count: 1, resetTime: now + config.windowMs });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
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
 * Get IP address from request headers
 * Uses Vercel's trusted headers in production
 */
export function getClientIp(request: Request): string {
  // Vercel provides the true client IP in x-real-ip (trusted, not spoofable)
  // https://vercel.com/docs/edge-network/headers#x-real-ip
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback to x-forwarded-for (less trusted, take first IP)
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString(),
  };
}

// Clean up memory store periodically (for dev environment)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of memoryStore.entries()) {
      if (now > entry.resetTime) {
        memoryStore.delete(key);
      }
    }
  }, 60000);
}
