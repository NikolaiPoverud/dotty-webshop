import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { success, errors } from '@/lib/api-response';

const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60 * 1000 };
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getSubjectPrefix(type: string): string {
  switch (type) {
    case 'sold_out_inquiry':
      return 'Interesse for solgt verk';
    case 'product_inquiry':
      return 'Forespørsel om verk';
    default:
      return 'Ny melding';
  }
}

function buildEmailHtml(
  subjectPrefix: string,
  productTitle: string | null,
  name: string | null,
  email: string,
  message: string
): string {
  const productSection = productTitle
    ? `<div style="background: #FE206A; color: white; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
        <p style="margin: 0; font-size: 14px; opacity: 0.9;">Gjelder kunstverket:</p>
        <p style="margin: 8px 0 0 0; font-size: 18px; font-weight: bold;">${productTitle}</p>
      </div>`
    : '';

  const nameRow = name
    ? `<p style="margin: 0 0 8px 0;"><strong>Fra:</strong> ${name}</p>`
    : '';

  const timestamp = new Date().toLocaleString('nb-NO', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  return `
    <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #FE206A; margin-bottom: 24px;">${subjectPrefix}</h2>
      ${productSection}
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        ${nameRow}
        <p style="margin: 0 0 8px 0;"><strong>E-post:</strong> <a href="mailto:${email}">${email}</a></p>
        <p style="margin: 0;"><strong>Mottatt:</strong> ${timestamp}</p>
      </div>
      <div style="background: #fff; border: 1px solid #e5e5e5; padding: 20px; border-radius: 8px;">
        <p style="margin: 0 0 8px 0;"><strong>Melding:</strong></p>
        <p style="margin: 0; white-space: pre-wrap;">${message}</p>
      </div>
      <p style="margin-top: 24px; color: #666; font-size: 14px;">
        Du kan svare direkte til denne e-posten, eller gå til <a href="${emailConfig.baseUrl}/admin/contact">admin-panelet</a> for å se alle meldinger.
      </p>
    </div>
  `;
}

export async function POST(request: Request): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`contact:${clientIp}`, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { success: false, error: 'Too many requests. Please try again later.', code: 'RATE_LIMITED' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  const body = await request.json();
  const { name, email, message, type, product_id, product_title } = body;

  const isProductInquiry = type === 'product_inquiry' || type === 'sold_out_inquiry';

  if (!email || !message) {
    return errors.badRequest('Email and message are required');
  }
  if (!isProductInquiry && !name) {
    return errors.badRequest('Name is required');
  }
  if (!EMAIL_REGEX.test(email)) {
    return errors.badRequest('Invalid email address');
  }

  const { data, error: dbError } = await supabase
    .from('contact_submissions')
    .insert({
      name: name?.trim() || (isProductInquiry ? 'Product Inquiry' : ''),
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

  const subjectPrefix = getSubjectPrefix(type);
  const displayName = name || email;

  try {
    await getResend().emails.send({
      from: emailConfig.from,
      to: emailConfig.artistEmail,
      subject: product_title
        ? `${subjectPrefix}: ${product_title}`
        : `${subjectPrefix} fra ${displayName}`,
      html: buildEmailHtml(subjectPrefix, product_title, name, email, message),
      replyTo: email,
    });
  } catch (emailError) {
    console.error('Failed to send email notification:', emailError);
  }

  return success({ id: data.id }, 'Message sent successfully');
}
