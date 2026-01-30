'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

export function Hero(): React.ReactElement {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0">
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          priority
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background/60" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1
          className="font-black text-[5rem] sm:text-[8rem] md:text-[12rem] lg:text-[16rem] leading-[0.85] tracking-tighter"
        >
          <span
            className="relative inline-block text-foreground"
            style={{
              textShadow: '4px 4px 0 var(--primary)',
            }}
          >
            Dotty
          </span>
          <span
            className="text-primary inline-block"
            style={{
              textShadow: '3px 3px 0 var(--foreground)',
            }}
          >
            .
          </span>
        </h1>
      </motion.div>
    </section>
  );
}
