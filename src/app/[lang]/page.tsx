import type { Locale, Product } from '@/types';
import { Hero } from '@/components/landing/hero';
import { FeaturedGrid } from '@/components/landing/featured-grid';
import { ArtistStatement } from '@/components/landing/artist-statement';
import { createClient } from '@/lib/supabase/server';

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true })
      .limit(12);

    if (error) {
      console.error('Failed to fetch featured products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Failed to fetch featured products:', error);
    return [];
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;

  const products = await getFeaturedProducts();

  return (
    <>
      <Hero lang={locale} />
      <FeaturedGrid lang={locale} products={products} />
      <ArtistStatement lang={locale} />
    </>
  );
}
