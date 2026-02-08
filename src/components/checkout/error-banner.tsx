'use client';

import { motion } from 'framer-motion';
import { AlertCircle, X } from 'lucide-react';

interface ErrorBannerProps {
  error: string;
  description?: string;
  onDismiss: () => void;
}

export function ErrorBanner({ error, description, onDismiss }: ErrorBannerProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3"
    >
      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-error">{error}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}
