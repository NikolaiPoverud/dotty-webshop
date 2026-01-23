'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import type { Dictionary, Locale } from '@/types';

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.3,
    },
  },
};

const popIn = {
  initial: { scale: 0, rotate: -12, opacity: 0 },
  animate: {
    scale: 1,
    rotate: 0,
    opacity: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 260,
      damping: 20
    }
  },
};

const slideInLeft = {
  initial: { x: -100, opacity: 0, skewX: 6 },
  animate: {
    x: 0,
    opacity: 1,
    skewX: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
  },
};

const slideInRight = {
  initial: { x: 100, opacity: 0, skewX: -6 },
  animate: {
    x: 0,
    opacity: 1,
    skewX: 0,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const }
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

export function Hero({ lang, dictionary }: HeroProps): React.ReactElement {
  const t = dictionary.hero;

  function scrollToArt(): void {
    const artSection = document.getElementById('art');
    if (!artSection) return;

    const rect = artSection.getBoundingClientRect();
    const scrollTop = window.scrollY + rect.top - (window.innerHeight / 2) + (rect.height / 2);
    window.scrollTo({ top: scrollTop, behavior: 'smooth' });
  }

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div
        className="absolute inset-0 z-[1] pointer-events-none opacity-[0.08]"
        style={{
          backgroundImage: `radial-gradient(circle at center, var(--primary) 2px, transparent 2px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/30 to-background/70" />
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-48 bg-gradient-to-t from-background via-background/80 to-transparent z-[2]" />

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-20"
        variants={staggerContainer}
        initial="initial"
        animate="animate"
      >
        <motion.div
          className="relative mb-6 sm:mb-8"
          variants={popIn}
        >
          <div className="relative inline-block">
            <div
              className="relative bg-primary px-6 py-3 sm:px-10 sm:py-5"
              style={{
                clipPath: 'polygon(0 10%, 3% 0, 97% 0, 100% 10%, 100% 90%, 97% 100%, 8% 100%, 0 100%, 0 90%)',
              }}
            >
              <div
                className="absolute inset-0 opacity-20 mix-blend-multiply"
                style={{
                  backgroundImage: `radial-gradient(circle at center, #000 1px, transparent 1px)`,
                  backgroundSize: '4px 4px',
                }}
              />
              <span
                className="relative font-black text-background text-lg sm:text-2xl md:text-3xl tracking-tight uppercase"
                style={{
                  textShadow: '2px 2px 0 rgba(0,0,0,0.2)',
                  letterSpacing: '-0.02em',
                }}
              >
                {t.headline}
              </span>
            </div>
            <div
              className="absolute -bottom-3 left-8 sm:left-12 w-6 h-6 sm:w-8 sm:h-8 bg-primary"
              style={{
                clipPath: 'polygon(0 0, 100% 0, 0 100%)',
              }}
            />
          </div>
        </motion.div>

        <motion.div
          className="relative mb-4 sm:mb-6"
          variants={slideInLeft}
        >
          <h1
            className="font-black text-[4rem] sm:text-[7rem] md:text-[10rem] lg:text-[13rem] leading-[0.85] tracking-tighter"
            style={{
              WebkitTextStroke: '3px var(--foreground)',
              WebkitTextFillColor: 'transparent',
              paintOrder: 'stroke fill',
            }}
          >
            <span
              className="relative inline-block"
              style={{
                WebkitTextStroke: '4px var(--primary)',
                WebkitTextFillColor: 'var(--background)',
                filter: 'drop-shadow(6px 6px 0 var(--primary))',
              }}
            >
              DOTTY
            </span>
            <span
              className="text-primary inline-block ml-1 sm:ml-2"
              style={{
                WebkitTextStroke: '0',
                WebkitTextFillColor: 'var(--primary)',
                filter: 'drop-shadow(4px 4px 0 var(--foreground))',
              }}
            >
              .
            </span>
          </h1>
        </motion.div>

        <motion.div
          className="relative max-w-xl mb-8 sm:mb-10"
          variants={slideInRight}
        >
          <div
            className="relative bg-background/90 backdrop-blur-sm border-4 border-foreground p-4 sm:p-6"
            style={{
              boxShadow: '6px 6px 0 var(--foreground)',
            }}
          >
            <div className="absolute -top-2 -left-2 w-4 h-4 bg-accent-3" />
            <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-primary" />

            <p className="text-foreground text-base sm:text-lg md:text-xl font-bold leading-relaxed">
              {t.subtitle}
            </p>
          </div>
        </motion.div>

        <motion.div variants={popIn}>
          <Link
            href={`/${lang}/shop`}
            className="group relative inline-flex items-center gap-3 bg-primary text-background font-black text-lg sm:text-xl uppercase tracking-wide px-8 py-4 sm:px-10 sm:py-5 border-4 border-foreground transition-all duration-200 hover:-translate-x-1 hover:-translate-y-1 active:translate-x-1 active:translate-y-1"
            style={{
              boxShadow: '6px 6px 0 var(--foreground)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '8px 8px 0 var(--foreground)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--foreground)';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.boxShadow = '2px 2px 0 var(--foreground)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.boxShadow = '6px 6px 0 var(--foreground)';
            }}
          >
            <div
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(circle at center, #000 1px, transparent 1px)`,
                backgroundSize: '3px 3px',
              }}
            />
            <span className="relative">{t.cta}</span>
            <svg
              className="relative w-5 h-5 sm:w-6 sm:h-6 transition-transform group-hover:translate-x-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </motion.div>

        <motion.div
          className="absolute top-8 right-4 sm:top-12 sm:right-12 hidden sm:block"
          initial={{ scale: 0, rotate: 20 }}
          animate={{ scale: 1, rotate: 12 }}
          transition={{ delay: 1, type: 'spring', stiffness: 200 }}
        >
          <div
            className="bg-accent-3 text-background font-black text-xs sm:text-sm px-3 py-1 sm:px-4 sm:py-2 uppercase tracking-wider"
            style={{
              transform: 'rotate(12deg)',
              boxShadow: '3px 3px 0 var(--foreground)',
            }}
          >
            Pop Art
          </div>
        </motion.div>

        <motion.div
          className="absolute bottom-32 right-8 sm:bottom-40 sm:right-16 hidden md:block"
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: -8 }}
          transition={{ delay: 1.2, type: 'spring', stiffness: 200 }}
        >
          <div
            className="bg-accent text-background font-black text-xs px-3 py-1 uppercase tracking-wider"
            style={{
              transform: 'rotate(-8deg)',
              boxShadow: '3px 3px 0 var(--foreground)',
            }}
          >
            Original Art
          </div>
        </motion.div>
      </motion.div>

      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 z-10">
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
