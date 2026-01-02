import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { success, errors } from '@/lib/api-response';

// Rate limit: 5 requests per minute per IP
const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60 * 1000 };

// Use service role to bypass RLS for contact submissions
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  // Check rate limit
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`contact:${clientIp}`, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  try {
    const body = await request.json();
    const { name, email, message, type, product_id, product_title } = body;

    // Validate required fields - name is optional for product inquiries
    const isProductInquiry = type === 'product_inquiry' || type === 'sold_out_inquiry';
    if (!email || !message) {
      return errors.badRequest('Email and message are required');
    }
    if (!isProductInquiry && !name) {
      return errors.badRequest('Name is required');
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return errors.badRequest('Invalid email address');
    }

    // Save to database
    const { data, error: dbError } = await supabase
      .from('contact_submissions')
      .insert({
        name: name ? name.trim() : (isProductInquiry ? 'Product Inquiry' : ''),
        email: email.trim().toLowerCase(),
        message: message.trim(),
        type: type || 'contact',
        product_id: product_id || null,
        product_title: product_title || null,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return errors.internal('Failed to save message');
    }

    // Send email notification to artist
    try {
      const resend = getResend();
      const subjectPrefix = type === 'sold_out_inquiry' ? 'Interesse for solgt verk' :
                           type === 'product_inquiry' ? 'Forespørsel om verk' : 'Ny melding';
      const displayName = name || email;

      await resend.emails.send({
        from: emailConfig.from,
        to: emailConfig.artistEmail,
        subject: product_title ? `${subjectPrefix}: ${product_title}` : `${subjectPrefix} fra ${displayName}`,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FE206A; margin-bottom: 24px;">${subjectPrefix}</h2>

            ${product_title ? `
            <div style="background: #FE206A; color: white; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
              <p style="margin: 0; font-size: 14px; opacity: 0.9;">Gjelder kunstverket:</p>
              <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold;">${product_title}</p>
            </div>
            ` : ''}

            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              ${name ? `<p style="margin: 0 0 8px 0;"><strong>Fra:</strong> ${name}</p>` : ''}
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

    return success({ id: data.id }, 'Message sent successfully');
  } catch (error) {
    console.error('Contact form error:', error);
    return errors.internal('An unexpected error occurred');
  }
}
