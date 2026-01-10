'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import type { Locale, ProductListItem, CollectionCard } from '@/types';
import { ProductCard } from './product-card';
import { FilterTabs, type FilterOption } from './filter-tabs';
import { staggerContainer, fadeUpItem, fadeBlur } from '@/lib/animations';

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

const MAX_DESCRIPTION_CHARS = 150;

interface ShopContentProps {
  products: ProductListItem[];
  collections: CollectionCard[];
  lang: Locale;
  initialCollection?: string;
  highlightedProduct?: string;
}

interface ShopContentInnerProps extends ShopContentProps {
  initialFilter: string;
}

function ShopContentInner({
  products,
  collections,
  lang,
  highlightedProduct,
  initialFilter,
}: ShopContentInnerProps) {
  const t = filterText[lang];
  const searchParams = useSearchParams();

  const highlightFromUrl = searchParams.get('highlight');
  const highlightId = highlightFromUrl || highlightedProduct;

  const [activeFilter, setActiveFilter] = useState(initialFilter);

  const handleFilterChange = useCallback((filterId: string) => {
    if (filterId === activeFilter) return;

    setActiveFilter(filterId);

    // Update URL without navigation (shallow update)
    const collection = collections.find(c => c.id === filterId);
    const newPath = filterId === 'all'
      ? `/${lang}/shop`
      : `/${lang}/shop/${collection?.slug || filterId}`;

    window.history.replaceState(null, '', newPath);
  }, [activeFilter, collections, lang]);

  // Scroll to highlighted product
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  const filterOptions: FilterOption[] = useMemo(() => [
    { id: 'all', label: t.all },
    ...collections.map(c => ({ id: c.id, label: c.name })),
  ], [collections, t.all]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter(p => p.collection_id === activeFilter);
  }, [products, activeFilter]);

  const activeDescription = useMemo(() => {
    if (activeFilter === 'all') return null;

    const description = collections.find(c => c.id === activeFilter)?.description;
    if (!description) return null;

    return description.length <= MAX_DESCRIPTION_CHARS
      ? description
      : `${description.slice(0, MAX_DESCRIPTION_CHARS).trim()}...`;
  }, [activeFilter, collections]);

  return (
    <LayoutGroup>
      <div className="mb-12">
        {filterOptions.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            <FilterTabs
              options={filterOptions}
              activeId={activeFilter}
              onChange={handleFilterChange}
              centered
            />
          </motion.div>
        )}

        <div className="h-16 flex items-center justify-center mt-6">
          <AnimatePresence mode="wait">
            {activeDescription && (
              <motion.p
                key={activeFilter}
                variants={fadeBlur}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="text-center text-muted-foreground max-w-2xl px-4"
              >
                {activeDescription}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={activeFilter}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  id={`product-${product.id}`}
                  variants={fadeUpItem}
                  layout
                  className="will-change-transform"
                >
                  <ProductCard
                    product={product}
                    lang={lang}
                    index={index}
                    isHighlighted={product.id === highlightId}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              className="text-muted-foreground text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {t.empty}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}

export function ShopContent({
  products,
  collections,
  lang,
  initialCollection,
  highlightedProduct,
}: ShopContentProps) {
  const searchParams = useSearchParams();
  const collectionFromUrl = searchParams.get('collection');

  // Derive the initial filter from external sources
  const initialFilter = initialCollection || collectionFromUrl || 'all';

  // Key-based remount ensures state resets when external filter changes
  return (
    <ShopContentInner
      key={initialFilter}
      products={products}
      collections={collections}
      lang={lang}
      highlightedProduct={highlightedProduct}
      initialFilter={initialFilter}
    />
  );
}
