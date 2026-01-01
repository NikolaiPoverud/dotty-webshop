import { Heading, Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';
import type { Order } from '@/types';
import { EmailLayout } from './components/layout';
import { EmailHeader } from './components/header';
import { EmailFooter } from './components/footer';

interface DeliveryConfirmationEmailProps {
  order: Order;
}

export function DeliveryConfirmationEmail({ order }: DeliveryConfirmationEmailProps) {
  return (
    <EmailLayout preview={`Pakken din er levert! - Ordre #${order.id}`}>
      <EmailHeader subtitle="Levert" />

      {/* Success Message */}
      <Section className="text-center">
        <Text className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-2xl">
          ✓
        </Text>
        <Heading className="m-0 text-2xl font-bold text-foreground">
          Pakken din er levert!
        </Heading>
        <Text className="mt-2 text-muted">
          Ordrenummer: #{order.id}
        </Text>
      </Section>

      <Hr className="my-8 border-border" />

      {/* Thank You Message */}
      <Section className="rounded-lg bg-card p-6 text-center">
        <Text className="m-0 text-foreground">
          Takk for at du handler hos Dotty. Vi haper du er fornøyd med ditt nye kunstverk!
        </Text>
      </Section>

      {/* Share Section */}
      <Section className="mt-8 text-center">
        <Heading as="h2" className="m-0 text-lg font-semibold text-muted">
          Del ditt kjop
        </Heading>
        <Text className="mt-2 text-sm text-muted">
          Vi setter pris pa om du deler ditt kjop pa Instagram.{' '}
          <Link href="https://instagram.com/dotty.shop" className="text-primary">
            Tag oss @dotty.shop
          </Link>
        </Text>
      </Section>

      <EmailFooter transactionText="Problemer med leveransen? Kontakt oss." />
    </EmailLayout>
  );
}

export default DeliveryConfirmationEmail;
