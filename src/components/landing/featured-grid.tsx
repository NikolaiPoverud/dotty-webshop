'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useMemo } from 'react';
import type { Locale, ProductListItem, CollectionCard } from '@/types';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { FilterTabs, type FilterOption } from '@/components/shop/filter-tabs';
import { formatPrice } from '@/lib/utils';

const sectionText = {
  no: {
    title: 'Nyeste verk',
    viewAll: 'Se alle',
    original: 'Original',
    print: 'Trykk',
    empty: 'Kommer snart...',
    all: 'Alle',
  },
  en: {
    title: 'Latest works',
    viewAll: 'View all',
    original: 'Original',
    print: 'Print',
    empty: 'Coming soon...',
    all: 'All',
  },
};


interface FeaturedGridProps {
  lang: Locale;
  products: ProductListItem[];
  collections: CollectionCard[];
  showFilters?: boolean;
}

export function FeaturedGrid({ lang, products, collections, showFilters = true }: FeaturedGridProps) {
  const t = sectionText[lang];
  const [activeFilter, setActiveFilter] = useState('all');

  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [{ id: 'all', label: t.all }];

    // Add all collections
    collections.forEach((collection) => {
      options.push({ id: collection.id, label: collection.name });
    });

    return options;
  }, [collections, t.all]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter(p => p.collection_id === activeFilter);
  }, [products, activeFilter]);

  if (products.length === 0) {
    return (
      <section id="art" className="py-20 sm:py-32 relative scroll-mt-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted-foreground text-center py-12">{t.empty}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="art" className="py-20 sm:py-32 relative scroll-mt-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* View All Link */}
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Link
              href={getLocalizedPath(lang, 'shop')}
              className="text-sm uppercase tracking-widest text-primary hover:text-primary-light transition-colors"
            >
              {t.viewAll} →
            </Link>
          </motion.div>
        </div>

        {/* Filter Tabs - Centered */}
        {showFilters && filterOptions.length > 1 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <FilterTabs
              options={filterOptions}
              activeId={activeFilter}
              onChange={setActiveFilter}
              centered
            />
          </motion.div>
        )}

        {/* Product Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.slice(0, 3).map((product, index) => (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  opacity: { duration: 0.2 },
                  scale: { duration: 0.2 },
                  layout: { type: 'spring', stiffness: 300, damping: 30 }
                }}
              >
                <Link href={getLocalizedPath(lang, 'shop', product.slug)}>
                  <motion.article
                    className="group relative bg-muted rounded-lg overflow-hidden"
                    whileHover={{ y: -8 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {/* Image Container */}
                    <div className="relative aspect-[4/5] overflow-hidden">
                      {product.image_url ? (
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          priority={index < 2}
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-primary" />
                      )}

                      {/* Hover Overlay */}
                      <motion.div
                        className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      />

                      {/* Product Type Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 bg-background/90 text-xs uppercase tracking-wider font-medium rounded">
                          {product.product_type === 'original' ? t.original : t.print}
                        </span>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-4">
                      <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-muted-foreground mt-1">
                        {formatPrice(product.price)}
                      </p>
                    </div>

                    {/* Glow Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-lg pointer-events-none"
                      initial={{ boxShadow: 'none' }}
                      whileHover={{
                        boxShadow: '0 0 30px rgba(254, 32, 106, 0.3)',
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.article>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {/* Empty state for filtered results */}
        {filteredProducts.length === 0 && (
          <motion.p
            className="text-muted-foreground text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {t.empty}
          </motion.p>
        )}
      </div>
    </section>
  );
}
