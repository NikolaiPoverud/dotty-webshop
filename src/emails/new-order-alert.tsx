import { Link, Section, Text } from '@react-email/components';

import { emailConfig } from '@/lib/email/resend';
import { formatPrice } from '@/lib/utils';
import type { OrderWithItems } from '@/types';

import { Button } from './components/button';
import { EmailFooter } from './components/footer';
import { EmailLayout } from './components/layout';
import { OrderItems } from './components/order-items';
import { formatDateTime } from './utils';

interface NewOrderAlertEmailProps {
  order: OrderWithItems;
}

export function NewOrderAlertEmail({ order }: NewOrderAlertEmailProps): React.ReactElement {
  return (
    <EmailLayout preview={`Ny ordre ${order.order_number} – ${formatPrice(order.total)}`}>
      {/* Main Card */}
      <Section style={{
        backgroundColor: '#131316',
        border: '3px solid #2a2a2f',
        overflow: 'hidden',
      }}>
        {/* Alert Header */}
        <Section style={{
          backgroundColor: '#10b981',
          padding: '24px 32px',
          textAlign: 'center',
          borderBottom: '4px solid #000000',
        }}>
          <table width="100%" cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td>
                  <Text style={{
                    margin: 0,
                    fontSize: '32px',
                    fontWeight: 900,
                    color: '#ffffff',
                    textShadow: '2px 2px 0 #000000',
                  }}>
                    DOTTY<span style={{ color: '#000000' }}>.</span>
                  </Text>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: '#ffffff',
                    color: '#000000',
                    padding: '8px 16px',
                    fontSize: '12px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '2px',
                    border: '2px solid #000000',
                  }}>
                    NY ORDRE!
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </Section>

        {/* Order Summary */}
        <Section style={{
          padding: '32px',
          textAlign: 'center',
          backgroundColor: '#131316',
        }}>
          <Text style={{
            margin: 0,
            fontSize: '14px',
            fontWeight: 700,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Ny bestilling mottatt
          </Text>

          <Text style={{
            margin: '16px 0 0 0',
            fontSize: '48px',
            fontWeight: 900,
            color: '#FE206A',
          }}>
            {formatPrice(order.total)}
          </Text>

          <Text style={{
            margin: '8px 0 0 0',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            Ordre <span style={{ color: '#FE206A', fontFamily: 'monospace', fontWeight: 700 }}>{order.order_number}</span>
            {' · '}
            {formatDateTime(order.created_at)}
          </Text>
        </Section>

        {/* Customer Info */}
        <Section style={{ padding: '0 32px 24px 32px' }}>
          <Text style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Kunde
          </Text>

          <Section style={{
            padding: '20px',
            backgroundColor: '#1a1a1f',
            borderLeft: '4px solid #FE206A',
          }}>
            <Text style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>
              {order.customer_name}
            </Text>
            <Text style={{ margin: '8px 0 0 0', fontSize: '14px' }}>
              <Link href={`mailto:${order.customer_email}`} style={{ color: '#FE206A', textDecoration: 'none' }}>
                {order.customer_email}
              </Link>
            </Text>
            <Text style={{ margin: '4px 0 0 0', fontSize: '14px' }}>
              <Link href={`tel:${order.customer_phone}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>
                {order.customer_phone}
              </Link>
            </Text>
          </Section>
        </Section>

        {/* Products */}
        <Section style={{ padding: '0 32px 24px 32px' }}>
          <Text style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Produkter
          </Text>
          <OrderItems items={order.items} />
        </Section>

        {/* Shipping Address */}
        <Section style={{ padding: '0 32px 32px 32px' }}>
          <Text style={{
            margin: '0 0 12px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Leveringsadresse
          </Text>

          <Section style={{
            padding: '20px',
            backgroundColor: '#1a1a1f',
          }}>
            <Text style={{ margin: 0, fontSize: '14px', color: '#ffffff' }}>
              {order.shipping_address.line1}
            </Text>
            {order.shipping_address.line2 && (
              <Text style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
                {order.shipping_address.line2}
              </Text>
            )}
            <Text style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
              {order.shipping_address.postal_code} {order.shipping_address.city}
            </Text>
            <Text style={{ margin: '2px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
              {order.shipping_address.country}
            </Text>
          </Section>
        </Section>

        {/* CTA */}
        <Section style={{
          padding: '24px 32px 40px 32px',
          textAlign: 'center',
          backgroundColor: '#0a0a0b',
        }}>
          <Button href={`${emailConfig.baseUrl}/admin/orders`}>
            Åpne admin-panel
          </Button>
        </Section>
      </Section>

      <EmailFooter transactionText="Automatisk varsling fra Dotty." />
    </EmailLayout>
  );
}

export default NewOrderAlertEmail;
