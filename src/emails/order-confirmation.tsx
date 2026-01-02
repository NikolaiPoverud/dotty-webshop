import { Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Order } from '@/types';
import { EmailLayout } from './components/layout';
import { EmailHeader } from './components/header';
import { EmailFooter } from './components/footer';
import { OrderItems } from './components/order-items';

interface OrderConfirmationEmailProps {
  order: Order;
}

function formatPrice(priceInOre: number): string {
  return `${(priceInOre / 100).toLocaleString('no-NO')} kr`;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function OrderConfirmationEmail({ order }: OrderConfirmationEmailProps) {
  // Calculate shipping from order if available
  const shippingCost = order.shipping_cost || 14900;

  return (
    <EmailLayout preview={`Ordrebekreftelse ${order.order_number}`}>
      <Section className="overflow-hidden rounded-2xl bg-card shadow-lg">
        <EmailHeader subtitle="Ordrebekreftelse" />

        {/* Success Message */}
        <Section className="px-8 pb-8 text-center">
          <Text className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl">
            ✓
          </Text>
          <Heading className="m-0 text-2xl font-bold text-foreground">
            Takk for din bestilling!
          </Heading>
          <Text className="mt-2 text-muted-foreground">
            Ordrenummer: <span className="font-mono font-bold text-primary">{order.order_number}</span>
          </Text>
          <Text className="m-0 text-sm text-muted-foreground">
            Dato: {formatDate(order.created_at)}
          </Text>
        </Section>

        <Hr className="mx-8 border-border" />

        {/* Order Items */}
        <Section className="px-8 py-6">
          <Heading as="h2" className="mb-4 text-base font-bold uppercase tracking-wider text-foreground">
            Din ordre
          </Heading>
          <OrderItems items={order.items} />
        </Section>

        {/* Price Breakdown */}
        <Section className="mx-8 mb-6 rounded-xl bg-muted p-4">
          <table width="100%" cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td>
                  <Text className="m-0 text-muted-foreground">Delsum</Text>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Text className="m-0 text-foreground">{formatPrice(order.subtotal)}</Text>
                </td>
              </tr>
              {order.discount_amount > 0 && (
                <tr>
                  <td>
                    <Text className="m-0 text-success">Rabatt ({order.discount_code})</Text>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Text className="m-0 text-success">-{formatPrice(order.discount_amount)}</Text>
                  </td>
                </tr>
              )}
              <tr>
                <td>
                  <Text className="m-0 text-muted-foreground">Frakt</Text>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Text className="m-0 text-foreground">{formatPrice(shippingCost)}</Text>
                </td>
              </tr>
            </tbody>
          </table>
          <Hr className="my-3 border-border" />
          <table width="100%" cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td>
                  <Text className="m-0 text-lg font-bold text-foreground">Totalt</Text>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <Text className="m-0 text-xl font-bold text-primary">
                    {formatPrice(order.total + shippingCost)}
                  </Text>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Shipping Address */}
        <Section className="px-8 pb-8">
          <Heading as="h2" className="mb-4 text-base font-bold uppercase tracking-wider text-foreground">
            Leveringsadresse
          </Heading>
          <Section className="rounded-xl border-l-4 border-primary bg-muted p-4">
            <Text className="m-0 font-semibold text-foreground">{order.customer_name}</Text>
            <Text className="m-0 text-muted-foreground">{order.shipping_address.line1}</Text>
            {order.shipping_address.line2 && (
              <Text className="m-0 text-muted-foreground">{order.shipping_address.line2}</Text>
            )}
            <Text className="m-0 text-muted-foreground">
              {order.shipping_address.postal_code} {order.shipping_address.city}
            </Text>
            <Text className="m-0 text-muted-foreground">{order.shipping_address.country}</Text>
          </Section>
        </Section>
      </Section>

      <EmailFooter transactionText="Du mottar denne e-posten fordi du har lagt inn en bestilling hos Dotty." />
    </EmailLayout>
  );
}

export default OrderConfirmationEmail;
