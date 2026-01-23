import { NextRequest, NextResponse } from 'next/server';

import { verifyCronAuth } from '@/lib/cron-auth';
import {
  sendDeliveryConfirmation,
  sendNewOrderAlert,
  sendOrderConfirmation,
  sendShippingNotification,
} from '@/lib/email/send';
import {
  cleanupEmailQueue,
  getPendingEmails,
  markEmailFailed,
  markEmailSent,
  type QueuedEmail,
} from '@/lib/services/email-queue-service';
import { createAdminClient } from '@/lib/supabase/admin';
import type { OrderItem, OrderWithItems } from '@/types';

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

type EmailSender = (order: OrderWithItems) => Promise<{ success: boolean; error?: string }>;

const EMAIL_HANDLERS: Record<string, EmailSender> = {
  order_confirmation: sendOrderConfirmation,
  new_order_alert: sendNewOrderAlert,
  shipping_notification: sendShippingNotification,
  delivery_confirmation: sendDeliveryConfirmation,
};

async function processEmail(email: QueuedEmail): Promise<boolean> {
  try {
    if (!email.entity_id) throw new Error('Missing order ID');

    const sender = EMAIL_HANDLERS[email.email_type];
    if (!sender) throw new Error(`Unknown email type: ${email.email_type}`);

    const order = await loadOrderWithItems(email.entity_id);
    if (!order) throw new Error('Order not found');

    const result = await sender(order);

    if (result.success) {
      await markEmailSent(email.id);
      return true;
    }

    await markEmailFailed(email.id, result.error || 'Unknown error');
    return false;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    await markEmailFailed(email.id, message);
    return false;
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = verifyCronAuth(request);
  if (!authResult.authorized) return authResult.response!;

  try {
    const startTime = Date.now();
    const emails = await getPendingEmails(10);

    let sent = 0;
    let failed = 0;

    for (const email of emails) {
      const success = await processEmail(email);
      if (success) {
        sent++;
      } else {
        failed++;
      }
    }

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
