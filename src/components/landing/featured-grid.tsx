'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import type { Locale, Product } from '@/types';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const sectionText = {
  no: {
    title: 'Nyeste verk',
    viewAll: 'Se alle',
    original: 'Original',
    print: 'Trykk',
    empty: 'Kommer snart...',
  },
  en: {
    title: 'Latest works',
    viewAll: 'View all',
    original: 'Original',
    print: 'Print',
    empty: 'Coming soon...',
  },
};

function formatPrice(priceInOre: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(priceInOre / 100);
}

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
  products: Product[];
}

export function FeaturedGrid({ lang, products }: FeaturedGridProps) {
  const t = sectionText[lang];

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

  if (products.length === 0) {
    return (
      <section className="py-20 sm:py-32 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.h2
            className="text-3xl sm:text-4xl font-bold mb-12"
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            {t.title}
          </motion.h2>
          <p className="text-muted-foreground text-center py-12">{t.empty}</p>
        </div>
      </section>
    );
  }

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
          {products.slice(0, 6).map((product, index) => (
            <motion.div key={product.id} variants={itemVariants}>
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
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div
                        className={`absolute inset-0 bg-gradient-to-br ${gradients[index % gradients.length]}`}
                      />
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
                      {formatPrice(product.price)}
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
