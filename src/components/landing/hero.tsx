'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import type { Dictionary, Locale } from '@/types';
import Link from 'next/link';

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.2,
    },
  },
};

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] as const }
  },
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
      {/* Subtle Ben-Day dots pattern overlay */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: `radial-gradient(circle at center, var(--primary) 1.5px, transparent 1.5px)`,
          backgroundSize: '20px 20px',
        }}
      />

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
        {/* Lighter overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/20 to-background/60" />
      </div>

      {/* Bottom fade gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-[2]" />

      {/* Main hero content */}
      <motion.div
        className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        {/* Clean headline badge */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
        >
          <span className="inline-block bg-primary px-4 py-2 sm:px-6 sm:py-3 text-background font-bold text-sm sm:text-base uppercase tracking-wide">
            {t.headline}
          </span>
        </motion.div>

        {/* Bold DOTTY logo text - simplified */}
        <motion.div
          className="mb-6 sm:mb-8"
          variants={fadeInUp}
        >
          <h1 className="font-black text-[4rem] sm:text-[6rem] md:text-[8rem] lg:text-[10rem] leading-[0.9] tracking-tighter text-foreground">
            DOTTY
            <span className="text-primary">.</span>
          </h1>
        </motion.div>

        {/* Clean subtitle */}
        <motion.div
          className="max-w-lg mb-8 sm:mb-10"
          variants={fadeInUp}
        >
          <p className="text-foreground/90 text-lg sm:text-xl font-medium leading-relaxed">
            {t.subtitle}
          </p>
        </motion.div>

        {/* CTA Button - cleaner pop-art style */}
        <motion.div variants={fadeInUp}>
          <Link
            href={`/${lang}/shop`}
            className="group inline-flex items-center gap-3 bg-primary text-background font-bold text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 border-3 border-foreground transition-all duration-200 hover:-translate-y-1 active:translate-y-0"
            style={{
              boxShadow: '4px 4px 0 var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '4px 4px 0 var(--foreground)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = '2px 2px 0 var(--foreground)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '4px 4px 0 var(--foreground)';
            }}
          >
            <span>{t.cta}</span>
            <svg
              className="w-5 h-5 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2.5}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>
      </motion.div>

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
