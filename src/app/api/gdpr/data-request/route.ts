import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { gdprVerificationTemplate } from '@/lib/email/templates';

const GDPR_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000,
};

const VALID_REQUEST_TYPES = ['export', 'delete'] as const;
type RequestType = (typeof VALID_REQUEST_TYPES)[number];

export async function POST(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`gdpr:${clientIp}`, GDPR_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const { email, request_type } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    if (!request_type || !VALID_REQUEST_TYPES.includes(request_type)) {
      return NextResponse.json(
        { error: 'Valid request type is required (export or delete)' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();
    const supabase = createAdminClient();

    const { data: newRequest, error } = await supabase
      .from('data_requests')
      .insert({ email: normalizedEmail, request_type, status: 'pending' })
      .select()
      .single();

    if (error) {
      console.error('Failed to create data request:', error);
      return NextResponse.json({ error: 'Failed to create request' }, { status: 500 });
    }

    await sendVerificationEmail(normalizedEmail, newRequest.verification_token, request_type);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Data request error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

async function sendVerificationEmail(
  email: string,
  token: string,
  requestType: RequestType
): Promise<void> {
  const resend = getResend();
  const verifyUrl = `${emailConfig.baseUrl}/api/gdpr/verify-request?token=${token}`;

  const subject =
    requestType === 'export'
      ? 'Bekreft dataforespørsel | Confirm data export request'
      : 'Bekreft sletting av data | Confirm data deletion request';

  await resend.emails.send({
    from: emailConfig.from,
    to: email,
    subject,
    html: gdprVerificationTemplate(verifyUrl, requestType),
  });
}
