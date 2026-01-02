'use client';

import { motion } from 'framer-motion';
import { Instagram, Mail, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { Locale } from '@/types';

const contactText = {
  no: {
    greeting: 'Hei du!',
    title: 'La oss snakke',
    subtitle: 'Har du et spørsmål, vil bestille noe spesielt, eller bare si hei? Jeg svarer alltid personlig.',
    namePlaceholder: 'Ditt navn',
    emailPlaceholder: 'Din e-post',
    messagePlaceholder: 'Hva tenker du på?',
    send: 'Send melding',
    sending: 'Sender...',
    success: 'Takk! Jeg svarer så fort jeg kan.',
    error: 'Noe gikk galt. Prøv igjen eller send e-post direkte.',
    or: 'eller kontakt meg direkte',
    email: 'E-post',
    followUs: 'Følg meg',
  },
  en: {
    greeting: 'Hey there!',
    title: "Let's talk",
    subtitle: "Have a question, want to order something special, or just say hi? I always reply personally.",
    namePlaceholder: 'Your name',
    emailPlaceholder: 'Your email',
    messagePlaceholder: "What's on your mind?",
    send: 'Send message',
    sending: 'Sending...',
    success: "Thanks! I'll get back to you soon.",
    error: 'Something went wrong. Try again or email me directly.',
    or: 'or reach me directly',
    email: 'Email',
    followUs: 'Follow me',
  },
};

export function ContactSection({ lang }: { lang: Locale }) {
  const t = contactText[lang];
  const [formState, setFormState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormState('loading');

    try {
      // For now, open mailto with the message
      const subject = encodeURIComponent(`Melding fra ${formData.name}`);
      const body = encodeURIComponent(`Fra: ${formData.name}\nE-post: ${formData.email}\n\n${formData.message}`);
      window.location.href = `mailto:hei@dotty.no?subject=${subject}&body=${body}`;

      setFormState('success');
      setFormData({ name: '', email: '', message: '' });

      // Reset after 3 seconds
      setTimeout(() => setFormState('idle'), 3000);
    } catch {
      setFormState('error');
      setTimeout(() => setFormState('idle'), 3000);
    }
  };

  return (
    <section id="contact" className="py-20 sm:py-32 relative scroll-mt-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Personal Greeting */}
        <motion.p
          className="text-primary font-medium text-lg mb-2 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t.greeting}
        </motion.p>

        <motion.h2
          className="text-4xl sm:text-5xl font-bold mb-6 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05 }}
        >
          <span className="gradient-text">{t.title}</span>
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t.subtitle}
        </motion.p>

        {/* Contact Form */}
        <motion.form
          onSubmit={handleSubmit}
          className="max-w-xl mx-auto space-y-4 mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15 }}
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t.namePlaceholder}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder={t.emailPlaceholder}
              className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
          <textarea
            required
            rows={4}
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder={t.messagePlaceholder}
            className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none"
          />

          <motion.button
            type="submit"
            disabled={formState === 'loading'}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background font-semibold uppercase tracking-widest rounded-lg transition-all duration-300 hover:bg-primary-light disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {formState === 'loading' ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {t.sending}
              </>
            ) : formState === 'success' ? (
              t.success
            ) : formState === 'error' ? (
              t.error
            ) : (
              <>
                <Send className="w-5 h-5" />
                {t.send}
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Divider */}
        <motion.p
          className="text-sm text-muted-foreground text-center mb-8"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {t.or}
        </motion.p>

        {/* Direct Contact */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
        >
          {/* Email */}
          <a
            href="mailto:hei@dotty.no"
            className="group flex items-center gap-3 px-5 py-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Mail className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.email}</p>
              <p className="font-medium group-hover:text-primary transition-colors">hei@dotty.no</p>
            </div>
          </a>

          {/* Instagram */}
          <a
            href="https://instagram.com/dotty.art"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 px-5 py-3 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
          >
            <Instagram className="w-5 h-5 text-primary" />
            <div className="text-left">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">{t.followUs}</p>
              <p className="font-medium group-hover:text-primary transition-colors">@dotty.art</p>
            </div>
          </a>
        </motion.div>
      </div>
    </section>
  );
}
