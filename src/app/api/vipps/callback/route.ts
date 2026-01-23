import { NextRequest, NextResponse } from 'next/server';
import { getPayment } from '@/lib/vipps';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import type { Locale, Order, OrderItem } from '@/types';

function getCanonicalOrigin(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';
}

function redirectToCheckout(locale: Locale, reason: string): NextResponse {
  const origin = getCanonicalOrigin();
  const checkoutUrl = locale === 'en'
    ? `${origin}/en/checkout?vipps_error=${reason}`
    : `${origin}/no/kasse?vipps_error=${reason}`;
  return NextResponse.redirect(checkoutUrl);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const reference = searchParams.get('reference');
  const locale = (searchParams.get('locale') || 'no') as Locale;

  if (!reference) {
    return redirectToCheckout(locale, 'missing_reference');
  }

  try {
    // Get payment status from Vipps
    const payment = await getPayment(reference);
    const supabase = createAdminClient();

    const isEnglish = locale === 'en';
    const origin = getCanonicalOrigin();

    switch (payment.state) {
      case 'AUTHORIZED': {
        // Payment authorized - update order status
        // Note: With reserve capture, we don't capture here.
        // Capture happens when order is shipped (via admin)
        const { data: order, error: updateError } = await supabase
          .from('orders')
          .update({
            payment_status: 'authorized',
            status: 'paid',
            vipps_state: payment.state,
            authorized_amount: payment.aggregate?.authorizedAmount?.value,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', reference)
          .select('*')
          .single();

        if (updateError) {
          console.error('Failed to update order:', updateError);
        }

        // Update inventory for each item
        if (order?.items) {
          for (const item of order.items as Array<{ product_id: string; quantity: number }>) {
            const { data: stockResult, error: stockError } = await supabase.rpc('decrement_product_stock', {
              p_product_id: item.product_id,
              p_quantity: item.quantity,
            });

            if (stockError) {
              console.error(`Failed to decrement stock for product ${item.product_id}:`, stockError.message);
            } else if (stockResult?.[0]?.success) {
              console.log(`Stock updated for product ${item.product_id}: new_stock=${stockResult[0].new_stock}`);
            }
          }
        }

        // Send confirmation emails
        if (order) {
          try {
            const orderWithItems = { ...order, items: order.items || [] } as Order & { items: OrderItem[] };
            await sendOrderEmails(orderWithItems);
            console.log('Confirmation emails sent for Vipps order:', reference);
          } catch (emailError) {
            console.error('Failed to send Vipps order emails:', emailError);
          }
        }

        // Redirect to success page
        const successUrl = isEnglish
          ? `${origin}/en/checkout/success?reference=${reference}&provider=vipps`
          : `${origin}/no/kasse/bekreftelse?reference=${reference}&provider=vipps`;

        return NextResponse.redirect(successUrl);
      }

      case 'TERMINATED':
      case 'EXPIRED': {
        await supabase
          .from('orders')
          .update({
            payment_status: 'cancelled',
            vipps_state: payment.state,
            updated_at: new Date().toISOString(),
          })
          .eq('order_number', reference);

        return redirectToCheckout(locale, 'canceled');
      }

      case 'CREATED': {
        return redirectToCheckout(locale, 'incomplete');
      }

      default: {
        console.warn(`Unexpected Vipps payment state: ${payment.state}`);
        return redirectToCheckout(locale, 'error');
      }
    }

  } catch (error) {
    console.error('Vipps callback error:', error);

    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from('orders')
      .select('id, payment_status')
      .eq('order_number', reference)
      .single();

    if (order) {
      await supabase
        .from('orders')
        .update({
          payment_status: 'pending_verification',
          updated_at: new Date().toISOString(),
        })
        .eq('order_number', reference);

      const origin = getCanonicalOrigin();
      const isEnglish = locale === 'en';
      const successUrl = isEnglish
        ? `${origin}/en/checkout/success?reference=${reference}&provider=vipps`
        : `${origin}/no/kasse/bekreftelse?reference=${reference}&provider=vipps`;

      return NextResponse.redirect(successUrl);
    }

    return redirectToCheckout(locale, 'error');
  }
}
