'use client';

import { motion } from 'framer-motion';
import type { Locale } from '@/types';

const heroText = {
  no: {
    title: 'Dotty.',
    subtitle: 'Et kunstunivers med sterke farger og en leken strek. Uten filter. Begrensede prints og originale verk.',
  },
  en: {
    title: 'Dotty.',
    subtitle: 'An art universe with bold colors and a playful stroke. Unfiltered. Limited prints and original works.',
  },
};

export function Hero({ lang }: { lang: Locale }) {
  const t = heroText[lang];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />

      {/* Subtle gradient accent */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px]"
        animate={{
          opacity: [0.08, 0.12, 0.08],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Bottom fade for smooth transition */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Title - italic serif for artsy feel */}
        <motion.h1
          className="text-5xl sm:text-7xl lg:text-8xl xl:text-9xl font-bold text-white italic"
          style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontWeight: 700,
            letterSpacing: '-0.02em',
          }}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
        >
          {t.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="mt-8 sm:mt-10 text-lg sm:text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed italic"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {t.subtitle}
        </motion.p>
      </div>
    </section>
  );
}
