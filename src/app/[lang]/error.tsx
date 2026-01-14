'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home, AlertCircle } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * ARCH-007: Error boundary for public-facing routes
 *
 * Provides user-friendly error handling for customer pages.
 * Logs errors for debugging while showing a polished UI.
 */
export default function PublicError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error for debugging (could be extended to send to error tracking service)
    console.error('[PublicRoute] Error:', {
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
          className="w-20 h-20 mx-auto mb-8 rounded-full bg-error/10 flex items-center justify-center"
        >
          <AlertCircle className="w-10 h-10 text-error" />
        </motion.div>

        <h1 className="text-3xl sm:text-4xl font-bold mb-4">
          <span className="gradient-text">Oisann!</span>
        </h1>

        <h2 className="text-xl font-semibold text-foreground mb-4">
          Noe gikk galt
        </h2>

        <p className="text-muted-foreground mb-8 leading-relaxed">
          Beklager, det oppstod en uventet feil. Prøv å laste siden på nytt,
          eller gå tilbake til forsiden.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <RefreshCw className="w-5 h-5" />
            Prøv igjen
          </motion.button>

          <motion.a
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Home className="w-5 h-5" />
            Til forsiden
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
              Feildetaljer (kun synlig i utvikling):
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
          Vedvarer problemet?{' '}
          <a href="/no/about#contact" className="text-primary hover:underline">
            Kontakt oss
          </a>
        </p>
      </motion.div>
    </div>
  );
}
