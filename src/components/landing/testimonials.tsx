'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Facebook, MessageCircle } from 'lucide-react';
import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
import type { TestimonialCard } from '@/types';

interface TestimonialsProps {
  testimonials: TestimonialCard[];
}

interface NavButtonProps {
  direction: 'prev' | 'next';
  onClick: () => void;
}

const SOURCE_ICONS: Record<string, React.ReactNode> = {
  Instagram: <SiInstagram className="w-8 h-8" />,
  TikTok: <SiTiktok className="w-8 h-8" />,
  Facebook: <Facebook className="w-8 h-8" />,
};

const SLIDE_VARIANTS = {
  enter: (direction: number) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

function NavButton({ direction, onClick }: NavButtonProps): React.ReactElement {
  const isPrev = direction === 'prev';
  const Icon = isPrev ? ChevronLeft : ChevronRight;
  const positionClass = isPrev
    ? 'left-0 sm:-left-14 shadow-[3px_3px_0_0_theme(colors.primary)] hover:shadow-[4px_4px_0_0_theme(colors.primary)]'
    : 'right-0 sm:-right-14 shadow-[-3px_3px_0_0_theme(colors.primary)] hover:shadow-[-4px_4px_0_0_theme(colors.primary)]';

  return (
    <button
      onClick={onClick}
      className={`group absolute ${positionClass} z-10 w-10 h-10 sm:w-12 sm:h-12 bg-background border-2 border-primary flex items-center justify-center transition-all duration-200 hover:bg-primary`}
      aria-label={`${isPrev ? 'Previous' : 'Next'} testimonial`}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:text-background transition-colors" strokeWidth={3} />
    </button>
  );
}

function getSourceIcon(source: string): React.ReactNode {
  return SOURCE_ICONS[source] ?? <MessageCircle className="w-8 h-8" />;
}

export function Testimonials({ testimonials }: TestimonialsProps): React.ReactElement | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToNext = useCallback((): void => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goToPrev = useCallback((): void => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  const goToIndex = useCallback((index: number): void => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }, [currentIndex]);

  useEffect(() => {
    if (testimonials.length <= 1) return;

    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [goToNext, testimonials.length]);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];
  const showNavigation = testimonials.length > 1;

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {showNavigation && <NavButton direction="prev" onClick={goToPrev} />}

          <div className="flex-1 text-center px-12 sm:px-16 min-h-[200px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={SLIDE_VARIANTS}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex flex-col items-center"
              >
                <div className="text-primary mb-6">
                  {getSourceIcon(current.source)}
                </div>

                <p className="text-xl sm:text-2xl lg:text-3xl text-foreground font-medium mb-6 leading-relaxed">
                  "{current.feedback}"
                </p>

                <div className="text-center">
                  <p className="font-semibold text-foreground">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.source}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {showNavigation && <NavButton direction="next" onClick={goToNext} />}
        </div>

        {showNavigation && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
