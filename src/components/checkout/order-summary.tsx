'use client';

import { motion } from 'framer-motion';
import { Loader2, Shield, HelpCircle } from 'lucide-react';
import type { ShippingOption } from '@/types';
import type { CheckoutText } from '@/lib/i18n/cart-checkout-text';
import { useCart } from '@/components/cart/cart-provider';
import { formatPrice } from '@/lib/utils';

interface OrderSummaryProps {
  t: CheckoutText;
  isLoading: boolean;
  onCheckout: (provider: 'stripe' | 'vipps') => void;
  selectedShipping: ShippingOption | null;
}

// Card icons - simple and clean
function CardIcon({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
      <line x1="1" y1="10" x2="23" y2="10"/>
    </svg>
  );
}

export function OrderSummary({ t, isLoading, onCheckout, selectedShipping }: OrderSummaryProps): React.ReactElement {
  const { cart } = useCart();
  const hasDiscount = cart.discountCode && (cart.discountAmount > 0 || cart.freeShipping);

  // Use selected shipping price if available, otherwise fall back to cart shipping
  // Free shipping discount overrides to 0
  const shippingCost = cart.freeShipping ? 0 : (selectedShipping?.priceWithVat ?? cart.shippingCost);

  // Recalculate total with selected shipping
  const total = cart.subtotal + shippingCost + cart.artistLevy - cart.discountAmount;

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
            <div className="flex items-start gap-1.5">
              <span className="text-muted-foreground">{t.artistLevy}</span>
              <div className="group relative">
                <HelpCircle className="w-4 h-4 text-muted-foreground/50 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 w-48 text-center z-10">
                  {t.artistLevyExplainer}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-foreground" />
                </div>
              </div>
            </div>
            <span className="text-muted-foreground">+{formatPrice(cart.artistLevy)}</span>
          </div>
        )}

        {hasDiscount && cart.discountAmount > 0 && (
          <div className="flex justify-between text-success">
            <span>{t.discount} ({cart.discountCode})</span>
            <span>-{formatPrice(cart.discountAmount)}</span>
          </div>
        )}

        {shippingCost > 0 ? (
          <div className="flex justify-between">
            <div>
              <span className="text-muted-foreground">{t.shippingCost}</span>
              {selectedShipping && (
                <p className="text-xs text-muted-foreground/70">{selectedShipping.name}</p>
              )}
            </div>
            <span>+{formatPrice(shippingCost)}</span>
          </div>
        ) : (
          <div className="flex justify-between text-success">
            <div>
              <span>{t.shippingCost}</span>
              {selectedShipping && (
                <p className="text-xs text-muted-foreground/70">{selectedShipping.name}</p>
              )}
              {cart.freeShipping && cart.discountCode && (
                <p className="text-xs text-success/70">{cart.discountCode}</p>
              )}
            </div>
            <span>{t.shippingFree}</span>
          </div>
        )}

        <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
          <span>{t.total}</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-muted-foreground">{t.includingVat}</p>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 mb-4 py-2 bg-background/50 rounded-lg">
        <Shield className="w-4 h-4 text-success" />
        <span className="text-xs font-medium text-muted-foreground">{t.securePayment}</span>
      </div>

      <div className="space-y-3">
        {/* Card Payment Button */}
        <motion.button
          onClick={() => onCheckout('stripe')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest transition-all duration-300 hover:bg-primary/90 active:bg-primary/90 disabled:opacity-50 touch-manipulation"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CardIcon className="w-6 h-6" />
          )}
          {isLoading ? t.processing : t.payWithCard}
        </motion.button>

        {/* Vipps Payment Button */}
        <motion.button
          onClick={() => onCheckout('vipps')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#ff5b24] text-white font-semibold text-lg uppercase tracking-widest transition-all duration-300 hover:bg-[#ff5b24]/90 active:bg-[#ff5b24]/90 disabled:opacity-50 touch-manipulation"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading && <Loader2 className="w-5 h-5 animate-spin" />}
          {isLoading ? t.processing : 'Vipps'}
        </motion.button>
      </div>

      {/* Contact Support Link */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        {t.needHelp}{' '}
        <a href="mailto:hei@dotty.no" className="text-primary hover:underline active:underline py-1 touch-manipulation">
          hei@dotty.no
        </a>
      </p>
    </div>
  );
}
