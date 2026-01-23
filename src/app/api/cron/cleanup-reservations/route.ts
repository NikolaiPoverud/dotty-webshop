import { NextRequest, NextResponse } from 'next/server';

import { verifyCronAuth } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc('cleanup_expired_reservations');

  if (error) {
    console.error('Cleanup reservations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  console.log('Cleanup completed, released reservations:', data);

  return NextResponse.json({
    success: true,
    released_count: data,
    timestamp: new Date().toISOString(),
  });
}
