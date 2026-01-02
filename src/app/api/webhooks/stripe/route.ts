import { NextRequest, NextResponse } from 'next/server';
import type Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import { getStripe } from '@/lib/stripe';
import type { Order } from '@/types';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    );
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature provided' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

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

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata;

  if (!metadata) {
    console.error('No metadata in session');
    return;
  }

  try {
    const supabase = createAdminClient();

    // Parse stored data
    const items = JSON.parse(metadata.items || '[]');
    const shippingAddress = JSON.parse(metadata.shipping_address || '{}');

    // DB-007: Use atomic transaction function for order processing
    // This wraps order creation, discount decrement, and inventory update in a single transaction
    const { data: result, error: rpcError } = await supabase.rpc('process_order', {
      p_customer_email: metadata.customer_email,
      p_customer_name: metadata.customer_name,
      p_customer_phone: metadata.customer_phone,
      p_shipping_address: shippingAddress,
      p_items: items,
      p_subtotal: parseInt(metadata.subtotal),
      p_discount_code: metadata.discount_code || null,
      p_discount_amount: parseInt(metadata.discount_amount) || 0,
      p_total: parseInt(metadata.total),
      p_payment_session_id: session.id,
    });

    // Check for RPC errors or function not existing
    if (rpcError) {
      console.warn('Atomic order processing unavailable, using fallback:', rpcError.message);
      await handleCheckoutCompletedFallback(supabase, session, metadata, items, shippingAddress);
      return;
    }

    // Process result
    if (!result?.success) {
      console.error('Order processing failed:', result?.error);
      return;
    }

    if (result.is_duplicate) {
      console.log(`Order already exists for session ${session.id}, skipping duplicate processing`);
      return;
    }

    console.log('Order created successfully (atomic):', result.order_id);

    // Log any inventory errors (non-fatal)
    if (result.errors && result.errors.length > 0) {
      console.warn('Some inventory updates had issues:', result.errors);
    }

    // Log successful inventory updates
    if (result.items_processed) {
      for (const item of result.items_processed) {
        if (item.product_type === 'original') {
          console.log(`Original artwork sold: product ${item.product_id} - marked as unavailable`);
        } else {
          console.log(`Print stock updated: product ${item.product_id} - new stock: ${item.new_stock}`);
        }
      }
    }

    // Fetch the order for email sending
    const { data: order } = await supabase
      .from('orders')
      .select('*')
      .eq('id', result.order_id)
      .single();

    if (order) {
      // Send confirmation emails (outside transaction - non-critical)
      try {
        const emailResults = await sendOrderEmails(order as Order);
        if (!emailResults.confirmation.success) {
          console.error('Customer email failed:', emailResults.confirmation.error);
        }
        if (!emailResults.alert.success) {
          console.error('Artist notification failed:', emailResults.alert.error);
        }
      } catch (emailError) {
        console.error('Email sending error:', emailError);
      }
    }

  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

// Fallback for when the atomic RPC function is not available
async function handleCheckoutCompletedFallback(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session,
  metadata: Stripe.Metadata,
  items: Array<{ product_id: string; quantity: number }>,
  shippingAddress: Record<string, unknown>
) {
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

  // Create order
  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      customer_email: metadata.customer_email,
      customer_name: metadata.customer_name,
      customer_phone: metadata.customer_phone,
      shipping_address: shippingAddress,
      items: items,
      subtotal: parseInt(metadata.subtotal),
      discount_code: metadata.discount_code || null,
      discount_amount: parseInt(metadata.discount_amount) || 0,
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

  // Decrement discount code uses
  if (metadata.discount_code) {
    const normalizedCode = metadata.discount_code.toUpperCase();

    // First get current uses_remaining
    const { data: discountData } = await supabase
      .from('discount_codes')
      .select('uses_remaining')
      .eq('code', normalizedCode)
      .single();

    if (discountData && discountData.uses_remaining !== null && discountData.uses_remaining > 0) {
      const { error: updateError } = await supabase
        .from('discount_codes')
        .update({ uses_remaining: Math.max(0, discountData.uses_remaining - 1) })
        .eq('code', normalizedCode);

      if (updateError) {
        console.warn(`Failed to decrement discount code ${normalizedCode}:`, updateError.message);
      }
    }
  }

  // Update inventory with proper error handling
  for (const item of items) {
    const { data: stockResult, error: stockError } = await supabase.rpc('decrement_product_stock', {
      p_product_id: item.product_id,
      p_quantity: item.quantity,
    });

    if (stockError) {
      console.error(`Failed to decrement stock for product ${item.product_id}:`, stockError.message);
    } else if (stockResult && stockResult.length > 0) {
      const result = stockResult[0];
      if (result.success) {
        console.log(`Stock updated for product ${item.product_id}: type=${result.product_type}, new_stock=${result.new_stock}`);
      } else {
        console.error(`Stock decrement failed for product ${item.product_id}: ${result.error_message}`);
      }
    } else {
      console.warn(`No result from decrement_product_stock for product ${item.product_id}`);
    }
  }

  // Send emails
  try {
    await sendOrderEmails(order as Order);
  } catch (emailError) {
    console.error('Email error:', emailError);
  }
}
