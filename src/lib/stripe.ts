import Stripe from 'stripe';

// Server-side Stripe client
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Create a checkout session
export async function createCheckoutSession({
  items,
  customerEmail,
  successUrl,
  cancelUrl,
  metadata,
}: {
  items: Array<{
    name: string;
    price: number; // in øre
    quantity: number;
    image?: string;
  }>;
  customerEmail?: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
    price_data: {
      currency: 'nok',
      product_data: {
        name: item.name,
        images: item.image ? [item.image] : undefined,
      },
      unit_amount: item.price, // Already in øre
    },
    quantity: item.quantity,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer_email: customerEmail,
    metadata,
    shipping_address_collection: {
      allowed_countries: ['NO', 'SE', 'DK', 'FI', 'DE', 'GB', 'US'],
    },
    phone_number_collection: {
      enabled: true,
    },
  });

  return session;
}

// Verify webhook signature
export function constructWebhookEvent(body: string, signature: string) {
  return stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET!
  );
}
