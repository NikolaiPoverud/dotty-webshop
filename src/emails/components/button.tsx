import { Button as EmailButton } from '@react-email/components';
import * as React from 'react';

interface ButtonProps {
  href: string;
  children: React.ReactNode;
}

export function Button({ href, children }: ButtonProps) {
  return (
    <EmailButton
      href={href}
      className="rounded-md bg-primary px-6 py-3 text-center text-sm font-semibold text-white no-underline"
    >
      {children}
    </EmailButton>
  );
}
