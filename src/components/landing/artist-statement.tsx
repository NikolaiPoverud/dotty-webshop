'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/types';

interface ArtistStatementProps {
  lang: Locale;
}

const artistText: Record<Locale, { title: string; paragraphs: string[]; cta: string }> = {
  no: {
    title: 'Om Dotty.',
    paragraphs: [
      'Dotty er en Oslo-basert kunstner som jobber med digitale tegninger og maleri på lerret og papir. Uttrykket er fargerikt, direkte og lekent, men tar også for seg mer alvorlige temaer der budskapet er viktig.',
      'Kunsten er ment å gi energi og karakter til rommet, enten det får deg til å trekke på smilebåndet eller stoppe opp og reflektere over livets oppturer og nedturer. Selv om uttrykket ofte er lekent og fargerikt, tar kunsten ofte utgangspunkt i seriøse temaer.',
      'Ambisjonen er å utfordre uten å støte, være direkte uten å belære, og formidle erfaringer og perspektiver på en ærlig måte.',
    ],
    cta: 'Se alle verk',
  },
  en: {
    title: 'About Dotty.',
    paragraphs: [
      'Dotty is an Oslo-based artist working with digital drawings and paintings on canvas and paper. The expression is colorful, direct and playful, but also addresses more serious themes where the message matters.',
      'The art is meant to give energy and character to a space, whether it makes you smile or pause to reflect on life\'s ups and downs. Although the expression is often playful and colorful, the art often stems from serious themes.',
      'The ambition is to challenge without offending, be direct without lecturing, and convey experiences and perspectives in an honest way.',
    ],
    cta: 'View all works',
  },
};

export function ArtistStatement({ lang }: ArtistStatementProps): React.ReactElement {
  const t = artistText[lang];

  return (
    <section id="about" className="py-20 sm:py-32 relative overflow-hidden scroll-mt-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <motion.div
            className="relative aspect-square max-w-md mx-auto lg:mx-0 bg-muted overflow-hidden rounded-lg"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Image
              src="/artist.jpg"
              alt="Dotty - Artist"
              fill
              priority
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-primary/10" />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              <span className="gradient-text">{t.title}</span>
            </h2>

            <div className="space-y-4">
              {t.paragraphs.map((paragraph, index) => (
                <p key={index} className="text-lg text-muted-foreground leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    className="w-3 h-3 rounded-full bg-primary"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + i * 0.1 }}
                  />
                ))}
              </div>
              <Link
                href={getLocalizedPath(lang, 'shop')}
                className="text-primary font-medium hover:underline active:underline transition-colors py-2 touch-manipulation"
              >
                {t.cta} →
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
