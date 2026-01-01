import { Heading, Section, Text } from '@react-email/components';
import * as React from 'react';

interface EmailHeaderProps {
  subtitle?: string;
}

export function EmailHeader({ subtitle }: EmailHeaderProps) {
  return (
    <Section className="mb-8 border-l-4 border-primary pl-4">
      <Heading className="m-0 text-2xl font-bold text-foreground">
        Dotty<span className="text-primary">.</span>
      </Heading>
      {subtitle && (
        <Text className="m-0 mt-1 text-sm text-muted">{subtitle}</Text>
      )}
    </Section>
  );
}
