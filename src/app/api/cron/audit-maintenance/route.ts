import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyCronAuth } from '@/lib/cron-auth';

/**
 * DB-013: Cron endpoint for audit log maintenance
 *
 * Archives audit logs older than 2 years and deletes archives older than 7 years.
 * Configured in vercel.json to run monthly.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  // SEC-017: Verify cron request is authenticated
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

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
