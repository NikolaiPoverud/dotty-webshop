import { NextRequest, NextResponse } from 'next/server';
import { getPayment } from '@/lib/vipps';
import { createAdminClient } from '@/lib/supabase/admin';
import type { Locale } from '@/types';

/**
 * Vipps callback handler
 * User is redirected here after completing/cancelling payment in Vipps app
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');
  const locale = (searchParams.get('locale') || 'no') as Locale;

  if (!reference) {
    return redirectToCheckout(request, locale, 'missing_reference');
  }

  try {
    // Get payment status from Vipps
    const payment = await getPayment(reference);
    const supabase = createAdminClient();

    const isEnglish = locale === 'en';
    const origin = getCanonicalOrigin(request);

    switch (payment.state) {
      case 'AUTHORIZED': {
        // Payment authorized - update order status
        // Note: With reserve capture, we don't capture here.
        // Capture happens when order is shipped (via admin)
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'authorized',
            vipps_state: payment.state,
            authorized_amount: payment.aggregate?.authorizedAmount?.value,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', reference);

        if (updateError) {
          console.error('Failed to update order:', updateError);
        }

        // Redirect to success page
        const successUrl = isEnglish
          ? `${origin}/en/checkout/success?reference=${reference}&provider=vipps`
          : `${origin}/no/kasse/bekreftelse?reference=${reference}&provider=vipps`;

        return NextResponse.redirect(successUrl);
      }

      case 'TERMINATED':
      case 'EXPIRED': {
        // Payment was cancelled or expired
        await supabase
          .from('orders')
          .update({
            payment_status: 'cancelled',
            vipps_state: payment.state,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', reference);

        return redirectToCheckout(request, locale, 'canceled');
      }

      case 'CREATED': {
        // User returned but payment not yet completed
        // This can happen if user closes Vipps app without completing
        return redirectToCheckout(request, locale, 'incomplete');
      }

      default: {
        console.warn(`Unexpected Vipps payment state: ${payment.state}`);
        return redirectToCheckout(request, locale, 'error');
      }
    }

  } catch (error) {
    console.error('Vipps callback error:', error);

    // If we can't verify payment status but user returned from Vipps,
    // check if order exists and redirect to success with pending status
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('order_number', reference)
      .single();

    if (order) {
      // Order exists - payment likely succeeded, mark as pending verification
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending_verification',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', reference);

      const origin = getCanonicalOrigin(request);
      const isEnglish = locale === 'en';
      const successUrl = isEnglish
        ? `${origin}/en/checkout/success?reference=${reference}&provider=vipps`
        : `${origin}/no/kasse/bekreftelse?reference=${reference}&provider=vipps`;

      return NextResponse.redirect(successUrl);
    }

    return redirectToCheckout(request, locale, 'error');
  }
}

function redirectToCheckout(
  request: NextRequest,
  locale: Locale,
  reason: string,
): NextResponse {
  const origin = getCanonicalOrigin(request);
  const isEnglish = locale === 'en';
  const checkoutUrl = isEnglish
    ? `${origin}/en/checkout?vipps_error=${reason}`
    : `${origin}/no/kasse?vipps_error=${reason}`;

  return NextResponse.redirect(checkoutUrl);
}

function getCanonicalOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin')
    || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
    || process.env.NEXT_PUBLIC_SITE_URL
    || 'https://dotty.no';
  return origin.replace('://www.', '://');
}
