import { Heading, Hr, Section, Text } from '@react-email/components';

import type { Order } from '@/types';

import { Button } from './components/button';
import { EmailFooter } from './components/footer';
import { EmailHeader } from './components/header';
import { EmailLayout } from './components/layout';
import { getTrackingUrl } from './utils';

interface ShippingNotificationEmailProps {
  order: Order;
}

export function ShippingNotificationEmail({ order }: ShippingNotificationEmailProps): React.ReactElement {
  const trackingUrl = order.tracking_carrier && order.tracking_number
    ? getTrackingUrl(order.tracking_carrier, order.tracking_number)
    : null;

  return (
    <EmailLayout preview={`Pakken din er pa vei! - Ordre ${order.order_number}`}>
      <Section className="overflow-hidden rounded-2xl bg-card shadow-lg">
        <EmailHeader subtitle="Forsendelsesbekreftelse" />

        <Section className="px-8 pb-8 text-center">
          <Text className="mx-auto mb-4 text-5xl">
            📦
          </Text>
          <Heading className="m-0 text-2xl font-bold text-foreground">
            Ordren din er pa vei!
          </Heading>
          <Text className="mt-2 text-muted-foreground">
            Ordrenummer: <span className="font-mono font-bold text-foreground">{order.order_number}</span>
          </Text>
        </Section>

        <Hr className="mx-8 border-border" />

        <Section className="px-8 py-6">
          <Section className="rounded-xl border-l-4 border-primary bg-muted p-6">
            <Heading as="h2" className="m-0 mb-4 text-base font-bold uppercase tracking-wider text-foreground">
              Sporing
            </Heading>

            {order.tracking_carrier && (
              <table width="100%" cellSpacing="0" cellPadding="0" className="mb-2">
                <tbody>
                  <tr>
                    <td>
                      <Text className="m-0 text-muted-foreground">Transportor</Text>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Text className="m-0 font-semibold text-foreground">{order.tracking_carrier}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {order.tracking_number && (
              <table width="100%" cellSpacing="0" cellPadding="0">
                <tbody>
                  <tr>
                    <td>
                      <Text className="m-0 text-muted-foreground">Sporingsnummer</Text>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Text className="m-0 font-mono font-semibold text-primary">{order.tracking_number}</Text>
                    </td>
                  </tr>
                </tbody>
              </table>
            )}

            {trackingUrl && (
              <Section className="mt-6 text-center">
                <Button href={trackingUrl}>Spor pakken</Button>
              </Section>
            )}

            <Text className="m-0 mt-4 text-center text-sm text-muted-foreground">
              Estimert levering: 3-5 virkedager
            </Text>
          </Section>
        </Section>

        <Section className="px-8 pb-8">
          <Heading as="h2" className="mb-4 text-base font-bold uppercase tracking-wider text-foreground">
            I denne pakken
          </Heading>
          <Section className="rounded-xl bg-muted p-4">
            {order.items.map((item) => (
              <Text key={item.product_id} className="m-0 py-1 text-foreground">
                • {item.title} {item.quantity > 1 ? `(${item.quantity}x)` : ''}
              </Text>
            ))}
          </Section>
        </Section>
      </Section>

      <EmailFooter transactionText="Sporsmål om leveransen? Kontakt oss." />
    </EmailLayout>
  );
}

export default ShippingNotificationEmail;
