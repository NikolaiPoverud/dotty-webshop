import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateCheckoutToken, generateCheckoutToken } from '@/lib/checkout-token';
import type { ShippingAddress, OrderItem, Locale, DiscountCode } from '@/types';

interface CheckoutRequestBody {
  items: OrderItem[];
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  discount_code?: string;
  discount_amount?: number;
  shipping_cost?: number;
  artist_levy?: number;
  locale?: Locale;
  privacy_accepted?: boolean;
  newsletter_opt_in?: boolean;
  checkout_token?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Rate limiting: 5 requests per minute per IP for checkout
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`checkout:${clientIp}`, {
    maxRequests: 5,
    windowMs: 60000,
  });

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please wait a minute and try again.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
    );
  }

  const body = await request.json() as CheckoutRequestBody;

  // SEC-002: Validate checkout token to ensure request originated from legitimate checkout
  const tokenValidation = validateCheckoutToken(body.checkout_token);
  if (!tokenValidation.valid) {
    return NextResponse.json(
      { error: tokenValidation.error || 'Invalid checkout session' },
      { status: 403 },
    );
  }

  const {
    items,
    customer_email,
    customer_name,
    customer_phone,
    shipping_address,
    discount_code,
    discount_amount = 0,
    shipping_cost = 0,
    artist_levy = 0,
    locale = 'no',
    privacy_accepted = false,
    newsletter_opt_in = false,
  } = body;

  if (!items || items.length === 0) {
    return NextResponse.json({ error: 'No items in cart' }, { status: 400 });
  }

  if (!customer_email || !customer_name || !customer_phone || !shipping_address) {
    return NextResponse.json({ error: 'Missing customer information' }, { status: 400 });
  }

  const stripe = getStripe();
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + shipping_cost + artist_levy - discount_amount;

  const lineItems = buildLineItems(items, shipping_cost, artist_levy, locale);
  const metadata = buildOrderMetadata({
    customer_email,
    customer_name,
    customer_phone,
    shipping_address,
    items,
    subtotal,
    discount_code,
    discount_amount,
    shipping_cost,
    artist_levy,
    total,
    privacy_accepted,
    newsletter_opt_in,
  });

  const origin = getCanonicalOrigin(request);
  const isEnglish = locale === 'en';
  const successUrl = `${origin}${isEnglish ? '/en/checkout/success' : '/no/kasse/bekreftelse'}?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}${isEnglish ? '/en/checkout' : '/no/kasse'}?canceled=true`;

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: lineItems,
    customer_email,
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    locale: locale === 'no' ? 'nb' : 'en',
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
    discounts: discount_amount > 0
      ? [{ coupon: await createStripeCoupon(stripe, discount_amount, discount_code) }]
      : undefined,
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
}

function buildLineItems(
  items: OrderItem[],
  shippingCost: number,
  artistLevy: number,
  locale: Locale,
): Stripe.Checkout.SessionCreateParams.LineItem[] {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'nok',
      product_data: {
        name: item.title,
        images: item.image_url ? [item.image_url] : undefined,
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  if (shippingCost > 0) {
    lineItems.push({
      price_data: {
        currency: 'nok',
        product_data: { name: locale === 'no' ? 'Frakt' : 'Shipping' },
        unit_amount: shippingCost,
      },
      quantity: 1,
    });
  }

  if (artistLevy > 0) {
    lineItems.push({
      price_data: {
        currency: 'nok',
        product_data: {
          name: locale === 'no' ? 'Kunsteravgift (5%)' : 'Artist Levy (5%)',
          description: locale === 'no'
            ? 'Lovpålagt avgift for kunst over 2 500 kr'
            : 'Legal fee for artwork over 2,500 kr',
        },
        unit_amount: artistLevy,
      },
      quantity: 1,
    });
  }

  return lineItems;
}

interface OrderMetadataInput {
  customer_email: string;
  customer_name: string;
  customer_phone: string;
  shipping_address: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  discount_code?: string;
  discount_amount: number;
  shipping_cost: number;
  artist_levy: number;
  total: number;
  privacy_accepted: boolean;
  newsletter_opt_in: boolean;
}

function buildOrderMetadata(input: OrderMetadataInput): Record<string, string> {
  return {
    customer_email: input.customer_email,
    customer_name: input.customer_name,
    customer_phone: input.customer_phone,
    shipping_address: JSON.stringify(input.shipping_address),
    items: JSON.stringify(input.items),
    subtotal: input.subtotal.toString(),
    discount_code: input.discount_code || '',
    discount_amount: input.discount_amount.toString(),
    shipping_cost: input.shipping_cost.toString(),
    artist_levy: input.artist_levy.toString(),
    total: input.total.toString(),
    privacy_accepted: input.privacy_accepted.toString(),
    newsletter_opt_in: input.newsletter_opt_in.toString(),
    checkout_token: generateCheckoutToken(),
  };
}

function getCanonicalOrigin(request: NextRequest): string {
  const origin = request.headers.get('origin')
    || request.headers.get('referer')?.split('/').slice(0, 3).join('/')
    || 'https://dotty.no';
  return origin.replace('://www.', '://');
}

async function createStripeCoupon(
  stripe: Stripe,
  amountOff: number,
  code?: string,
): Promise<string> {
  const coupon = await stripe.coupons.create({
    amount_off: amountOff,
    currency: 'nok',
    duration: 'once',
    name: code || 'Discount',
  });
  return coupon.id;
}
