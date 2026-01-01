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
  const shippingCost = 14900; // 149 kr in øre - adjust as needed

  return (
    <EmailLayout preview={`Ordrebekreftelse #${order.id}`}>
      <EmailHeader subtitle="Ordrebekreftelse" />

      {/* Success Message */}
      <Section className="text-center">
        <Text className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-2xl">
          ✓
        </Text>
        <Heading className="m-0 text-2xl font-bold text-foreground">
          Takk for din bestilling!
        </Heading>
        <Text className="mt-2 text-muted">
          Ordrenummer: #{order.id}
        </Text>
        <Text className="m-0 text-sm text-muted">
          Dato: {formatDate(order.created_at)}
        </Text>
      </Section>

      <Hr className="my-8 border-border" />

      {/* Order Items */}
      <Section>
        <Heading as="h2" className="mb-4 text-lg font-semibold text-foreground">
          Din ordre
        </Heading>
        <OrderItems items={order.items} />
      </Section>

      {/* Price Breakdown */}
      <Section className="mt-6 rounded-lg bg-card p-4">
        <div className="flex justify-between">
          <Text className="m-0 text-muted">Delsum</Text>
          <Text className="m-0 text-foreground">{formatPrice(order.subtotal)}</Text>
        </div>
        {order.discount_amount > 0 && (
          <div className="flex justify-between">
            <Text className="m-0 text-muted">Rabatt ({order.discount_code})</Text>
            <Text className="m-0 text-success">-{formatPrice(order.discount_amount)}</Text>
          </div>
        )}
        <div className="flex justify-between">
          <Text className="m-0 text-muted">Frakt</Text>
          <Text className="m-0 text-foreground">{formatPrice(shippingCost)}</Text>
        </div>
        <Hr className="my-3 border-border" />
        <div className="flex justify-between">
          <Text className="m-0 font-semibold text-foreground">Totalt</Text>
          <Text className="m-0 font-semibold text-foreground">
            {formatPrice(order.total + shippingCost)}
          </Text>
        </div>
      </Section>

      {/* Shipping Address */}
      <Section className="mt-6">
        <Heading as="h2" className="mb-4 text-lg font-semibold text-foreground">
          Leveringsadresse
        </Heading>
        <Section className="rounded-lg bg-card p-4">
          <Text className="m-0 text-foreground">{order.customer_name}</Text>
          <Text className="m-0 text-muted">{order.shipping_address.line1}</Text>
          {order.shipping_address.line2 && (
            <Text className="m-0 text-muted">{order.shipping_address.line2}</Text>
          )}
          <Text className="m-0 text-muted">
            {order.shipping_address.postal_code} {order.shipping_address.city}
          </Text>
          <Text className="m-0 text-muted">{order.shipping_address.country}</Text>
        </Section>
      </Section>

      <EmailFooter transactionText="Du mottar denne e-posten fordi du har lagt inn en bestilling hos Dotty." />
    </EmailLayout>
  );
}

export default OrderConfirmationEmail;
