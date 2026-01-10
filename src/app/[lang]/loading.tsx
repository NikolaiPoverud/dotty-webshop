import { Skeleton, ProductGridSkeleton, FilterTabsSkeleton } from '@/components/ui/skeleton';

function HeroSkeleton(): React.ReactElement {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      <div className="relative z-10 text-center px-4">
        <div className="flex flex-col items-center gap-4 mb-8">
          <Skeleton className="h-16 sm:h-24 w-48 sm:w-72" />
        </div>
        <Skeleton className="h-6 w-64 mx-auto mb-8" />
        <Skeleton className="h-14 w-40 mx-auto rounded-none" />
      </div>
    </section>
  );
}

function FeaturedGridSkeleton(): React.ReactElement {
  return (
    <section className="py-20 sm:py-32 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-center mb-4">
          <Skeleton className="h-4 w-24" />
        </div>
        <div className="mb-8">
          <FilterTabsSkeleton />
        </div>
        <ProductGridSkeleton count={3} />
      </div>
    </section>
  );
}

function ArtistStatementSkeleton(): React.ReactElement {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <Skeleton className="h-8 w-48 mx-auto mb-8" />
        <div className="space-y-4 mb-8">
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-full" />
          <Skeleton className="h-5 w-3/4 mx-auto" />
        </div>
        <Skeleton className="h-12 w-36 mx-auto" />
      </div>
    </section>
  );
}

function TestimonialsSkeleton(): React.ReactElement {
  return (
    <section className="py-20 sm:py-32 bg-background overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-6 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-80 p-6 bg-muted rounded-lg">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3 mb-4" />
              <Skeleton className="h-5 w-24" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ContactSkeleton(): React.ReactElement {
  return (
    <section className="py-20 sm:py-32 bg-muted/30">
      <div className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <Skeleton className="h-10 w-48 mx-auto mb-4" />
          <Skeleton className="h-5 w-64 mx-auto" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      </div>
    </section>
  );
}

export default function HomeLoading(): React.ReactElement {
  return (
    <>
      <HeroSkeleton />
      <FeaturedGridSkeleton />
      <ArtistStatementSkeleton />
      <TestimonialsSkeleton />
      <ContactSkeleton />
    </>
  );
}
