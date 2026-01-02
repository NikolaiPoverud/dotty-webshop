'use client';

import Image from 'next/image';
import { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'hero';
}

const sizes = {
  sm: { width: 80, height: 40, textClass: 'text-lg' },
  md: { width: 120, height: 60, textClass: 'text-2xl' },
  lg: { width: 160, height: 80, textClass: 'text-3xl' },
  hero: { width: 600, height: 200, textClass: 'text-7xl sm:text-8xl lg:text-9xl' },
};

export function Logo({ className = '', size = 'md' }: LogoProps) {
  const [imageError, setImageError] = useState(false);
  const { width, height, textClass } = sizes[size];

  if (imageError) {
    // Fallback to text logo
    return (
      <span className={`font-bold tracking-tight ${textClass} ${className}`}>
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
      className={`h-auto w-auto ${className}`}
      style={{ maxHeight: size === 'hero' ? undefined : height * 0.7 }}
      onError={() => setImageError(true)}
      priority
    />
  );
}
