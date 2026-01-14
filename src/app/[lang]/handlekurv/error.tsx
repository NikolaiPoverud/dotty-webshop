'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ShoppingBag, ShoppingCart, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * ARCH-007: Error boundary for cart page
 *
 * Handles errors in the shopping cart.
 * Provides reassurance about cart data preservation.
 */
export default function CartError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('[Cart] Error:', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    });
  }, [error]);

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
          <ShoppingCart className="w-10 h-10 text-primary" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="gradient-text">Oisann!</span>
        </h1>

        <h2 className="text-xl font-semibold text-foreground mb-4">
          Kunne ikke vise handlekurven
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Ikke bekymre deg – varene dine er fortsatt lagret.
          Prøv å laste siden på nytt, eller fortsett å handle.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-5 h-5" />
            Last på nytt
          </motion.button>

          <motion.a
            href="/no/shop"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ShoppingBag className="w-5 h-5" />
            Fortsett å handle
          </motion.a>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-12 p-4 bg-muted rounded-lg text-left">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-error" />
              <p className="text-xs font-medium text-muted-foreground">
                Dev feilmelding:
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
