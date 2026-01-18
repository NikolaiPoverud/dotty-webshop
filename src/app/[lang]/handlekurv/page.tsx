'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Loader2 } from 'lucide-react';
import { use, useState } from 'react';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { CartItemRow } from '@/components/cart/cart-item';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { getCartText } from '@/lib/i18n/cart-checkout-text';

interface CartPageProps {
  params: Promise<{ lang: string }>;
}

function EmptyCart({ locale, t }: { locale: Locale; t: ReturnType<typeof getCartText> }): React.ReactElement {
  return (
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
  );
}

interface OrderSummaryProps {
  locale: Locale;
  t: ReturnType<typeof getCartText>;
  privacyAccepted: boolean;
  newsletterOptIn: boolean;
  onPrivacyChange: (value: boolean) => void;
  onNewsletterChange: (value: boolean) => void;
}

function OrderSummary({ locale, t, privacyAccepted, newsletterOptIn, onPrivacyChange, onNewsletterChange }: OrderSummaryProps): React.ReactElement {
  const { cart, applyDiscount } = useCart();
  const [discountInput, setDiscountInput] = useState('');
  const [isLoadingDiscount, setIsLoadingDiscount] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');

  const hasDiscount = cart.discountCode && cart.discountAmount > 0;
  const hasShipping = cart.shippingCost > 0;
  const hasArtistLevy = cart.artistLevy > 0;

  async function handleApplyDiscount(): Promise<void> {
    if (!discountInput.trim()) return;

    setIsLoadingDiscount(true);
    setDiscountError('');
    setDiscountSuccess('');

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput.trim(), subtotal: cart.subtotal }),
      });

      const result = await response.json();

      if (!response.ok || !result.valid) {
        setDiscountError(result.error || t.invalidDiscountCode);
        return;
      }

      applyDiscount(result.code, result.calculated_discount);
      setDiscountSuccess(t.discountApplied);
      setDiscountInput('');
    } catch {
      setDiscountError(t.discountValidationFailed);
    } finally {
      setIsLoadingDiscount(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-muted rounded-lg p-6 sticky top-24"
    >
      <h2 className="text-xl font-bold mb-6">{t.total}</h2>

      <div className="space-y-3 mb-6">
        {/* Subtotal */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.subtotal}</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>

        {/* Shipping */}
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.shipping}</span>
          {hasShipping ? (
            <span>{formatPrice(cart.shippingCost)}</span>
          ) : (
            <span className="text-muted-foreground text-sm">{t.shippingNote}</span>
          )}
        </div>

        {/* Artist Levy - only show if applicable */}
        {hasArtistLevy && (
          <div className="flex justify-between">
            <div>
              <span className="text-muted-foreground">{t.artistLevy}</span>
              <p className="text-xs text-muted-foreground/70">{t.artistLevyNote}</p>
            </div>
            <span>{formatPrice(cart.artistLevy)}</span>
          </div>
        )}

        {/* Discount */}
        {hasDiscount && (
          <div className="flex justify-between text-success">
            <span>{t.discount} ({cart.discountCode})</span>
            <span>-{formatPrice(cart.discountAmount)}</span>
          </div>
        )}

        {/* Total */}
        <div className="border-t border-border pt-3">
          <div className="flex justify-between font-bold text-lg">
            <span>{t.total}</span>
            <span>{formatPrice(cart.total)}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">{t.includingVat}</p>
        </div>
      </div>

      {/* Discount Code Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">{t.discountCode}</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={discountInput}
            onChange={(e) => {
              setDiscountInput(e.target.value);
              setDiscountError('');
              setDiscountSuccess('');
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleApplyDiscount()}
            disabled={isLoadingDiscount || !!cart.discountCode}
            placeholder={cart.discountCode || ''}
            className="flex-1 px-4 py-2.5 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 text-sm"
          />
          <button
            type="button"
            onClick={handleApplyDiscount}
            disabled={isLoadingDiscount || !discountInput.trim() || !!cart.discountCode}
            className="px-4 py-2.5 bg-background hover:bg-background/80 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {isLoadingDiscount ? <Loader2 className="w-4 h-4 animate-spin" /> : t.apply}
          </button>
        </div>
        {discountError && <p className="mt-1 text-xs text-error">{discountError}</p>}
        {discountSuccess && <p className="mt-1 text-xs text-success">{discountSuccess}</p>}
      </div>

      {/* Consent Checkboxes */}
      <div className="mb-6 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={privacyAccepted}
            onChange={(e) => onPrivacyChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {t.acceptPrivacy}{' '}
            <a
              href={`/${locale}/privacy`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {t.privacyPolicy}
            </a>
            {' *'}
          </span>
        </label>

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={newsletterOptIn}
            onChange={(e) => onNewsletterChange(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary focus:ring-offset-0"
          />
          <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
            {t.subscribeNewsletter}
          </span>
        </label>
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
  );
}

export default function CartPage({ params }: CartPageProps): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = getCartText(locale);
  const { cart, itemCount } = useCart();
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  const hasReservations = cart.items.some((item) => item.expiresAt);

  if (itemCount === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl sm:text-5xl font-bold mb-8">
            <span className="gradient-text">{t.title}</span>
          </h1>
          <EmptyCart locale={locale} t={t} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">
          <span className="gradient-text">{t.title}</span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
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

            <Link
              href={getLocalizedPath(locale, 'shop')}
              className="inline-flex items-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
            >
              &larr; {t.continueShopping}
            </Link>
          </div>

          <div className="lg:col-span-1">
            <OrderSummary
              locale={locale}
              t={t}
              privacyAccepted={privacyAccepted}
              newsletterOptIn={newsletterOptIn}
              onPrivacyChange={setPrivacyAccepted}
              onNewsletterChange={setNewsletterOptIn}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
