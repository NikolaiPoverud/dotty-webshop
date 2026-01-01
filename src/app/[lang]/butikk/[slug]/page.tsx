'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, Mail } from 'lucide-react';
import { useState, use } from 'react';
import type { Locale, Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

// Placeholder data - replace with Supabase fetch
const getProduct = (slug: string): Product | null => {
  const products: Record<string, Product> = {
    'neon-dreams': {
      id: '1',
      title: 'Neon Dreams',
      description: 'En eksplosjon av neonfarger som fanger byens puls. Dette verket representerer den urbane energien og livskraften som finnes i storbyens nattliv. Skapt med akryl på lerret.',
      slug: 'neon-dreams',
      price: 350000,
      image_url: '',
      image_path: '',
      product_type: 'original',
      stock_quantity: null,
      collection_id: null,
      is_available: true,
      is_featured: true,
      display_order: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    'pink-explosion': {
      id: '2',
      title: 'Pink Explosion',
      description: 'Kraftfulle rosa toner som sprenger grenser. Et trykk som bringer pop-art energi til ethvert rom.',
      slug: 'pink-explosion',
      price: 150000,
      image_url: '',
      image_path: '',
      product_type: 'print',
      stock_quantity: 10,
      collection_id: null,
      is_available: true,
      is_featured: false,
      display_order: 2,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  };
  return products[slug] || null;
};

const text = {
  no: {
    back: 'Tilbake til butikken',
    original: 'Original',
    print: 'Trykk',
    inStock: 'På lager',
    addToCart: 'Legg i handlekurv',
    sold: 'Solgt',
    requestSimilar: 'Interessert i lignende verk?',
    contactArtist: 'Kontakt kunstneren',
    includingVat: 'inkl. MVA',
    adding: 'Legger til...',
  },
  en: {
    back: 'Back to shop',
    original: 'Original',
    print: 'Print',
    inStock: 'In stock',
    addToCart: 'Add to cart',
    sold: 'Sold',
    requestSimilar: 'Interested in similar work?',
    contactArtist: 'Contact the artist',
    includingVat: 'incl. VAT',
    adding: 'Adding...',
  },
};

// Random gradient for placeholder
const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
];

export default function ProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = use(params);
  const locale = lang as Locale;
  const t = text[locale];
  const product = getProduct(slug);
  const [isAdding, setIsAdding] = useState(false);

  if (!product) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const isSold = !product.is_available;
  const gradient = gradients[Math.floor(Math.random() * gradients.length)];

  const handleAddToCart = async () => {
    setIsAdding(true);
    // TODO: Implement add to cart with reservation
    await new Promise((r) => setTimeout(r, 1000));
    setIsAdding(false);
    // Show success feedback
  };

  const handleRequestSimilar = () => {
    const subject = encodeURIComponent(`Interested in similar work to "${product.title}"`);
    const body = encodeURIComponent(`Hi Dotty,\n\nI saw "${product.title}" on your website and I'm interested in similar artwork.\n\nBest regards`);
    window.location.href = `mailto:hello@dotty.no?subject=${subject}&body=${body}`;
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Link */}
        <Link
          href={getLocalizedPath(locale, 'shop')}
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Image */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
              {product.image_url ? (
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient}`} />
              )}

              {/* Sold Overlay */}
              {isSold && (
                <div className="absolute inset-0 bg-background/60 flex items-center justify-center">
                  <span className="px-8 py-3 bg-foreground text-background text-xl font-bold uppercase tracking-widest">
                    {t.sold}
                  </span>
                </div>
              )}
            </div>

            {/* Decorative frame */}
            <div className="absolute -inset-4 border-2 border-primary/20 rounded-lg -z-10" />
          </motion.div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col"
          >
            {/* Type Badge */}
            <span className="inline-block px-3 py-1 bg-muted text-sm uppercase tracking-wider font-medium rounded w-fit mb-4">
              {product.product_type === 'original' ? t.original : t.print}
            </span>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl font-bold mb-4">
              {product.title}
            </h1>

            {/* Price */}
            <div className="mb-6">
              <span className={`text-3xl font-bold ${isSold ? 'line-through text-muted-foreground' : ''}`}>
                {formatPrice(product.price)}
              </span>
              <span className="text-sm text-muted-foreground ml-2">
                {t.includingVat}
              </span>
            </div>

            {/* Stock info for prints */}
            {product.product_type === 'print' && product.stock_quantity !== null && product.is_available && (
              <p className="text-sm text-muted-foreground mb-6">
                {t.inStock}: {product.stock_quantity}
              </p>
            )}

            {/* Description */}
            <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
              {product.description}
            </p>

            {/* CTA */}
            {isSold ? (
              <div className="space-y-4">
                <p className="text-muted-foreground">{t.requestSimilar}</p>
                <motion.button
                  onClick={handleRequestSimilar}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-muted hover:bg-muted/80 font-semibold rounded-lg transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Mail className="w-5 h-5" />
                  {t.contactArtist}
                </motion.button>
              </div>
            ) : (
              <motion.button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest pop-outline transition-all duration-300 hover:bg-primary-light disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <ShoppingBag className="w-5 h-5" />
                {isAdding ? t.adding : t.addToCart}
              </motion.button>
            )}

            {/* Signature dots */}
            <div className="mt-auto pt-12 flex gap-2">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary/50"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                />
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
