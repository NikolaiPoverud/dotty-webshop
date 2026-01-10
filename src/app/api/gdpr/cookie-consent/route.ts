import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { consent_given } = await request.json();

    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    const supabase = createAdminClient();
    const { error } = await supabase.from('cookie_consents').insert({
      session_id: crypto.randomUUID(),
      consent_given,
      ip_address: ip,
      user_agent: userAgent.substring(0, 500),
    });

    if (error) {
      console.error('Failed to store cookie consent:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cookie consent error:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
