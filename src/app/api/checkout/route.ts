import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateCheckoutToken, generateCheckoutToken } from '@/lib/checkout-token';
import { validateCheckoutRequest } from '@/lib/schemas/checkout';
import { validateCartServerSide, calculateArtistLevy } from '@/lib/checkout-validation';
import type { ShippingAddress, OrderItem, Locale } from '@/types';

const VALID_SHIPPING_COST = 9900; // 99 NOK in ore - flat shipping fee

const RATE_LIMIT_CONFIG = { maxRequests: 5, windowMs: 60000 };

export async function POST(request: NextRequest): Promise<NextResponse> {
  const clientIp = getClientIp(request);
  const rateLimitResult = await checkRateLimit(`checkout:${clientIp}`, RATE_LIMIT_CONFIG);

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many checkout attempts. Please wait a minute and try again.' },
      { status: 429, headers: getRateLimitHeaders(rateLimitResult) },
    );
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const validationResult = validateCheckoutRequest(rawBody);
  if (!validationResult.success) {
    console.error('Checkout validation failed:', validationResult.error, validationResult.details);
    return NextResponse.json(
      { error: validationResult.error },
      { status: 400 },
    );
  }

  const body = validationResult.data;

  if (body.checkout_token) {
    const tokenValidation = validateCheckoutToken(body.checkout_token);
    if (!tokenValidation.valid) {
      return NextResponse.json(
        { error: tokenValidation.error || 'Invalid checkout session' },
        { status: 403 },
      );
    }
  } else if (process.env.NODE_ENV === 'production') {
    // In production, require the token
    return NextResponse.json(
      { error: 'Checkout session expired. Please refresh the page and try again.' },
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
    shipping_cost,
    locale,
    privacy_accepted,
    newsletter_opt_in,
  } = body;

  const cartValidationResult = await validateCartServerSide(items, discount_code);
  if (!cartValidationResult.valid) {
    return NextResponse.json({ error: cartValidationResult.error }, { status: 400 });
  }

  // Use server-validated prices and discount
  const validatedItems = cartValidationResult.items!;
  const validatedDiscountAmount = cartValidationResult.discountAmount ?? 0;

  // Server-validate shipping cost against known rates
  let hasFreeShipping = false;
  if (discount_code) {
    const supabaseAdmin = createAdminClient();
    const { data: discountData } = await supabaseAdmin
      .from('discount_codes')
      .select('free_shipping')
      .eq('code', discount_code.toUpperCase())
      .eq('is_active', true)
      .single();
    hasFreeShipping = discountData?.free_shipping === true;
  }
  const expectedShippingCost = hasFreeShipping ? 0 : VALID_SHIPPING_COST;
  if (shipping_cost !== expectedShippingCost) {
    return NextResponse.json(
      { error: 'Invalid shipping cost. Please refresh the page and try again.' },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Recalculate artist levy using shared function
  const calculatedArtistLevy = calculateArtistLevy(subtotal);

  // Use server-calculated values
  const total = subtotal + shipping_cost + calculatedArtistLevy - validatedDiscountAmount;

  const lineItems = buildLineItems(validatedItems, shipping_cost, calculatedArtistLevy, locale);
  const metadata = buildOrderMetadata({
    customer_email,
    customer_name,
    customer_phone,
    shipping_address,
    items: validatedItems,
    subtotal,
    discount_code,
    discount_amount: validatedDiscountAmount,
    shipping_cost,
    artist_levy: calculatedArtistLevy,
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
    discounts: validatedDiscountAmount > 0
      ? [{ coupon: await createStripeCoupon(stripe, validatedDiscountAmount, discount_code) }]
      : undefined,
  });

  return NextResponse.json({ sessionId: session.id, url: session.url });
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

// Cart validation moved to @/lib/checkout-validation
