import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendOrderEmails } from '@/lib/email/send';
import type { Order } from '@/types';

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(key);
}

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

    // Create order in database
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

    console.log('Order created successfully:', order.id);

    // Send confirmation emails (customer + artist)
    try {
      const emailResults = await sendOrderEmails(order as Order);
      if (!emailResults.confirmation.success) {
        console.error('Customer email failed:', emailResults.confirmation.error);
      }
      if (!emailResults.alert.success) {
        console.error('Artist notification failed:', emailResults.alert.error);
      }
    } catch (emailError) {
      // Don't fail the webhook if emails fail
      console.error('Email sending error:', emailError);
    }

    // Update product availability/stock
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('product_type, stock_quantity, title')
        .eq('id', item.product_id)
        .single();

      if (product) {
        if (product.product_type === 'original') {
          // Mark original as sold (one-of-a-kind)
          const { error: updateError } = await supabase
            .from('products')
            .update({ is_available: false })
            .eq('id', item.product_id);

          if (updateError) {
            console.error(`Failed to mark original as sold: ${product.title}`, updateError);
          } else {
            console.log(`Original artwork sold: "${product.title}" - marked as unavailable`);
          }
        } else if (product.product_type === 'print') {
          // Decrease print stock
          const currentStock = product.stock_quantity ?? 0;
          const newQuantity = Math.max(0, currentStock - item.quantity);

          const { error: updateError } = await supabase
            .from('products')
            .update({
              stock_quantity: newQuantity,
              is_available: newQuantity > 0,
            })
            .eq('id', item.product_id);

          if (updateError) {
            console.error(`Failed to update print stock: ${product.title}`, updateError);
          } else {
            console.log(`Print stock updated: "${product.title}" - ${currentStock} → ${newQuantity} (ordered: ${item.quantity})`);
          }
        }
      }
    }

  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}
