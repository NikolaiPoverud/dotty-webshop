import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/rate-limit';
import { validateCheckoutToken, generateCheckoutToken } from '@/lib/checkout-token';
import { validateCheckoutRequest } from '@/lib/schemas/checkout';
import type { ShippingAddress, OrderItem, Locale } from '@/types';

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

  // ARCH-002: Zod schema validation of request body
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
    shipping_cost,
    locale,
    privacy_accepted,
    newsletter_opt_in,
  } = body;

  // ARCH-001: Server-side cart validation - fetch actual prices from database
  const cartValidationResult = await validateCartServerSide(items, discount_code);
  if (!cartValidationResult.valid) {
    return NextResponse.json({ error: cartValidationResult.error }, { status: 400 });
  }

  // Use server-validated prices and discount
  const validatedItems = cartValidationResult.items!;
  const validatedDiscountAmount = cartValidationResult.discountAmount ?? 0;

  const stripe = getStripe();
  const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  // Recalculate artist levy (5% on artwork over 2,500 kr)
  const calculatedArtistLevy = subtotal >= 250000 ? Math.floor(subtotal * 0.05) : 0;

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

interface CartValidationResult {
  valid: boolean;
  error?: string;
  items?: OrderItem[];
  discountAmount?: number;
}

/**
 * ARCH-001: Server-side cart validation
 * Validates prices against database and recalculates discount amounts
 */
async function validateCartServerSide(
  clientItems: OrderItem[],
  discountCode?: string,
): Promise<CartValidationResult> {
  const supabase = createAdminClient();
  const productIds = clientItems.map(item => item.product_id);

  // Fetch actual product data from database
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, title, price, is_available, stock_quantity, product_type, image_url')
    .in('id', productIds)
    .is('deleted_at', null);

  if (productsError) {
    console.error('Failed to fetch products for validation:', productsError);
    return { valid: false, error: 'Failed to validate cart items' };
  }

  if (!products || products.length !== productIds.length) {
    return { valid: false, error: 'One or more products not found' };
  }

  // Create a map for easy lookup
  const productMap = new Map(products.map(p => [p.id, p]));

  // Validate each item and build validated items list
  const validatedItems: OrderItem[] = [];

  for (const clientItem of clientItems) {
    const dbProduct = productMap.get(clientItem.product_id);

    if (!dbProduct) {
      return { valid: false, error: `Product ${clientItem.product_id} not found` };
    }

    if (!dbProduct.is_available) {
      return { valid: false, error: `${dbProduct.title} is no longer available` };
    }

    // Check stock for prints
    if (dbProduct.product_type === 'print' && dbProduct.stock_quantity !== null) {
      if (dbProduct.stock_quantity < clientItem.quantity) {
        return {
          valid: false,
          error: `Not enough stock for ${dbProduct.title}. Available: ${dbProduct.stock_quantity}`,
        };
      }
    }

    // Build validated item with server prices
    validatedItems.push({
      product_id: dbProduct.id,
      title: dbProduct.title,
      price: dbProduct.price, // Use database price, not client price
      quantity: clientItem.quantity,
      image_url: dbProduct.image_url,
    });
  }

  // Validate and calculate discount if provided
  let discountAmount = 0;

  if (discountCode) {
    const normalizedCode = discountCode.toUpperCase();

    const { data: discount, error: discountError } = await supabase
      .from('discount_codes')
      .select('*')
      .eq('code', normalizedCode)
      .eq('is_active', true)
      .single();

    if (discountError || !discount) {
      return { valid: false, error: 'Invalid discount code' };
    }

    // Check if code has remaining uses
    if (discount.uses_remaining !== null && discount.uses_remaining <= 0) {
      return { valid: false, error: 'Discount code has been used up' };
    }

    // Check expiration
    if (discount.expires_at && new Date(discount.expires_at) < new Date()) {
      return { valid: false, error: 'Discount code has expired' };
    }

    // Calculate discount amount
    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    if (discount.discount_percent) {
      discountAmount = Math.floor(subtotal * (discount.discount_percent / 100));
    } else if (discount.discount_amount) {
      discountAmount = discount.discount_amount;
    }
  }

  return {
    valid: true,
    items: validatedItems,
    discountAmount,
  };
}
