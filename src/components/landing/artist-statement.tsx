'use client';

import { motion } from 'framer-motion';
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
    <section className="py-20 sm:py-32 relative overflow-hidden">
      {/* Background accent */}
      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/2 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />

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
            {/* Decorative frame */}
            <div className="absolute inset-0 border-4 border-primary translate-x-4 translate-y-4" />

            {/* Main image container */}
            <div className="relative bg-gradient-to-br from-muted to-muted/50 w-full h-full">
              {/* Placeholder - replace with actual artist photo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="text-6xl mb-4">🎨</div>
                  <p className="text-sm uppercase tracking-widest">Artist Photo</p>
                </div>
              </div>

              {/* Halftone overlay */}
              <div className="absolute inset-0 halftone-pattern opacity-50" />
            </div>

            {/* Floating accent */}
            <motion.div
              className="absolute -bottom-8 -right-8 w-24 h-24 bg-primary rounded-full opacity-20"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
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
