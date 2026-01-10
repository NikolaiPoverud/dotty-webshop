import { Heading, Hr, Link, Section, Text } from '@react-email/components';

import { emailConfig } from '@/lib/email/resend';
import type { Order } from '@/types';

import { Button } from './components/button';
import { EmailFooter } from './components/footer';
import { EmailLayout } from './components/layout';
import { OrderItems } from './components/order-items';
import { formatDateTime, formatPrice } from './utils';

interface NewOrderAlertEmailProps {
  order: Order;
}

export function NewOrderAlertEmail({ order }: NewOrderAlertEmailProps): React.ReactElement {
  return (
    <EmailLayout preview={`Ny ordre ${order.order_number} - ${formatPrice(order.total)}`}>
      <Section className="overflow-hidden rounded-2xl bg-card shadow-lg">
        <Section className="bg-muted px-8 py-8">
          <table width="100%" cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td>
                  <Heading className="m-0 text-4xl font-extrabold tracking-tight">
                    <span className="text-primary">Dotty</span>
                    <span className="text-foreground">.</span>
                  </Heading>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span className="rounded-full bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-white">
                    NY ORDRE
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        <Section className="px-8 py-8 text-center">
          <Heading className="m-0 text-xl font-bold text-foreground">
            Ny bestilling mottatt
          </Heading>
          <Text className="mt-2 text-sm text-muted-foreground">
            Ordrenummer: <span className="font-mono font-bold text-foreground">{order.order_number}</span>
          </Text>
          <Text className="m-0 text-sm text-muted-foreground">
            {formatDateTime(order.created_at)}
          </Text>
          <Text className="mt-4 text-4xl font-bold text-primary">
            {formatPrice(order.total)}
          </Text>
        </Section>

        <Hr className="mx-8 border-border" />

        <Section className="px-8 py-6">
          <Heading as="h2" className="mb-4 text-base font-bold uppercase tracking-wider text-foreground">
            Kunde
          </Heading>
          <Section className="rounded-xl border-l-4 border-primary bg-muted p-4">
            <Text className="m-0 font-semibold text-foreground">{order.customer_name}</Text>
            <Text className="m-0 mt-1">
              <Link href={`mailto:${order.customer_email}`} className="text-primary no-underline">
                {order.customer_email}
              </Link>
            </Text>
            <Text className="m-0 mt-1">
              <Link href={`tel:${order.customer_phone}`} className="text-primary no-underline">
                {order.customer_phone}
              </Link>
            </Text>
          </Section>
        </Section>

        <Section className="px-8 pb-6">
          <Heading as="h2" className="mb-4 text-base font-bold uppercase tracking-wider text-foreground">
            Produkter
          </Heading>
          <OrderItems items={order.items} />
        </Section>

        <Section className="px-8 pb-8">
          <Heading as="h2" className="mb-4 text-base font-bold uppercase tracking-wider text-foreground">
            Leveringsadresse
          </Heading>
          <Section className="rounded-xl bg-muted p-4">
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

        <Section className="px-8 pb-8 text-center">
          <Button href={`${emailConfig.baseUrl}/admin/orders`}>
            Se ordre i admin-panel
          </Button>
        </Section>
      </Section>

      <EmailFooter transactionText="Dette er en automatisk varsling fra Dotty." />
    </EmailLayout>
  );
}

export default NewOrderAlertEmail;
