'use client';

import type { Locale } from '@/types';
import type { CheckoutText } from '@/lib/i18n/cart-checkout-text';

interface ConsentCheckboxesProps {
  locale: Locale;
  t: CheckoutText;
  privacyAccepted: boolean;
  newsletterOptIn: boolean;
  onPrivacyChange: (value: boolean) => void;
  onNewsletterChange: (value: boolean) => void;
}

export function ConsentCheckboxes({ locale, t, privacyAccepted, newsletterOptIn, onPrivacyChange, onNewsletterChange }: ConsentCheckboxesProps): React.ReactElement {
  return (
    <div className="mt-6 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          {t.acceptPrivacy}{' '}
          <a
            href={`/${locale}/privacy`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {t.privacyPolicy}
          </a>
          {' *'}
        </span>
      </label>

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(e) => onNewsletterChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          {t.subscribeNewsletter}
        </span>
      </label>
    </div>
  );
}
