'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import type { Locale, ProductListItem } from '@/types';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { ProductCard } from '@/components/shop/product-card';

const MAX_RELATED_PRODUCTS = 4;

const sectionText: Record<Locale, { title: string; viewAll: string }> = {
  no: {
    title: 'Du vil kanskje også like',
    viewAll: 'Se alle',
  },
  en: {
    title: 'You might also like',
    viewAll: 'View all',
  },
};

interface RelatedProductsProps {
  products: ProductListItem[];
  lang: Locale;
}

export function RelatedProducts({ products, lang }: RelatedProductsProps): React.ReactElement | null {
  if (products.length === 0) return null;

  const t = sectionText[lang];
  const displayProducts = products.slice(0, MAX_RELATED_PRODUCTS);

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-wider text-primary">
            {t.title}
          </h2>
          <Link
            href={getLocalizedPath(lang, 'shop')}
            className="text-xs sm:text-sm font-bold uppercase tracking-wider text-primary hover:text-primary-light transition-colors"
          >
            {t.viewAll} →
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard product={product} lang={lang} index={index} />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
