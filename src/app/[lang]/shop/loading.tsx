import { ProductGridSkeleton, FilterTabsSkeleton } from '@/components/ui/skeleton';

export default function ShopLoading() {
  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back link skeleton */}
        <div className="h-5 w-24 bg-muted animate-pulse rounded mb-6" />

        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
          <span className="gradient-text">Shop</span>
        </h1>

        {/* Filter Tabs */}
        <div className="mb-12">
          <FilterTabsSkeleton />
          {/* Description placeholder */}
          <div className="h-16 flex items-center justify-center mt-6">
            <div className="h-4 w-64 bg-muted animate-pulse rounded" />
          </div>
        </div>

        {/* Product Grid */}
        <ProductGridSkeleton count={6} />
      </div>
    </div>
  );
}
