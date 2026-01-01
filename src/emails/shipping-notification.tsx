import { Heading, Hr, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Order } from '@/types';
import { EmailLayout } from './components/layout';
import { EmailHeader } from './components/header';
import { EmailFooter } from './components/footer';
import { Button } from './components/button';

interface ShippingNotificationEmailProps {
  order: Order;
}

// Common Norwegian carrier tracking URLs
function getTrackingUrl(carrier: string, trackingNumber: string): string {
  const carrierLower = carrier.toLowerCase();

  if (carrierLower.includes('posten') || carrierLower.includes('bring')) {
    return `https://sporing.bring.no/sporing/${trackingNumber}`;
  }
  if (carrierLower.includes('postnord')) {
    return `https://www.postnord.no/sporpakke?id=${trackingNumber}`;
  }
  if (carrierLower.includes('dhl')) {
    return `https://www.dhl.com/no-no/home/tracking.html?tracking-id=${trackingNumber}`;
  }
  if (carrierLower.includes('ups')) {
    return `https://www.ups.com/track?tracknum=${trackingNumber}`;
  }

  // Default: Google search for tracking
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} ${trackingNumber} sporing`)}`;
}

export function ShippingNotificationEmail({ order }: ShippingNotificationEmailProps) {
  const trackingUrl = order.tracking_carrier && order.tracking_number
    ? getTrackingUrl(order.tracking_carrier, order.tracking_number)
    : null;

  return (
    <EmailLayout preview={`Pakken din er på vei! - Ordre #${order.id}`}>
      <EmailHeader subtitle="Forsendelsesbekreftelse" />

      {/* Status Message */}
      <Section className="text-center">
        <Text className="mx-auto mb-4 text-4xl">
          📦
        </Text>
        <Heading className="m-0 text-2xl font-bold text-foreground">
          Ordren din er pa vei!
        </Heading>
        <Text className="mt-2 text-muted">
          Ordrenummer: #{order.id}
        </Text>
      </Section>

      <Hr className="my-8 border-border" />

      {/* Tracking Info */}
      <Section className="rounded-lg border-l-4 border-primary bg-card p-6">
        <Heading as="h2" className="m-0 mb-4 text-lg font-semibold text-foreground">
          Sporing
        </Heading>

        {order.tracking_carrier && (
          <div className="mb-2 flex justify-between">
            <Text className="m-0 text-muted">Transportor</Text>
            <Text className="m-0 font-medium text-foreground">{order.tracking_carrier}</Text>
          </div>
        )}

        {order.tracking_number && (
          <div className="mb-4 flex justify-between">
            <Text className="m-0 text-muted">Sporingsnummer</Text>
            <Text className="m-0 font-mono text-foreground">{order.tracking_number}</Text>
          </div>
        )}

        {trackingUrl && (
          <Section className="mt-4 text-center">
            <Button href={trackingUrl}>Spor pakken</Button>
          </Section>
        )}

        <Text className="m-0 mt-4 text-center text-sm text-muted">
          Estimert levering: 3-5 virkedager
        </Text>
      </Section>

      {/* Items Reminder */}
      <Section className="mt-6">
        <Heading as="h2" className="mb-4 text-lg font-semibold text-foreground">
          I denne pakken
        </Heading>
        <Section className="rounded-lg bg-card p-4">
          {order.items.map((item) => (
            <Text key={item.product_id} className="m-0 py-1 text-foreground">
              • {item.title} {item.quantity > 1 ? `(${item.quantity}x)` : ''}
            </Text>
          ))}
        </Section>
      </Section>

      <EmailFooter transactionText="Sporsmål om leveransen? Kontakt oss." />
    </EmailLayout>
  );
}

export default ShippingNotificationEmail;
