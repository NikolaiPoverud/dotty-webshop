'use client';

import { motion } from 'framer-motion';
import type { Locale, Product, Collection } from '@/types';
import { ProductCard } from './product-card';

interface ProductGridProps {
  products: Product[];
  lang: Locale;
}

export function ProductGrid({ products, lang }: ProductGridProps) {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {products.map((product, index) => (
        <motion.div key={product.id} variants={itemVariants}>
          <ProductCard product={product} lang={lang} index={index} />
        </motion.div>
      ))}
    </motion.div>
  );
}
