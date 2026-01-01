'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1));
  };

  const goToIndex = (index: number) => {
    setCurrentIndex(index);
  };

  // Only show navigation if there are multiple images
  const hasMultipleImages = allImages.length > 1;

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-[4/5] max-w-md mx-auto lg:max-w-full rounded-lg overflow-hidden bg-muted group">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0"
          >
            {allImages[currentIndex] ? (
              <Image
                src={allImages[currentIndex]}
                alt={`${title} - ${currentIndex + 1}`}
                fill
                className="object-cover"
                priority={currentIndex === 0}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {hasMultipleImages && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-background/80 hover:bg-background rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              aria-label="Next image"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Image Counter */}
        {hasMultipleImages && (
          <div className="absolute bottom-3 right-3 px-2 py-1 bg-background/80 rounded text-xs font-medium">
            {currentIndex + 1} / {allImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Navigation */}
      {hasMultipleImages && (
        <div className="flex justify-center gap-2">
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
