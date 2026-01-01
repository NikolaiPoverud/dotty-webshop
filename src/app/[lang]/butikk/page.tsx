import type { Locale, Product, Collection } from '@/types';
import { ProductGrid } from '@/components/shop/product-grid';
import { CollectionFilter } from '@/components/shop/collection-filter';
import { createClient } from '@/lib/supabase/server';

const pageText = {
  no: {
    title: 'Butikk',
    empty: 'Ingen verk tilgjengelig for oyeblikket.',
  },
  en: {
    title: 'Shop',
    empty: 'No works available at the moment.',
  },
};

async function getProducts(collectionSlug?: string): Promise<Product[]> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true });

    // Filter by collection if provided
    if (collectionSlug) {
      const { data: collection } = await supabase
        .from('collections')
        .select('id')
        .eq('slug', collectionSlug)
        .single();

      if (collection) {
        query = query.eq('collection_id', collection.id);
      }
    } else {
      // Limit to 3 products when no collection is selected (default view)
      query = query.limit(3);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('Failed to fetch products:', error);
      return [];
    }

    return products || [];
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return [];
  }
}

async function getCollections(): Promise<Collection[]> {
  try {
    const supabase = await createClient();

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

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ collection?: string }>;
}) {
  const { lang } = await params;
  const { collection } = await searchParams;
  const locale = lang as Locale;
  const t = pageText[locale];

  // Fetch from Supabase
  const [products, collections] = await Promise.all([
    getProducts(collection),
    getCollections(),
  ]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">
          <span className="gradient-text">{t.title}</span>
        </h1>

        {/* Collection Filter */}
        <CollectionFilter
          collections={collections}
          lang={locale}
          currentSlug={collection}
        />

        {/* Product Grid */}
        {products.length > 0 ? (
          <ProductGrid products={products} lang={locale} />
        ) : (
          <p className="text-muted-foreground text-center py-12">{t.empty}</p>
        )}
      </div>
    </div>
  );
}
