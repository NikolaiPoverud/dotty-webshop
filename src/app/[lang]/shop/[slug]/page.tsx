import type { Locale, Product } from '@/types';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { ProductDetail } from '@/components/shop/product-detail';

async function getProduct(slug: string): Promise<Product | null> {
  try {
    const supabase = await createClient();

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error || !product) {
      return null;
    }

    return product;
  } catch (error) {
    console.error('Failed to fetch product:', error);
    return null;
  }
}

async function getCollectionName(collectionId: string | null): Promise<string | null> {
  if (!collectionId) return null;

  try {
    const supabase = await createClient();

    const { data: collection } = await supabase
      .from('collections')
      .select('name')
      .eq('id', collectionId)
      .single();

    return collection?.name || null;
  } catch (error) {
    return null;
  }
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  const locale = lang as Locale;

  const product = await getProduct(slug);

  if (!product) {
    notFound();
  }

  const collectionName = await getCollectionName(product.collection_id);

  return (
    <ProductDetail
      product={product}
      collectionName={collectionName}
      lang={locale}
    />
  );
}
