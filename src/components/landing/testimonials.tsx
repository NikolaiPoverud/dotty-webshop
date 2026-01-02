'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Instagram, Facebook, MessageCircle } from 'lucide-react';
import type { TestimonialCard } from '@/types';

interface TestimonialsProps {
  testimonials: TestimonialCard[];
}

const sourceIcons: Record<string, React.ReactNode> = {
  Instagram: <Instagram className="w-8 h-8" />,
  Facebook: <Facebook className="w-8 h-8" />,
  default: <MessageCircle className="w-8 h-8" />,
};

export function Testimonials({ testimonials }: TestimonialsProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToNext = useCallback(() => {
    setDirection(1);
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  }, [testimonials.length]);

  const goToPrev = useCallback(() => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  }, [testimonials.length]);

  // Auto-advance every 6 seconds
  useEffect(() => {
    if (testimonials.length <= 1) return;

    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [goToNext, testimonials.length]);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];
  const icon = sourceIcons[current.source] || sourceIcons.default;

  const variants = {
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

  return (
    <section className="py-16 sm:py-24 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {/* Previous Button */}
          {testimonials.length > 1 && (
            <button
              onClick={goToPrev}
              className="absolute left-0 sm:-left-12 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Testimonial Content */}
          <div className="flex-1 text-center px-12 sm:px-16 min-h-[200px] flex flex-col items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="flex flex-col items-center"
              >
                {/* Source Icon */}
                <div className="text-primary mb-6">
                  {icon}
                </div>

                {/* Feedback Text */}
                <p className="text-xl sm:text-2xl lg:text-3xl text-foreground font-medium mb-6 leading-relaxed">
                  "{current.feedback}"
                </p>

                {/* Name and Source */}
                <div className="text-center">
                  <p className="font-semibold text-foreground">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.source}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Next Button */}
          {testimonials.length > 1 && (
            <button
              onClick={goToNext}
              className="absolute right-0 sm:-right-12 z-10 p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}
        </div>

        {/* Dots Indicator */}
        {testimonials.length > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  setDirection(index > currentIndex ? 1 : -1);
                  setCurrentIndex(index);
                }}
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
