'use client';

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import type { Dictionary, Locale, ProductListItem, CollectionCard } from '@/types';
import { ProductCard } from './product-card';
import { FilterTabs, type FilterOption } from './filter-tabs';
import { staggerContainer, fadeUpItem } from '@/lib/animations';

interface ShopContentProps {
  products: ProductListItem[];
  collections: CollectionCard[];
  lang: Locale;
  dictionary: Dictionary;
  initialCollection?: string;
  highlightedProduct?: string;
}


export function ShopContent({
  products,
  collections,
  lang,
  dictionary,
  initialCollection,
  highlightedProduct,
}: ShopContentProps) {
  const t = dictionary.shop;
  const searchParams = useSearchParams();

  const highlightFromUrl = searchParams.get('highlight');
  const highlightId = highlightFromUrl || highlightedProduct;
  const collectionFromUrl = searchParams.get('collection');

  const [activeCollection, setActiveCollection] = useState(initialCollection || collectionFromUrl || 'all');

  // Scroll to highlighted product
  useEffect(() => {
    if (highlightId) {
      const timer = setTimeout(() => {
        const element = document.getElementById(`product-${highlightId}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightId]);

  function handleCollectionChange(collectionId: string): void {
    if (collectionId === activeCollection) return;
    setActiveCollection(collectionId);

    const collection = collections.find(c => c.id === collectionId);
    const newPath = collectionId === 'all'
      ? `/${lang}/shop`
      : `/${lang}/shop/${collection?.slug || collectionId}`;
    window.history.replaceState(null, '', newPath);
  }

  // Filter products by collection
  const filteredProducts = useMemo(() => {
    if (activeCollection === 'all') {
      return products;
    }
    return products.filter(p => p.collection_id === activeCollection);
  }, [products, activeCollection]);

  // Build collection filter options (only show collections with products)
  const collectionsWithProducts = collections.filter(c =>
    products.some(p => p.collection_id === c.id)
  );

  const collectionOptions: FilterOption[] = [
    { id: 'all', label: t.all },
    ...collectionsWithProducts.map(c => ({ id: c.id, label: c.name })),
  ];

  return (
    <LayoutGroup>
      {/* Collection Filter */}
      {collectionsWithProducts.length > 0 && (
        <div className="mb-10">
          <FilterTabs
            options={collectionOptions}
            activeId={activeCollection}
            onChange={handleCollectionChange}
            centered
          />
        </div>
      )}

      {/* Products Grid */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={activeCollection}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  id={`product-${product.id}`}
                  variants={fadeUpItem}
                  layout
                  className="will-change-transform"
                >
                  <ProductCard
                    product={product}
                    lang={lang}
                    index={index}
                    isHighlighted={product.id === highlightId}
                  />
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              className="text-muted-foreground text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {t.empty}
            </motion.p>
          )}
        </AnimatePresence>
      </div>
    </LayoutGroup>
  );
}
