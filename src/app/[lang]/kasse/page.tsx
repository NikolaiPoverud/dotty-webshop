'use client';

import { Suspense, use, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import Link from 'next/link';
import { useCart } from '@/components/cart/cart-provider';
import {
  ConsentCheckboxes,
  DiscountCodeInput,
  ErrorBanner,
  FormInput,
  MobileCheckoutBar,
  OrderSummary,
  ShippingSelector,
} from '@/components/checkout';
import { getCheckoutText, type CheckoutText } from '@/lib/i18n/cart-checkout-text';
import type { Locale, ShippingOption } from '@/types';

interface CheckoutPageProps {
  params: Promise<{ lang: string }>;
}

interface ShippingFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  city: string;
  postalCode: string;
  country: string;
}

const INITIAL_FORM_DATA: ShippingFormData = {
  name: '',
  email: '',
  phone: '',
  address: '',
  addressLine2: '',
  city: '',
  postalCode: '',
  country: 'Norge',
};

function CheckoutContent({ locale, t }: { locale: Locale; t: CheckoutText }): React.ReactElement {
  const searchParams = useSearchParams();
  const { cart, itemCount, applyDiscount } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>(INITIAL_FORM_DATA);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);
  const errorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (error && errorRef.current) {
      errorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      const firstInvalid = document.querySelector<HTMLInputElement>('input:invalid');
      if (firstInvalid) {
        firstInvalid.focus({ preventScroll: true });
      }
    }
  }, [error]);

  useEffect(() => {
    let isCancelled = false;

    async function fetchToken(isRetry = false): Promise<void> {
      try {
        const response = await fetch('/api/checkout/token');
        if (isCancelled) return;

        if (response.ok) {
          const data = await response.json();
          setCheckoutToken(data.token);
        } else if (!isRetry) {
          setTimeout(() => fetchToken(true), 1000);
        }
      } catch {
        // Token fetch failed, will be validated at checkout
      }
    }

    fetchToken();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setError(t.paymentCanceled);
      return;
    }

    const vippsError = searchParams.get('vipps_error');
    if (!vippsError) return;

    if (vippsError === 'canceled') {
      setError(t.paymentCanceled);
    } else if (vippsError === 'incomplete') {
      setError(t.vippsIncomplete ?? 'Vipps-betaling ble ikke fullført. Prøv igjen.');
    } else {
      setError(t.genericError);
    }
  }, [searchParams, t.paymentCanceled, t.vippsIncomplete, t.genericError]);

  if (itemCount === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex flex-col items-center justify-center gap-6">
        <p className="text-muted-foreground">{t.emptyCart}</p>
        <Link
          href={`/${locale}/shop`}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary/90 transition-colors"
        >
          {t.continueShopping}
        </Link>
      </div>
    );
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm(): boolean {
    const { name, email, phone, address, city, postalCode, country } = formData;
    const requiredFieldsMissing = !name || !email || !phone || !address || !city || !postalCode;

    if (requiredFieldsMissing) {
      setError(t.fillAllFields);
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t.invalidEmail);
      return false;
    }

    const phoneRegex = /^[+\d][\d\s-]{6,}$/;
    if (!phoneRegex.test(phone)) {
      setError(t.invalidPhone);
      return false;
    }

    if (country === 'Norge' && !/^\d{4}$/.test(postalCode)) {
      setError(t.invalidPostalCode);
      return false;
    }

    if (country === 'Norge' && !selectedShipping) {
      setError(t.shippingRequired);
      return false;
    }

    if (!privacyAccepted) {
      setError(t.acceptPrivacyRequired);
      return false;
    }

    return true;
  }

  async function handleCheckout(provider: 'stripe' | 'vipps'): Promise<void> {
    setError(null);

    if (!validateForm()) return;

    if (!checkoutToken) {
      setError(t.sessionExpired ?? 'Checkout session expired. Please refresh the page and try again.');
      return;
    }

    setIsLoading(true);

    try {
      const endpoint = provider === 'vipps' ? '/api/vipps/initiate' : '/api/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map((item) => ({
            product_id: item.product.id,
            title: item.product.title,
            price: item.selectedSize?.price ?? item.product.price,
            quantity: item.quantity,
            image_url: item.product.image_url ?? '',
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
          discount_code: cart.discountCode ?? undefined,
          discount_amount: cart.discountAmount ?? 0,
          shipping_cost: cart.freeShipping ? 0 : (selectedShipping?.priceWithVat ?? cart.shippingCost ?? 0),
          shipping_option_id: selectedShipping?.id,
          shipping_option_name: selectedShipping?.name,
          artist_levy: cart.artistLevy ?? 0,
          locale,
          privacy_accepted: true,
          newsletter_opt_in: newsletterOptIn,
          checkout_token: checkoutToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error || t.genericError);
        setIsLoading(false);
        return;
      }

      const redirectUrl = result.url ?? result.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch {
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
  }

  const shippingCost = cart.freeShipping ? 0 : (selectedShipping?.priceWithVat ?? cart.shippingCost);
  const total = cart.subtotal + shippingCost + cart.artistLevy - cart.discountAmount;

  return (
    <div className="min-h-screen pt-20 sm:pt-24 pb-28 lg:pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {error && (
          <div ref={errorRef}>
            <ErrorBanner
              error={error}
              description={error === t.paymentCanceled ? t.paymentCanceledDesc : undefined}
              onDismiss={() => setError(null)}
            />
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
              <span className="gradient-text">{t.title}</span>
            </h1>

            <form className="space-y-3 sm:space-y-4">
              <FormInput
                label={t.name}
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
              />

              <div className="grid sm:grid-cols-2 gap-4">
                <FormInput
                  label={t.email}
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                />
                <FormInput
                  label={t.phone}
                  name="phone"
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </div>

              <FormInput
                label={t.address}
                name="address"
                required
                value={formData.address}
                onChange={handleInputChange}
              />

              <FormInput
                label={t.addressLine2}
                name="addressLine2"
                value={formData.addressLine2}
                onChange={handleInputChange}
              />

              <div className="grid sm:grid-cols-3 gap-4">
                <FormInput
                  label={t.postalCode}
                  name="postalCode"
                  required
                  value={formData.postalCode}
                  onChange={handleInputChange}
                />
                <FormInput
                  label={t.city}
                  name="city"
                  required
                  value={formData.city}
                  onChange={handleInputChange}
                  className="sm:col-span-2"
                />
              </div>

              <FormInput
                label={t.country}
                name="country"
                required
                value={formData.country}
                onChange={handleInputChange}
              />

              <ConsentCheckboxes
                locale={locale}
                t={t}
                privacyAccepted={privacyAccepted}
                newsletterOptIn={newsletterOptIn}
                onPrivacyChange={setPrivacyAccepted}
                onNewsletterChange={setNewsletterOptIn}
              />
            </form>

            <DiscountCodeInput
              t={t}
              onApplyDiscount={applyDiscount}
              existingCode={cart.discountCode}
              subtotal={cart.subtotal}
            />

            {formData.country === 'Norge' && (
              <div className="mt-8">
                <h2 className="text-xl font-bold mb-4">{t.shippingMethod}</h2>
                <ShippingSelector
                  postalCode={formData.postalCode}
                  countryCode="NO"
                  locale={locale}
                  selectedOption={selectedShipping}
                  onSelect={setSelectedShipping}
                  disabled={isLoading}
                  freeShipping={cart.freeShipping}
                />
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <OrderSummary
              t={t}
              isLoading={isLoading}
              onCheckout={handleCheckout}
              selectedShipping={selectedShipping}
            />
          </motion.div>
        </div>
      </div>

      <MobileCheckoutBar
        total={total}
        t={t}
        isLoading={isLoading}
        onCheckout={handleCheckout}
      />
    </div>
  );
}

export default function CheckoutPage({ params }: CheckoutPageProps): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = getCheckoutText(locale);

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
