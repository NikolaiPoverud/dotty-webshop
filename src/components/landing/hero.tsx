'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Locale } from '@/types';

const heroText = {
  no: {
    title: 'Pop-art med personlighet',
    subtitle: 'Unike kunstverk som bringer energi og farge til ditt hjem',
  },
  en: {
    title: 'Pop-art with personality',
    subtitle: 'Unique artworks that bring energy and color to your home',
  },
};

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
          </motion.div>

          {/* Artist Image */}
          <motion.div
            className="relative flex items-center justify-center"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.3 }}
          >
            <motion.div
              className="relative w-80 h-96 sm:w-96 sm:h-[480px] lg:w-[420px] lg:h-[520px] rounded-2xl overflow-hidden glow-pink"
              initial={{ opacity: 0, y: 30, rotate: -3 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
              whileHover={{ rotate: 0, scale: 1.02 }}
            >
              {/* Artist photo placeholder - replace src with actual image */}
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-accent to-accent-2">
                <Image
                  src="/artist.jpg"
                  alt="Dotty - Pop-art artist"
                  fill
                  className="object-cover"
                  priority
                  onError={(e) => {
                    // Hide image on error, show gradient placeholder
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              {/* Decorative border */}
              <div className="absolute inset-0 border-4 border-background/20 rounded-2xl pointer-events-none" />
            </motion.div>

            {/* Decorative elements */}
            <motion.div
              className="absolute -bottom-4 -right-4 w-24 h-24 bg-accent rounded-full blur-xl opacity-60"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
            />
            <motion.div
              className="absolute -top-4 -left-4 w-20 h-20 bg-primary rounded-full blur-xl opacity-60"
              animate={{ scale: [1.2, 1, 1.2] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
            />
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
