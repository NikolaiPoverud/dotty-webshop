'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Locale, Product } from '@/types';
import { formatPrice } from '@/lib/utils';

const text = {
  no: {
    dimensions: 'Dimensjoner',
    year: 'År',
    availability: 'Tilgjengelighet',
    available: 'Tilgjengelig',
    soldOut: 'Utsolgt',
    addToCart: 'Legg i Handlekurv',
    original: 'Original',
    print: 'Trykk',
  },
  en: {
    dimensions: 'Dimensions',
    year: 'Year',
    availability: 'Availability',
    available: 'Available',
    soldOut: 'Sold out',
    addToCart: 'Add to Cart',
    original: 'Original',
    print: 'Print',
  },
};

interface ProductDetailProps {
  product: Product;
  collectionName: string | null;
  lang: Locale;
}

export function ProductDetail({ product, collectionName, lang }: ProductDetailProps) {
  const t = text[lang];
  
  // Extract year from created_at
  const year = new Date(product.created_at).getFullYear();
  
  // Format dimensions
  const dimensionsText = product.sizes && product.sizes.length > 0
    ? product.sizes[0].label
    : '-';

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image Section */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative aspect-square rounded-lg overflow-hidden bg-muted"
          >
            {product.image_url ? (
              <Image
                src={product.image_url}
                alt={product.title}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent" />
            )}
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            {/* Collection Name */}
            {collectionName && (
              <p className="text-primary font-medium mb-4">
                {collectionName}
              </p>
            )}

            {/* Product Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              {product.title}
            </h1>

            {/* Price */}
            <p className="text-3xl sm:text-4xl font-bold mb-12">
              {formatPrice(product.price)}
            </p>

            {/* Specifications */}
            <div className="space-y-6 mb-12">
              {/* Dimensions */}
              <div className="flex justify-between items-center pb-6 border-b border-border">
                <span className="text-muted-foreground">{t.dimensions}</span>
                <span className="font-medium">{dimensionsText}</span>
              </div>

              {/* Year */}
              <div className="flex justify-between items-center pb-6 border-b border-border">
                <span className="text-muted-foreground">{t.year}</span>
                <span className="font-medium">{year}</span>
              </div>

              {/* Availability */}
              <div className="flex justify-between items-center pb-6 border-b border-border">
                <span className="text-muted-foreground">{t.availability}</span>
                <span className="font-medium">
                  {product.is_available ? t.available : t.soldOut}
                </span>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground mb-12 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Add to Cart Button */}
            <motion.button
              className="w-full py-6 bg-primary text-background font-semibold text-lg uppercase tracking-wider rounded-full transition-all duration-300 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={{ scale: product.is_available ? 1.02 : 1 }}
              whileTap={{ scale: product.is_available ? 0.98 : 1 }}
              disabled={!product.is_available}
            >
              {t.addToCart}
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
