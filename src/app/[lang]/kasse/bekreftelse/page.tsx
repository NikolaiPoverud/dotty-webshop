'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CheckCircle, Package, Loader2 } from 'lucide-react';
import { Suspense, use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Locale } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { formatPrice } from '@/lib/utils';

const text = {
  no: {
    title: 'Takk for din bestilling!',
    message: 'Vi har mottatt din ordre og sender deg en bekreftelse på e-post.',
    orderNumber: 'Ordrenummer',
    emailSent: 'Bekreftelse sendt til',
    shippingNote: 'Vi kontakter deg snart med informasjon om frakt.',
    backToShop: 'Tilbake til butikken',
    total: 'Total betalt',
    loading: 'Henter ordredetaljer...',
  },
  en: {
    title: 'Thank you for your order!',
    message: 'We have received your order and will send you a confirmation by email.',
    orderNumber: 'Order number',
    emailSent: 'Confirmation sent to',
    shippingNote: 'We will contact you soon with shipping information.',
    backToShop: 'Back to shop',
    total: 'Total paid',
    loading: 'Loading order details...',
  },
};

interface OrderInfo {
  id: string;
  email: string;
  total: number;
}

function LoadingFallback({ t }: { t: typeof text['no'] }) {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground">{t.loading}</span>
      </div>
    </div>
  );
}

function SuccessContent({ locale, t }: { locale: Locale; t: typeof text['no'] }) {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Clear cart and fetch order info on success page load
  useEffect(() => {
    clearCart();

    // Fetch order info from session
    if (sessionId) {
      fetch('/api/checkout/session?session_id=' + sessionId)
        .then(res => res.json())
        .then(data => {
          if (data.order) {
            setOrderInfo(data.order);
          }
        })
        .catch(console.error)
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [clearCart, sessionId]);

  // Generate order number from session or timestamp
  const orderNumber = orderInfo?.id
    ? orderInfo.id.slice(0, 8).toUpperCase()
    : 'DOT-' + Date.now().toString(36).toUpperCase();

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto px-4 text-center"
      >
        {/* Success Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-success/10 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-success" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl sm:text-4xl font-bold mb-4"
        >
          <span className="gradient-text">{t.title}</span>
        </motion.h1>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8"
        >
          {t.message}
        </motion.p>

        {/* Order Details Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-muted rounded-lg p-6 mb-8"
        >
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-4">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span className="text-muted-foreground">{t.loading}</span>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-center gap-3 mb-4">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">{t.orderNumber}</span>
              </div>
              <p className="text-2xl font-bold font-mono">{orderNumber}</p>

              {orderInfo?.email && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">{t.emailSent}</p>
                  <p className="font-medium">{orderInfo.email}</p>
                </div>
              )}

              {orderInfo?.total && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">{t.total}</p>
                  <p className="text-xl font-bold">{formatPrice(orderInfo.total)}</p>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground">{t.shippingNote}</p>
              </div>
            </>
          )}
        </motion.div>

        {/* Back to Shop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          <Link href={getLocalizedPath(locale, 'shop')}>
            <motion.button
              className="px-8 py-4 bg-primary text-background font-semibold text-lg uppercase tracking-widest pop-outline transition-all duration-300 hover:bg-primary-light"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {t.backToShop}
            </motion.button>
          </Link>
        </motion.div>

        {/* Decorative dots */}
        <motion.div
          className="mt-12 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-3 h-3 rounded-full bg-primary"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.8 + i * 0.1 }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function SuccessPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = text[locale];

  return (
    <Suspense fallback={<LoadingFallback t={t} />}>
      <SuccessContent locale={locale} t={t} />
    </Suspense>
  );
}
