import type { Transition, Variants } from 'framer-motion';

// =============================================================================
// UNIFIED ANIMATION SYSTEM
// =============================================================================
// Use these constants across all components for consistent feel

// -----------------------------------------------------------------------------
// DURATIONS
// -----------------------------------------------------------------------------
export const duration = {
  fast: 0.15,    // Micro-interactions (button press, toggle)
  normal: 0.25,  // Standard transitions (fade, slide)
  slow: 0.4,     // Emphasis animations (page enter, modal)
} as const;

// -----------------------------------------------------------------------------
// EASING
// -----------------------------------------------------------------------------
// Single easing curve for consistency - smooth deceleration
export const ease = [0.22, 1, 0.36, 1] as const;

// -----------------------------------------------------------------------------
// SPRING CONFIG
// -----------------------------------------------------------------------------
// One spring config for all physics-based animations
export const spring: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
};

// -----------------------------------------------------------------------------
// TRANSITIONS
// -----------------------------------------------------------------------------
export const transition = {
  fast: { duration: duration.fast, ease },
  normal: { duration: duration.normal, ease },
  slow: { duration: duration.slow, ease },
  spring,
} as const;

// -----------------------------------------------------------------------------
// INTERACTION STATES
// -----------------------------------------------------------------------------
export const tap = { scale: 0.98, y: 1 };
export const hover = { y: -4 };

// -----------------------------------------------------------------------------
// STAGGER CONFIG
// -----------------------------------------------------------------------------
export const stagger = {
  children: 0.06,
  delayChildren: 0.1,
} as const;

// -----------------------------------------------------------------------------
// VARIANTS
// -----------------------------------------------------------------------------

// Container for staggered children
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: stagger.children,
      delayChildren: stagger.delayChildren,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: stagger.children / 2,
      staggerDirection: -1,
    },
  },
};

// Standard fade + slide up
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: transition.fast,
  },
};

// For grid items (cards, products)
export const gridItem: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: transition.normal,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: transition.fast,
  },
};

// For carousel/swipe items
export const slideItem: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 60 : -60,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
    transition: transition.normal,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 60 : -60,
    opacity: 0,
    transition: transition.fast,
  }),
};

// For modals/panels sliding in
export const slideIn: Variants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: spring,
  },
  exit: {
    x: '100%',
    transition: transition.normal,
  },
};

// For overlays/backdrops
export const overlay: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: transition.fast,
  },
  exit: {
    opacity: 0,
    transition: transition.fast,
  },
};

// Legacy export for backwards compatibility
export const fadeUpItem = fadeUp;
