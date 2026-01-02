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
      <Section className="overflow-hidden rounded-2xl bg-card shadow-lg">
        <EmailHeader subtitle="Levert" />

        {/* Success Message */}
        <Section className="px-8 pb-8 text-center">
          <Text className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-3xl">
            ✓
          </Text>
          <Heading className="m-0 text-2xl font-bold text-foreground">
            Pakken din er levert!
          </Heading>
          <Text className="mt-2 text-muted-foreground">
            Ordrenummer: <span className="font-mono font-bold text-foreground">#{order.id}</span>
          </Text>
        </Section>

        <Hr className="mx-8 border-border" />

        {/* Thank You Message */}
        <Section className="px-8 py-6">
          <Section className="rounded-xl border-l-4 border-primary bg-muted p-6 text-center">
            <Text className="m-0 text-foreground">
              Takk for at du handler hos Dotty. Vi haper du er fornoyd med ditt nye kunstverk!
            </Text>
          </Section>
        </Section>

        {/* Share Section */}
        <Section className="px-8 pb-8 text-center">
          <Heading as="h2" className="m-0 text-lg font-semibold text-muted-foreground">
            Del ditt kjop
          </Heading>
          <Text className="mt-2 text-sm text-muted-foreground">
            Vi setter pris pa om du deler ditt kjop pa Instagram.{' '}
            <Link href="https://instagram.com/dotty.popart" className="font-semibold text-primary no-underline">
              Tag oss @dotty.popart
            </Link>
          </Text>
        </Section>
      </Section>

      <EmailFooter transactionText="Problemer med leveransen? Kontakt oss." />
    </EmailLayout>
  );
}

export default DeliveryConfirmationEmail;
