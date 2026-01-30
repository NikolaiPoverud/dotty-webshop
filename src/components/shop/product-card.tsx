'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Ruler } from 'lucide-react';
import type { Locale, ProductListItem } from '@/types';
import { cn, formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

interface ProductCardProps {
  product: ProductListItem;
  lang: Locale;
  index?: number;
  isHighlighted?: boolean;
  priority?: boolean;
}

const FALLBACK_TEXT = {
  no: { original: 'Maleri', print: 'Prints', sold: 'Solgt', left: 'igjen' },
  en: { original: 'Painting', print: 'Print', sold: 'Sold', left: 'left' },
} as const;

function getDisplayPrice(product: ProductListItem): { price: number; isFromPrice: boolean } {
  const sizes = product.sizes ?? [];
  const sizesWithPrices = sizes.filter((s) => s.price != null);

  if (sizesWithPrices.length > 1) {
    return { price: Math.min(...sizesWithPrices.map((s) => s.price!)), isFromPrice: true };
  }

  if (sizesWithPrices.length === 1) {
    return { price: sizesWithPrices[0].price!, isFromPrice: false };
  }

  return { price: product.price, isFromPrice: sizes.length > 1 };
}

const highlightAnimation = {
  initial: { scale: 1.02 },
  animate: {
    scale: [1.02, 1],
    boxShadow: [
      '0 0 40px rgba(254, 32, 106, 0.5)',
      '0 0 20px rgba(254, 32, 106, 0.3)',
    ],
  },
};

const springTransition = { type: 'spring', stiffness: 300, damping: 20 } as const;

export const ProductCard = memo(function ProductCard({
  product,
  lang,
  index = 0,
  isHighlighted,
  priority = false,
}: ProductCardProps): React.ReactElement {
  const t = FALLBACK_TEXT[lang];
  const isSold = !product.is_available || product.stock_quantity === 0;
  const isLowStock = product.product_type === 'print' && product.stock_quantity != null && product.stock_quantity <= 3 && product.is_available;
  const productTypeLabel = product.product_type === 'original' ? t.original : t.print;
  const { price: displayPrice, isFromPrice } = getDisplayPrice(product);
  const fromLabel = lang === 'no' ? 'fra ' : 'from ';

  return (
    <Link href={getLocalizedPath(lang, 'shop', product.slug)}>
      <motion.article
        className={cn(
          'group relative bg-muted overflow-hidden border-[3px] border-transparent hover:border-primary active:border-primary transition-colors duration-200 touch-manipulation',
          isHighlighted && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
        )}
        initial={isHighlighted ? highlightAnimation.initial : undefined}
        animate={isHighlighted ? highlightAnimation.animate : undefined}
        whileHover={{ y: -6, boxShadow: '6px 6px 0 0 var(--color-primary)' }}
        whileTap={{ scale: 0.98, y: 2 }}
        transition={springTransition}
      >
        <div className="relative aspect-[4/5] overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20 animate-shimmer" />

          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              priority={priority || index < 3}
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              quality={85}
            />
          ) : (
            <div className="absolute inset-0 bg-primary" />
          )}

          {isSold && (
            <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
              <span className="px-4 sm:px-6 py-1.5 sm:py-2 bg-foreground border-2 sm:border-[3px] border-foreground text-background text-sm sm:text-lg font-bold uppercase tracking-widest shadow-[2px_2px_0_0_rgba(0,0,0,0.3)] sm:shadow-[4px_4px_0_0_rgba(0,0,0,0.3)]">
                {t.sold}
              </span>
            </div>
          )}

          {!isSold && (
            <motion.div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}

          <div className="absolute top-3 left-3 sm:top-4 sm:left-4">
            <span className={cn(
              "px-2 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs uppercase tracking-wider font-bold border sm:border-2 shadow-[1px_1px_0_0_theme(colors.primary)] sm:shadow-[2px_2px_0_0_theme(colors.primary)]",
              product.product_type === 'original'
                ? "bg-background text-primary border-primary"
                : "bg-background text-foreground border-foreground shadow-[1px_1px_0_0_theme(colors.foreground)] sm:shadow-[2px_2px_0_0_theme(colors.foreground)]"
            )}>
              {productTypeLabel}
            </span>
          </div>

          {isLowStock && (
            <div className="absolute top-3 right-3 sm:top-4 sm:right-4">
              <span className="px-2 sm:px-3 py-0.5 sm:py-1 bg-warning text-background text-[10px] sm:text-xs uppercase tracking-wider font-bold border sm:border-2 border-warning shadow-[1px_1px_0_0_theme(colors.warning)] sm:shadow-[2px_2px_0_0_theme(colors.warning)]">
                {product.stock_quantity} {t.left}
              </span>
            </div>
          )}
        </div>

        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-base sm:text-lg group-hover:text-primary group-active:text-primary transition-colors line-clamp-2">
            {product.title}
          </h3>
          <p className={cn('mt-1 text-base sm:text-lg font-medium', isSold ? 'text-muted-foreground' : 'text-foreground')}>
            {isFromPrice && <span className="text-muted-foreground/50 text-xs font-normal lowercase">{fromLabel}</span>}
            {formatPrice(displayPrice)}
          </p>
          {product.sizes && product.sizes.length > 0 && (
            <div className="mt-1.5 sm:mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Ruler className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{product.sizes.map((s) => s.label).join(', ')}</span>
            </div>
          )}
        </div>

      </motion.article>
    </Link>
  );
});
