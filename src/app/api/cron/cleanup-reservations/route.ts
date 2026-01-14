import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * SEC-011: Cron endpoint for cleaning up expired cart reservations
 *
 * This endpoint is called by Vercel Cron or an external cron service
 * to release reservations older than 15 minutes.
 *
 * Configured in vercel.json to run every 5 minutes.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify this is a legitimate cron request (Vercel adds this header)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  // In production, verify the request is from Vercel Cron or has correct secret
  if (process.env.NODE_ENV === 'production') {
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

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
