import { NextRequest, NextResponse } from 'next/server';

interface CronAuthResult {
  authorized: boolean;
  response?: NextResponse;
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

  if (authHeader !== `Bearer ${cronSecret}`) {
    console.warn('Unauthorized cron access attempt');
    return {
      authorized: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { authorized: true };
}
