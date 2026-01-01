import type { Locale, Product, Collection } from '@/types';
import { ProductGrid } from '@/components/shop/product-grid';
import { CollectionFilter } from '@/components/shop/collection-filter';

// Placeholder data - replace with Supabase fetch
const placeholderProducts: Product[] = [
  {
    id: '5',
    title: 'Color Storm',
    description: 'En virvlende dans av farger.',
    slug: 'color-storm',
    price: 550000,
    image_url: '',
    image_path: '',
    product_type: 'original',
    stock_quantity: null,
    collection_id: null,
    is_available: false,
    is_featured: false,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    title: 'Electric Sunset',
    description: 'Solnedgang i elektriske farger.',
    slug: 'electric-sunset',
    price: 480000,
    image_url: '',
    image_path: '',
    product_type: 'original',
    stock_quantity: null,
    collection_id: null,
    is_available: false,
    is_featured: false,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const placeholderCollections: Collection[] = [
  {
    id: '1',
    name: 'Neon Series',
    slug: 'neon-series',
    description: 'Lysfylte verk',
    display_order: 1,
    created_at: new Date().toISOString(),
  },
];

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

export default async function SoldGalleryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const t = pageText[locale];

  // TODO: Fetch from Supabase - filter for sold products (is_available = false, product_type = 'original')
  const soldProducts = placeholderProducts.filter((p) => !p.is_available);
  const collections = placeholderCollections;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-4">
          <span className="gradient-text">{t.title}</span>
        </h1>
        <p className="text-muted-foreground mb-8 max-w-2xl">{t.description}</p>

        {/* Collection Filter */}
        <CollectionFilter
          collections={collections}
          lang={locale}
          showSold={true}
        />

        {/* Sold Products Grid */}
        {soldProducts.length > 0 ? (
          <ProductGrid products={soldProducts} lang={locale} />
        ) : (
          <p className="text-muted-foreground text-center py-12">{t.empty}</p>
        )}
      </div>
    </div>
  );
}
