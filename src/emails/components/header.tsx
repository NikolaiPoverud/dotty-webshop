import { Section, Text, Img } from '@react-email/components';

interface EmailHeaderProps {
  subtitle?: string;
}

export function EmailHeader({ subtitle }: EmailHeaderProps) {
  return (
    <Section style={{
      backgroundColor: '#FE206A',
      padding: '32px 24px',
      textAlign: 'center',
      borderBottom: '4px solid #000000',
    }}>
      {/* Logo/Brand */}
      <Text style={{
        margin: 0,
        fontSize: '48px',
        fontWeight: 900,
        letterSpacing: '-2px',
        color: '#ffffff',
        textShadow: '3px 3px 0 #000000',
      }}>
        DOTTY<span style={{ color: '#000000' }}>.</span>
      </Text>

      {subtitle && (
        <Text style={{
          margin: '8px 0 0 0',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: '#000000',
          backgroundColor: '#ffffff',
          display: 'inline-block',
          padding: '4px 12px',
        }}>
          {subtitle}
        </Text>
      )}
    </Section>
  );
}
