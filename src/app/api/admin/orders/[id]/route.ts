import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { sendShippingNotification, sendDeliveryConfirmation } from '@/lib/email/send';
import type { Order } from '@/types';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = createAdminClient();

    // Get the current order to check status change
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    const previousStatus = currentOrder?.status;

    // Update the order
    const { data, error } = await supabase
      .from('orders')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const updatedOrder = data as Order;

    // Send emails based on status changes
    if (previousStatus !== updatedOrder.status) {
      if (updatedOrder.status === 'shipped') {
        // Send shipping notification to customer
        sendShippingNotification(updatedOrder).then((result) => {
          if (!result.success) {
            console.error('Failed to send shipping notification:', result.error);
          } else {
            console.log(`Shipping notification sent for order ${id}`);
          }
        }).catch((err) => {
          console.error('Shipping notification failed:', err);
        });
      } else if (updatedOrder.status === 'delivered') {
        // Send delivery confirmation to customer
        sendDeliveryConfirmation(updatedOrder).then((result) => {
          if (!result.success) {
            console.error('Failed to send delivery confirmation:', result.error);
          } else {
            console.log(`Delivery confirmation sent for order ${id}`);
          }
        }).catch((err) => {
          console.error('Delivery confirmation failed:', err);
        });
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
