import { Button as EmailButton } from '@react-email/components';
import type { ReactNode } from 'react';

interface ButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary';
}

export function Button({ href, children, variant = 'primary' }: ButtonProps) {
  const isPrimary = variant === 'primary';

  return (
    <EmailButton
      href={href}
      style={{
        backgroundColor: isPrimary ? '#FE206A' : '#ffffff',
        color: isPrimary ? '#ffffff' : '#000000',
        padding: '14px 32px',
        fontSize: '14px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '1px',
        textDecoration: 'none',
        display: 'inline-block',
        border: '3px solid #000000',
        boxShadow: '4px 4px 0 #000000',
      }}
    >
      {children}
    </EmailButton>
  );
}
