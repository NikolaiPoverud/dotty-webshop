'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import type { Locale } from '@/types';
import { Logo } from '@/components/ui/logo';

const heroText = {
  no: {
    subtitle: 'Et kunstunivers med sterke farger og en leken strek. Uten filter. Begrensede prints og originale verk.',
  },
  en: {
    subtitle: 'An art universe with bold colors and a playful stroke. Unfiltered. Limited prints and original works.',
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: 'easeOut' as const },
};

const pulseAnimation = {
  animate: { opacity: [0.08, 0.12, 0.08] },
  transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const },
};

const bounceAnimation = {
  animate: { y: [0, 8, 0] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
};

interface HeroProps {
  lang: Locale;
}

export function Hero({ lang }: HeroProps): React.ReactNode {
  const t = heroText[lang];

  function scrollToArt(): void {
    document.getElementById('art')?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0 opacity-[0.02] bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[length:24px_24px]" />

      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[120px]"
        {...pulseAnimation}
      />

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fadeInUp}>
          <Logo size="hero" className="mx-auto" />
        </motion.div>

        <motion.p
          className="mt-2 text-lg sm:text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed font-normal"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {t.subtitle}
        </motion.p>
      </div>

      <motion.button
        onClick={scrollToArt}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 text-muted-foreground/50 hover:text-primary transition-colors cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        aria-label="Scroll down"
      >
        <motion.div {...bounceAnimation}>
          <ChevronDown className="w-6 h-6" />
        </motion.div>
      </motion.button>
    </section>
  );
}
