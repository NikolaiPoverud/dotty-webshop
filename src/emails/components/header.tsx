import { Heading, Section, Text } from '@react-email/components';

interface EmailHeaderProps {
  subtitle?: string;
}

export function EmailHeader({ subtitle }: EmailHeaderProps) {
  return (
    <Section className="mb-8 rounded-t-2xl bg-card px-8 py-8 text-center">
      <Heading className="m-0 text-4xl font-extrabold tracking-tight">
        <span className="text-primary">Dotty</span>
        <span className="text-foreground">.</span>
      </Heading>
      {subtitle && (
        <Text className="m-0 mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          {subtitle}
        </Text>
      )}
    </Section>
  );
}
