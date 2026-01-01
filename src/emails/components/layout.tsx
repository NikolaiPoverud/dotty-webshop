import {
  Body,
  Container,
  Head,
  Html,
  Preview,
  Tailwind,
} from '@react-email/components';
import * as React from 'react';

interface EmailLayoutProps {
  preview: string;
  children: React.ReactNode;
}

export function EmailLayout({ preview, children }: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind
        config={{
          theme: {
            extend: {
              colors: {
                background: '#0f0f14',
                card: '#1a1a1f',
                border: '#2a2a30',
                primary: '#FF1493',
                'primary-dark': '#cc1078',
                foreground: '#ffffff',
                muted: '#a3a3a8',
                success: '#22c55e',
              },
            },
          },
        }}
      >
        <Body className="bg-background font-sans">
          <Container className="mx-auto max-w-[600px] px-6 py-10">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
