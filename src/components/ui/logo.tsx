'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

const IMAGE_SIZES = {
  sm: { width: 80, height: 40 },
  md: { width: 120, height: 60 },
  lg: { width: 160, height: 80 },
  hero: { width: 600, height: 200 },
} as const;

const TEXT_CLASSES = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  hero: 'text-7xl sm:text-8xl lg:text-9xl',
} as const;

export function Logo({ className, size = 'md' }: LogoProps): ReactNode {
  const [imageError, setImageError] = useState(false);
  const { width, height } = IMAGE_SIZES[size];

  if (imageError) {
    return (
      <span className={cn('font-bold tracking-tight', TEXT_CLASSES[size], className)}>
        <span className="text-primary">Dotty</span>
        <span className="text-foreground">.</span>
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="Dotty."
      width={width}
      height={height}
      className={cn('h-auto w-auto', className)}
      style={size !== 'hero' ? { maxHeight: height * 0.7 } : undefined}
      onError={() => setImageError(true)}
      priority
    />
  );
}
