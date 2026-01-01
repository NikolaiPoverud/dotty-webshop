import type { Locale, Product, Collection } from '@/types';
import { ShopContent } from '@/components/shop/shop-content';
import { createClient } from '@/lib/supabase/server';

const pageText = {
  no: {
    title: 'Shop',
  },
  en: {
    title: 'Shop',
  },
};

async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_available', true)
      .order('is_featured', { ascending: false })
      .order('display_order', { ascending: true });

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
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  const locale = lang as Locale;
  const t = pageText[locale];

  const [products, collections] = await Promise.all([
    getProducts(),
    getCollections(),
  ]);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-8 text-center">
          <span className="gradient-text">{t.title}</span>
        </h1>

        {/* Shop Content with Filters */}
        <ShopContent products={products} collections={collections} lang={locale} />
      </div>
    </div>
  );
}
