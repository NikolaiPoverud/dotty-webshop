'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import type { Locale, ProductListItem, CollectionCard } from '@/types';
import { ProductCard } from './product-card';
import { FilterTabs, type FilterOption } from './filter-tabs';

const filterText = {
  no: {
    all: 'Alle',
    empty: 'Ingen verk tilgjengelig.',
  },
  en: {
    all: 'All',
    empty: 'No works available.',
  },
};

interface ShopContentProps {
  products: ProductListItem[];
  collections: CollectionCard[];
  lang: Locale;
  initialCollection?: string;
  highlightedProduct?: string;
}

export function ShopContent({ products, collections, lang, initialCollection, highlightedProduct }: ShopContentProps) {
  const t = filterText[lang];
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get collection and highlight from URL
  const collectionFromUrl = searchParams.get('collection');
  const highlightFromUrl = searchParams.get('highlight');
  const highlightId = highlightFromUrl || highlightedProduct;
  const defaultFilter = collectionFromUrl || initialCollection || 'all';

  const [activeFilter, setActiveFilter] = useState(defaultFilter);

  // Update filter when initialCollection changes (from URL route)
  useEffect(() => {
    if (initialCollection) {
      setActiveFilter(initialCollection);
    } else if (collectionFromUrl) {
      setActiveFilter(collectionFromUrl);
    }
  }, [initialCollection, collectionFromUrl]);

  // Handle filter change - update URL
  const handleFilterChange = (filterId: string) => {
    setActiveFilter(filterId);

    if (filterId === 'all') {
      // Navigate to main shop page
      router.push(`/${lang}/shop`);
    } else {
      // Find collection slug and navigate to collection page
      const collection = collections.find(c => c.id === filterId);
      if (collection) {
        router.push(`/${lang}/shop/${collection.slug}`);
      }
    }
  };

  // Scroll to highlighted product
  useEffect(() => {
    if (highlightId) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

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

  return (
    <>
      {/* Filter Tabs - Centered */}
      {filterOptions.length > 1 && (
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FilterTabs
            options={filterOptions}
            activeId={activeFilter}
            onChange={handleFilterChange}
            centered
          />
        </motion.div>
      )}

      {/* Product Grid */}
      {filteredProducts.length > 0 ? (
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          layout
        >
          <AnimatePresence mode="popLayout">
            {filteredProducts.map((product, index) => (
              <motion.div
                key={product.id}
                id={`product-${product.id}`}
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
                <ProductCard
                  product={product}
                  lang={lang}
                  index={index}
                  isHighlighted={product.id === highlightId}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      ) : (
        <motion.p
          className="text-muted-foreground text-center py-12"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {t.empty}
        </motion.p>
      )}
    </>
  );
}
