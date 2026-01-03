'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import type { Locale, ProductListItem } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const sectionText = {
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

export function RelatedProducts({ products, lang }: RelatedProductsProps) {
  const t = sectionText[lang];

  if (products.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">{t.title}</h2>
          <Link
            href={getLocalizedPath(lang, 'shop')}
            className="text-sm text-primary hover:text-primary-light transition-colors"
          >
            {t.viewAll} →
          </Link>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {products.slice(0, 4).map((product, index) => {
            const isSold = !product.is_available || product.stock_quantity === 0;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={getLocalizedPath(lang, 'shop', product.slug)}>
                  <article className="group relative bg-muted rounded-lg overflow-hidden">
                    {/* Image */}
                    <div className="relative aspect-square overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 50vw, 25vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary/20" />
                      )}

                      {/* Sold overlay */}
                      {isSold && (
                        <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                          <span className="px-3 py-1 bg-foreground text-background text-xs font-bold uppercase tracking-wider">
                            {lang === 'no' ? 'Solgt' : 'Sold'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <p className={`text-sm ${isSold ? 'text-muted-foreground' : 'text-foreground'}`}>
                        {formatPrice(product.price)}
                      </p>
                    </div>
                  </article>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
