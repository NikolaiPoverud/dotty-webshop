'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Locale } from '@/types';

const artistText = {
  no: {
    title: 'Om Dotty.',
    statement: 'Pop-art som utfordrer det vanlige og feirer det uventede. Hvert verk er en eksplosjon av farge og energi, skapt for å bringe glede og personlighet til ditt rom.',
    quote: '"Kunst skal ikke være stille. Den skal rope, danse, og få deg til å smile."',
  },
  en: {
    title: 'About Dotty.',
    statement: 'Pop-art that challenges the ordinary and celebrates the unexpected. Each piece is an explosion of color and energy, created to bring joy and personality to your space.',
    quote: '"Art should not be quiet. It should shout, dance, and make you smile."',
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

            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {t.statement}
            </p>

            {/* Quote */}
            <motion.blockquote
              className="relative pl-6 border-l-4 border-primary"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <p className="text-xl sm:text-2xl font-medium italic text-foreground/90">
                {t.quote}
              </p>
              <footer className="mt-4 text-primary font-semibold">
                — Dotty
              </footer>
            </motion.blockquote>

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
