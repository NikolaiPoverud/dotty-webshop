import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripe();
    const body = await request.json();
    const {
      items,
      customer_email,
      customer_name,
      customer_phone,
      shipping_address,
      discount_code,
      discount_amount,
      artist_levy = 0,
      locale = 'no',
      privacy_accepted = false,
      newsletter_opt_in = false,
    } = body;

    // Validate items
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'No items in cart' },
        { status: 400 }
      );
    }

    // Validate customer info
    if (!customer_email || !customer_name || !customer_phone || !shipping_address) {
      return NextResponse.json(
        { error: 'Missing customer information' },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = items.reduce((sum: number, item: any) => {
      return sum + (item.price * item.quantity);
    }, 0);

    const total = subtotal + (artist_levy || 0) - (discount_amount || 0);

    // Create line items for Stripe
    const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item: any) => ({
      price_data: {
        currency: 'nok',
        product_data: {
          name: item.title,
          images: item.image_url ? [item.image_url] : undefined,
        },
        unit_amount: item.price, // Already in øre
      },
      quantity: item.quantity,
    }));

    // Add artist levy (kunsteravgift) as a separate line item if applicable
    if (artist_levy > 0) {
      lineItems.push({
        price_data: {
          currency: 'nok',
          product_data: {
            name: locale === 'no' ? 'Kunsteravgift (5%)' : 'Artist Levy (5%)',
            description: locale === 'no'
              ? 'Lovpålagt avgift for kunst over 2 500 kr'
              : 'Legal fee for artwork over 2,500 kr',
          },
          unit_amount: artist_levy, // Already in øre
        },
        quantity: 1,
      });
    }

    // Store order metadata
    const orderMetadata = {
      customer_email,
      customer_name,
      customer_phone,
      shipping_address: JSON.stringify(shipping_address),
      items: JSON.stringify(items),
      subtotal: subtotal.toString(),
      discount_code: discount_code || '',
      discount_amount: (discount_amount || 0).toString(),
      artist_levy: (artist_levy || 0).toString(),
      total: total.toString(),
      privacy_accepted: privacy_accepted.toString(),
      newsletter_opt_in: newsletter_opt_in.toString(),
    };

    // Get base URL - always use canonical (non-www) domain
    let origin = request.headers.get('origin') || request.headers.get('referer')?.split('/').slice(0, 3).join('/') || 'https://dotty.no';

    // Normalize to non-www
    origin = origin.replace('://www.', '://');

    // Use localized route paths
    const successPath = locale === 'en' ? '/en/checkout/success' : '/no/kasse/bekreftelse';
    const cancelPath = locale === 'en' ? '/en/checkout' : '/no/kasse';

    const successUrl = `${origin}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}${cancelPath}?canceled=true`;

    // Create Stripe checkout session
    // Prefill customer info so they don't have to enter it twice
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: orderMetadata,
      locale: locale === 'no' ? 'nb' : 'en',
      // Pass shipping info directly instead of asking again
      payment_intent_data: {
        shipping: {
          name: customer_name,
          phone: customer_phone,
          address: {
            line1: shipping_address.line1,
            line2: shipping_address.line2 || undefined,
            city: shipping_address.city,
            postal_code: shipping_address.postal_code,
            country: shipping_address.country === 'Norge' ? 'NO' : shipping_address.country,
          },
        },
      },
      // Apply discount as coupon if exists
      discounts: discount_amount > 0 ? [{
        coupon: await createStripeCoupon(stripe, discount_amount, discount_code),
      }] : undefined,
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });

  } catch (error) {
    console.error('Stripe checkout error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper to create a one-time Stripe coupon for discounts
async function createStripeCoupon(stripe: Stripe, amountOff: number, code?: string): Promise<string> {
  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: 'nok',
    duration: 'once',
    name: code || 'Discount',
  });
  return coupon.id;
}
