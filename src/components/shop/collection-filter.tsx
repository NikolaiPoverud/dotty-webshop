'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  onFilterChange?: (collectionId: string | null) => void;
}

export function CollectionFilter({
  collections,
  lang,
  currentSlug,
  showSold = false,
  onFilterChange,
}: CollectionFilterProps) {
  const t = text[lang];
  const router = useRouter();
  const shopPath = getLocalizedPath(lang, 'shop');
  const soldPath = getLocalizedPath(lang, 'sold');

  // Build options array
  const options = [
    { id: 'all', label: t.all, href: shopPath },
    ...collections.map(c => ({
      id: c.slug,
      label: c.name,
      href: `${shopPath}?collection=${c.slug}`,
    })),
    { id: 'sold', label: t.sold, href: soldPath },
  ];

  // Determine active option
  const activeId = showSold ? 'sold' : (currentSlug || 'all');

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabsRef = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const activeIndex = options.findIndex(opt => opt.id === activeId);
    const activeTab = tabsRef.current[activeIndex];

    if (activeTab) {
      setIndicatorStyle({
        left: activeTab.offsetLeft,
        width: activeTab.offsetWidth,
      });
    }
  }, [activeId, options]);

  const handleClick = (option: typeof options[0]) => {
    // If we have a callback, use instant client-side filtering
    if (onFilterChange) {
      onFilterChange(option.id === 'all' ? null : option.id);
    } else {
      // Otherwise, navigate to the URL
      router.push(option.href);
    }
  };

  return (
    <div className="flex justify-center mb-10">
      <div className="relative inline-flex items-center gap-1 p-1.5 bg-muted rounded-full overflow-x-auto max-w-full">
        {/* Animated Background Indicator */}
        <motion.div
          className="absolute h-[calc(100%-12px)] bg-primary rounded-full"
          initial={false}
          animate={{
            left: indicatorStyle.left,
            width: indicatorStyle.width,
          }}
          transition={{
            type: 'spring',
            stiffness: 400,
            damping: 30,
          }}
        />

        {/* Tab Buttons */}
        {options.map((option, index) => (
          <button
            key={option.id}
            ref={(el) => { tabsRef.current[index] = el; }}
            onClick={() => handleClick(option)}
            className={`relative z-10 px-4 py-2 text-sm font-medium rounded-full whitespace-nowrap transition-colors duration-200 ${
              activeId === option.id
                ? 'text-background'
                : 'text-foreground/70 hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
