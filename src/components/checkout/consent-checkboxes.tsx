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

const CHECKBOX_CLASS =
  'mt-0.5 w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0';

const LABEL_CLASS =
  'text-sm text-muted-foreground group-hover:text-foreground group-active:text-foreground transition-colors';

export function ConsentCheckboxes({
  locale,
  t,
  privacyAccepted,
  newsletterOptIn,
  onPrivacyChange,
  onNewsletterChange,
}: ConsentCheckboxesProps): React.ReactElement {
  return (
    <div className="mt-6 space-y-3">
      <label className="flex items-start gap-3 cursor-pointer group py-1 touch-manipulation">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
          className={CHECKBOX_CLASS}
        />
        <span className={LABEL_CLASS}>
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

      <label className="flex items-start gap-3 cursor-pointer group py-1 touch-manipulation">
        <input
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(e) => onNewsletterChange(e.target.checked)}
          className={CHECKBOX_CLASS}
        />
        <span className={LABEL_CLASS}>{t.subscribeNewsletter}</span>
      </label>
    </div>
  );
}
