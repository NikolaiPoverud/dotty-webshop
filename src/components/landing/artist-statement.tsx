'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Locale } from '@/types';

const artistText = {
  no: {
    title: 'Om Dotty.',
    paragraphs: [
      'Dotty er en Oslo-basert kunstner som jobber med digitale tegninger og maleri på lerret og papir. Uttrykket er fargerikt, direkte og lekent, men tar også for seg mer alvorlige temaer der budskapet er viktig.',
      'Kunsten er ment å gi energi og karakter til rommet, enten det får deg til å trekke på smilebåndet eller stoppe opp og reflektere over livets oppturer og nedturer. Selv om uttrykket ofte er lekent og fargerikt, tar kunsten ofte utgangspunkt i seriøse temaer.',
      'Ambisjonen er å utfordre uten å støte, være direkte uten å belære, og formidle erfaringer og perspektiver på en ærlig måte.',
    ],
  },
  en: {
    title: 'About Dotty.',
    paragraphs: [
      'Dotty is an Oslo-based artist working with digital drawings and paintings on canvas and paper. The expression is colorful, direct and playful, but also addresses more serious themes where the message matters.',
      'The art is meant to give energy and character to a space, whether it makes you smile or pause to reflect on life\'s ups and downs. Although the expression is often playful and colorful, the art often stems from serious themes.',
      'The ambition is to challenge without offending, be direct without lecturing, and convey experiences and perspectives in an honest way.',
    ],
  },
};

export function ArtistStatement({ lang }: { lang: Locale }) {
  const t = artistText[lang];

  return (
    <section id="about" className="py-20 sm:py-32 relative overflow-hidden scroll-mt-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Artist Image Placeholder */}
          <motion.div
            className="relative aspect-square max-w-md mx-auto lg:mx-0"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Main image container */}
            <div className="relative bg-muted w-full h-full overflow-hidden rounded-lg">
              <Image
                src="/artist.jpg"
                alt="Dotty - Artist"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              {/* Subtle pink overlay */}
              <div className="absolute inset-0 bg-primary/10" />
            </div>
          </motion.div>

          {/* Text Content */}
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

            {/* Signature dots pattern */}
            <motion.div
              className="mt-8 flex gap-2"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
            >
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-3 h-3 rounded-full bg-primary"
                  initial={{ scale: 0 }}
                  whileInView={{ scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                />
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
