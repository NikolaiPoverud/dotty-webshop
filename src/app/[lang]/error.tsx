'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const errorText = {
  no: {
    heading: 'Oisann!',
    subheading: 'Noe gikk galt',
    description: 'Beklager, det oppstod en uventet feil. Prøv å laste siden på nytt, eller gå tilbake til forsiden.',
    retry: 'Prøv igjen',
    home: 'Til forsiden',
    devLabel: 'Feildetaljer (kun synlig i utvikling):',
    persist: 'Vedvarer problemet?',
    contactUs: 'Kontakt oss',
  },
  en: {
    heading: 'Oops!',
    subheading: 'Something went wrong',
    description: 'Sorry, an unexpected error occurred. Try reloading the page, or go back to the homepage.',
    retry: 'Try again',
    home: 'Go to homepage',
    devLabel: 'Error details (only visible in development):',
    persist: 'Problem persisting?',
    contactUs: 'Contact us',
  },
};

/**
 * ARCH-007: Error boundary for public-facing routes
 *
 * Provides user-friendly error handling for customer pages.
 * Logs errors for debugging while showing a polished UI.
 */
export default function PublicError({ error, reset }: ErrorProps) {
  const [lang, setLang] = useState<'no' | 'en'>('no');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang(window.location.pathname.split('/')[1] === 'en' ? 'en' : 'no');
    }
  }, []);

  useEffect(() => {
    console.error('[PublicRoute] Error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

  const t = errorText[lang];

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
          className="w-20 h-20 mx-auto mb-8 rounded-full bg-error/10 flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-error" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="gradient-text">{t.heading}</span>
        </h1>

        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t.subheading}
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-5 h-5" />
            {t.retry}
          </motion.button>

          <motion.a
            href={`/${lang}`}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Home className="w-5 h-5" />
            {t.home}
          </motion.a>
        </div>

        {/* Error details for development */}
        {process.env.NODE_ENV === 'development' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-12 p-4 bg-muted rounded-lg text-left"
          >
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t.devLabel}
            </p>
            <p className="text-sm font-mono text-error break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs font-mono text-muted-foreground mt-2">
                Digest: {error.digest}
              </p>
            )}
          </motion.div>
        )}

        {/* Contact info for persistent issues */}
        <p className="mt-8 text-sm text-muted-foreground">
          {t.persist}{' '}
          <a href={`/${lang}/about#contact`} className="text-primary hover:underline">
            {t.contactUs}
          </a>
        </p>
      </motion.div>
    </div>
  );
}
