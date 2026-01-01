import { Hr, Link, Section, Text } from '@react-email/components';
import * as React from 'react';

interface EmailFooterProps {
  transactionText?: string;
}

export function EmailFooter({ transactionText }: EmailFooterProps) {
  return (
    <Section className="mt-10">
      <Hr className="border-border" />
      <Text className="text-center text-sm text-muted">
        Sporsmal? Kontakt oss pa{' '}
        <Link href="mailto:hei@dotty.no" className="text-primary underline">
          hei@dotty.no
        </Link>
      </Text>
      {transactionText && (
        <Text className="text-center text-xs text-muted">{transactionText}</Text>
      )}
    </Section>
  );
}
