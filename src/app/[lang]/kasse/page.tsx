'use client';

import { motion } from 'framer-motion';
import { useState, use, useEffect, Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Locale, ShippingOption } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import {
  FormInput,
  ErrorBanner,
  DiscountCodeInput,
  ConsentCheckboxes,
  OrderSummary,
  ShippingSelector,
} from '@/components/checkout';
import { getCheckoutText, type CheckoutText } from '@/lib/i18n/cart-checkout-text';

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

  // SEC-002: Fetch checkout token when page loads
  useEffect(() => {
    async function fetchCheckoutToken(): Promise<void> {
      try {
        const response = await fetch('/api/checkout/token');
        if (response.ok) {
          const data = await response.json();
          setCheckoutToken(data.token);
        }
      } catch (err) {
        console.error('Failed to fetch checkout token:', err);
      }
    }

    fetchCheckoutToken();
  }, []);

  useEffect(() => {
    if (searchParams.get('canceled') === 'true') {
      setError(t.paymentCanceled);
    }

    // Handle Vipps errors
    const vippsError = searchParams.get('vipps_error');
    if (vippsError) {
      switch (vippsError) {
        case 'canceled':
          setError(t.paymentCanceled);
          break;
        case 'incomplete':
          setError(t.vippsIncomplete || 'Vipps-betaling ble ikke fullført. Prøv igjen.');
          break;
        default:
          setError(t.genericError);
      }
    }
  }, [searchParams, t.paymentCanceled, t.genericError]);

  if (itemCount === 0) {
    return (
      <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
        <p className="text-muted-foreground">{t.emptyCart}</p>
      </div>
    );
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>): void {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function validateForm(): boolean {
    if (!formData.name || !formData.email || !formData.phone ||
        !formData.address || !formData.city || !formData.postalCode) {
      setError(t.fillAllFields);
      return false;
    }

    // Require shipping selection for Norwegian addresses
    if (formData.country === 'Norge' && !selectedShipping) {
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

    setIsLoading(true);

    try {
      const endpoint = provider === 'vipps' ? '/api/vipps/initiate' : '/api/checkout';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.items.map(item => ({
            product_id: item.product.id,
            title: item.product.title,
            price: item.product.price,
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
          discount_code: cart.discountCode || undefined,
          discount_amount: cart.discountAmount ?? 0,
          shipping_cost: selectedShipping?.priceWithVat ?? cart.shippingCost ?? 0,
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
        // Show the actual API error message to help users understand what went wrong
        setError(result.error || t.genericError);
        setIsLoading(false);
        return;
      }

      // Handle redirect URL (Stripe uses 'url', Vipps uses 'redirectUrl')
      const redirectUrl = result.url || result.redirectUrl;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(t.genericError);
    } finally {
      setIsLoading(false);
    }
  }

  const errorDescription = error === t.paymentCanceled ? t.paymentCanceledDesc : undefined;

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-8">
          <span className="gradient-text">{t.title}</span>
        </h1>

        {error && (
          <ErrorBanner
            error={error}
            description={errorDescription}
            onDismiss={() => setError(null)}
          />
        )}

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-xl font-bold mb-6">{t.shipping}</h2>

            <form className="space-y-4">
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
            </form>

            {/* Shipping Method Selection - Only for Norwegian addresses */}
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
                />
              </div>
            )}

            <DiscountCodeInput
              t={t}
              onApplyDiscount={applyDiscount}
              existingCode={cart.discountCode}
              subtotal={cart.subtotal}
            />

            <ConsentCheckboxes
              locale={locale}
              t={t}
              privacyAccepted={privacyAccepted}
              newsletterOptIn={newsletterOptIn}
              onPrivacyChange={setPrivacyAccepted}
              onNewsletterChange={setNewsletterOptIn}
            />
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
