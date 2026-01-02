'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Ruler } from 'lucide-react';
import type { Locale, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const text = {
  no: {
    original: 'Original',
    print: 'Trykk',
    sold: 'Solgt',
    view: 'Se mer',
    sizes: 'Storrelser',
  },
  en: {
    original: 'Original',
    print: 'Print',
    sold: 'Sold',
    view: 'View',
    sizes: 'Sizes',
  },
};

interface ProductCardProps {
  product: Product;
  lang: Locale;
  index?: number;
}

// Random gradients for placeholder images
const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
  'from-accent-3 to-primary',
  'from-primary-light to-accent',
  'from-accent to-primary-dark',
];

export function ProductCard({ product, lang, index = 0 }: ProductCardProps) {
  const t = text[lang];
  // Item is sold if not available OR stock is 0
  const isSold = !product.is_available || product.stock_quantity === 0;
  const gradient = gradients[index % gradients.length];

  return (
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
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            // Placeholder gradient
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
          )}

          {/* Sold Overlay */}
          {isSold && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="px-6 py-2 bg-foreground text-background text-lg font-bold uppercase tracking-widest">
                {t.sold}
              </span>
            </div>
          )}

          {/* Hover Overlay (only if not sold) */}
          {!isSold && (
            <motion.div
              className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            />
          )}

          {/* Product Type Badge */}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-background/90 text-xs uppercase tracking-wider font-medium rounded">
              {product.product_type === 'original' ? t.original : t.print}
            </span>
          </div>

          {/* Stock indicator for prints */}
          {product.product_type === 'print' && product.stock_quantity !== null && product.stock_quantity <= 3 && product.is_available && (
            <div className="absolute top-4 right-4">
              <span className="px-3 py-1 bg-warning text-background text-xs uppercase tracking-wider font-medium rounded">
                {product.stock_quantity} {lang === 'no' ? 'igjen' : 'left'}
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
            {product.title}
          </h3>
          <p className={`mt-1 ${isSold ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
            {formatPrice(product.price)}
          </p>
          {/* Display sizes if available */}
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ruler className="w-3.5 h-3.5" />
              <span>
                {product.sizes.map((s) => s.label).join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Glow Effect */}
        {!isSold && (
          <motion.div
            className="absolute inset-0 rounded-lg pointer-events-none"
            initial={{ boxShadow: 'none' }}
            whileHover={{
              boxShadow: '0 0 30px rgba(236, 72, 153, 0.3)',
            }}
            transition={{ duration: 0.3 }}
          />
        )}
      </motion.article>
    </Link>
  );
}
