import { NextRequest, NextResponse } from 'next/server';
import { capturePayment, cancelPayment, refundPayment } from '@/lib/vipps';
import { createAdminClient } from '@/lib/supabase/admin';
import { verifyAdminAuth } from '@/lib/auth/admin-guard';

interface CaptureRequest {
  reference: string;
  action: 'capture' | 'cancel' | 'refund';
  amount?: number; // For partial capture/refund (in ore)
}

/**
 * Admin endpoint to capture, cancel, or refund Vipps payments
 * Reserve capture: Call this when shipping the order
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify admin authentication using consistent auth method
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {

    const body = await request.json() as CaptureRequest;
    const { reference, action, amount } = body;

    if (!reference || !action) {
      return NextResponse.json({ error: 'Missing reference or action' }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Get order from database
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', reference)
      .single();

    if (orderError || !order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (order.payment_provider !== 'vipps') {
      return NextResponse.json({ error: 'Not a Vipps order' }, { status: 400 });
    }

    const captureAmount = amount || order.total;

    switch (action) {
      case 'capture': {
        if (order.payment_status !== 'authorized') {
          return NextResponse.json(
            { error: 'Payment must be authorized before capture' },
            { status: 400 },
          );
        }

        const payment = await capturePayment(reference, captureAmount);

        await supabase
          .from('orders')
          .update({
            payment_status: 'captured',
            vipps_state: payment.state,
            captured_amount: payment.aggregate?.capturedAmount?.value,
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reference);

        return NextResponse.json({
          success: true,
          state: payment.state,
          capturedAmount: payment.aggregate?.capturedAmount?.value,
        });
      }

      case 'cancel': {
        if (order.payment_status !== 'authorized') {
          return NextResponse.json(
            { error: 'Can only cancel authorized payments' },
            { status: 400 },
          );
        }

        const payment = await cancelPayment(reference);

        await supabase
          .from('orders')
          .update({
            payment_status: 'cancelled',
            vipps_state: payment.state,
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reference);

        return NextResponse.json({
          success: true,
          state: payment.state,
        });
      }

      case 'refund': {
        if (order.payment_status !== 'captured') {
          return NextResponse.json(
            { error: 'Can only refund captured payments' },
            { status: 400 },
          );
        }

        const refundAmount = amount || order.captured_amount || order.total;
        const payment = await refundPayment(reference, refundAmount);

        await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
            vipps_state: payment.state,
            refunded_amount: payment.aggregate?.refundedAmount?.value,
            status: 'refunded',
            updated_at: new Date().toISOString(),
          })
          .eq('id', reference);

        return NextResponse.json({
          success: true,
          state: payment.state,
          refundedAmount: payment.aggregate?.refundedAmount?.value,
        });
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

  } catch (error) {
    // SEC-015: Log full error server-side but return generic message to client
    console.error('Vipps capture error:', error);
    return NextResponse.json(
      { error: 'Failed to process payment action. Please try again.' },
      { status: 500 },
    );
  }
}
