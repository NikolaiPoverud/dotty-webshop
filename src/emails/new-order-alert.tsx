import { Heading, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Order } from '@/types';
import { EmailLayout } from './components/layout';
import { EmailHeader } from './components/header';
import { EmailFooter } from './components/footer';
import { OrderItems } from './components/order-items';
import { Button } from './components/button';
import { emailConfig } from '@/lib/email/resend';

interface NewOrderAlertEmailProps {
  order: Order;
}

function formatPrice(priceInOre: number): string {
  return `${(priceInOre / 100).toLocaleString('no-NO')} kr`;
}

function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('no-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NewOrderAlertEmail({ order }: NewOrderAlertEmailProps) {
  return (
    <EmailLayout preview={`Ny ordre #${order.id} - ${formatPrice(order.total)}`}>
      {/* Header with Alert Badge */}
      <Section className="mb-8 border-l-4 border-primary pl-4">
        <div className="flex items-center gap-3">
          <Heading className="m-0 text-2xl font-bold text-foreground">
            Dotty<span className="text-primary">.</span>
          </Heading>
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white">
            NY ORDRE
          </span>
        </div>
      </Section>

      {/* Order Summary */}
      <Section className="rounded-lg bg-card p-6 text-center">
        <Heading className="m-0 text-xl font-bold text-foreground">
          Ny bestilling mottatt
        </Heading>
        <Text className="mt-2 text-sm text-muted">
          Ordrenummer: #{order.id}
        </Text>
        <Text className="m-0 text-sm text-muted">
          {formatDateTime(order.created_at)}
        </Text>
        <Text className="mt-4 text-3xl font-bold text-foreground">
          {formatPrice(order.total)}
        </Text>
      </Section>

      <Hr className="my-6 border-border" />

      {/* Customer Info */}
      <Section>
        <Heading as="h2" className="mb-4 text-lg font-semibold text-foreground">
          Kunde
        </Heading>
        <Section className="rounded-lg bg-card p-4">
          <Text className="m-0 font-medium text-foreground">{order.customer_name}</Text>
          <Text className="m-0 mt-1 text-muted">
            <Link href={`mailto:${order.customer_email}`} className="text-primary">
              {order.customer_email}
            </Link>
          </Text>
          <Text className="m-0 mt-1 text-muted">
            <Link href={`tel:${order.customer_phone}`} className="text-primary">
              {order.customer_phone}
            </Link>
          </Text>
        </Section>
      </Section>

      {/* Order Items */}
      <Section className="mt-6">
        <Heading as="h2" className="mb-4 text-lg font-semibold text-foreground">
          Produkter
        </Heading>
        <OrderItems items={order.items} />
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

      {/* CTA Button */}
      <Section className="mt-8 text-center">
        <Button href={`${emailConfig.baseUrl}/admin/orders`}>
          Se ordre i admin-panel
        </Button>
      </Section>

      <EmailFooter transactionText="Dette er en automatisk varsling fra Dotty." />
    </EmailLayout>
  );
}

export default NewOrderAlertEmail;
