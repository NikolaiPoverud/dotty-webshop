'use client';

import { motion } from 'framer-motion';
import { useState, use, useEffect, Suspense } from 'react';
import { CreditCard, Loader2, AlertCircle, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/utils';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';

const text = {
  no: {
    title: 'Kasse',
    shipping: 'Leveringsadresse',
    payment: 'Betaling',
    name: 'Fullt navn',
    email: 'E-post',
    phone: 'Telefon',
    address: 'Adresse',
    addressLine2: 'Adresse linje 2 (valgfritt)',
    city: 'By',
    postalCode: 'Postnummer',
    country: 'Land',
    discountCode: 'Rabattkode',
    apply: 'Bruk',
    subtotal: 'Delsum',
    discount: 'Rabatt',
    shipping_cost: 'Frakt',
    shipping_note: 'Beregnes etter bestilling',
    total: 'Totalt',
    payWithCard: 'Betal med kort',
    payWithVipps: 'Betal med Vipps',
    processing: 'Behandler...',
    orderSummary: 'Ordresammendrag',
    includingVat: 'inkl. MVA',
    emptyCart: 'Handlekurven er tom',
    paymentCanceled: 'Betalingen ble avbrutt',
    paymentCanceledDesc: 'Du kan prøve igjen når du er klar.',
    paymentFailed: 'Betalingen mislyktes',
    paymentFailedDesc: 'Kortet ble avvist eller det oppstod en feil. Vennligst prøv igjen.',
    genericError: 'Noe gikk galt. Vennligst prøv igjen.',
    fillAllFields: 'Vennligst fyll ut alle påkrevde felt',
    acceptPrivacy: 'Jeg har lest og godtar',
    privacyPolicy: 'personvernerklæringen',
    subscribeNewsletter: 'Ja, jeg vil motta nyhetsbrev med nyheter og tilbud',
    acceptPrivacyRequired: 'Du må godta personvernerklæringen for å fortsette',
  },
  en: {
    title: 'Checkout',
    shipping: 'Shipping Address',
    payment: 'Payment',
    name: 'Full name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    addressLine2: 'Address line 2 (optional)',
    city: 'City',
    postalCode: 'Postal code',
    country: 'Country',
    discountCode: 'Discount code',
    apply: 'Apply',
    subtotal: 'Subtotal',
    discount: 'Discount',
    shipping_cost: 'Shipping',
    shipping_note: 'Calculated after order',
    total: 'Total',
    payWithCard: 'Pay with card',
    payWithVipps: 'Pay with Vipps',
    processing: 'Processing...',
    orderSummary: 'Order Summary',
    includingVat: 'incl. VAT',
    emptyCart: 'Your cart is empty',
    paymentCanceled: 'Payment was canceled',
    paymentCanceledDesc: 'You can try again when you are ready.',
    paymentFailed: 'Payment failed',
    paymentFailedDesc: 'Your card was declined or an error occurred. Please try again.',
    genericError: 'Something went wrong. Please try again.',
    fillAllFields: 'Please fill in all required fields',
    acceptPrivacy: 'I have read and accept the',
    privacyPolicy: 'privacy policy',
    subscribeNewsletter: 'Yes, I want to receive newsletters with news and offers',
    acceptPrivacyRequired: 'You must accept the privacy policy to continue',
  },
};

function CheckoutContent({ locale, t }: { locale: Locale; t: typeof text['no'] }) {
  const searchParams = useSearchParams();
  const { cart, itemCount, applyDiscount } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [discountInput, setDiscountInput] = useState('');
  const [discountLoading, setDiscountLoading] = useState(false);
  const [discountError, setDiscountError] = useState('');
  const [discountSuccess, setDiscountSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    addressLine2: '',
    city: '',
    postalCode: '',
    country: 'Norge',
  });
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);

  // Check for canceled payment on mount
  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setError(t.paymentCanceled);
    }
  }, [searchParams, t.paymentCanceled]);

  if (itemCount === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <p className="text-muted-foreground">{t.emptyCart}</p>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyDiscount = async () => {
    if (!discountInput.trim()) return;

    setDiscountLoading(true);
    setDiscountError('');
    setDiscountSuccess('');

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: discountInput.trim(),
          subtotal: cart.subtotal,
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.valid) {
        setDiscountError(result.error || (locale === 'no' ? 'Ugyldig rabattkode' : 'Invalid discount code'));
        return;
      }

      applyDiscount(result.code, result.calculated_discount);
      setDiscountSuccess(locale === 'no' ? 'Rabattkode aktivert!' : 'Discount applied!');
      setDiscountInput('');
    } catch (error) {
      console.error('Discount validation error:', error);
      setDiscountError(locale === 'no' ? 'Kunne ikke validere rabattkode' : 'Failed to validate discount code');
    } finally {
      setDiscountLoading(false);
    }
  };

  const handleCheckout = async (provider: 'stripe' | 'vipps') => {
    // Clear any previous errors
    setError(null);

    // Validate form
    if (!formData.name || !formData.email || !formData.phone ||
        !formData.address || !formData.city || !formData.postalCode) {
      setError(t.fillAllFields);
      return;
    }

    // Validate privacy acceptance
    if (!privacyAccepted) {
      setError(t.acceptPrivacyRequired);
      return;
    }

    setIsLoading(true);

    try {
      if (provider === 'stripe') {
        // Create Stripe checkout session
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: cart.items.map(item => ({
              product_id: item.product.id,
              title: item.product.title,
              price: item.product.price,
              quantity: item.quantity,
              image_url: item.product.image_url,
            })),
            customer_email: formData.email,
            customer_name: formData.name,
            customer_phone: formData.phone,
            shipping_address: {
              line1: formData.address,
              line2: formData.addressLine2 || undefined,
              city: formData.city,
              postal_code: formData.postalCode,
              country: formData.country,
            },
            discount_code: cart.discountCode,
            discount_amount: cart.discountAmount,
            locale,
            privacy_accepted: true,
            newsletter_opt_in: newsletterOptIn,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to create checkout session');
        }

        // Redirect to Stripe checkout
        if (result.url) {
          window.location.href = result.url;
        }
      } else {
        // Vipps - placeholder for now
        setError(locale === 'no' ? 'Vipps-betaling kommer snart!' : 'Vipps payment coming soon!');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">
          <span className="gradient-text">{t.title}</span>
        </h1>

        {/* Error Banner */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-error">{error}</p>
              {error === t.paymentCanceled && (
                <p className="text-sm text-muted-foreground mt-1">{t.paymentCanceledDesc}</p>
              )}
            </div>
            <button
              onClick={() => setError(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Shipping Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold mb-6">{t.shipping}</h2>

            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">{t.name} *</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.email} *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t.phone} *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.address} *</label>
                <input
                  type="text"
                  name="address"
                  required
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.addressLine2}</label>
                <input
                  type="text"
                  name="addressLine2"
                  value={formData.addressLine2}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t.postalCode} *</label>
                  <input
                    type="text"
                    name="postalCode"
                    required
                    value={formData.postalCode}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium mb-1">{t.city} *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t.country} *</label>
                <input
                  type="text"
                  name="country"
                  required
                  value={formData.country}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </form>

            {/* Discount Code */}
            <div className="mt-8">
              <label className="block text-sm font-medium mb-1">{t.discountCode}</label>
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
                  disabled={discountLoading || !!cart.discountCode}
                  placeholder={cart.discountCode ? cart.discountCode : ''}
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  disabled={discountLoading || !discountInput.trim() || !!cart.discountCode}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {discountLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.apply}
                </button>
              </div>
              {discountError && (
                <p className="mt-2 text-sm text-error">{discountError}</p>
              )}
              {discountSuccess && (
                <p className="mt-2 text-sm text-success">{discountSuccess}</p>
              )}
            </div>

            {/* Consent Checkboxes */}
            <div className="mt-8 space-y-4">
              {/* Privacy Policy */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0"
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

              {/* Newsletter Opt-in */}
              <label className="flex items-start gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={newsletterOptIn}
                  onChange={(e) => setNewsletterOptIn(e.target.checked)}
                  className="mt-1 w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0"
                />
                <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  {t.subscribeNewsletter}
                </span>
              </label>
            </div>
          </motion.div>

          {/* Order Summary & Payment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-muted rounded-lg p-6">
              <h2 className="text-xl font-bold mb-6">{t.orderSummary}</h2>

              {/* Items */}
              <div className="space-y-4 mb-6">
                {cart.items.map((item) => (
                  <div key={item.product.id} className="flex justify-between">
                    <span className="text-muted-foreground">
                      {item.product.title} x{item.quantity}
                    </span>
                    <span>{formatPrice(item.product.price * item.quantity)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-3 border-t border-border pt-4 mb-6">
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

                <div className="flex justify-between text-muted-foreground">
                  <span>{t.shipping_cost}</span>
                  <span className="text-sm">{t.shipping_note}</span>
                </div>

                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>{t.total}</span>
                  <span>{formatPrice(cart.total)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{t.includingVat}</p>
              </div>

              {/* Payment Buttons */}
              <div className="space-y-3">
                <motion.button
                  onClick={() => handleCheckout('stripe')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest pop-outline transition-all duration-300 hover:bg-primary-light disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5" />
                  )}
                  {isLoading ? t.processing : t.payWithCard}
                </motion.button>

                <motion.button
                  onClick={() => handleCheckout('vipps')}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff5b24] text-white font-semibold text-lg uppercase tracking-widest rounded transition-all duration-300 hover:bg-[#ff5b24]/90 disabled:opacity-50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : null}
                  {isLoading ? t.processing : t.payWithVipps}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = text[locale];

  return (
    <Suspense fallback={
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <CheckoutContent locale={locale} t={t} />
    </Suspense>
  );
}
