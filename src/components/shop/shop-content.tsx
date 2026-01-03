'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
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

const MAX_DESCRIPTION_CHARS = 150;

// Staggered animation for grid items
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

const itemVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 300,
      damping: 24,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
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
  const searchParams = useSearchParams();

  // Get collection and highlight from URL
  const collectionFromUrl = searchParams.get('collection');
  const highlightFromUrl = searchParams.get('highlight');
  const highlightId = highlightFromUrl || highlightedProduct;
  const defaultFilter = collectionFromUrl || initialCollection || 'all';

  const [activeFilter, setActiveFilter] = useState(defaultFilter);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Update filter when initialCollection changes (from URL route)
  useEffect(() => {
    if (initialCollection) {
      setActiveFilter(initialCollection);
    } else if (collectionFromUrl) {
      setActiveFilter(collectionFromUrl);
    }
  }, [initialCollection, collectionFromUrl]);

  // Handle filter change - smooth client-side update with URL sync
  const handleFilterChange = useCallback((filterId: string) => {
    if (filterId === activeFilter) return;

    setIsTransitioning(true);

    // Small delay for exit animation
    setTimeout(() => {
      setActiveFilter(filterId);

      // Update URL without navigation (shallow update)
      const collection = collections.find(c => c.id === filterId);
      const newPath = filterId === 'all'
        ? `/${lang}/shop`
        : `/${lang}/shop/${collection?.slug || filterId}`;

      window.history.replaceState(null, '', newPath);

      // Reset transition state after animation completes
      setTimeout(() => setIsTransitioning(false), 300);
    }, 150);
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

  const filterOptions: FilterOption[] = useMemo(() => {
    const options: FilterOption[] = [{ id: 'all', label: t.all }];
    collections.forEach((collection) => {
      options.push({ id: collection.id, label: collection.name });
    });
    return options;
  }, [collections, t.all]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter(p => p.collection_id === activeFilter);
  }, [products, activeFilter]);

  // Get active collection description (truncated)
  const activeDescription = useMemo(() => {
    if (activeFilter === 'all') return null;
    const collection = collections.find(c => c.id === activeFilter);
    if (!collection?.description) return null;

    const desc = collection.description;
    if (desc.length <= MAX_DESCRIPTION_CHARS) return desc;
    return desc.slice(0, MAX_DESCRIPTION_CHARS).trim() + '...';
  }, [activeFilter, collections]);

  return (
    <LayoutGroup>
      {/* Filter Section - Fixed spacing */}
      <div className="mb-12">
        {/* Filter Tabs - Centered */}
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

        {/* Collection Description - Fixed height container */}
        <div className="h-16 flex items-center justify-center mt-6">
          <AnimatePresence mode="wait">
            {activeDescription && (
              <motion.p
                key={activeFilter}
                initial={{ opacity: 0, y: 10, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                className="text-center text-muted-foreground max-w-2xl px-4"
              >
                {activeDescription}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Product Grid */}
      <div className="relative min-h-[400px]">
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={activeFilter}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  id={`product-${product.id}`}
                  variants={itemVariants}
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

        {/* Subtle transition overlay */}
        <AnimatePresence>
          {isTransitioning && (
            <motion.div
              className="absolute inset-0 bg-background/30 backdrop-blur-[1px] pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            />
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
