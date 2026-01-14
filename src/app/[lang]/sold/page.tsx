import type { Metadata } from 'next';
import type { Locale, Product, Collection } from '@/types';
import { ProductGrid } from '@/components/shop/product-grid';
import { CollectionFilter } from '@/components/shop/collection-filter';
import { createPublicClient } from '@/lib/supabase/public';
import { getDictionary } from '@/lib/i18n/get-dictionary';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }): Promise<Metadata> {
  const { lang } = await params;
  const isNorwegian = lang === 'no';

  const title = isNorwegian ? 'Solgte verk' : 'Sold Works';
  const description = isNorwegian
    ? 'Utforsk solgte originale kunstverk fra Dotty. Interessert i lignende verk? Ta kontakt!'
    : 'Explore sold original artworks from Dotty. Interested in similar work? Get in touch!';

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${lang}/sold`,
      languages: {
        'nb-NO': `${BASE_URL}/no/solgt`,
        'en': `${BASE_URL}/en/sold`,
      },
    },
  };
}


async function getSoldProducts(): Promise<Product[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', false)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch sold products:', error);
    return [];
  }

  return data || [];
}

async function getCollections(): Promise<Collection[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from('collections')
    .select('*')
    .order('display_order', { ascending: true });

  if (error) {
    console.error('Failed to fetch collections:', error);
    return [];
  }

  return data || [];
}

export default async function SoldGalleryPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<React.JSX.Element> {
  const { lang } = await params;
  const locale = lang as Locale;

  const [soldProducts, collections, dictionary] = await Promise.all([
    getSoldProducts(),
    getCollections(),
    getDictionary(locale),
  ]);
  const t = dictionary.soldPage;

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
