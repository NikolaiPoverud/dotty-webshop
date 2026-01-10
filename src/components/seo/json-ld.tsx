import type { ReactElement } from 'react';

export const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

interface JsonLdProps {
  data: Record<string, unknown>;
}

export function JsonLd({ data }: JsonLdProps): ReactElement {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
