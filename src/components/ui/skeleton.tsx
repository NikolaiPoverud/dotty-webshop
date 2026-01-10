import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps): React.ReactElement {
  return (
    <div className={cn('animate-pulse rounded-md bg-muted', className)} />
  );
}

export function ProductCardSkeleton(): React.ReactElement {
  return (
    <div className="bg-muted rounded-lg overflow-hidden">
      <div className="relative aspect-[4/5] overflow-hidden">
        <Skeleton className="absolute inset-0 rounded-none" />
        <div className="absolute top-4 left-4">
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
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

interface ProductGridSkeletonProps {
  count?: number;
}

export function ProductGridSkeleton({ count = 6 }: ProductGridSkeletonProps): React.ReactElement {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function FilterTabsSkeleton(): React.ReactElement {
  return (
    <div className="flex justify-center gap-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-20 rounded-full" />
      ))}
    </div>
  );
}

export function ProductDetailSkeleton(): React.ReactElement {
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-4">
          <Skeleton className="h-8 w-32" />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          <div className="space-y-4">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="flex flex-col space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-12 w-3/4" />
            <Skeleton className="h-8 w-32" />

            <div className="space-y-3 py-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex justify-between items-center pb-3 border-b border-border">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>

            <Skeleton className="h-14 w-full rounded-full mt-4" />
          </div>
        </div>
      </div>
    </div>
  );
}
