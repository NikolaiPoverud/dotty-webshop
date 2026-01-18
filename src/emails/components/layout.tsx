import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
  Font,
} from '@react-email/components';
import type { ReactNode } from 'react';

interface EmailLayoutProps {
  preview: string;
  children: ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head>
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={400}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuI6fAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
        <Font
          fontFamily="Inter"
          fallbackFontFamily="Helvetica"
          webFont={{
            url: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hiJ-Ek-_EeA.woff2',
            format: 'woff2',
          }}
          fontWeight={900}
          fontStyle="normal"
        />
      </Head>
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                // Dotty Pop Art Colors
                background: '#0a0a0b',
                card: '#131316',
                'card-alt': '#1a1a1f',
                border: '#2a2a2f',
                primary: '#FE206A',
                'primary-dark': '#d41857',
                'primary-light': '#ff4d8a',
                foreground: '#ffffff',
                muted: '#1f1f23',
                'muted-foreground': '#9ca3af',
                success: '#10b981',
                warning: '#f59e0b',
                accent: '#8b5cf6',
                cyan: '#06b6d4',
                yellow: '#fbbf24',
              },
            },
          },
        }}
      >
        <Body className="bg-background m-0 p-0" style={{ fontFamily: 'Inter, Helvetica, Arial, sans-serif' }}>
          <Container className="mx-auto max-w-[600px] py-8">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
