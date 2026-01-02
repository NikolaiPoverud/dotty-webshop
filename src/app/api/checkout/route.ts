import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
}

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
      locale = 'no',
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

    const total = subtotal - (discount_amount || 0);

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
      total: total.toString(),
    };

    // Get base URL for the locale
    const baseUrl = locale === 'en'
      ? (process.env.NEXT_PUBLIC_DOMAIN_EN || 'https://dottyartwork.com')
      : (process.env.NEXT_PUBLIC_DOMAIN_NO || process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no');

    // Use localized route paths
    const successPath = locale === 'en' ? '/en/checkout/success' : '/no/kasse/bekreftelse';
    const cancelPath = locale === 'en' ? '/en/checkout' : '/no/kasse';

    const successUrl = `${baseUrl}${successPath}?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}${cancelPath}`;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: lineItems,
      customer_email,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: orderMetadata,
      locale: locale === 'no' ? 'nb' : 'en',
      shipping_address_collection: {
        allowed_countries: ['NO', 'SE', 'DK', 'FI'],
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
