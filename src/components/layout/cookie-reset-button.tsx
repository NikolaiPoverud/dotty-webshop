'use client';

import { resetCookieConsent } from '@/components/gdpr/cookie-consent';

interface CookieResetButtonProps {
  label: string;
}

export function CookieResetButton({ label }: CookieResetButtonProps): React.ReactElement {
  function handleCookieReset(): void {
    resetCookieConsent();
    window.location.reload();
  }

  return (
    <button
      onClick={handleCookieReset}
      className="text-sm text-muted-foreground hover:text-foreground active:text-foreground transition-colors py-2 px-3 touch-manipulation"
    >
      {label}
    </button>
  );
}
