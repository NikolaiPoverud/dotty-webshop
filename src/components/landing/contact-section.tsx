'use client';

import { motion } from 'framer-motion';
import { Instagram, Mail } from 'lucide-react';
import type { Locale } from '@/types';

const contactText = {
  no: {
    title: 'Kontakt',
    subtitle: 'Har du spørsmål om et kunstverk, bestillinger eller samarbeid? Ta gjerne kontakt.',
    email: 'E-post',
    followUs: 'Følg oss',
  },
  en: {
    title: 'Contact',
    subtitle: 'Have questions about an artwork, orders, or collaborations? Feel free to reach out.',
    email: 'Email',
    followUs: 'Follow us',
  },
};

export function ContactSection({ lang }: { lang: Locale }) {
  const t = contactText[lang];

  return (
    <section id="contact" className="py-20 sm:py-32 relative scroll-mt-20 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.h2
          className="text-4xl sm:text-5xl font-bold mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <span className="gradient-text">{t.title}</span>
        </motion.h2>

        <motion.p
          className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
        >
          {t.subtitle}
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          {/* Email */}
          <a
            href="mailto:hei@dotty.no"
            className="group flex items-center gap-3 px-6 py-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
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
            className="group flex items-center gap-3 px-6 py-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors"
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
