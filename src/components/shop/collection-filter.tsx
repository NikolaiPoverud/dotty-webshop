'use client';

import { useRouter } from 'next/navigation';
import { FilterTabs, type FilterOption } from '@/components/shop/filter-tabs';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import type { Collection, Locale } from '@/types';

const TEXT = {
  no: { all: 'Alle verk', sold: 'Solgte verk' },
  en: { all: 'All works', sold: 'Sold works' },
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

  const options: FilterOptionWithHref[] = [
    { id: 'all', label: t.all, href: shopPath },
    ...collections.map((c) => ({ id: c.slug, label: c.name, href: `${shopPath}?collection=${c.slug}` })),
    { id: 'sold', label: t.sold, href: getLocalizedPath(lang, 'sold') },
  ];

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
        activeId={showSold ? 'sold' : (currentSlug ?? 'all')}
        onChange={handleChange}
        centered
      />
    </div>
  );
}
