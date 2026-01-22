'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import type { Dictionary, Locale } from '@/types';
import { Logo } from '@/components/ui/logo';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: 'easeOut' as const },
};

const bounceAnimation = {
  animate: { y: [0, 10, 0] },
  transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' as const },
};

const pulseRing = {
  animate: {
    scale: [1, 1.3, 1],
    opacity: [0.5, 0, 0.5],
  },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
};

interface HeroProps {
  lang: Locale;
  dictionary: Dictionary;
}

export function Hero({ lang, dictionary }: HeroProps): React.ReactNode {
  const t = dictionary.hero;

  function scrollToArt(): void {
    const artSection = document.getElementById('art');
    if (artSection) {
      const rect = artSection.getBoundingClientRect();
      const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
      window.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Hero background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-background/20" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10">
        <motion.div {...fadeInUp}>
          <Logo size="hero" className="mx-auto" aria-hidden="true" />
        </motion.div>
      </div>

      {/* Scroll button with enhanced mobile tap target */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
        {/* Pulsing ring for attention */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-primary/50"
          {...pulseRing}
        />
        <motion.button
          onClick={scrollToArt}
          className="group relative
                     w-14 h-14 sm:w-14 sm:h-14
                     bg-background border-[3px] border-primary
                     flex items-center justify-center
                     transition-all duration-200
                     hover:bg-primary active:bg-primary
                     shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_6px_0_0_theme(colors.primary)]
                     hover:-translate-y-1 active:translate-y-1 active:shadow-none cursor-pointer"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileTap={{ scale: 0.95 }}
          aria-label="Scroll down"
        >
          <motion.div {...bounceAnimation}>
            <ChevronDown className="w-8 h-8 text-primary group-hover:text-background group-active:text-background transition-colors" strokeWidth={3} />
          </motion.div>
        </motion.button>
      </div>
    </section>
  );
}
