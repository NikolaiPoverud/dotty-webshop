import type { Locale } from '@/types';
import { Hero } from '@/components/landing/hero';
import { FeaturedGrid } from '@/components/landing/featured-grid';
import { ArtistStatement } from '@/components/landing/artist-statement';

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;

  // TODO: Fetch featured products from Supabase
  // const products = await getFeaturedProducts();

  return (
    <>
      <Hero lang={locale} />
      <FeaturedGrid lang={locale} />
      <ArtistStatement lang={locale} />
    </>
  );
}
