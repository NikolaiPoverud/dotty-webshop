import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend, emailConfig } from '@/lib/email/resend';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { newsletterConfirmationTemplate } from '@/lib/email/templates';

const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60 * 1000 };

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`newsletter:${clientIp}`, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) }
    );
  }

  // SEC-004: Strong email validation regex
  const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  try {
    const { email } = await request.json();

    if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json({ error: 'Valid email is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      if (existing.is_confirmed && !existing.unsubscribed_at) {
        return NextResponse.json({ success: true, message: 'Already subscribed' });
      }

      if (existing.unsubscribed_at) {
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({ unsubscribed_at: null, is_confirmed: false, consent_ip: clientIp })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Failed to resubscribe:', updateError);
          return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
        }
      }

      return sendConfirmationAndRespond(normalizedEmail, existing.confirmation_token);
    }

    const { data: newSubscriber, error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: normalizedEmail, is_confirmed: false, consent_ip: clientIp })
      .select()
      .single();

    if (error) {
      console.error('Failed to subscribe:', error);
      return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }

    const emailResult = await sendConfirmationEmail(normalizedEmail, newSubscriber.confirmation_token);
    if (!emailResult.success) {
      await supabase.from('newsletter_subscribers').delete().eq('id', newSubscriber.id);
      return NextResponse.json(
        { error: 'Failed to send confirmation email. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, needs_confirmation: true });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
  }
}

async function sendConfirmationAndRespond(
  email: string,
  confirmationToken: string
): Promise<NextResponse> {
  const emailResult = await sendConfirmationEmail(email, confirmationToken);
  if (!emailResult.success) {
    return NextResponse.json(
      { error: 'Failed to send confirmation email. Please try again.' },
      { status: 500 }
    );
  }
  return NextResponse.json({ success: true, needs_confirmation: true });
}

async function sendConfirmationEmail(
  email: string,
  confirmationToken: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const resend = getResend();
    const confirmUrl = `${emailConfig.baseUrl}/api/newsletter/confirm?token=${confirmationToken}`;

    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Bekreft nyhetsbrev-abonnement | Confirm newsletter subscription',
      html: newsletterConfirmationTemplate(confirmUrl),
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send confirmation email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Email sending failed',
    };
  }
}
