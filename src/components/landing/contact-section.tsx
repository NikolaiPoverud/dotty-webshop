'use client';

import { motion } from 'framer-motion';
import { Send, Loader2 } from 'lucide-react';
import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
import { useState } from 'react';
import type { Dictionary, Locale } from '@/types';

interface ContactSectionProps {
  lang: Locale;
  dictionary: Dictionary;
}

type FormState = 'idle' | 'loading' | 'success' | 'error';

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
};

const inputClassName =
  'w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all';

function getButtonContent(state: FormState, t: Dictionary['contact']): React.ReactNode {
  switch (state) {
    case 'loading':
      return (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          {t.sending}
        </>
      );
    case 'success':
      return t.success;
    case 'error':
      return t.error;
    default:
      return (
        <>
          <Send className="w-5 h-5" />
          {t.send}
        </>
      );
  }
}

const emptyFormData = { name: '', email: '', message: '' };

export function ContactSection({ lang, dictionary }: ContactSectionProps): React.ReactElement {
  const t = dictionary.contact;
  const [formState, setFormState] = useState<FormState>('idle');
  const [formData, setFormData] = useState(emptyFormData);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setFormState('loading');

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setFormState('success');
      setFormData(emptyFormData);
    } else {
      setFormState('error');
    }

    setTimeout(() => setFormState('idle'), 3000);
  }

  return (
    <section id="contact" className="py-16 sm:py-24 relative scroll-mt-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.p className="text-primary font-medium text-lg mb-2 text-center" {...fadeInUp}>
          {t.greeting}
        </motion.p>

        <motion.h2
          className="text-4xl sm:text-5xl font-bold mb-6 text-center"
          {...fadeInUp}
          transition={{ delay: 0.05 }}
        >
          <span className="gradient-text">{t.title}</span>
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-center"
          {...fadeInUp}
          transition={{ delay: 0.1 }}
        >
          {t.subtitle}
        </motion.p>

        <motion.form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto space-y-4 mb-6"
          {...fadeInUp}
          transition={{ delay: 0.15 }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.namePlaceholder}
              className={inputClassName}
            />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t.emailPlaceholder}
              className={inputClassName}
            />
          </div>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t.messagePlaceholder}
            className={`${inputClassName} resize-none`}
          />

          <motion.button
            type="submit"
            disabled={formState === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-4 bg-background border-2 sm:border-[3px] border-primary text-primary font-bold uppercase tracking-wider sm:tracking-widest text-sm sm:text-base transition-all duration-200 hover:bg-primary hover:text-background disabled:opacity-50 disabled:hover:bg-background disabled:hover:text-primary shadow-[0_3px_0_0_theme(colors.primary)] sm:shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_4px_0_0_theme(colors.primary)] sm:hover:shadow-[0_6px_0_0_theme(colors.primary)] hover:-translate-y-0.5"
            whileTap={{ scale: 0.98, y: 2 }}
          >
            {getButtonContent(formState, t)}
          </motion.button>

          <p className="text-xs text-muted-foreground text-center">
            {t.privacyNotice}{' '}
            <a href={`/${lang}/privacy`} className="text-primary hover:underline">
              {t.privacyLink}
            </a>
            .
          </p>
        </motion.form>

        <div className="flex justify-center gap-3">
          <motion.a
            href="https://instagram.com/dottyartwork"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-5 py-3 bg-muted rounded-full hover:bg-primary/20 transition-colors"
            {...fadeInUp}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <SiInstagram className="w-5 h-5 text-primary" />
            <span className="font-medium group-hover:text-primary transition-colors">@dottyartwork</span>
          </motion.a>
          <motion.a
            href="https://tiktok.com/@dottyartwork"
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-2 px-5 py-3 bg-muted rounded-full hover:bg-primary/20 transition-colors"
            {...fadeInUp}
            transition={{ delay: 0.25 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            <SiTiktok className="w-5 h-5 text-primary" />
            <span className="font-medium group-hover:text-primary transition-colors">@dottyartwork</span>
          </motion.a>
        </div>
      </div>
    </section>
  );
}
