'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import type { Locale, Product } from '@/types';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const sectionText = {
  no: {
    title: 'Nyeste verk',
    viewAll: 'Se alle',
    original: 'Original',
    print: 'Trykk',
  },
  en: {
    title: 'Latest works',
    viewAll: 'View all',
    original: 'Original',
    print: 'Print',
  },
};

// Format price in NOK
function formatPrice(priceInOre: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInOre / 100);
}

// Placeholder products for initial build
const placeholderProducts: Partial<Product>[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    slug: 'neon-dreams',
    price: 350000, // 3500 kr
    product_type: 'original',
    is_available: true,
  },
  {
    id: '2',
    title: 'Pink Explosion',
    slug: 'pink-explosion',
    price: 150000, // 1500 kr
    product_type: 'print',
    is_available: true,
  },
  {
    id: '3',
    title: 'Urban Pop',
    slug: 'urban-pop',
    price: 450000, // 4500 kr
    product_type: 'original',
    is_available: true,
  },
  {
    id: '4',
    title: 'Dotty Portrait',
    slug: 'dotty-portrait',
    price: 200000, // 2000 kr
    product_type: 'print',
    is_available: true,
  },
  {
    id: '5',
    title: 'Color Storm',
    slug: 'color-storm',
    price: 550000, // 5500 kr
    product_type: 'original',
    is_available: true,
  },
  {
    id: '6',
    title: 'Pop Vibes',
    slug: 'pop-vibes',
    price: 180000, // 1800 kr
    product_type: 'print',
    is_available: true,
  },
];

// Random gradient for placeholder
const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
  'from-accent-3 to-primary',
  'from-primary-light to-accent',
  'from-accent to-primary-dark',
];

interface FeaturedGridProps {
  lang: Locale;
  products?: Product[];
}

export function FeaturedGrid({ lang, products }: FeaturedGridProps) {
  const t = sectionText[lang];
  const displayProducts = products || placeholderProducts;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <section className="py-20 sm:py-32 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-12">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {t.title}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
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

        {/* Product Grid */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          {displayProducts.slice(0, 6).map((product, index) => (
            <motion.div key={product.id} variants={itemVariants}>
              <Link href={getLocalizedPath(lang, 'shop', product.slug)}>
                <motion.article
                  className="group relative bg-muted rounded-lg overflow-hidden"
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/5] overflow-hidden">
                    {/* Placeholder gradient - replace with actual image */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`}
                    />

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

                    {/* Quick View on Hover */}
                    <motion.div
                      className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                      initial={false}
                    >
                      <span className="px-6 py-3 bg-foreground text-background font-medium uppercase tracking-wider text-sm">
                        {lang === 'no' ? 'Se mer' : 'View'}
                      </span>
                    </motion.div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                      {product.title}
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      {formatPrice(product.price!)}
                    </p>
                  </div>

                  {/* Glow Effect */}
                  <motion.div
                    className="absolute inset-0 rounded-lg pointer-events-none"
                    initial={{ boxShadow: 'none' }}
                    whileHover={{
                      boxShadow: '0 0 30px rgba(236, 72, 153, 0.3)',
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.article>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
