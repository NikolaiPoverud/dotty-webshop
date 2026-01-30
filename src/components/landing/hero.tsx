'use client';

import { motion } from 'framer-motion';

import { Logo } from '@/components/ui/logo';

export function Hero(): React.ReactElement {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <picture>
          {/* Desktop 4K */}
          <source
            media="(min-width: 1024px)"
            srcSet="/hero-desktop.webp"
          />
          {/* Tablet */}
          <source
            media="(min-width: 640px)"
            srcSet="/hero-tablet.webp"
          />
          {/* Mobile (default) */}
          <img
            src="/hero-mobile.webp"
            alt=""
            className="w-full h-full object-cover object-center"
          />
        </picture>
        {/* Soft gradient fade at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background to-transparent" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <Logo size="hero" />
      </motion.div>
    </section>
  );
}
