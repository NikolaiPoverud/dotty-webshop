import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { gdprVerificationTemplate } from '@/lib/email/templates';

// Use service role to bypass RLS
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// SEC-002: Rate limit config for GDPR requests (5 requests per hour)
const GDPR_RATE_LIMIT = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

// POST /api/gdpr/data-request - Create a new data request
export async function POST(request: Request) {
  // SEC-002: Apply rate limiting
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`gdpr:${clientIp}`, GDPR_RATE_LIMIT);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      {
        status: 429,
        headers: getRateLimitHeaders(rateLimitResult),
      }
    );
  }

  try {
    const body = await request.json();
    const { email, request_type } = body;

    // Validate input
    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!request_type || !['export', 'delete'].includes(request_type)) {
      return NextResponse.json(
        { error: 'Valid request type is required (export or delete)' },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Create the data request
    const { data: newRequest, error } = await supabase
      .from('data_requests')
      .insert({
        email: normalizedEmail,
        request_type,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create data request:', error);
      return NextResponse.json(
        { error: 'Failed to create request' },
        { status: 500 }
      );
    }

    // Send verification email
    await sendVerificationEmail(normalizedEmail, newRequest.verification_token, request_type);

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Data request error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

async function sendVerificationEmail(email: string, token: string, requestType: string) {
  try {
    const resend = getResend();
    const verifyUrl = `${emailConfig.baseUrl}/api/gdpr/verify-request?token=${token}`;

    const isExport = requestType === 'export';
    const subjectNo = isExport ? 'Bekreft dataforespørsel' : 'Bekreft sletting av data';
    const subjectEn = isExport ? 'Confirm data export request' : 'Confirm data deletion request';

    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: `${subjectNo} | ${subjectEn}`,
      html: gdprVerificationTemplate(verifyUrl, requestType as 'export' | 'delete'),
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}
