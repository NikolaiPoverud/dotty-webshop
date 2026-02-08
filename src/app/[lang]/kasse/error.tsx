'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShoppingCart, CreditCard, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const errorText = {
  no: {
    heading: 'Et øyeblikk',
    subheading: 'Noe gikk galt i kassen',
    cartSafe: 'Ikke bekymre deg – handlekurven din er trygt lagret. Ingen betaling har blitt gjennomført.',
    tryAgain: 'Prøv å laste siden på nytt, eller gå tilbake til handlekurven.',
    retry: 'Prøv igjen',
    goToCart: 'Til handlekurven',
    paymentSafe: 'Betalingsinformasjon er aldri lagret lokalt',
    devLabel: 'Dev feilmelding:',
    cartPath: '/no/handlekurv',
  },
  en: {
    heading: 'One moment',
    subheading: 'Something went wrong at checkout',
    cartSafe: 'Don\'t worry – your cart is safely saved. No payment has been processed.',
    tryAgain: 'Try reloading the page, or go back to your cart.',
    retry: 'Try again',
    goToCart: 'Go to cart',
    paymentSafe: 'Payment information is never stored locally',
    devLabel: 'Dev error message:',
    cartPath: '/en/cart',
  },
};

/**
 * ARCH-007: Error boundary for checkout pages
 *
 * Critical error handling for the checkout flow.
 * Provides reassurance about cart preservation and payment safety.
 */
export default function CheckoutError({ error, reset }: ErrorProps) {
  const [lang, setLang] = useState<'no' | 'en'>('no');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLang(window.location.pathname.split('/')[1] === 'en' ? 'en' : 'no');
    }
  }, []);

  useEffect(() => {
    console.error('[Checkout] Error:', {
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
          className="w-20 h-20 mx-auto mb-8 rounded-full bg-warning/10 flex items-center justify-center"
        >
          <CreditCard className="w-10 h-10 text-warning" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="gradient-text">{t.heading}</span>
        </h1>

        <h2 className="text-xl font-semibold text-foreground mb-4">
          {t.subheading}
        </h2>

        <p className="text-muted-foreground mb-4 leading-relaxed">
          {t.cartSafe}
        </p>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          {t.tryAgain}
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
            href={t.cartPath}
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingCart className="w-5 h-5" />
            {t.goToCart}
          </motion.a>
        </div>

        {/* Security reassurance */}
        <div className="mt-8 p-4 bg-success/10 border border-success/20 rounded-lg">
          <p className="text-sm text-success flex items-center justify-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {t.paymentSafe}
          </p>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
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
