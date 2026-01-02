import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';

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
    const actionNo = isExport ? 'eksportere dine data' : 'slette dine data';
    const actionEn = isExport ? 'export your data' : 'delete your data';
    const buttonNo = isExport ? 'Bekreft eksport' : 'Bekreft sletting';
    const buttonEn = isExport ? 'Confirm export' : 'Confirm deletion';

    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: `${subjectNo} | ${subjectEn}`,
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #FE206A; font-size: 32px; margin: 0;">Dotty.</h1>
          </div>

          <h2 style="color: #fafafa; margin-bottom: 16px;">${subjectNo}</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            Vi har mottatt en forespørsel om å ${actionNo}. Klikk på knappen under for å bekrefte forespørselen.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #FE206A; color: #131316; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              ${buttonNo}
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #3f3f46; margin: 32px 0;" />

          <h2 style="color: #fafafa; margin-bottom: 16px;">${subjectEn}</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            We have received a request to ${actionEn}. Click the button below to confirm the request.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${verifyUrl}" style="display: inline-block; background: #FE206A; color: #131316; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              ${buttonEn}
            </a>
          </div>

          <p style="color: #71717a; font-size: 12px; margin-top: 40px; text-align: center;">
            Hvis du ikke ba om dette, kan du ignorere denne e-posten.<br/>
            If you didn't request this, you can ignore this email.
          </p>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send verification email:', error);
    throw error;
  }
}
