import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCronAuth } from '@/lib/cron-auth';

/**
 * Cron endpoint for cleaning up expired cart reservations
 *
 * This endpoint is called by Vercel Cron to release reservations older than 15 minutes.
 * Configured in vercel.json to run every 5 minutes.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // SEC-017: Verify cron request is authenticated
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

  try {
    const supabase = createAdminClient();

    // Call the cleanup function
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
  } catch (error) {
    console.error('Cleanup reservations error:', error);
    return NextResponse.json({ error: 'Cleanup failed' }, { status: 500 });
  }
}
