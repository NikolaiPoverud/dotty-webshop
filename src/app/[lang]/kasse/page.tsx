'use client';

import { motion } from 'framer-motion';
import { useState, use } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
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
  },
};

export default function CheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = text[locale];
  const { cart, itemCount, applyDiscount } = useCart();

  const [isLoading, setIsLoading] = useState(false);
  const [discountInput, setDiscountInput] = useState('');
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

  const handleApplyDiscount = () => {
    // TODO: Validate discount code against Supabase
    // For now, placeholder
    if (discountInput.toLowerCase() === 'test20') {
      applyDiscount('TEST20', cart.subtotal * 0.2);
    }
  };

  const handleCheckout = async (provider: 'stripe' | 'vipps') => {
    setIsLoading(true);

    try {
      // TODO: Create Stripe/Vipps checkout session via API
      // For now, simulate
      await new Promise((r) => setTimeout(r, 2000));

      // Redirect to success for demo
      window.location.href = getLocalizedPath(locale, 'success');
    } catch (error) {
      console.error('Checkout error:', error);
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
                  onChange={(e) => setDiscountInput(e.target.value)}
                  className="flex-1 px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={handleApplyDiscount}
                  className="px-6 py-3 bg-muted hover:bg-muted/80 font-medium rounded-lg transition-colors"
                >
                  {t.apply}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Order Summary & Payment */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-muted rounded-lg p-6 sticky top-24">
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
