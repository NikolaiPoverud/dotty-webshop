'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cookie } from 'lucide-react';
import Link from 'next/link';
import type { Dictionary, Locale } from '@/types';

const COOKIE_CONSENT_KEY = 'dotty-cookie-consent';

interface CookieConsentProps {
  lang: Locale;
  dictionary: Dictionary;
}

export function CookieConsent({ lang, dictionary }: CookieConsentProps): React.ReactElement | null {
  const [showBanner, setShowBanner] = useState(false);
  const t = dictionary.cookies;

  useEffect(() => {
    const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!consent) {
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  function saveConsent(accepted: boolean): void {
    const consentData = {
      accepted,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setShowBanner(false);

    fetch('/api/gdpr/cookie-consent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ consent_given: accepted }),
    }).catch(() => {
      // Silently fail - consent is already saved locally
    });
  }

  return (
    <AnimatePresence>
      {showBanner && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6"
        >
          <div className="max-w-4xl mx-auto bg-muted border border-border rounded-xl shadow-2xl overflow-hidden">
            {/* Main Banner */}
            <div className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {/* Icon & Text */}
                <div className="flex items-start gap-3 flex-1">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Cookie className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{t.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {t.description}{' '}
                      <Link
                        href={`/${lang}/privacy`}
                        className="text-primary hover:underline"
                      >
                        {t.learnMore}
                      </Link>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => saveConsent(false)}
                    className="flex-1 sm:flex-none px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-background transition-colors"
                  >
                    {t.decline}
                  </button>
                  <button
                    onClick={() => saveConsent(true)}
                    className="flex-1 sm:flex-none px-6 py-2 text-sm font-medium bg-primary text-background rounded-lg hover:bg-primary-light transition-colors"
                  >
                    {t.accept}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Export function to check consent status
export function getCookieConsent(): boolean | null {
  if (typeof window === 'undefined') return null;

  const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
  if (!consent) return null;

  try {
    const data = JSON.parse(consent);
    return data.accepted;
  } catch {
    return null;
  }
}

// Export function to reset consent (for settings page)
export function resetCookieConsent(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(COOKIE_CONSENT_KEY);
}
