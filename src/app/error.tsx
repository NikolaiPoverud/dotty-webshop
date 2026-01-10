'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-4xl font-bold text-primary mb-4">Oops!</h1>
        <h2 className="text-xl font-semibold mb-4">Noe gikk galt</h2>
        <p className="text-muted-foreground mb-8">
          Vi beklager, men det oppstod en feil. Vennligst prøv igjen.
        </p>
        <div className="space-y-4">
          <button
            onClick={reset}
            className="w-full px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors"
          >
            Prøv igjen
          </button>
          <a
            href="/"
            className="block w-full px-6 py-3 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Gå til forsiden
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && error.message && (
          <div className="mt-8 p-4 bg-muted rounded-lg text-left">
            <p className="text-sm font-mono text-error break-all">
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
