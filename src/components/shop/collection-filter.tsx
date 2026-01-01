'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import type { Locale, Collection } from '@/types';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const text = {
  no: {
    all: 'Alle verk',
    sold: 'Solgte verk',
  },
  en: {
    all: 'All works',
    sold: 'Sold works',
  },
};

interface CollectionFilterProps {
  collections: Collection[];
  lang: Locale;
  currentSlug?: string;
  showSold?: boolean;
}

export function CollectionFilter({
  collections,
  lang,
  currentSlug,
  showSold = false,
}: CollectionFilterProps) {
  const t = text[lang];
  const shopPath = getLocalizedPath(lang, 'shop');

  return (
    <div className="flex flex-wrap gap-3 mb-8">
      {/* All Works */}
      <Link href={shopPath}>
        <motion.button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            !currentSlug && !showSold
              ? 'bg-primary text-background'
              : 'bg-muted hover:bg-muted/80'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {t.all}
        </motion.button>
      </Link>

      {/* Collections */}
      {collections.map((collection) => (
        <Link key={collection.id} href={`${shopPath}?collection=${collection.slug}`}>
          <motion.button
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              currentSlug === collection.slug
                ? 'bg-primary text-background'
                : 'bg-muted hover:bg-muted/80'
            }`}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {collection.name}
          </motion.button>
        </Link>
      ))}

      {/* Sold Gallery */}
      <Link href={getLocalizedPath(lang, 'sold')}>
        <motion.button
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            showSold
              ? 'bg-primary text-background'
              : 'bg-muted hover:bg-muted/80'
          }`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {t.sold}
        </motion.button>
      </Link>
    </div>
  );
}
