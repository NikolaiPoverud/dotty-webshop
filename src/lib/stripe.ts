import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;

/**
 * Get or create the Stripe client instance.
 * Throws if STRIPE_SECRET_KEY is not configured.
 */
export function getStripe(): Stripe {
  if (stripeInstance) return stripeInstance;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }

  stripeInstance = new Stripe(key, {
    apiVersion: '2025-12-15.clover',
    typescript: true,
  });

  return stripeInstance;
}

interface CheckoutItem {
  name: string;
  price: number; // in øre
  quantity: number;
  image?: string;
}

interface CheckoutSessionParams {
  items: CheckoutItem[];
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  metadata?: Record<string, string>;
}

const ALLOWED_SHIPPING_COUNTRIES = ['NO', 'SE', 'DK', 'FI', 'DE', 'GB', 'US'] as const;

export async function createCheckoutSession({
  items,
  successUrl,
  cancelUrl,
  customerEmail,
  metadata,
}: CheckoutSessionParams): Promise<Stripe.Checkout.Session> {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'nok',
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : undefined,
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  return getStripe().checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata,
    shipping_address_collection: {
      allowed_countries: [...ALLOWED_SHIPPING_COUNTRIES],
    },
    phone_number_collection: {
      enabled: true,
    },
  });
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
  }

  return getStripe().webhooks.constructEvent(body, signature, secret);
}
