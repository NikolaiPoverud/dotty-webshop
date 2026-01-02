'use client';

import { motion } from 'framer-motion';
import type { Locale } from '@/types';

const heroText = {
  no: {
    title: 'Pop Art med Attitude',
    subtitle: 'Kraftfull pop art som fusjonerer gatekultur med klassisk skjønnhet. Fargesterk, uredd, uforglemmelig.',
  },
  en: {
    title: 'Pop Art with Attitude',
    subtitle: 'Powerful pop art fusing street culture with classic beauty. Bold, fearless, unforgettable.',
  },
};

export function Hero({ lang }: { lang: Locale }) {
  const t = heroText[lang];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-neutral-900">
      {/* Subtle texture overlay */}
      <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />

      {/* Subtle gradient accent */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px]"
        animate={{
          opacity: [0.1, 0.15, 0.1],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

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
