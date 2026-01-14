'use client';

import { motion } from 'framer-motion';
import { useState, use, useEffect, Suspense } from 'react';
import { CreditCard, Loader2, AlertCircle, X } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/utils';
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

const INPUT_CLASS = 'w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

interface FormInputProps {
  label: string;
  name: keyof ShippingFormData;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}

function FormInput({ label, name, type = 'text', required = false, value, onChange, className }: FormInputProps): React.ReactElement {
  return (
    <div className={className}>
      <label className="block text-sm font-medium mb-1">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        value={value}
        onChange={onChange}
        className={INPUT_CLASS}
      />
    </div>
  );
}

interface ErrorBannerProps {
  error: string;
  description?: string;
  onDismiss: () => void;
}

function ErrorBanner({ error, description, onDismiss }: ErrorBannerProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-8 p-4 bg-error/10 border border-error/20 rounded-lg flex items-start gap-3"
    >
      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="font-medium text-error">{error}</p>
        {description && (
          <p className="text-sm text-muted-foreground mt-1">{description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </motion.div>
  );
}

interface DiscountCodeInputProps {
  t: CheckoutText;
  onApplyDiscount: (code: string, amount: number) => void;
  existingCode: string | undefined;
  subtotal: number;
}

function DiscountCodeInput({ t, onApplyDiscount, existingCode, subtotal }: DiscountCodeInputProps): React.ReactElement {
  const [discountInput, setDiscountInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleApply(): Promise<void> {
    if (!discountInput.trim()) return;

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/discounts/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput.trim(), subtotal }),
      });

      const result = await response.json();

      if (!response.ok || !result.valid) {
        setError(result.error || t.invalidDiscountCode);
        return;
      }

      onApplyDiscount(result.code, result.calculated_discount);
      setSuccess(t.discountApplied);
      setDiscountInput('');
    } catch {
      setError(t.discountValidationFailed);
    } finally {
      setIsLoading(false);
    }
  }

  const isDisabled = isLoading || !!existingCode;

  return (
    <div className="mt-8">
      <label className="block text-sm font-medium mb-1">{t.discountCode}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={discountInput}
          onChange={(e) => {
            setDiscountInput(e.target.value);
            setError('');
            setSuccess('');
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          disabled={isDisabled}
          placeholder={existingCode || ''}
          className={`flex-1 ${INPUT_CLASS} disabled:opacity-50`}
        />
        <button
          type="button"
          onClick={handleApply}
          disabled={isDisabled || !discountInput.trim()}
          className="px-6 py-3 bg-muted hover:bg-muted/80 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : t.apply}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-error">{error}</p>}
      {success && <p className="mt-2 text-sm text-success">{success}</p>}
    </div>
  );
}

interface ConsentCheckboxesProps {
  locale: Locale;
  t: CheckoutText;
  privacyAccepted: boolean;
  newsletterOptIn: boolean;
  onPrivacyChange: (value: boolean) => void;
  onNewsletterChange: (value: boolean) => void;
}

function ConsentCheckboxes({ locale, t, privacyAccepted, newsletterOptIn, onPrivacyChange, onNewsletterChange }: ConsentCheckboxesProps): React.ReactElement {
  return (
    <div className="mt-8 space-y-4">
      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={privacyAccepted}
          onChange={(e) => onPrivacyChange(e.target.checked)}
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

      <label className="flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={newsletterOptIn}
          onChange={(e) => onNewsletterChange(e.target.checked)}
          className="mt-1 w-5 h-5 rounded border-border bg-muted text-primary focus:ring-primary focus:ring-offset-0"
        />
        <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
          {t.subscribeNewsletter}
        </span>
      </label>
    </div>
  );
}

interface OrderSummaryProps {
  t: CheckoutText;
  isLoading: boolean;
  onCheckout: (provider: 'stripe' | 'vipps') => void;
}

function OrderSummary({ t, isLoading, onCheckout }: OrderSummaryProps): React.ReactElement {
  const { cart } = useCart();
  const hasDiscount = cart.discountCode && cart.discountAmount > 0;

  return (
    <div className="bg-muted rounded-lg p-6">
      <h2 className="text-xl font-bold mb-6">{t.orderSummary}</h2>

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

      <div className="space-y-3 border-t border-border pt-4 mb-6">
        <div className="flex justify-between">
          <span className="text-muted-foreground">{t.subtotal}</span>
          <span>{formatPrice(cart.subtotal)}</span>
        </div>

        {cart.artistLevy > 0 && (
          <div className="flex justify-between">
            <div>
              <span className="text-muted-foreground">{t.artistLevy}</span>
              <p className="text-xs text-muted-foreground/70">{t.artistLevyNote}</p>
            </div>
            <span className="text-muted-foreground">+{formatPrice(cart.artistLevy)}</span>
          </div>
        )}

        {hasDiscount && (
          <div className="flex justify-between text-success">
            <span>{t.discount} ({cart.discountCode})</span>
            <span>-{formatPrice(cart.discountAmount)}</span>
          </div>
        )}

        {cart.shippingCost > 0 ? (
          <div className="flex justify-between">
            <span className="text-muted-foreground">{t.shippingCost}</span>
            <span>+{formatPrice(cart.shippingCost)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-success">
            <span>{t.shippingCost}</span>
            <span>{t.shippingFree}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
          <span>{t.total}</span>
          <span>{formatPrice(cart.total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t.includingVat}</p>
      </div>

      <div className="space-y-3">
        <motion.button
          onClick={() => onCheckout('stripe')}
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
          onClick={() => onCheckout('vipps')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-[#ff5b24] text-white font-semibold text-lg uppercase tracking-widest transition-all duration-300 hover:bg-[#ff5b24]/90 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z" />
            </svg>
          )}
          {isLoading ? t.processing : t.payWithVipps}
        </motion.button>
      </div>
    </div>
  );
}

function CheckoutContent({ locale, t }: { locale: Locale; t: CheckoutText }): React.ReactElement {
  const searchParams = useSearchParams();
  const { cart, itemCount, applyDiscount } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<ShippingFormData>(INITIAL_FORM_DATA);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [newsletterOptIn, setNewsletterOptIn] = useState(false);
  const [checkoutToken, setCheckoutToken] = useState<string | null>(null);

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
          shipping_cost: cart.shippingCost,
          artist_levy: cart.artistLevy,
          locale,
          privacy_accepted: true,
          newsletter_opt_in: newsletterOptIn,
          checkout_token: checkoutToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create checkout session');
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
