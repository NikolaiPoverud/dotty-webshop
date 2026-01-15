'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useState, useMemo, useRef, useCallback } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';

import type { Dictionary, Locale, ProductListItem, CollectionCard } from '@/types';
import { cn } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { FilterTabs, type FilterOption } from '@/components/shop/filter-tabs';
import { ProductCard } from '@/components/shop/product-card';

const PRODUCTS_PER_PAGE = 3;

interface CarouselArrowProps {
  direction: 'left' | 'right';
  onClick: () => void;
}

function CarouselArrow({ direction, onClick }: CarouselArrowProps): React.ReactElement {
  const isLeft = direction === 'left';
  const Icon = isLeft ? ChevronLeft : ChevronRight;

  return (
    <motion.button
      initial={{ opacity: 0, x: isLeft ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isLeft ? -20 : 20 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={isLeft ? 'Previous products' : 'Next products'}
      className={`group absolute top-1/2 -translate-y-1/2 z-20
                  w-10 h-10 sm:w-14 sm:h-14
                  bg-background border-2 sm:border-[3px] border-primary
                  flex items-center justify-center
                  transition-all duration-200
                  hover:bg-primary
                  ${isLeft
                    ? 'left-1 sm:left-0 sm:-translate-x-3 shadow-[2px_2px_0_0_theme(colors.primary)] sm:shadow-[4px_4px_0_0_theme(colors.primary)]'
                    : 'right-1 sm:right-0 sm:translate-x-3 shadow-[-2px_2px_0_0_theme(colors.primary)] sm:shadow-[-4px_4px_0_0_theme(colors.primary)]'
                  }`}
    >
      <Icon
        className="w-5 h-5 sm:w-8 sm:h-8 text-primary group-hover:text-background transition-colors"
        strokeWidth={3}
      />
    </motion.button>
  );
}

interface FeaturedGridProps {
  lang: Locale;
  products: ProductListItem[];
  collections: CollectionCard[];
  dictionary: Dictionary;
  showFilters?: boolean;
}

export function FeaturedGrid({
  lang,
  products,
  collections,
  dictionary,
  showFilters = true,
}: FeaturedGridProps): React.ReactElement {
  const t = dictionary.shop;
  const [activeFilter, setActiveFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(0);
  const isNavigating = useRef(false);

  const filterOptions: FilterOption[] = useMemo(() => {
    const collectionOptions = collections.map((c) => ({ id: c.id, label: c.name }));
    return [{ id: 'all', label: t.all }, ...collectionOptions];
  }, [collections, t.all]);

  const filteredProducts = useMemo(() => {
    if (activeFilter === 'all') return products;
    return products.filter((p) => p.collection_id === activeFilter);
  }, [products, activeFilter]);

  function handleFilterChange(filter: string): void {
    setActiveFilter(filter);
    setCurrentPage(0);
  }

  const totalPages = Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE);
  const maxPage = Math.max(0, totalPages - 1);
  const hasNextPage = currentPage < maxPage;
  const hasPrevPage = currentPage > 0;
  const startIndex = currentPage * PRODUCTS_PER_PAGE;
  const visibleProducts = filteredProducts.slice(startIndex, startIndex + PRODUCTS_PER_PAGE);

  const goToPage = useCallback((direction: 'next' | 'prev') => {
    if (isNavigating.current) return;
    isNavigating.current = true;

    setCurrentPage((prev) => {
      if (direction === 'next') {
        return Math.min(prev + 1, maxPage);
      }
      return Math.max(prev - 1, 0);
    });

    // Debounce: prevent rapid clicks for 300ms
    setTimeout(() => {
      isNavigating.current = false;
    }, 300);
  }, [maxPage]);

  if (products.length === 0) {
    return (
      <section id="art" className="py-20 sm:py-32 relative scroll-mt-20 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-muted-foreground text-center py-12">{t.comingSoon}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="art" className="py-20 sm:py-32 relative scroll-mt-20 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* View All Link */}
        <div className="flex justify-center mb-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
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

        {/* Filter Tabs - Centered */}
        {showFilters && filterOptions.length > 1 && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <FilterTabs
              options={filterOptions}
              activeId={activeFilter}
              onChange={handleFilterChange}
              centered
            />
          </motion.div>
        )}

        {/* Product Grid with Navigation */}
        <div className="relative">
          <AnimatePresence>
            {hasPrevPage && (
              <CarouselArrow
                direction="left"
                onClick={() => goToPage('prev')}
              />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {hasNextPage && (
              <CarouselArrow
                direction="right"
                onClick={() => goToPage('next')}
              />
            )}
          </AnimatePresence>

          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
            layout
          >
            <AnimatePresence mode="popLayout">
              {visibleProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{
                    opacity: { duration: 0.3 },
                    scale: { duration: 0.3 },
                    layout: { type: 'spring', stiffness: 300, damping: 30 },
                  }}
                >
                  <ProductCard
                    product={product}
                    lang={lang}
                    index={index}
                    priority={index < 2}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6 sm:hidden">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  aria-label={`Go to page ${i + 1}`}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    i === currentPage ? 'bg-primary' : 'bg-muted-foreground/30'
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Empty state for filtered results */}
        {filteredProducts.length === 0 && (
          <motion.p
            className="text-muted-foreground text-center py-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {t.empty}
          </motion.p>
        )}
      </div>
    </section>
  );
}
