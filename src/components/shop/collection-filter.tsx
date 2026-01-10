'use client';

import { useRouter } from 'next/navigation';
import { FilterTabs, type FilterOption } from '@/components/shop/filter-tabs';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import type { Collection, Locale } from '@/types';

const TEXT = {
  no: {
    all: 'Alle verk',
    sold: 'Solgte verk',
  },
  en: {
    all: 'All works',
    sold: 'Sold works',
  },
} as const;

interface CollectionFilterProps {
  collections: Collection[];
  lang: Locale;
  currentSlug?: string;
  showSold?: boolean;
  onFilterChange?: (collectionId: string | null) => void;
}

interface FilterOptionWithHref extends FilterOption {
  href: string;
}

export function CollectionFilter({
  collections,
  lang,
  currentSlug,
  showSold = false,
  onFilterChange,
}: CollectionFilterProps): React.ReactElement {
  const router = useRouter();
  const t = TEXT[lang];
  const shopPath = getLocalizedPath(lang, 'shop');
  const soldPath = getLocalizedPath(lang, 'sold');

  const options: FilterOptionWithHref[] = [
    { id: 'all', label: t.all, href: shopPath },
    ...collections.map((collection) => ({
      id: collection.slug,
      label: collection.name,
      href: `${shopPath}?collection=${collection.slug}`,
    })),
    { id: 'sold', label: t.sold, href: soldPath },
  ];

  const activeId = showSold ? 'sold' : (currentSlug || 'all');

  function handleChange(id: string): void {
    if (onFilterChange) {
      onFilterChange(id === 'all' ? null : id);
      return;
    }

    const selectedOption = options.find((opt) => opt.id === id);
    if (selectedOption) {
      router.push(selectedOption.href);
    }
  }

  return (
    <div className="mb-10">
      <FilterTabs
        options={options}
        activeId={activeId}
        onChange={handleChange}
        centered
      />
    </div>
  );
}
