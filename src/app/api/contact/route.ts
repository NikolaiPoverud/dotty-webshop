import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';

// Rate limit: 5 requests per minute per IP
const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60 * 1000 };

// Create a public Supabase client for anonymous submissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(request: Request) {
  // Check rate limit
  const clientIp = getClientIp(request);
  const rateLimitResult = checkRateLimit(`contact:${clientIp}`, RATE_LIMIT_CONFIG);

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
    const { name, email, message } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email address' },
        { status: 400 }
      );
    }

    // Save to database
    const { data, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        message: message.trim(),
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }

    // Send email notification to artist
    try {
      const resend = getResend();
      await resend.emails.send({
        from: emailConfig.from,
        to: emailConfig.artistEmail,
        subject: `Ny melding fra ${name}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FE206A; margin-bottom: 24px;">Ny kontaktmelding</h2>

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0 0 8px 0;"><strong>Fra:</strong> ${name}</p>
              <p style="margin: 0 0 8px 0;"><strong>E-post:</strong> <a href="mailto:${email}">${email}</a></p>
              <p style="margin: 0;"><strong>Mottatt:</strong> ${new Date().toLocaleString('nb-NO', { dateStyle: 'full', timeStyle: 'short' })}</p>
            </div>

            <div style="background: #fff; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px;">
              <p style="margin: 0 0 8px 0;"><strong>Melding:</strong></p>
              <p style="margin: 0; white-space: pre-wrap;">${message}</p>
            </div>

            <p style="margin-top: 24px; color: #666; font-size: 14px;">
              Du kan svare direkte til denne e-posten, eller gå til <a href="${emailConfig.baseUrl}/admin/contact">admin-panelet</a> for å se alle meldinger.
            </p>
          </div>
        `,
        replyTo: email,
      });
    } catch (emailError) {
      // Log but don't fail the request if email fails
      console.error('Failed to send email notification:', emailError);
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
