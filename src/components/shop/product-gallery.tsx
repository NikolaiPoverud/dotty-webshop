'use client';

import { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { GalleryImage } from '@/types';

interface ProductGalleryProps {
  mainImage: string;
  galleryImages?: GalleryImage[];
  title: string;
}

export function ProductGallery({ mainImage, galleryImages, title }: ProductGalleryProps) {
  // Combine main image with gallery images
  const allImages = [
    mainImage,
    ...(galleryImages?.map(img => img.url) || []),
  ].filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(0);

  const goToPrevious = () => {
    setDirection(-1);
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setDirection(1);
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  // Handle swipe gestures
  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 50;
    if (info.offset.x > threshold) {
      goToPrevious();
    } else if (info.offset.x < -threshold) {
      goToNext();
    }
  };

  // Only show navigation if there are multiple images
  const hasMultipleImages = allImages.length > 1;

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

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/5] max-w-md mx-auto lg:max-w-full rounded-lg overflow-hidden bg-muted group">
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
            {allImages[currentIndex] ? (
              <Image
                src={allImages[currentIndex]}
                alt={`${title} - ${currentIndex + 1}`}
                fill
                className="object-cover pointer-events-none"
                priority={currentIndex === 0}
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows - visible on hover (desktop) or always visible with lower opacity on mobile */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-200 z-10"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-background/80 rounded text-xs font-medium z-10">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}

        {/* Swipe hint dots for mobile */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 sm:hidden z-10">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary w-4'
                    : 'bg-foreground/40'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation - hidden on mobile */}
      {hasMultipleImages && (
        <div className="hidden sm:flex justify-center gap-2">
          {allImages.map((image, index) => (
            <button
              key={index}
              onClick={() => goToIndex(index)}
              className={`relative w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-primary'
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
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
