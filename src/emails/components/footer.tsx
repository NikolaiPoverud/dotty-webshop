import { Link, Section, Text } from '@react-email/components';

interface EmailFooterProps {
  transactionText?: string;
}

export function EmailFooter({ transactionText }: EmailFooterProps) {
  return (
    <Section style={{ marginTop: '0' }}>
      {/* Pop art footer bar */}
      <Section style={{
        backgroundColor: '#1f1f23',
        padding: '24px',
        textAlign: 'center',
        borderTop: '4px solid #FE206A',
      }}>
        <Text style={{
          margin: 0,
          fontSize: '24px',
          fontWeight: 900,
          color: '#FE206A',
          letterSpacing: '-1px',
        }}>
          DOTTY<span style={{ color: '#ffffff' }}>.</span>
        </Text>

        <Text style={{
          margin: '16px 0 0 0',
          fontSize: '13px',
          color: '#9ca3af',
        }}>
          Spørsmål? Kontakt oss på{' '}
          <Link href="mailto:hei@dotty.no" style={{ color: '#FE206A', textDecoration: 'none', fontWeight: 700 }}>
            hei@dotty.no
          </Link>
        </Text>

        <Text style={{
          margin: '12px 0 0 0',
          fontSize: '12px',
          color: '#6b7280',
        }}>
          <Link href="https://dotty.no" style={{ color: '#FE206A', textDecoration: 'none' }}>
            dotty.no
          </Link>
          {' · '}
          <Link href="https://instagram.com/dotty.artwork" style={{ color: '#9ca3af', textDecoration: 'none' }}>
            @dotty.artwork
          </Link>
        </Text>
      </Section>

      {transactionText && (
        <Text style={{
          margin: '16px 0 0 0',
          fontSize: '11px',
          color: '#6b7280',
          textAlign: 'center',
        }}>
          {transactionText}
        </Text>
      )}
    </Section>
  );
}
