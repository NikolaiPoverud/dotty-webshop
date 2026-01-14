import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import { constructWebhookEvent } from '@/lib/stripe';
import { validateCheckoutToken } from '@/lib/checkout-token';
import type { Order, ShippingAddress } from '@/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature provided' }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
      break;

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      console.error('Payment failed:', paymentIntent.id, paymentIntent.last_payment_error?.message);
      break;
    }

    default:
      console.log('Unhandled event type:', event.type);
  }

  return NextResponse.json({ received: true });
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session): Promise<void> {
  const metadata = session.metadata;
  if (!metadata) {
    console.error('No metadata in session');
    return;
  }

  // SEC-003: Validate checkout token to verify session originated from this app
  const tokenValidation = validateCheckoutToken(metadata.checkout_token);
  if (!tokenValidation.valid) {
    console.error('Invalid checkout token for session:', session.id, tokenValidation.error);
    return;
  }

  const supabase = createAdminClient();
  const items = parseJSON<OrderItemInput[]>(metadata.items, []);
  const shippingAddress = parseJSON<ShippingAddress>(metadata.shipping_address, {} as ShippingAddress);

  // DB-007: Use atomic transaction function for order processing
  const { data: result, error: rpcError } = await supabase.rpc('process_order', {
    p_customer_email: metadata.customer_email,
    p_customer_name: metadata.customer_name,
    p_customer_phone: metadata.customer_phone,
    p_shipping_address: shippingAddress,
    p_items: items,
    p_subtotal: parseInt(metadata.subtotal),
    p_discount_code: metadata.discount_code || null,
    p_discount_amount: parseInt(metadata.discount_amount) || 0,
    p_shipping_cost: parseInt(metadata.shipping_cost) || 0,
    p_artist_levy: parseInt(metadata.artist_levy) || 0,
    p_total: parseInt(metadata.total),
    p_payment_session_id: session.id,
  });

  if (rpcError) {
    console.warn('Atomic order processing unavailable, using fallback:', rpcError.message);
    await handleCheckoutCompletedFallback(supabase, session, metadata, items, shippingAddress);
    return;
  }

  if (!result?.success) {
    console.error('Order processing failed:', result?.error);
    return;
  }

  if (result.is_duplicate) {
    console.log(`Order already exists for session ${session.id}, skipping duplicate processing`);
    return;
  }

  console.log('Order created successfully (atomic):', result.order_id);
  logInventoryUpdates(result);

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('id', result.order_id)
    .single();

  if (order) {
    await sendOrderEmailsSafe(order as Order);
  }
}

interface OrderItemInput {
  product_id: string;
  quantity: number;
}

type SupabaseClient = ReturnType<typeof createAdminClient>;

async function handleCheckoutCompletedFallback(
  supabase: SupabaseClient,
  session: Stripe.Checkout.Session,
  metadata: Stripe.Metadata,
  items: OrderItemInput[],
  shippingAddress: ShippingAddress,
): Promise<void> {
  // SEC-004: Idempotency check
  const { data: existingOrder } = await supabase
    .from('orders')
    .select('id')
    .eq('payment_session_id', session.id)
    .maybeSingle();

  if (existingOrder) {
    console.log(`Order already exists for session ${session.id}, skipping`);
    return;
  }

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_email: metadata.customer_email,
      customer_name: metadata.customer_name,
      customer_phone: metadata.customer_phone,
      shipping_address: shippingAddress,
      items,
      subtotal: parseInt(metadata.subtotal),
      discount_code: metadata.discount_code || null,
      discount_amount: parseInt(metadata.discount_amount) || 0,
      shipping_cost: parseInt(metadata.shipping_cost) || 0,
      artist_levy: parseInt(metadata.artist_levy) || 0,
      total: parseInt(metadata.total),
      payment_provider: 'stripe',
      payment_session_id: session.id,
      status: 'paid',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create order:', error);
    return;
  }

  console.log('Order created (fallback):', order.id);

  if (metadata.discount_code) {
    await decrementDiscountCode(supabase, metadata.discount_code);
  }

  await updateInventory(supabase, items);
  await sendOrderEmailsSafe(order as Order);
}

async function decrementDiscountCode(supabase: SupabaseClient, code: string): Promise<void> {
  const normalizedCode = code.toUpperCase();

  const { data: discountData } = await supabase
    .from('discount_codes')
    .select('uses_remaining')
    .eq('code', normalizedCode)
    .single();

  if (!discountData?.uses_remaining || discountData.uses_remaining <= 0) {
    return;
  }

  const { error } = await supabase
    .from('discount_codes')
    .update({ uses_remaining: Math.max(0, discountData.uses_remaining - 1) })
    .eq('code', normalizedCode);

  if (error) {
    console.warn(`Failed to decrement discount code ${normalizedCode}:`, error.message);
  }
}

async function updateInventory(supabase: SupabaseClient, items: OrderItemInput[]): Promise<void> {
  for (const item of items) {
    const { data: stockResult, error: stockError } = await supabase.rpc('decrement_product_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });

    if (stockError) {
      console.error(`Failed to decrement stock for product ${item.product_id}:`, stockError.message);
      continue;
    }

    if (!stockResult || stockResult.length === 0) {
      console.warn(`No result from decrement_product_stock for product ${item.product_id}`);
      continue;
    }

    const result = stockResult[0];
    if (result.success) {
      console.log(`Stock updated for product ${item.product_id}: type=${result.product_type}, new_stock=${result.new_stock}`);
    } else {
      console.error(`Stock decrement failed for product ${item.product_id}: ${result.error_message}`);
    }
  }
}

async function sendOrderEmailsSafe(order: Order): Promise<void> {
  try {
    const emailResults = await sendOrderEmails(order);
    if (!emailResults.confirmation.success) {
      console.error('Customer email failed:', emailResults.confirmation.error);
    }
    if (!emailResults.alert.success) {
      console.error('Artist notification failed:', emailResults.alert.error);
    }
  } catch (error) {
    console.error('Email sending error:', error);
  }
}

interface ProcessOrderResult {
  success: boolean;
  error?: string;
  is_duplicate?: boolean;
  order_id?: string;
  errors?: string[];
  items_processed?: Array<{
    product_id: string;
    product_type: string;
    new_stock?: number;
  }>;
}

function logInventoryUpdates(result: ProcessOrderResult): void {
  if (result.errors && result.errors.length > 0) {
    console.warn('Some inventory updates had issues:', result.errors);
  }

  if (!result.items_processed) return;

  for (const item of result.items_processed) {
    if (item.product_type === 'original') {
      console.log(`Original artwork sold: product ${item.product_id} - marked as unavailable`);
    } else {
      console.log(`Print stock updated: product ${item.product_id} - new stock: ${item.new_stock}`);
    }
  }
}

function parseJSON<T>(json: string | undefined, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}
