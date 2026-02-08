'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, ShoppingBag, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const errorText = {
  no: {
    heading: 'Beklager!',
    subheading: 'Kunne ikke laste butikken',
    description: 'Vi klarte ikke å hente produktene akkurat nå. Dette er vanligvis midlertidig. Prøv å laste siden på nytt om et øyeblikk.',
    retry: 'Last på nytt',
    home: 'Til forsiden',
    devLabel: 'Dev feilmelding:',
  },
  en: {
    heading: 'Sorry!',
    subheading: 'Could not load the shop',
    description: 'We were unable to load the products right now. This is usually temporary. Try reloading the page in a moment.',
    retry: 'Reload',
    home: 'Go to homepage',
    devLabel: 'Dev error message:',
  },
};

/**
 * ARCH-007: Error boundary for shop pages
 *
 * Handles errors in the product listing and detail pages.
 * Provides shop-specific recovery options.
 */
export default function ShopError({ error, reset }: ErrorProps) {
  const [lang, setLang] = useState<'no' | 'en'>('no');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang(window.location.pathname.split('/')[1] === 'en' ? 'en' : 'no');
    }
  }, []);

  useEffect(() => {
    console.error('[Shop] Error:', {
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
          className="w-20 h-20 mx-auto mb-8 rounded-full bg-primary/10 flex items-center justify-center"
        >
          <ShoppingBag className="w-10 h-10 text-primary" />
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

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 p-4 bg-muted rounded-lg text-left">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-error" />
              <p className="text-xs font-medium text-muted-foreground">
                {t.devLabel}
              </p>
            </div>
            <p className="text-sm font-mono text-error break-all">
              {error.message}
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
