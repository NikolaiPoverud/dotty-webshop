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

// Real Vipps logo
function VippsLogo({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 49 12" fill="currentColor">
      <path d="M6.91 11.5L0 0h3.25l4.84 8.48L12.93 0h3.15l-6.9 11.5H6.9zm10.84-9.98h2.83v9.36h-2.83V1.52zm1.41-1.52c-.97 0-1.67-.7-1.67-1.52S18.19-3 19.16-3s1.67.7 1.67 1.52-.7 1.48-1.67 1.48zm5.04 6.72V1.52h2.83v4.96c0 1.32.71 2.06 1.84 2.06 1.13 0 1.95-.74 1.95-2.06V1.52h2.83v5.2c0 2.68-1.85 4.4-4.78 4.4-2.93 0-4.67-1.72-4.67-4.4zm11.22 0V1.52h2.83v4.96c0 1.32.71 2.06 1.84 2.06 1.13 0 1.95-.74 1.95-2.06V1.52h2.83v5.2c0 2.68-1.85 4.4-4.78 4.4-2.93 0-4.67-1.72-4.67-4.4zm15.57.36c.47.52 1.18.86 2.06.86.77 0 1.27-.3 1.27-.78 0-.52-.5-.68-1.4-.86l-.6-.12c-1.86-.38-3-1.22-3-2.94 0-1.84 1.58-3.04 3.81-3.04 1.64 0 2.98.58 3.82 1.56l-1.7 1.7c-.52-.56-1.16-.88-2.02-.88-.7 0-1.12.28-1.12.72 0 .48.48.64 1.35.82l.6.12c1.98.4 3.08 1.28 3.08 2.98 0 1.9-1.58 3.12-4 3.12-1.82 0-3.3-.62-4.15-1.68l2-1.58z"/>
    </svg>
  );
}

// Card brand logos
function VisaLogo({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 50 16" fill="currentColor">
      <path d="M19.5 1.3l-3.1 13.4h-2.9l3.1-13.4h2.9zm13.2 8.7l1.5-4.2.9 4.2h-2.4zm3.2 4.7h2.7l-2.4-13.4h-2.5c-.6 0-1 .3-1.2.8l-4.3 12.6h3l.6-1.7h3.7l.4 1.7zm-8.4-4.4c0-3.5-4.9-3.7-4.9-5.3 0-.5.5-.9 1.5-.9.9 0 1.6.2 2 .4l.4-1.7c-.5-.2-1.2-.4-2.1-.4-2.2 0-3.8 1.2-3.8 2.9 0 2.8 3.9 3 3.9 4.6 0 .7-.6 1.3-1.7 1.3-1.1 0-2-.4-2.5-.7l-.4 1.8c.6.3 1.6.5 2.7.5 2.4-.1 4.1-1.2 4.1-3zm-13.8-9l-4.6 13.4h-3l-2.3-10.7c-.1-.5-.2-.7-.6-.9-.6-.3-1.6-.6-2.5-.8l.1-.3h4.8c.6 0 1.1.4 1.3 1.1l1.2 6.3 2.9-7.4h3l.7.3z"/>
    </svg>
  );
}

function MastercardLogo({ className }: { className?: string }): React.ReactElement {
  return (
    <svg className={className} viewBox="0 0 50 30" fill="none">
      <circle cx="18" cy="15" r="12" fill="#EB001B"/>
      <circle cx="32" cy="15" r="12" fill="#F79E1B"/>
      <path d="M25 5.8c2.9 2.3 4.7 5.8 4.7 9.7s-1.8 7.4-4.7 9.7c-2.9-2.3-4.7-5.8-4.7-9.7s1.8-7.4 4.7-9.7z" fill="#FF5F00"/>
    </svg>
  );
}

export function OrderSummary({ t, isLoading, onCheckout, selectedShipping }: OrderSummaryProps): React.ReactElement {
  const { cart } = useCart();
  const hasDiscount = cart.discountCode && cart.discountAmount > 0;

  // Use selected shipping price if available, otherwise fall back to cart shipping
  const shippingCost = selectedShipping?.priceWithVat ?? cart.shippingCost;

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

        {hasDiscount && (
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
            <span>{t.shippingCost}</span>
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
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest transition-all duration-300 hover:bg-primary/90 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <div className="flex items-center gap-2">
              <VisaLogo className="h-4 w-auto" />
              <MastercardLogo className="h-5 w-auto" />
            </div>
          )}
          {isLoading ? t.processing : t.payWithCard}
        </motion.button>

        {/* Vipps Payment Button */}
        <motion.button
          onClick={() => onCheckout('vipps')}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-[#ff5b24] text-white font-semibold text-lg uppercase tracking-widest transition-all duration-300 hover:bg-[#ff5b24]/90 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <VippsLogo className="h-4 w-auto" />
          )}
          {isLoading ? t.processing : t.payWithVipps}
        </motion.button>
      </div>

      {/* Contact Support Link */}
      <p className="text-center text-xs text-muted-foreground mt-4">
        {t.needHelp}{' '}
        <a href="mailto:hei@dotty.no" className="text-primary hover:underline">
          hei@dotty.no
        </a>
      </p>
    </div>
  );
}
