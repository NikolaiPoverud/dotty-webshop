import { Section, Text, Hr, Link } from '@react-email/components';

import type { OrderWithItems } from '@/types';
import { formatPrice } from '@/lib/utils';

import { EmailFooter } from './components/footer';
import { EmailHeader } from './components/header';
import { EmailLayout } from './components/layout';
import { OrderItems } from './components/order-items';
import { Button } from './components/button';
import { formatDate } from './utils';

interface OrderConfirmationEmailProps {
  order: OrderWithItems;
}

export function OrderConfirmationEmail({ order }: OrderConfirmationEmailProps): React.ReactElement {
  const shippingCost = order.shipping_cost ?? 0;
  const artistLevy = order.artist_levy ?? 0;
  const discountAmount = order.discount_amount ?? 0;

  return (
    <EmailLayout preview={`Ordrebekreftelse ${order.order_number} – Takk for handelen!`}>
      {/* Main Card */}
      <Section style={{
        backgroundColor: '#131316',
        border: '3px solid #2a2a2f',
        overflow: 'hidden',
      }}>
        <EmailHeader subtitle="Ordrebekreftelse" />

        {/* Success Message */}
        <Section style={{
          padding: '40px 32px',
          textAlign: 'center',
          backgroundColor: '#131316',
        }}>
          <Text style={{
            margin: 0,
            fontSize: '48px',
            lineHeight: '1',
          }}>
            🎉
          </Text>

          <Text style={{
            margin: '16px 0 0 0',
            fontSize: '28px',
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Takk for bestillingen!
          </Text>

          <Text style={{
            margin: '12px 0 0 0',
            fontSize: '15px',
            color: '#9ca3af',
            lineHeight: '1.6',
          }}>
            Vi har mottatt ordren din og gjør den klar for sending.
            <br />
            Du vil få en e-post når pakken er på vei.
          </Text>

          {/* Order number badge */}
          <Section style={{
            marginTop: '24px',
            padding: '16px 24px',
            backgroundColor: '#1a1a1f',
            border: '2px solid #FE206A',
            display: 'inline-block',
          }}>
            <Text style={{
              margin: 0,
              fontSize: '12px',
              fontWeight: 700,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              Ordrenummer
            </Text>
            <Text style={{
              margin: '4px 0 0 0',
              fontSize: '24px',
              fontWeight: 900,
              color: '#FE206A',
              fontFamily: 'monospace',
            }}>
              {order.order_number}
            </Text>
          </Section>

          <Text style={{
            margin: '16px 0 0 0',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            {formatDate(order.created_at)}
          </Text>
        </Section>

        {/* Divider */}
        <Section style={{
          height: '4px',
          backgroundColor: '#FE206A',
          margin: '0 32px',
        }} />

        {/* Order Items */}
        <Section style={{ padding: '32px' }}>
          <Text style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Din bestilling
          </Text>
          <OrderItems items={order.items} />
        </Section>

        {/* Order Summary */}
        <Section style={{
          margin: '0 32px 32px 32px',
          padding: '24px',
          backgroundColor: '#1a1a1f',
          border: '2px solid #2a2a2f',
        }}>
          <table width="100%" cellSpacing="0" cellPadding="0">
            <tbody>
              <tr>
                <td style={{ padding: '8px 0' }}>
                  <Text style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Delsum</Text>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  <Text style={{ margin: 0, fontSize: '14px', color: '#ffffff' }}>{formatPrice(order.subtotal)}</Text>
                </td>
              </tr>

              {discountAmount > 0 && (
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <Text style={{ margin: 0, fontSize: '14px', color: '#10b981' }}>
                      Rabatt {order.discount_code && `(${order.discount_code})`}
                    </Text>
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>
                    <Text style={{ margin: 0, fontSize: '14px', color: '#10b981' }}>
                      −{formatPrice(discountAmount)}
                    </Text>
                  </td>
                </tr>
              )}

              <tr>
                <td style={{ padding: '8px 0' }}>
                  <Text style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Frakt</Text>
                </td>
                <td style={{ textAlign: 'right', padding: '8px 0' }}>
                  <Text style={{ margin: 0, fontSize: '14px', color: '#ffffff' }}>
                    {shippingCost > 0 ? formatPrice(shippingCost) : 'Gratis'}
                  </Text>
                </td>
              </tr>

              {artistLevy > 0 && (
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <Text style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>
                      Kunstavgift (5%)
                    </Text>
                  </td>
                  <td style={{ textAlign: 'right', padding: '8px 0' }}>
                    <Text style={{ margin: 0, fontSize: '14px', color: '#ffffff' }}>
                      {formatPrice(artistLevy)}
                    </Text>
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          <Section style={{
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '2px solid #2a2a2f',
          }}>
            <table width="100%" cellSpacing="0" cellPadding="0">
              <tbody>
                <tr>
                  <td>
                    <Text style={{
                      margin: 0,
                      fontSize: '16px',
                      fontWeight: 700,
                      color: '#ffffff',
                      textTransform: 'uppercase',
                    }}>
                      Totalt
                    </Text>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Text style={{
                      margin: 0,
                      fontSize: '24px',
                      fontWeight: 900,
                      color: '#FE206A',
                    }}>
                      {formatPrice(order.total)}
                    </Text>
                  </td>
                </tr>
              </tbody>
            </table>
            <Text style={{
              margin: '4px 0 0 0',
              fontSize: '11px',
              color: '#6b7280',
              textAlign: 'right',
            }}>
              Inkl. mva
            </Text>
          </Section>
        </Section>

        {/* Shipping Address */}
        <Section style={{ padding: '0 32px 32px 32px' }}>
          <Text style={{
            margin: '0 0 16px 0',
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
            borderLeft: '4px solid #FE206A',
          }}>
            <Text style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#ffffff' }}>
              {order.customer_name}
            </Text>
            <Text style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#9ca3af' }}>
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
          <Button href="https://dotty.no/no/shop">
            Se flere kunstverk
          </Button>
        </Section>
      </Section>

      <EmailFooter transactionText="Du mottar denne e-posten fordi du har lagt inn en bestilling hos Dotty." />
    </EmailLayout>
  );
}

export default OrderConfirmationEmail;
