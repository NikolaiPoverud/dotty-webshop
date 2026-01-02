'use client';

import { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Admin error:', error);
  }, [error]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center max-w-md p-8">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-error" />
        </div>
        <h2 className="text-xl font-semibold mb-4">Feil i admin-panelet</h2>
        <p className="text-muted-foreground mb-6">
          Det oppstod en feil. Vennligst prøv igjen eller kontakt support hvis problemet vedvarer.
        </p>
        <div className="space-y-3">
          <button
            onClick={reset}
            className="w-full px-4 py-2 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors"
          >
            Prøv igjen
          </button>
          <a
            href="/admin"
            className="block w-full px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
          >
            Tilbake til dashboard
          </a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-6 p-4 bg-error/10 border border-error/20 rounded-lg text-left">
            <p className="text-xs font-mono text-error break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-muted-foreground mt-2">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
