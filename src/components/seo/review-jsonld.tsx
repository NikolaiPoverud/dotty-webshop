import type { ReactElement } from 'react';

import { BASE_URL, JsonLd } from './json-ld';

interface Review {
  author: string;
  reviewBody: string;
  rating?: number;
  datePublished?: string;
}

interface ReviewJsonLdProps {
  reviews: Review[];
  itemName?: string;
}

function calculateAverageRating(reviews: Review[]): number {
  const reviewsWithRatings = reviews.filter((r) => r.rating !== undefined);
  if (reviewsWithRatings.length === 0) {
    return 5;
  }
  const sum = reviewsWithRatings.reduce((acc, r) => acc + (r.rating ?? 5), 0);
  return sum / reviewsWithRatings.length;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export function ReviewJsonLd({ reviews, itemName = 'Dotty. Pop-Art' }: ReviewJsonLdProps): ReactElement {
  const averageRating = calculateAverageRating(reviews);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: itemName,
    brand: {
      '@type': 'Brand',
      name: 'Dotty.',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: averageRating.toFixed(1),
      reviewCount: reviews.length,
      bestRating: '5',
      worstRating: '1',
    },
    review: reviews.map((review) => ({
      '@type': 'Review',
      author: {
        '@type': 'Person',
        name: review.author,
      },
      reviewBody: review.reviewBody,
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating ?? 5,
        bestRating: '5',
        worstRating: '1',
      },
      datePublished: review.datePublished ?? getTodayDateString(),
      publisher: {
        '@type': 'Organization',
        name: 'Dotty.',
        url: BASE_URL,
      },
    })),
  };

  return <JsonLd data={structuredData} />;
}
