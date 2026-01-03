'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-muted',
        className
      )}
    />
  );
}

// Product card skeleton - matches ProductCard layout
export function ProductCardSkeleton() {
  return (
    <div className="bg-muted rounded-lg overflow-hidden">
      {/* Image Container */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        {/* Badge placeholder */}
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      {/* Product Info */}
      <div className="p-4 space-y-2">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-5 w-1/3" />
        <div className="flex items-center gap-1.5 pt-1">
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
    </div>
  );
}

// Product grid skeleton - shows multiple card skeletons
export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Filter tabs skeleton
export function FilterTabsSkeleton() {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-20 rounded-full" />
      ))}
    </div>
  );
}

// Product detail skeleton - matches ProductDetail layout
export function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <div className="mb-4">
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col space-y-4">
            {/* Collection */}
            <Skeleton className="h-5 w-24" />
            {/* Title */}
            <Skeleton className="h-12 w-3/4" />
            {/* Price */}
            <Skeleton className="h-8 w-32" />

            {/* Specifications */}
            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-border">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            {/* Button */}
            <Skeleton className="h-14 w-full rounded-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
