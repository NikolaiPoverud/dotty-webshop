'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PanInfo } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '@/types';
import { cn } from '@/lib/utils';

interface ProductGalleryProps {
  mainImage: string;
  galleryImages?: GalleryImage[];
  title: string;
  isSold?: boolean;
}

const SWIPE_THRESHOLD = 50;

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 300 : -300,
    opacity: 0,
  }),
};

const navButtonClass =
  'absolute top-1/2 -translate-y-1/2 p-3 bg-background/80 hover:bg-background active:bg-background rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10 touch-manipulation';

export function ProductGallery({
  mainImage,
  galleryImages,
  title,
  isSold = false,
}: ProductGalleryProps): React.ReactElement {
  const allImages = [mainImage, ...(galleryImages?.map((img) => img.url) ?? [])].filter(Boolean);
  const hasMultipleImages = allImages.length > 1;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  function goToPrevious(): void {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  }

  function goToNext(): void {
    setDirection(1);
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  }

  function goToIndex(index: number): void {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo): void {
    if (info.offset.x > SWIPE_THRESHOLD) {
      goToPrevious();
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      goToNext();
    }
  }

  const currentImage = allImages[currentIndex];

  return (
    <div className="space-y-4">
      <div className={cn(
        'relative aspect-[4/5] max-w-md mx-auto lg:max-w-full rounded-lg overflow-hidden bg-muted group',
        isSold && 'grayscale-[30%]'
      )}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            drag={hasMultipleImages ? 'x' : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
          >
            {currentImage ? (
              <Image
                src={currentImage}
                alt={`${title} - ${currentIndex + 1}`}
                fill
                className="object-cover pointer-events-none"
                priority={currentIndex === 0}
                draggable={false}
                quality={90}
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 600px"
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
            )}
          </motion.div>
        </AnimatePresence>

        {isSold && (
          <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-20 pointer-events-none">
            <span className="px-8 py-3 bg-foreground text-background text-xl font-bold uppercase tracking-widest">
              Solgt
            </span>
          </div>
        )}

        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className={`${navButtonClass} left-3`}
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className={`${navButtonClass} right-3`}
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="absolute bottom-3 right-3 px-2 py-1 bg-background/80 rounded text-xs font-medium z-10">
              {currentIndex + 1} / {allImages.length}
            </div>

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 sm:hidden z-10">
              {allImages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => goToIndex(index)}
                  className={cn(
                    'w-3 h-3 rounded-full transition-all touch-manipulation',
                    index === currentIndex ? 'bg-primary w-5 scale-110' : 'bg-foreground/40'
                  )}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {hasMultipleImages && (
        <div className="hidden sm:flex justify-center gap-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={cn(
                'relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all touch-manipulation',
                index === currentIndex
                  ? 'border-primary'
                  : 'border-transparent opacity-60 hover:opacity-100 active:opacity-100'
              )}
            >
              <Image
                src={image}
                alt={`${title} thumbnail ${index + 1}`}
                fill
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
