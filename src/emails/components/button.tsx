import { Button as EmailButton } from '@react-email/components';
import type { ReactNode } from 'react';

interface ButtonProps {
  href: string;
  children: ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      className="rounded-full bg-primary px-10 py-4 text-center text-sm font-bold uppercase tracking-wider text-white no-underline"
      style={{
        background: 'linear-gradient(135deg, #FE206A 0%, #E01A5E 100%)',
        boxShadow: '0 4px 16px rgba(254, 32, 106, 0.3)',
      }}
    >
      {children}
    </EmailButton>
  );
}
