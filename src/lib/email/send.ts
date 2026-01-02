import { getResend, emailConfig } from './resend';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { NewOrderAlertEmail } from '@/emails/new-order-alert';
import { ShippingNotificationEmail } from '@/emails/shipping-notification';
import { DeliveryConfirmationEmail } from '@/emails/delivery-confirmation';
import type { Order } from '@/types';

function formatPrice(priceInOre: number): string {
  return `${(priceInOre / 100).toLocaleString('no-NO')} kr`;
}

/**
 * Send order confirmation email to customer
 */
export async function sendOrderConfirmation(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: emailConfig.from,
      to: order.customer_email,
      subject: `Ordrebekreftelse ${order.order_number} – Dotty.`,
      react: OrderConfirmationEmail({ order }),
    });

    if (error) {
      console.error('Failed to send order confirmation:', error);
      return { success: false, error: error.message };
    }

    console.log(`Order confirmation sent to ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send order confirmation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send new order alert to artist
 */
export async function sendNewOrderAlert(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: emailConfig.from,
      to: emailConfig.artistEmail,
      subject: `Ny ordre ${order.order_number} – ${formatPrice(order.total)}`,
      react: NewOrderAlertEmail({ order }),
    });

    if (error) {
      console.error('Failed to send new order alert:', error);
      return { success: false, error: error.message };
    }

    console.log(`New order alert sent to ${emailConfig.artistEmail}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send new order alert:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send shipping notification to customer
 */
export async function sendShippingNotification(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: emailConfig.from,
      to: order.customer_email,
      subject: `Pakken din er på vei! – Ordre ${order.order_number}`,
      react: ShippingNotificationEmail({ order }),
    });

    if (error) {
      console.error('Failed to send shipping notification:', error);
      return { success: false, error: error.message };
    }

    console.log(`Shipping notification sent to ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send shipping notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send delivery confirmation to customer
 */
export async function sendDeliveryConfirmation(order: Order): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await getResend().emails.send({
      from: emailConfig.from,
      to: order.customer_email,
      subject: `Pakken din er levert! – Ordre ${order.order_number}`,
      react: DeliveryConfirmationEmail({ order }),
    });

    if (error) {
      console.error('Failed to send delivery confirmation:', error);
      return { success: false, error: error.message };
    }

    console.log(`Delivery confirmation sent to ${order.customer_email}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to send delivery confirmation:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Send both order confirmation to customer and alert to artist
 * Used when a new order is created
 */
export async function sendOrderEmails(order: Order): Promise<{
  confirmation: { success: boolean; error?: string };
  alert: { success: boolean; error?: string };
}> {
  const [confirmation, alert] = await Promise.all([
    sendOrderConfirmation(order),
    sendNewOrderAlert(order),
  ]);

  return { confirmation, alert };
}
