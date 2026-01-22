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
  animate: { y: [0, 8, 0] },
  transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' as const },
};

interface HeroProps {
  lang: Locale;
  dictionary: Dictionary;
}

export function Hero({ lang, dictionary }: HeroProps): React.ReactNode {
  const t = dictionary.hero;

  function scrollToArt(): void {
    document.getElementById('art')?.scrollIntoView({ behavior: 'smooth' });
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
        <div className="absolute inset-0 bg-background/40" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div {...fadeInUp}>
          <Logo size="hero" className="mx-auto" aria-hidden="true" />
          <h1 className="mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            {t.headline}
          </h1>
        </motion.div>

        <motion.p
          className="mt-3 text-lg sm:text-xl lg:text-2xl text-neutral-400 max-w-3xl mx-auto leading-relaxed font-normal"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          {t.subtitle}
        </motion.p>

      </div>

      <motion.button
        onClick={scrollToArt}
        className="group absolute bottom-8 left-1/2 -translate-x-1/2 z-10
                   w-11 h-11 sm:w-14 sm:h-14
                   bg-background border-2 sm:border-[3px] border-primary
                   flex items-center justify-center
                   transition-all duration-200
                   hover:bg-primary
                   shadow-[0_3px_0_0_theme(colors.primary)] sm:shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_4px_0_0_theme(colors.primary)] sm:hover:shadow-[0_6px_0_0_theme(colors.primary)]
                   hover:-translate-y-1 cursor-pointer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.8 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Scroll down"
      >
        <motion.div {...bounceAnimation}>
          <ChevronDown className="w-7 h-7 sm:w-8 sm:h-8 text-primary group-hover:text-background transition-colors" strokeWidth={3} />
        </motion.div>
      </motion.button>
    </section>
  );
}
