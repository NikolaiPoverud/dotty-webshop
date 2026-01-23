'use client';

import { useState } from 'react';
import Image from 'next/image';

import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg' | 'hero';

interface LogoProps {
  className?: string;
  size?: LogoSize;
}

const IMAGE_SIZES: Record<LogoSize, { width: number; height: number }> = {
  sm: { width: 80, height: 40 },
  md: { width: 120, height: 60 },
  lg: { width: 160, height: 80 },
  hero: { width: 600, height: 200 },
};

const TEXT_CLASSES: Record<LogoSize, string> = {
  sm: 'text-lg',
  md: 'text-2xl',
  lg: 'text-3xl',
  hero: 'text-7xl sm:text-8xl lg:text-9xl',
};

export function Logo({ className, size = 'md' }: LogoProps): React.ReactElement {
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
