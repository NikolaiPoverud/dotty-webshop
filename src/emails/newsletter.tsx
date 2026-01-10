import { Hr, Link, Section, Text } from '@react-email/components';

import { EmailFooter } from './components/footer';
import { EmailHeader } from './components/header';
import { EmailLayout } from './components/layout';

interface NewsletterEmailProps {
  subject: string;
  content: string;
  recipientEmail: string;
}

export function NewsletterEmail({ subject, content, recipientEmail }: NewsletterEmailProps): React.ReactElement {
  const unsubscribeUrl = `https://dotty.no/no/unsubscribe?email=${encodeURIComponent(recipientEmail)}`;

  return (
    <EmailLayout preview={subject}>
      <Section className="overflow-hidden rounded-2xl bg-card shadow-lg">
        <EmailHeader subtitle="Nyhetsbrev" />

        <Section className="px-8 py-6">
          <div
            className="prose prose-invert max-w-none text-foreground"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Section>

        <Hr className="mx-8 border-border" />

        <EmailFooter />

        <Section className="px-8 pb-6 text-center">
          <Text className="m-0 text-xs text-muted-foreground">
            Du mottar denne e-posten fordi du er registrert som kunde eller abonnent hos Dotty.
          </Text>
          <Link
            href={unsubscribeUrl}
            className="text-xs text-muted-foreground underline"
          >
            Meld deg av nyhetsbrev
          </Link>
        </Section>
      </Section>
    </EmailLayout>
  );
}

export default NewsletterEmail;
