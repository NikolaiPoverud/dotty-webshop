import { Link, Section, Text } from '@react-email/components';

import type { Order } from '@/types';

import { Button } from './components/button';
import { EmailFooter } from './components/footer';
import { EmailHeader } from './components/header';
import { EmailLayout } from './components/layout';

interface DeliveryConfirmationEmailProps {
  order: Order;
}

export function DeliveryConfirmationEmail({ order }: DeliveryConfirmationEmailProps): React.ReactElement {
  return (
    <EmailLayout preview={`Pakken din er levert! – Ordre ${order.order_number}`}>
      {/* Main Card */}
      <Section style={{
        backgroundColor: '#131316',
        border: '3px solid #2a2a2f',
        overflow: 'hidden',
      }}>
        <EmailHeader subtitle="Levert!" />

        {/* Success Message */}
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
            🎨
          </Text>

          <Text style={{
            margin: '16px 0 0 0',
            fontSize: '28px',
            fontWeight: 900,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '1px',
          }}>
            Pakken er levert!
          </Text>

          <Text style={{
            margin: '12px 0 0 0',
            fontSize: '13px',
            color: '#6b7280',
          }}>
            Ordrenummer: <span style={{ color: '#FE206A', fontWeight: 700, fontFamily: 'monospace' }}>{order.order_number}</span>
          </Text>
        </Section>

        {/* Thank you message */}
        <Section style={{
          margin: '0 20px 24px 20px',
          padding: '24px',
          backgroundColor: '#1a1a1f',
          borderLeft: '4px solid #FE206A',
          textAlign: 'center',
        }}>
          <Text style={{
            margin: 0,
            fontSize: '16px',
            color: '#ffffff',
            lineHeight: '1.6',
          }}>
            Takk for at du handler hos Dotty.
            <br />
            <span style={{ color: '#9ca3af' }}>Vi håper du blir fornøyd med ditt nye kunstverk.</span>
          </Text>
        </Section>

        {/* Share section */}
        <Section style={{
          padding: '0 20px 24px 20px',
          textAlign: 'center',
        }}>
          <Text style={{
            margin: '0 0 8px 0',
            fontSize: '14px',
            fontWeight: 700,
            color: '#ffffff',
            textTransform: 'uppercase',
            letterSpacing: '2px',
          }}>
            Del ditt kjøp!
          </Text>

          <Text style={{
            margin: 0,
            fontSize: '14px',
            color: '#9ca3af',
            lineHeight: '1.6',
          }}>
            Vi setter stor pris på om du deler ditt nye kunstverk
            <br />
            på Instagram eller TikTok.
          </Text>

          <Section style={{ marginTop: '16px' }}>
            <Link
              href="https://instagram.com/dotty.artwork"
              style={{
                color: '#FE206A',
                fontSize: '16px',
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              @dotty.artwork
            </Link>
          </Section>
        </Section>

        {/* CTA */}
        <Section style={{
          padding: '20px 20px 32px 20px',
          textAlign: 'center',
          backgroundColor: '#0a0a0b',
        }}>
          <Button href="https://dotty.no/no/shop">
            Se flere kunstverk
          </Button>
        </Section>
      </Section>

      <EmailFooter transactionText="Problemer med leveransen? Svar på denne e-posten." />
    </EmailLayout>
  );
}

export default DeliveryConfirmationEmail;
