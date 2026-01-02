import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getResend, emailConfig } from '@/lib/email/resend';

// POST /api/newsletter - Subscribe to newsletter (double opt-in)
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Get client IP for consent tracking
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';

    const supabase = createAdminClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists
    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('email', normalizedEmail)
      .single();

    if (existing) {
      // Already subscribed and confirmed
      if (existing.is_confirmed && !existing.unsubscribed_at) {
        return NextResponse.json({ success: true, message: 'Already subscribed' });
      }

      // Was unsubscribed - resubscribe them
      if (existing.unsubscribed_at) {
        const { error: updateError } = await supabase
          .from('newsletter_subscribers')
          .update({
            unsubscribed_at: null,
            is_confirmed: false,
            consent_ip: ip,
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('Failed to resubscribe:', updateError);
          return NextResponse.json(
            { error: 'Failed to subscribe' },
            { status: 500 }
          );
        }

        // Send confirmation email
        await sendConfirmationEmail(normalizedEmail, existing.confirmation_token);
        return NextResponse.json({ success: true, needs_confirmation: true });
      }

      // Not confirmed yet - resend confirmation
      await sendConfirmationEmail(normalizedEmail, existing.confirmation_token);
      return NextResponse.json({ success: true, needs_confirmation: true });
    }

    // Insert new subscriber
    const { data: newSubscriber, error } = await supabase
      .from('newsletter_subscribers')
      .insert({
        email: normalizedEmail,
        is_confirmed: false,
        consent_ip: ip,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to subscribe:', error);
      return NextResponse.json(
        { error: 'Failed to subscribe' },
        { status: 500 }
      );
    }

    // Send confirmation email
    await sendConfirmationEmail(normalizedEmail, newSubscriber.confirmation_token);

    return NextResponse.json({ success: true, needs_confirmation: true });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe' },
      { status: 500 }
    );
  }
}

async function sendConfirmationEmail(email: string, confirmationToken: string) {
  try {
    const resend = getResend();
    const confirmUrl = `${emailConfig.baseUrl}/api/newsletter/confirm?token=${confirmationToken}`;

    await resend.emails.send({
      from: emailConfig.from,
      to: email,
      subject: 'Bekreft nyhetsbrev-abonnement | Confirm newsletter subscription',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <h1 style="color: #FE206A; font-size: 32px; margin: 0;">Dotty.</h1>
          </div>

          <h2 style="color: #fafafa; margin-bottom: 16px;">Bekreft abonnementet ditt</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            Takk for at du vil abonnere på nyhetsbrevet til Dotty! Klikk på knappen under for å bekrefte abonnementet.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: #FE206A; color: #131316; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              Bekreft abonnement
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #3f3f46; margin: 32px 0;" />

          <h2 style="color: #fafafa; margin-bottom: 16px;">Confirm your subscription</h2>
          <p style="color: #a1a1aa; line-height: 1.6;">
            Thank you for subscribing to the Dotty newsletter! Click the button below to confirm your subscription.
          </p>

          <div style="text-align: center; margin: 32px 0;">
            <a href="${confirmUrl}" style="display: inline-block; background: #FE206A; color: #131316; font-weight: 600; text-decoration: none; padding: 14px 32px; border-radius: 8px;">
              Confirm subscription
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
    console.error('Failed to send confirmation email:', error);
    // Don't throw - subscription is saved, email can be resent
  }
}
