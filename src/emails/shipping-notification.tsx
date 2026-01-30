import { Section, Text } from '@react-email/components';

import type { OrderWithItems } from '@/types';

import { Button } from './components/button';
import { EmailFooter } from './components/footer';
import { EmailHeader } from './components/header';
import { EmailLayout } from './components/layout';
import { getTrackingUrl } from './utils';

interface ShippingNotificationEmailProps {
  order: OrderWithItems;
}

export function ShippingNotificationEmail({ order }: ShippingNotificationEmailProps): React.ReactElement {
  const trackingUrl = order.tracking_carrier && order.tracking_number
    ? getTrackingUrl(order.tracking_carrier, order.tracking_number)
    : null;

  return (
    <EmailLayout preview={`Pakken din er på vei! – Ordre ${order.order_number}`}>
      {/* Main Card */}
      <Section style={{
        backgroundColor: '#131316',
        border: '3px solid #2a2a2f',
        overflow: 'hidden',
      }}>
        <EmailHeader subtitle="Sendt!" />

        {/* Hero Section */}
        <Section style={{
          padding: '32px 20px',
          textAlign: 'center',
          backgroundColor: '#131316',
        }}>
          <Text style={{
            margin: 0,
            fontSize: '64px',
            lineHeight: '1',
          }}>
            📦
          </Text>

          <Text style={{
            margin: '16px 0 0 0',
            fontSize: '28px',
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Pakken er på vei!
          </Text>

          <Text style={{
            margin: '12px 0 0 0',
            fontSize: '15px',
            color: '#9ca3af',
            lineHeight: '1.6',
          }}>
            Ordren din er nå sendt og på vei til deg.
            <br />
            Forventet leveringstid: <strong style={{ color: '#ffffff' }}>2–5 virkedager</strong>
          </Text>

          {/* Order number */}
          <Text style={{
            margin: '24px 0 0 0',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            Ordrenummer: <span style={{ color: '#FE206A', fontWeight: 700, fontFamily: 'monospace' }}>{order.order_number}</span>
          </Text>
        </Section>

        {/* Tracking Section */}
        {(order.tracking_carrier || order.tracking_number) && (
          <Section style={{
            margin: '0 20px 24px 20px',
            padding: '24px 24px 32px 24px',
            backgroundColor: '#1a1a1f',
            border: '2px solid #FE206A',
          }}>
            <Text style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              Sporing
            </Text>

            <table width="100%" cellSpacing="0" cellPadding="0">
              <tbody>
                {order.tracking_carrier && (
                  <tr>
                    <td style={{ padding: '8px 0' }}>
                      <Text style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Transportør</Text>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>
                      <Text style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#ffffff' }}>
                        {order.tracking_carrier}
                      </Text>
                    </td>
                  </tr>
                )}
                {order.tracking_number && (
                  <tr>
                    <td style={{ padding: '8px 0' }}>
                      <Text style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Sporingsnummer</Text>
                    </td>
                    <td style={{ textAlign: 'right', padding: '8px 0' }}>
                      <Text style={{ margin: 0, fontSize: '14px', fontWeight: 700, color: '#FE206A', fontFamily: 'monospace' }}>
                        {order.tracking_number}
                      </Text>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {trackingUrl && (
              <Section style={{ marginTop: '20px', paddingBottom: '8px', textAlign: 'center' }}>
                <Button href={trackingUrl}>
                  Spor pakken
                </Button>
              </Section>
            )}
          </Section>
        )}

        {/* Package Contents */}
        {order.items && order.items.length > 0 && (
          <Section style={{ padding: '0 20px 24px 20px' }}>
            <Text style={{
              margin: '0 0 16px 0',
              fontSize: '14px',
              fontWeight: 700,
              color: '#ffffff',
              textTransform: 'uppercase',
              letterSpacing: '2px',
            }}>
              I pakken
            </Text>

            <Section style={{
              padding: '20px',
              backgroundColor: '#1a1a1f',
              borderLeft: '4px solid #FE206A',
            }}>
              {order.items.map((item, index) => (
                <Text key={item.product_id || index} style={{
                  margin: 0,
                  padding: '6px 0',
                  fontSize: '14px',
                  color: '#ffffff',
                  borderBottom: index < order.items.length - 1 ? '1px solid #2a2a2f' : 'none',
                }}>
                  <span style={{ color: '#FE206A', marginRight: '8px' }}>●</span>
                  {item.title || 'Kunstverk'}
                  {item.quantity > 1 && (
                    <span style={{ color: '#9ca3af', marginLeft: '8px' }}>×{item.quantity}</span>
                  )}
                </Text>
              ))}
            </Section>
          </Section>
        )}

        {/* Delivery Address */}
        <Section style={{ padding: '0 20px 24px 20px' }}>
          <Text style={{
            margin: '0 0 16px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Leveres til
          </Text>

          <Section style={{
            padding: '20px',
            backgroundColor: '#1a1a1f',
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
          </Section>
        </Section>
      </Section>

      <EmailFooter transactionText="Spørsmål om leveransen? Svar på denne e-posten." />
    </EmailLayout>
  );
}

export default ShippingNotificationEmail;
