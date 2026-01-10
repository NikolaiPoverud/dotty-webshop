import { Hr, Link, Section, Text } from '@react-email/components';

interface EmailFooterProps {
  transactionText?: string;
}

export function EmailFooter({ transactionText }: EmailFooterProps) {
  return (
    <Section className="mt-8">
      <Hr className="border-border" />
      <Section className="rounded-b-2xl bg-muted px-8 py-6 text-center">
        <Text className="m-0 text-sm text-muted-foreground">
          Sporsmal? Kontakt oss pa{' '}
          <Link href="mailto:hei@dotty.no" className="text-primary no-underline">
            hei@dotty.no
          </Link>
        </Text>
        <Text className="m-0 mt-2 text-xs text-muted-foreground">
          <Link href="https://dotty.no" className="font-semibold text-primary no-underline">
            dotty.no
          </Link>
        </Text>
      </Section>
      {transactionText && (
        <Text className="mt-4 text-center text-xs text-muted-foreground">{transactionText}</Text>
      )}
    </Section>
  );
}
