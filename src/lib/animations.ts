import type { Variants } from 'framer-motion';

// Shared spring configurations
export const springConfig = {
  default: { type: 'spring' as const, stiffness: 300, damping: 24 },
  snappy: { type: 'spring' as const, stiffness: 400, damping: 30 },
  gentle: { type: 'spring' as const, stiffness: 200, damping: 20 },
};

const EXIT_DURATION = 0.2;

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

export const fadeUpItem: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig.default,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: EXIT_DURATION },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    transition: { duration: EXIT_DURATION },
  },
};

export const fadeBlur: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
  exit: {
    opacity: 0,
    y: -10,
    filter: 'blur(4px)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

export function createSlideVariants(offset = 100): Variants {
  return {
    enter: (direction: number) => ({
      x: direction > 0 ? offset : -offset,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? offset : -offset,
      opacity: 0,
    }),
  };
}

export const popIn: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
  },
  visible: {
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.9,
    transition: { duration: EXIT_DURATION },
  },
};
