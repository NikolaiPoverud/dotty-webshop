import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * DB-013: Cron endpoint for audit log maintenance
 *
 * Archives audit logs older than 2 years and deletes archives older than 7 years.
 * Configured in vercel.json to run monthly.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify this is a legitimate cron request
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

    // Call the maintenance function
    const { data, error } = await supabase.rpc('maintain_audit_logs');

    if (error) {
      console.error('Audit maintenance error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Audit maintenance completed:', data);

    return NextResponse.json({
      success: true,
      ...data,
    });
  } catch (error) {
    console.error('Audit maintenance error:', error);
    return NextResponse.json({ error: 'Maintenance failed' }, { status: 500 });
  }
}
