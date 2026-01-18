'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import type { Dictionary, Locale, ProductListItem, CollectionCard } from '@/types';
import { ProductCard } from './product-card';
import { staggerContainer, fadeUpItem } from '@/lib/animations';

interface ShopContentProps {
  products: ProductListItem[];
  collections: CollectionCard[];
  lang: Locale;
  dictionary: Dictionary;
  initialCollection?: string;
  highlightedProduct?: string;
}

type ProductTypeFilter = 'all' | 'original' | 'print';

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
  const [activeType, setActiveType] = useState<ProductTypeFilter>('all');

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

  const handleCollectionChange = useCallback((collectionId: string) => {
    if (collectionId === activeCollection) return;
    setActiveCollection(collectionId);

    // Update URL without navigation
    const collection = collections.find(c => c.id === collectionId);
    const newPath = collectionId === 'all'
      ? `/${lang}/shop`
      : `/${lang}/shop/${collection?.slug || collectionId}`;
    window.history.replaceState(null, '', newPath);
  }, [activeCollection, collections, lang]);

  // Filter products by collection and type
  const filteredProducts = useMemo(() => {
    let filtered = products;

    // Filter by collection
    if (activeCollection !== 'all') {
      filtered = filtered.filter(p => p.collection_id === activeCollection);
    }

    // Filter by type
    if (activeType !== 'all') {
      filtered = filtered.filter(p => p.product_type === activeType);
    }

    return filtered;
  }, [products, activeCollection, activeType]);

  // Count products by type (for showing counts)
  const typeCounts = useMemo(() => {
    const baseProducts = activeCollection === 'all'
      ? products
      : products.filter(p => p.collection_id === activeCollection);

    return {
      all: baseProducts.length,
      original: baseProducts.filter(p => p.product_type === 'original').length,
      print: baseProducts.filter(p => p.product_type === 'print').length,
    };
  }, [products, activeCollection]);

  const typeLabels = {
    all: lang === 'no' ? 'Alle' : 'All',
    original: lang === 'no' ? 'Originaler' : 'Originals',
    print: lang === 'no' ? 'Trykk' : 'Prints',
  };

  return (
    <LayoutGroup>
      {/* Filter Section */}
      <div className="mb-10 space-y-6">
        {/* Type Toggle */}
        <div className="flex justify-center">
          <div className="inline-flex bg-muted/50 p-1 rounded-sm gap-1">
            {(['all', 'original', 'print'] as ProductTypeFilter[]).map((type) => (
              <button
                key={type}
                onClick={() => setActiveType(type)}
                className={`
                  px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-200
                  ${activeType === type
                    ? 'bg-primary text-white shadow-[2px_2px_0_0_rgba(0,0,0,0.3)]'
                    : 'text-muted-foreground hover:text-foreground'
                  }
                `}
              >
                {typeLabels[type]}
                {typeCounts[type] > 0 && (
                  <span className="ml-1.5 opacity-70">({typeCounts[type]})</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Collection Tabs */}
        {collections.length > 0 && (
          <div className="flex justify-center">
            <div className="flex flex-wrap justify-center gap-2">
              <button
                onClick={() => handleCollectionChange('all')}
                className={`
                  px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all duration-200
                  ${activeCollection === 'all'
                    ? 'border-primary bg-primary text-white shadow-[2px_2px_0_0_theme(colors.primary/30)]'
                    : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary'
                  }
                `}
              >
                {t.all}
              </button>
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionChange(collection.id)}
                  className={`
                    px-4 py-2 text-xs font-bold uppercase tracking-wider border-2 transition-all duration-200
                    ${activeCollection === collection.id
                      ? 'border-primary bg-primary text-white shadow-[2px_2px_0_0_theme(colors.primary/30)]'
                      : 'border-muted-foreground/30 text-muted-foreground hover:border-primary hover:text-primary'
                    }
                  `}
                >
                  {collection.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="min-h-[400px]">
        <AnimatePresence mode="wait">
          {filteredProducts.length > 0 ? (
            <motion.div
              key={`${activeCollection}-${activeType}`}
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
