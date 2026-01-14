'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { Check, Loader2, Send } from 'lucide-react';

import type { Locale } from '@/types';

interface NewsletterFormProps {
  lang: Locale;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'already' | 'error';

const newsletterText = {
  no: {
    title: 'Hold deg oppdatert',
    subtitle: 'Få beskjed om nye verk og eksklusive tilbud',
    placeholder: 'Din e-postadresse',
    subscribe: 'Abonner',
    success: 'Sjekk e-posten din!',
    successMessage: 'Vi har sendt deg en bekreftelseslenke. Klikk på den for å fullføre abonnementet.',
    alreadySubscribed: 'Du er allerede abonnent!',
    error: 'Noe gikk galt. Prøv igjen.',
  },
  en: {
    title: 'Stay updated',
    subtitle: 'Get notified about new works and exclusive offers',
    placeholder: 'Your email address',
    subscribe: 'Subscribe',
    success: 'Check your email!',
    successMessage: "We've sent you a confirmation link. Click it to complete your subscription.",
    alreadySubscribed: "You're already subscribed!",
    error: 'Something went wrong. Try again.',
  },
};

export function NewsletterForm({ lang }: NewsletterFormProps): React.ReactElement {
  const t = newsletterText[lang];
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');

  async function handleSubmit(e: React.FormEvent): Promise<void> {
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

      const data = await response.json();
      const newStatus = data.message === 'Already subscribed' ? 'already' : 'success';

      setStatus(newStatus);
      setEmail('');
      setTimeout(() => setStatus('idle'), 5000);
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus('error');
      setTimeout(() => setStatus('idle'), 3000);
    }
  }

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

      {status === 'success' || status === 'already' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-success border-[3px] border-success text-background p-4 shadow-[4px_4px_0_0_theme(colors.success)]"
        >
          <div className="flex items-center justify-center gap-2 mb-2">
            <Check className="w-5 h-5" />
            <span className="font-bold uppercase tracking-wider">
              {status === 'already' ? t.alreadySubscribed : t.success}
            </span>
          </div>
          {status === 'success' && (
            <p className="text-sm text-background/80">{t.successMessage}</p>
          )}
        </motion.div>
      ) : (
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
            disabled={status === 'loading'}
            className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-background border-2 sm:border-[3px] border-muted-foreground/30 focus:outline-none focus:border-primary focus:shadow-[2px_2px_0_0_theme(colors.primary)] sm:focus:shadow-[3px_3px_0_0_theme(colors.primary)] transition-all disabled:opacity-50 text-sm sm:text-base"
          />

          <motion.button
            type="submit"
            disabled={status === 'loading'}
            className="px-4 sm:px-6 py-2.5 sm:py-3 bg-background border-2 sm:border-[3px] border-primary text-primary font-bold uppercase tracking-wider text-sm sm:text-base transition-all duration-200 hover:bg-primary hover:text-background disabled:opacity-50 flex items-center justify-center gap-2 shadow-[2px_2px_0_0_theme(colors.primary)] sm:shadow-[4px_4px_0_0_theme(colors.primary)] hover:shadow-[3px_3px_0_0_theme(colors.primary)] sm:hover:shadow-[6px_6px_0_0_theme(colors.primary)] hover:-translate-x-0.5 hover:-translate-y-0.5"
            whileTap={{ scale: 0.98, x: 2, y: 2 }}
          >
            {status === 'loading' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">{t.subscribe}</span>
          </motion.button>
        </motion.form>
      )}

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
