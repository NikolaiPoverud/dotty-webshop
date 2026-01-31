'use client';

import type { ReactElement } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Locale, ProductListItem } from '@/types';
import { ProductCard } from './product-card';
import { gridItem, spring } from '@/lib/animations';

interface ProductGridProps {
  products: ProductListItem[];
  lang: Locale;
}

export function ProductGrid({ products, lang }: ProductGridProps): ReactElement {
  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
      layout
    >
      <AnimatePresence mode="popLayout">
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            layout
            variants={gridItem}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ ...spring, layout: spring }}
          >
            <ProductCard product={product} lang={lang} index={index} />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
