'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/types';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const heroText = {
  no: {
    title: 'Pop-art med personlighet',
    subtitle: 'Unike kunstverk som bringer energi og farge til ditt hjem',
    cta: 'Utforsk butikken',
  },
  en: {
    title: 'Pop-art with personality',
    subtitle: 'Unique artworks that bring energy and color to your home',
    cta: 'Explore the shop',
  },
};

// Placeholder artwork - in production these come from DB
const placeholderArtwork = [
  { id: 1, color: 'from-primary to-accent' },
  { id: 2, color: 'from-accent to-accent-2' },
  { id: 3, color: 'from-accent-2 to-primary' },
];

export function Hero({ lang }: { lang: Locale }) {
  const t = heroText[lang];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 halftone-pattern pointer-events-none" />

      {/* Gradient Orbs */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 4,
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Text Content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-center lg:text-left"
          >
            <motion.h1
              className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="block">
                <span className="gradient-text">{t.title.split(' ')[0]}</span>
              </span>
              <span className="block mt-2">
                {t.title.split(' ').slice(1).join(' ')}
              </span>
            </motion.h1>

            <motion.p
              className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              {t.subtitle}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="mt-10"
            >
              <Link
                href={getLocalizedPath(lang, 'shop')}
                className="inline-block"
              >
                <motion.button
                  className="px-8 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest pop-outline transition-all duration-300 hover:bg-primary-light"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.cta}
                </motion.button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Artwork Showcase */}
          <motion.div
            className="relative h-[400px] sm:h-[500px] lg:h-[600px]"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          >
            {/* Stacked Artwork Cards */}
            {placeholderArtwork.map((art, index) => (
              <motion.div
                key={art.id}
                className={`absolute w-64 h-80 sm:w-72 sm:h-96 rounded-lg bg-gradient-to-br ${art.color} glow-pink`}
                style={{
                  top: `${index * 8}%`,
                  left: `${index * 12}%`,
                  zIndex: placeholderArtwork.length - index,
                }}
                initial={{ opacity: 0, y: 50, rotate: -5 + index * 5 }}
                animate={{ opacity: 1, y: 0, rotate: -5 + index * 5 }}
                transition={{
                  duration: 0.6,
                  delay: 0.5 + index * 0.15,
                  ease: 'easeOut',
                }}
                whileHover={{
                  y: -10,
                  rotate: 0,
                  scale: 1.02,
                  zIndex: 10,
                }}
              >
                {/* Placeholder for actual artwork images */}
                <div className="absolute inset-0 flex items-center justify-center text-background/50 text-sm font-medium">
                  Artwork {art.id}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-6 h-10 border-2 border-foreground/30 rounded-full flex items-start justify-center p-2"
          animate={{ y: [0, 5, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <motion.div
            className="w-1 h-2 bg-primary rounded-full"
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </motion.div>
      </motion.div>
    </section>
  );
}
