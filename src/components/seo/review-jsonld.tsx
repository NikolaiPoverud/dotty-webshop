const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dotty.no';

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

export function ReviewJsonLd({ reviews, itemName = 'Dotty. Pop-Art' }: ReviewJsonLdProps) {
  // Calculate aggregate rating
  const reviewsWithRatings = reviews.filter((r) => r.rating !== undefined);
  const averageRating =
    reviewsWithRatings.length > 0
      ? reviewsWithRatings.reduce((sum, r) => sum + (r.rating || 5), 0) / reviewsWithRatings.length
      : 5;

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
        ratingValue: review.rating || 5,
        bestRating: '5',
        worstRating: '1',
      },
      datePublished: review.datePublished || new Date().toISOString().split('T')[0],
      publisher: {
        '@type': 'Organization',
        name: 'Dotty.',
        url: BASE_URL,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
