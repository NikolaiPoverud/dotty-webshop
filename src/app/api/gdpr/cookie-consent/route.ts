import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';

const RATE_LIMIT_CONFIG = { maxRequests: 10, windowMs: 60 * 1000 };

export async function POST(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`cookie-consent:${clientIp}`, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { consent_given } = await request.json();

    const ip = clientIp;
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
