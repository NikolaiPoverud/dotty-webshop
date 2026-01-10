'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

const DECORATIVE_DOTS = [
  { x: '15%', y: '20%' },
  { x: '80%', y: '35%' },
  { x: '25%', y: '70%' },
  { x: '65%', y: '85%' },
  { x: '45%', y: '15%' },
  { x: '90%', y: '60%' },
];

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-[12rem] sm:text-[16rem] font-bold leading-none tracking-tighter">
            <span className="text-primary">4</span>
            <motion.span
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
              className="inline-block text-muted-foreground"
            >
              0
            </motion.span>
            <span className="text-primary">4</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Dette kunstverket finnes ikke
          </h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Kanskje det allerede er solgt, eller så har du funnet en side som ikke eksisterer.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            href="/no"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Tilbake til galleriet
          </Link>
        </motion.div>

        <div className="absolute inset-0 pointer-events-none overflow-hidden -z-10">
          {DECORATIVE_DOTS.map((dot, i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-primary/20"
              initial={{ x: dot.x, y: dot.y, scale: 0 }}
              animate={{ scale: [0, 1, 0], opacity: [0, 0.5, 0] }}
              transition={{ duration: 3, delay: i * 0.5, repeat: Infinity, repeatDelay: 2 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
