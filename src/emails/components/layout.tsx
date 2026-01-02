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
                // Dotty Brand Colors - Matching Website
                background: '#131316',
                card: '#1a1a1f',
                border: '#3f3f46',
                primary: '#FE206A',
                'primary-dark': '#E01A5E',
                'primary-light': '#FF4D8A',
                foreground: '#fafafa',
                muted: '#27272a',
                'muted-foreground': '#a1a1aa',
                success: '#22c55e',
                error: '#ef4444',
                accent: '#a855f7',
              },
            },
          },
        }}
      >
        <Body className="bg-background font-sans">
          <Container className="mx-auto max-w-[600px] px-4 py-10">
            {children}
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
