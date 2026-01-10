import type { ReactElement } from 'react';

import { emailConfig, getResend } from './resend.js';
import { DeliveryConfirmationEmail } from '@/emails/delivery-confirmation';
import { NewOrderAlertEmail } from '@/emails/new-order-alert';
import { OrderConfirmationEmail } from '@/emails/order-confirmation';
import { ShippingNotificationEmail } from '@/emails/shipping-notification';
import type { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

type EmailResult = { success: boolean; error?: string };

interface EmailOptions {
  to: string;
  subject: string;
  react: ReactElement;
  logMessage: string;
}

async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    const { error } = await getResend().emails.send({
      from: emailConfig.from,
      to: options.to,
      subject: options.subject,
      react: options.react,
    });

    if (error) {
      console.error(`Failed to send email: ${options.logMessage}`, error);
      return { success: false, error: error.message };
    }

    console.log(options.logMessage);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error(`Failed to send email: ${options.logMessage}`, err);
    return { success: false, error: message };
  }
}

export function sendOrderConfirmation(order: Order): Promise<EmailResult> {
  return sendEmail({
    to: order.customer_email,
    subject: `Ordrebekreftelse ${order.order_number} – Dotty.`,
    react: OrderConfirmationEmail({ order }),
    logMessage: `Order confirmation sent to ${order.customer_email}`,
  });
}

export function sendNewOrderAlert(order: Order): Promise<EmailResult> {
  return sendEmail({
    to: emailConfig.artistEmail,
    subject: `Ny ordre ${order.order_number} – ${formatPrice(order.total)}`,
    react: NewOrderAlertEmail({ order }),
    logMessage: `New order alert sent to ${emailConfig.artistEmail}`,
  });
}

export function sendShippingNotification(order: Order): Promise<EmailResult> {
  return sendEmail({
    to: order.customer_email,
    subject: `Pakken din er på vei! – Ordre ${order.order_number}`,
    react: ShippingNotificationEmail({ order }),
    logMessage: `Shipping notification sent to ${order.customer_email}`,
  });
}

export function sendDeliveryConfirmation(order: Order): Promise<EmailResult> {
  return sendEmail({
    to: order.customer_email,
    subject: `Pakken din er levert! – Ordre ${order.order_number}`,
    react: DeliveryConfirmationEmail({ order }),
    logMessage: `Delivery confirmation sent to ${order.customer_email}`,
  });
}

export async function sendOrderEmails(order: Order): Promise<{
  confirmation: EmailResult;
  alert: EmailResult;
}> {
  const [confirmation, alert] = await Promise.all([
    sendOrderConfirmation(order),
    sendNewOrderAlert(order),
  ]);

  return { confirmation, alert };
}
