'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Locale, Product } from '@/types';
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: Product[];
  lang: Locale;
}

export function ProductGrid({ products, lang }: ProductGridProps) {
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
  );
}
