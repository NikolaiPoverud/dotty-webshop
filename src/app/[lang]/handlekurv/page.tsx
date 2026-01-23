'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';

import { useCart } from '@/components/cart/cart-provider';
import { getCartText } from '@/lib/i18n/cart-checkout-text';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import type { Locale } from '@/types';

interface CartPageProps {
  params: Promise<{ lang: string }>;
}

const BUTTON_CLASSES =
  'px-6 py-4 sm:py-3 bg-background border-2 border-primary text-primary font-bold uppercase tracking-wider shadow-[3px_3px_0_0_theme(colors.primary)] hover:bg-primary hover:text-background active:bg-primary active:text-background hover:-translate-y-0.5 hover:shadow-[4px_4px_0_0_theme(colors.primary)] transition-all duration-200 touch-manipulation';

function EmptyCartState({ locale }: { locale: Locale }): React.ReactElement {
  const t = getCartText(locale);

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
            <motion.button className={BUTTON_CLASSES} whileTap={{ scale: 0.98 }}>
              {t.continueShopping}
            </motion.button>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function RedirectingState({ locale }: { locale: Locale }): React.ReactElement {
  const t = getCartText(locale);

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">{t.redirectingToCheckout}</p>
      </motion.div>
    </div>
  );
}

/**
 * Cart page redirects to checkout when items exist.
 * The slide-out cart panel handles cart viewing.
 * This page only shows empty state or redirects.
 */
export default function CartPage({ params }: CartPageProps): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const { itemCount } = useCart();
  const router = useRouter();

  useEffect(() => {
    if (itemCount > 0) {
      router.replace(getLocalizedPath(locale, 'checkout'));
    }
  }, [itemCount, locale, router]);

  if (itemCount === 0) {
    return <EmptyCartState locale={locale} />;
  }

  return <RedirectingState locale={locale} />;
}
