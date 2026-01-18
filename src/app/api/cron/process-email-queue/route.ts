import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  getPendingEmails,
  markEmailSent,
  markEmailFailed,
  cleanupEmailQueue,
  type QueuedEmail,
} from '@/lib/services/email-queue-service';
import {
  sendOrderConfirmation,
  sendNewOrderAlert,
  sendShippingNotification,
  sendDeliveryConfirmation,
} from '@/lib/email/send';
import type { Order, OrderWithItems, OrderItem } from '@/types';

/**
 * ARCH-010: Cron endpoint for processing the email queue
 *
 * Runs every minute to process pending emails.
 * Configured in vercel.json.
 */

// Load order with items for email templates
async function loadOrderWithItems(orderId: string): Promise<OrderWithItems | null> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (orderError || !order) {
    console.error('[EmailQueue] Failed to load order:', orderError);
    return null;
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_id, title, price, quantity, image_url')
    .eq('order_id', orderId);

  return {
    ...order,
    items: (items ?? []) as OrderItem[],
  } as OrderWithItems;
}

async function processEmail(email: QueuedEmail): Promise<boolean> {
  try {
    let result: { success: boolean; error?: string };

    switch (email.email_type) {
      case 'order_confirmation': {
        if (!email.entity_id) throw new Error('Missing order ID');
        const order = await loadOrderWithItems(email.entity_id);
        if (!order) throw new Error('Order not found');
        result = await sendOrderConfirmation(order);
        break;
      }

      case 'new_order_alert': {
        if (!email.entity_id) throw new Error('Missing order ID');
        const order = await loadOrderWithItems(email.entity_id);
        if (!order) throw new Error('Order not found');
        result = await sendNewOrderAlert(order);
        break;
      }

      case 'shipping_notification': {
        if (!email.entity_id) throw new Error('Missing order ID');
        const order = await loadOrderWithItems(email.entity_id);
        if (!order) throw new Error('Order not found');
        result = await sendShippingNotification(order);
        break;
      }

      case 'delivery_confirmation': {
        if (!email.entity_id) throw new Error('Missing order ID');
        const supabase = createAdminClient();
        const { data: order, error } = await supabase
          .from('orders')
          .select('*')
          .eq('id', email.entity_id)
          .single();
        if (error || !order) throw new Error('Order not found');
        result = await sendDeliveryConfirmation(order as Order);
        break;
      }

      default:
        throw new Error(`Unknown email type: ${email.email_type}`);
    }

    if (result.success) {
      await markEmailSent(email.id);
      return true;
    } else {
      await markEmailFailed(email.id, result.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await markEmailFailed(email.id, message);
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // SEC-017: Verify cron request is authenticated
  const { verifyCronAuth } = await import('@/lib/cron-auth');
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

  try {
    const startTime = Date.now();
    let sent = 0;
    let failed = 0;

    // Process emails in batches
    const emails = await getPendingEmails(10);

    for (const email of emails) {
      const success = await processEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

    // Cleanup old processed emails (keep 30 days)
    const cleaned = await cleanupEmailQueue(30);

    const duration = Date.now() - startTime;

    console.log('[EmailQueue] Processing complete:', { sent, failed, cleaned, duration });

    return NextResponse.json({
      success: true,
      processed: emails.length,
      sent,
      failed,
      cleaned,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[EmailQueue] Processing error:', error);
    return NextResponse.json({ error: 'Queue processing failed' }, { status: 500 });
  }
}
