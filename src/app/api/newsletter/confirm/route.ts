import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      // Redirect to error page
      return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=invalid', request.url));
    }

    const supabase = createAdminClient();

    // Find subscriber by confirmation token
    const { data: subscriber, error: findError } = await supabase
      .from('newsletter_subscribers')
      .select('*')
      .eq('confirmation_token', token)
      .single();

    if (findError || !subscriber) {
      return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=invalid', request.url));
    }

    // Check if already confirmed
    if (subscriber.is_confirmed) {
      return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=already', request.url));
    }

    // Check if unsubscribed
    if (subscriber.unsubscribed_at) {
      return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=unsubscribed', request.url));
    }

    // Confirm the subscription
    const { error: updateError } = await supabase
      .from('newsletter_subscribers')
      .update({
        is_confirmed: true,
      })
      .eq('id', subscriber.id);

    if (updateError) {
      console.error('Failed to confirm subscription:', updateError);
      return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=error', request.url));
    }

    // Log to audit
    await supabase.from('audit_log').insert({
      action: 'newsletter_confirmed',
      entity_type: 'newsletter_subscriber',
      entity_id: subscriber.id,
      actor_type: 'customer',
      actor_id: subscriber.email,
      details: { email: subscriber.email },
    });

    // Redirect to success page
    return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=success', request.url));
  } catch (error) {
    console.error('Newsletter confirmation error:', error);
    return NextResponse.redirect(new URL('/no/newsletter-confirmed?status=error', request.url));
  }
}
