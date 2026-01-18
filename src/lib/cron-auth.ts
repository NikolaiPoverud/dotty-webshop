/**
 * SEC-017: Cron endpoint authentication helper
 *
 * Verifies that cron requests come from legitimate sources:
 * 1. Vercel Cron (via CRON_SECRET in Authorization header)
 * 2. Local development (skipped in non-production)
 *
 * Vercel automatically sends:
 * - Authorization: Bearer <CRON_SECRET> (if CRON_SECRET env var is set)
 *
 * Usage:
 * ```typescript
 * const authResult = verifyCronAuth(request);
 * if (!authResult.authorized) return authResult.response;
 * ```
 */

import { NextRequest, NextResponse } from 'next/server';

interface CronAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

export function verifyCronAuth(request: NextRequest): CronAuthResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const cronSecret = process.env.CRON_SECRET;

  // In development, allow all requests for testing
  if (!isProduction) {
    return { authorized: true };
  }

  // In production, CRON_SECRET must be set
  if (!cronSecret) {
    console.error('SEC-017: CRON_SECRET not set in production environment');
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      ),
    };
  }

  const authHeader = request.headers.get('authorization');

  // Verify the Authorization header matches the CRON_SECRET
  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('SEC-017: Unauthorized cron access attempt');
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      ),
    };
  }

  return { authorized: true };
}
