'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { use } from 'react';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { CartItemRow } from '@/components/cart/cart-item';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const text = {
  no: {
    title: 'Handlekurv',
    empty: 'Handlekurven din er tom',
    continueShopping: 'Fortsett å handle',
    checkout: 'Gå til kassen',
    subtotal: 'Delsum',
    discount: 'Rabatt',
    total: 'Totalt',
    reservationWarning: 'Varer er reservert i begrenset tid',
    includingVat: 'inkl. MVA',
  },
  en: {
    title: 'Shopping Cart',
    empty: 'Your cart is empty',
    continueShopping: 'Continue shopping',
    checkout: 'Proceed to checkout',
    subtotal: 'Subtotal',
    discount: 'Discount',
    total: 'Total',
    reservationWarning: 'Items are reserved for limited time',
    includingVat: 'incl. VAT',
  },
};

export default function CartPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = text[locale];
  const { cart, itemCount } = useCart();

  const hasReservations = cart.items.some((item) => item.expiresAt);

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Title */}
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">
          <span className="gradient-text">{t.title}</span>
        </h1>

        {itemCount === 0 ? (
          /* Empty Cart */
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
                className="px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {t.continueShopping}
              </motion.button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              {/* Reservation Warning */}
              {hasReservations && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-warning/10 border border-warning/30 rounded-lg"
                >
                  <p className="text-sm text-warning">{t.reservationWarning}</p>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {cart.items.map((item) => (
                  <CartItemRow key={item.product.id} item={item} lang={locale} />
                ))}
              </AnimatePresence>

              {/* Continue Shopping Link */}
              <Link
                href={getLocalizedPath(locale, 'shop')}
                className="inline-flex items-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                ← {t.continueShopping}
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-muted rounded-lg p-6 sticky top-24"
              >
                <h2 className="text-xl font-bold mb-6">{t.total}</h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{t.subtotal}</span>
                    <span>{formatPrice(cart.subtotal)}</span>
                  </div>

                  {cart.discountCode && cart.discountAmount > 0 && (
                    <div className="flex justify-between text-success">
                      <span>{t.discount} ({cart.discountCode})</span>
                      <span>-{formatPrice(cart.discountAmount)}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-3">
                    <div className="flex justify-between font-bold text-lg">
                      <span>{t.total}</span>
                      <span>{formatPrice(cart.total)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.includingVat}
                    </p>
                  </div>
                </div>

                <Link href={getLocalizedPath(locale, 'checkout')}>
                  <motion.button
                    className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest pop-outline transition-all duration-300 hover:bg-primary-light"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {t.checkout}
                    <ArrowRight className="w-5 h-5" />
                  </motion.button>
                </Link>
              </motion.div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
