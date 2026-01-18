import { Link, Section, Text } from '@react-email/components';

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
      {/* Main Card */}
      <Section style={{
        backgroundColor: '#131316',
        border: '3px solid #2a2a2f',
        overflow: 'hidden',
      }}>
        <EmailHeader subtitle="Nyhetsbrev" />

        {/* Content */}
        <Section style={{
          padding: '32px',
          backgroundColor: '#131316',
        }}>
          <div
            style={{
              color: '#ffffff',
              fontSize: '15px',
              lineHeight: '1.7',
            }}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </Section>

        {/* Divider */}
        <Section style={{
          height: '4px',
          backgroundColor: '#FE206A',
          margin: '0 32px',
        }} />

        <EmailFooter />

        {/* Unsubscribe */}
        <Section style={{
          padding: '16px 32px 24px 32px',
          textAlign: 'center',
          backgroundColor: '#0a0a0b',
        }}>
          <Text style={{
            margin: 0,
            fontSize: '11px',
            color: '#6b7280',
          }}>
            Du mottar denne e-posten fordi du er registrert som kunde eller abonnent hos Dotty.
          </Text>
          <Link
            href={unsubscribeUrl}
            style={{
              fontSize: '11px',
              color: '#6b7280',
              textDecoration: 'underline',
            }}
          >
            Meld deg av nyhetsbrev
          </Link>
        </Section>
      </Section>
    </EmailLayout>
  );
}

export default NewsletterEmail;
