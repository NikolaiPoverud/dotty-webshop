'use client';

import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
import { AnimatePresence, motion, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Facebook, MessageCircle } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import type { TestimonialCard } from '@/types';
import { slideItem } from '@/lib/animations';

const SWIPE_THRESHOLD = 50;

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


function NavButton({ direction, onClick }: NavButtonProps): React.ReactElement {
  const isPrev = direction === 'prev';
  const Icon = isPrev ? ChevronLeft : ChevronRight;
  const positionClass = isPrev
    ? '-left-1 sm:-left-14 shadow-[2px_2px_0_0_theme(colors.primary)] sm:shadow-[3px_3px_0_0_theme(colors.primary)]'
    : '-right-1 sm:-right-14 shadow-[-2px_2px_0_0_theme(colors.primary)] sm:shadow-[-3px_3px_0_0_theme(colors.primary)]';

  return (
    <button
      onClick={onClick}
      className={`group absolute ${positionClass} z-10 w-10 h-10 sm:w-12 sm:h-12 bg-background border-2 border-primary flex items-center justify-center transition-all duration-200 hover:bg-primary active:bg-primary touch-manipulation`}
      aria-label={`${isPrev ? 'Previous' : 'Next'} testimonial`}
    >
      <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:text-background group-active:text-background transition-colors" strokeWidth={3} />
    </button>
  );
}

function getSourceIcon(source: string): React.ReactNode {
  return SOURCE_ICONS[source] ?? <MessageCircle className="w-8 h-8" />;
}

export function Testimonials({ testimonials }: TestimonialsProps): React.ReactElement | null {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

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
    if (testimonials.length <= 1 || isPaused) return;

    const timer = setInterval(goToNext, 6000);
    return () => clearInterval(timer);
  }, [goToNext, testimonials.length, isPaused]);

  const handleDragEnd = useCallback((_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (testimonials.length <= 1) return;
    if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    } else if (info.offset.x > SWIPE_THRESHOLD) {
      goToPrev();
    }
  }, [goToNext, goToPrev, testimonials.length]);

  if (testimonials.length === 0) return null;

  const current = testimonials[currentIndex];
  const showNavigation = testimonials.length > 1;

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 bg-muted/30"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center">
          {/* Desktop-only nav buttons */}
          {showNavigation && (
            <div className="hidden sm:block">
              <NavButton direction="prev" onClick={goToPrev} />
            </div>
          )}

          <div className="flex-1 text-center px-2 sm:px-14 lg:px-16 min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentIndex}
                custom={direction}
                variants={slideItem}
                initial="enter"
                animate="center"
                exit="exit"
                className="flex flex-col items-center w-full"
                drag={showNavigation ? 'x' : false}
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
              >
                <div className="text-primary mb-4 sm:mb-6">
                  {getSourceIcon(current.source)}
                </div>

                <p className="text-base sm:text-xl lg:text-2xl text-foreground font-medium mb-4 sm:mb-6 leading-relaxed px-2">
                  "{current.feedback}"
                </p>

                <div className="text-center">
                  <p className="font-semibold text-foreground">{current.name}</p>
                  <p className="text-sm text-muted-foreground">{current.source}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Desktop-only nav buttons */}
          {showNavigation && (
            <div className="hidden sm:block">
              <NavButton direction="next" onClick={goToNext} />
            </div>
          )}
        </div>

        {showNavigation && (
          <div className="flex justify-center gap-3 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-3 h-3 rounded-full transition-all touch-manipulation ${
                  index === currentIndex
                    ? 'bg-primary scale-110'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 active:bg-muted-foreground/50'
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
