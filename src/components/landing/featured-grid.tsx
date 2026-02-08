'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { fadeUp, staggerContainer } from '@/lib/animations';
import type { CollectionCard, Dictionary, Locale, ProductListItem } from '@/types';

interface FeaturedGridProps {
  lang: Locale;
  products: ProductListItem[];
  collections: CollectionCard[];
  dictionary: Dictionary;
  showFilters?: boolean;
}

function getCollectionHref(lang: Locale, collection: CollectionCard): string {
  return `/${lang}/shop/${collection.slug}`;
}

export function FeaturedGrid({
  lang,
  products,
  collections,
  dictionary,
}: FeaturedGridProps): React.ReactElement {
  const t = dictionary.shop;

  // Pick one representative image per collection
  const collectionCards = collections
    .map((collection) => {
      const collectionProduct = products.find((p) => p.collection_id === collection.id);
      return {
        collection,
        imageUrl: collectionProduct?.image_url ?? null,
        productCount: products.filter((p) => p.collection_id === collection.id).length,
      };
    })
    .filter((c) => c.imageUrl);

  if (collectionCards.length === 0) {
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
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {collectionCards.map(({ collection, imageUrl }) => (
            <motion.div key={collection.id} variants={fadeUp}>
              <Link
                href={getCollectionHref(lang, collection)}
                className="group block"
              >
                <div className="relative aspect-[3/4] overflow-hidden bg-muted border-[3px] border-transparent group-hover:border-primary transition-all duration-300">
                  {imageUrl && (
                    <Image
                      src={imageUrl}
                      alt={collection.name}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6">
                    <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">
                      {collection.name}
                    </h3>
                    <span className="inline-flex items-center gap-1.5 text-sm text-white/80 font-medium group-hover:text-primary transition-colors">
                      {t.viewAll}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex justify-center mt-10"
        >
          <Link
            href={getLocalizedPath(lang, 'shop')}
            className="text-sm uppercase tracking-widest text-primary hover:text-primary/80 transition-colors py-3 px-4 touch-manipulation"
          >
            {t.viewAll} →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
