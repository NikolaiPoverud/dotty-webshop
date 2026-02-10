import { NextRequest, NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';

interface CronAuthResult {
  authorized: boolean;
  response?: NextResponse;
}

function timingSafeStringEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export function verifyCronAuth(request: NextRequest): CronAuthResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const cronSecret = process.env.CRON_SECRET;

  if (!isProduction) {
    return { authorized: true };
  }

  if (!cronSecret) {
    console.error('CRON_SECRET not set in production environment');
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Server configuration error' }, { status: 500 }),
    };
  }

  const authHeader = request.headers.get('authorization');
  const expectedHeader = `Bearer ${cronSecret}`;

  if (!authHeader || !timingSafeStringEqual(authHeader, expectedHeader)) {
    console.warn('Unauthorized cron access attempt');
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
