'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { getCartText } from '@/lib/i18n/cart-checkout-text';

interface CartPageProps {
  params: Promise<{ lang: string }>;
}

/**
 * Cart page redirects to checkout.
 * The slide-out cart panel handles cart viewing.
 * This page only shows empty state or redirects.
 */
export default function CartPage({ params }: CartPageProps): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = getCartText(locale);
  const { itemCount } = useCart();
  const router = useRouter();

  // Redirect to checkout if cart has items
  useEffect(() => {
    if (itemCount > 0) {
      router.replace(getLocalizedPath(locale, 'checkout'));
    }
  }, [itemCount, locale, router]);

  // Show empty cart state if no items
  if (itemCount === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-8">
            <span className="gradient-text">{t.title}</span>
          </h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-12 h-12 text-muted-foreground" />
            </div>
            <p className="text-xl text-muted-foreground mb-8">{t.empty}</p>
            <Link href={getLocalizedPath(locale, 'shop')}>
              <motion.button
                className="px-6 py-3 bg-background border-2 border-primary text-primary font-bold uppercase tracking-wider shadow-[3px_3px_0_0_theme(colors.primary)] hover:bg-primary hover:text-background hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_theme(colors.primary)] transition-all duration-200"
                whileTap={{ scale: 0.98 }}
              >
                {t.continueShopping}
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{locale === 'no' ? 'Går til kassen...' : 'Going to checkout...'}</p>
      </motion.div>
    </div>
  );
}
