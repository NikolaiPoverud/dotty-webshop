'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Locale, Product } from '@/types';
import { ProductCard } from './product-card';
import { FilterTabs, type FilterOption } from './filter-tabs';

const filterText = {
  no: {
    all: 'Alle',
    originals: 'Originaler',
    prints: 'Trykk',
    empty: 'Ingen verk tilgjengelig.',
  },
  en: {
    all: 'All',
    originals: 'Originals',
    prints: 'Prints',
    empty: 'No works available.',
  },
};

interface ShopContentProps {
  products: Product[];
  lang: Locale;
}

export function ShopContent({ products, lang }: ShopContentProps) {
  const t = filterText[lang];
  const [activeFilter, setActiveFilter] = useState('all');

  const filterOptions: FilterOption[] = [
    { id: 'all', label: t.all },
    { id: 'original', label: t.originals },
    { id: 'print', label: t.prints },
  ];

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter(p => p.product_type === activeFilter);
  }, [products, activeFilter]);

  return (
    <>
      {/* Filter Tabs - Centered */}
      <motion.div
        className="mb-12"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <FilterTabs
          options={filterOptions}
          activeId={activeFilter}
          onChange={setActiveFilter}
          centered
        />
      </motion.div>

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
                <ProductCard product={product} lang={lang} index={index} />
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
