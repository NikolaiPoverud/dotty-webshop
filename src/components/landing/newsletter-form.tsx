'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { Send, Check, Loader2 } from 'lucide-react';
import type { Locale } from '@/types';

const newsletterText = {
  no: {
    title: 'Hold deg oppdatert',
    subtitle: 'Få beskjed om nye verk og eksklusive tilbud',
    placeholder: 'Din e-postadresse',
    subscribe: 'Abonner',
    success: 'Takk for at du abonnerer!',
    error: 'Noe gikk galt. Prøv igjen.',
  },
  en: {
    title: 'Stay updated',
    subtitle: 'Get notified about new works and exclusive offers',
    placeholder: 'Your email address',
    subscribe: 'Subscribe',
    success: 'Thank you for subscribing!',
    error: 'Something went wrong. Try again.',
  },
};

export function NewsletterForm({ lang }: { lang: Locale }) {
  const t = newsletterText[lang];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');

    try {
      const response = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        throw new Error('Failed to subscribe');
      }

      setStatus('success');
      setEmail('');

      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');

      // Reset after 3 seconds
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <div className="text-center max-w-xl mx-auto">
      <motion.h3
        className="text-2xl sm:text-3xl font-bold mb-2"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
      >
        {t.title}
      </motion.h3>

      <motion.p
        className="text-muted-foreground mb-6"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1 }}
      >
        {t.subtitle}
      </motion.p>

      <motion.form
        onSubmit={handleSubmit}
        className="flex flex-col sm:flex-row gap-3"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2 }}
      >
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.placeholder}
          required
          disabled={status === 'loading' || status === 'success'}
          className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all disabled:opacity-50"
        />

        <motion.button
          type="submit"
          disabled={status === 'loading' || status === 'success'}
          className="px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {status === 'loading' && (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
          {status === 'success' && (
            <Check className="w-4 h-4" />
          )}
          {status === 'idle' && (
            <Send className="w-4 h-4" />
          )}
          <span>
            {status === 'success' ? t.success : t.subscribe}
          </span>
        </motion.button>
      </motion.form>

      {status === 'error' && (
        <motion.p
          className="text-error text-sm mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {t.error}
        </motion.p>
      )}
    </div>
  );
}
