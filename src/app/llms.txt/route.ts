/**
 * Dynamic llms.txt route
 *
 * Generates a comprehensive llms.txt file with current site data
 * for AI crawlers and LLMs to understand the site structure.
 */

import { createPublicClient } from '@/lib/supabase/public';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

// Cache for 1 hour
export const revalidate = 3600;

export async function GET() {
  const supabase = createPublicClient();

  // Fetch current data
  const [
    { data: products },
    { data: collections },
    { count: productCount },
  ] = await Promise.all([
    supabase
      .from('products')
      .select('title, slug, product_type, price, description')
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true })
      .limit(50),
    supabase
      .from('collections')
      .select('name, slug, description')
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('display_order', { ascending: true }),
    supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('is_public', true)
      .is('deleted_at', null),
  ]);

  const content = generateLlmsTxt(products || [], collections || [], productCount || 0);

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}

interface Product {
  title: string;
  slug: string;
  product_type: string;
  price: number;
  description: string | null;
}

interface Collection {
  name: string;
  slug: string;
  description: string | null;
}

function generateLlmsTxt(
  products: Product[],
  collections: Collection[],
  totalProducts: number
): string {
  const lines: string[] = [];

  // Header
  lines.push('# Dotty. Pop-Art Webshop');
  lines.push('');
  lines.push('> Norwegian pop-art e-commerce store selling original artworks and limited edition prints.');
  lines.push('');

  // Quick facts
  lines.push('## Quick Facts');
  lines.push('');
  lines.push(`- **Total Products**: ${totalProducts}`);
  lines.push(`- **Collections**: ${collections.length}`);
  lines.push('- **Languages**: Norwegian (no), English (en)');
  lines.push('- **Currency**: NOK (Norwegian Kroner)');
  lines.push('- **Location**: Norway');
  lines.push('');

  // About
  lines.push('## About Dotty.');
  lines.push('');
  lines.push('Dotty. creates bold, colorful pop-art that brings personality and energy to any space.');
  lines.push('Each piece is designed to make a statement and spark joy.');
  lines.push('');
  lines.push('We offer:');
  lines.push('- **Original Paintings**: One-of-a-kind hand-painted artworks');
  lines.push('- **Art Prints**: High-quality limited edition prints');
  lines.push('');

  // Site structure
  lines.push('## Site Structure');
  lines.push('');
  lines.push('### Main Pages');
  lines.push(`- ${BASE_URL}/ - Homepage`);
  lines.push(`- ${BASE_URL}/no/shop - Shop (Norwegian)`);
  lines.push(`- ${BASE_URL}/en/shop - Shop (English)`);
  lines.push(`- ${BASE_URL}/no/om-oss - About (Norwegian)`);
  lines.push(`- ${BASE_URL}/en/about - About (English)`);
  lines.push('');

  lines.push('### Product Categories');
  lines.push(`- ${BASE_URL}/no/shop/type/originaler - Original artworks`);
  lines.push(`- ${BASE_URL}/no/shop/type/trykk - Art prints`);
  lines.push(`- ${BASE_URL}/en/shop/type/originals - Original artworks (EN)`);
  lines.push(`- ${BASE_URL}/en/shop/type/prints - Art prints (EN)`);
  lines.push('');

  lines.push('### Browse by');
  lines.push('- `/shop/year/[year]` - Artworks by creation year');
  lines.push('- `/shop/price/[range]` - Artworks by price range');
  lines.push('- `/shop/size/[size]` - Artworks by size category');
  lines.push('');

  // Collections
  if (collections.length > 0) {
    lines.push('## Collections');
    lines.push('');
    for (const collection of collections) {
      lines.push(`### ${collection.name}`);
      if (collection.description) {
        lines.push(collection.description);
      }
      lines.push(`- URL: ${BASE_URL}/no/shop/${collection.slug}`);
      lines.push('');
    }
  }

  // Products
  if (products.length > 0) {
    lines.push('## Featured Products');
    lines.push('');
    for (const product of products) {
      const priceFormatted = new Intl.NumberFormat('nb-NO', {
        style: 'currency',
        currency: 'NOK',
        maximumFractionDigits: 0,
      }).format(product.price / 100);

      const type = product.product_type === 'original' ? 'Original' : 'Print';

      lines.push(`### ${product.title}`);
      lines.push(`- **Type**: ${type}`);
      lines.push(`- **Price**: ${priceFormatted}`);
      if (product.description) {
        const shortDesc = product.description.length > 150
          ? product.description.slice(0, 150) + '...'
          : product.description;
        lines.push(`- **Description**: ${shortDesc}`);
      }
      lines.push(`- **URL**: ${BASE_URL}/no/shop/${product.slug}`);
      lines.push('');
    }

    if (totalProducts > products.length) {
      lines.push(`*Showing ${products.length} of ${totalProducts} products. Visit the shop for the complete catalog.*`);
      lines.push('');
    }
  }

  // API info
  lines.push('## Structured Data');
  lines.push('');
  lines.push('All pages include JSON-LD structured data for:');
  lines.push('- Product schema (individual products)');
  lines.push('- ItemList schema (product listings)');
  lines.push('- BreadcrumbList schema (navigation)');
  lines.push('- Organization schema (site-wide)');
  lines.push('- CollectionPage schema (collections)');
  lines.push('');

  // Technical
  lines.push('## Technical Information');
  lines.push('');
  lines.push('- **Sitemap**: /sitemap.xml');
  lines.push('- **Robots**: /robots.txt');
  lines.push('- **RSS/Atom**: Not available');
  lines.push('- **API**: Not publicly available');
  lines.push('');

  // Contact
  lines.push('## Contact');
  lines.push('');
  lines.push(`Website: ${BASE_URL}`);
  lines.push('');

  // Footer
  lines.push('---');
  lines.push(`Generated: ${new Date().toISOString()}`);

  return lines.join('\n');
}
