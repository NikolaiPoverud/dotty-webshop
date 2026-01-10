import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('checkRateLimit', () => {
    function createIdentifier(): string {
      return `test-ip-${Date.now()}-${Math.random()}`
    }

    it('should allow first request', async () => {
      const result = await checkRateLimit(createIdentifier(), { maxRequests: 5, windowMs: 60000 })

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(4)
    })

    it('should decrement remaining count with each request', async () => {
      const config = { maxRequests: 3, windowMs: 60000 }
      const identifier = createIdentifier()

      const result1 = await checkRateLimit(identifier, config)
      const result2 = await checkRateLimit(identifier, config)
      const result3 = await checkRateLimit(identifier, config)

      expect(result1.remaining).toBe(2)
      expect(result2.remaining).toBe(1)
      expect(result3.remaining).toBe(0)
    })

    it('should block requests when limit exceeded', async () => {
      const config = { maxRequests: 2, windowMs: 60000 }
      const identifier = createIdentifier()

      await checkRateLimit(identifier, config)
      await checkRateLimit(identifier, config)
      const result = await checkRateLimit(identifier, config)

      expect(result.success).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after window expires', async () => {
      const config = { maxRequests: 2, windowMs: 1000 }
      const identifier = createIdentifier()

      await checkRateLimit(identifier, config)
      await checkRateLimit(identifier, config)

      vi.advanceTimersByTime(1100)

      const result = await checkRateLimit(identifier, config)

      expect(result.success).toBe(true)
      expect(result.remaining).toBe(1)
    })
  })

  describe('getClientIp', () => {
    function createRequest(headers: Record<string, string> = {}): Request {
      return new Request('https://example.com', { headers })
    }

    it('should prefer x-real-ip header', () => {
      const request = createRequest({
        'x-real-ip': '192.168.1.2',
        'x-forwarded-for': '10.0.0.1',
      })

      expect(getClientIp(request)).toBe('192.168.1.2')
    })

    it('should fallback to x-forwarded-for when x-real-ip not present', () => {
      const request = createRequest({ 'x-forwarded-for': '192.168.1.1, 10.0.0.1' })

      expect(getClientIp(request)).toBe('192.168.1.1')
    })

    it('should extract IP from x-real-ip header', () => {
      const request = createRequest({ 'x-real-ip': '192.168.1.2' })

      expect(getClientIp(request)).toBe('192.168.1.2')
    })

    it('should return unknown when no IP headers present', () => {
      const request = createRequest()

      expect(getClientIp(request)).toBe('unknown')
    })
  })

  describe('getRateLimitHeaders', () => {
    it('should return correct headers', () => {
      const result = { success: true, remaining: 5, resetTime: 1700000000000 }
      const headers = getRateLimitHeaders(result)

      expect(headers['X-RateLimit-Remaining']).toBe('5')
      expect(headers['X-RateLimit-Reset']).toBe('1700000000')
    })
  })
})
