'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

import { Logo } from '@/components/ui/logo';

export function Hero(): React.ReactElement {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <Image
          src="/hero1.png"
          alt=""
          fill
          priority
          quality={95}
          className="object-cover object-top scale-105"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-transparent to-transparent" />
        {/* Smooth blur transition at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-20 backdrop-blur-md bg-gradient-to-t from-background via-background/80 to-transparent" />
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
