import type { Locale, Product, Collection } from '@/types';
import { ProductGrid } from '@/components/shop/product-grid';
import { CollectionFilter } from '@/components/shop/collection-filter';
import { createPublicClient } from '@/lib/supabase/public';

const pageText = {
  no: {
    title: 'Solgte verk',
    description: 'Disse originalene har funnet nye hjem. Interessert i lignende verk? Ta kontakt!',
    empty: 'Ingen solgte verk ennå.',
  },
  en: {
    title: 'Sold Works',
    description: 'These originals have found new homes. Interested in similar work? Get in touch!',
    empty: 'No sold works yet.',
  },
};

async function getSoldProducts(): Promise<Product[]> {
  try {
    const supabase = createPublicClient();
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', false)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch sold products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Failed to fetch sold products:', error);
    return [];
  }
}

async function getCollections(): Promise<Collection[]> {
  try {
    const supabase = createPublicClient();
    const { data: collections, error } = await supabase
      .from('collections')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Failed to fetch collections:', error);
      return [];
    }

    return collections || [];
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }
}

export default async function SoldGalleryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const t = pageText[locale];

  const [soldProducts, collections] = await Promise.all([
    getSoldProducts(),
    getCollections(),
  ]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="gradient-text">{t.title}</span>
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">{t.description}</p>

        <CollectionFilter
          collections={collections}
          lang={locale}
          showSold={true}
        />

        {soldProducts.length > 0 ? (
          <ProductGrid products={soldProducts} lang={locale} />
        ) : (
          <p className="text-muted-foreground text-center py-12">{t.empty}</p>
        )}
      </div>
    </div>
  );
}
