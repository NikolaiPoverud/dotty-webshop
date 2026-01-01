import type { Locale, Product, Collection } from '@/types';
import { ProductGrid } from '@/components/shop/product-grid';
import { CollectionFilter } from '@/components/shop/collection-filter';

// Placeholder data - replace with Supabase fetch
const placeholderProducts: Product[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    description: 'En eksplosjon av neonfarger som fanger byens puls.',
    slug: 'neon-dreams',
    price: 350000,
    image_url: '',
    image_path: '',
    product_type: 'original',
    stock_quantity: null,
    collection_id: null,
    is_available: true,
    is_featured: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Pink Explosion',
    description: 'Kraftfulle rosa toner som sprenger grenser.',
    slug: 'pink-explosion',
    price: 150000,
    image_url: '',
    image_path: '',
    product_type: 'print',
    stock_quantity: 10,
    collection_id: null,
    is_available: true,
    is_featured: false,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Urban Pop',
    description: 'Gatekunst møter pop-art i denne unike originalen.',
    slug: 'urban-pop',
    price: 450000,
    image_url: '',
    image_path: '',
    product_type: 'original',
    stock_quantity: null,
    collection_id: null,
    is_available: true,
    is_featured: true,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    title: 'Dotty Portrait',
    description: 'Klassisk portrett med et moderne twist.',
    slug: 'dotty-portrait',
    price: 200000,
    image_url: '',
    image_path: '',
    product_type: 'print',
    stock_quantity: 5,
    collection_id: null,
    is_available: true,
    is_featured: false,
    display_order: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
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
    is_available: false, // Sold
    is_featured: false,
    display_order: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    title: 'Pop Vibes',
    description: 'Gode vibes i pop-art stil.',
    slug: 'pop-vibes',
    price: 180000,
    image_url: '',
    image_path: '',
    product_type: 'print',
    stock_quantity: 3,
    collection_id: null,
    is_available: true,
    is_featured: false,
    display_order: 6,
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
  {
    id: '2',
    name: 'Portraits',
    slug: 'portraits',
    description: 'Pop-art portretter',
    display_order: 2,
    created_at: new Date().toISOString(),
  },
];

const pageText = {
  no: {
    title: 'Butikk',
    empty: 'Ingen verk tilgjengelig for øyeblikket.',
  },
  en: {
    title: 'Shop',
    empty: 'No works available at the moment.',
  },
};

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

  // TODO: Fetch from Supabase
  // Filter available products only (not sold)
  const products = placeholderProducts.filter((p) => p.is_available);
  const collections = placeholderCollections;

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
