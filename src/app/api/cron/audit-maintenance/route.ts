import { NextRequest, NextResponse } from 'next/server';

import { verifyCronAuth } from '@/lib/cron-auth';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

  const supabase = createAdminClient();
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
}
