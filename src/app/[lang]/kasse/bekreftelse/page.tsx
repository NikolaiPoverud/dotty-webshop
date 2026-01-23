'use client';

import { Suspense, use, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CheckCircle, Loader2, Package, Share2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';

import type { Locale, OrderItem } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { formatPrice } from '@/lib/utils';
import { getSuccessText, type SuccessText } from '@/lib/i18n/cart-checkout-text';

const SHARE_TEXT: Record<Locale, string> = {
  no: 'Jeg kjøpte nettopp kunst fra Dotty.',
  en: 'I just bought art from Dotty.',
};

interface SuccessPageProps {
  params: Promise<{ lang: string }>;
}

interface OrderInfo {
  id: string;
  order_number: string | null;
  email: string;
  total: number;
  items: OrderItem[];
}

function ShareButton({ locale }: { locale: Locale }): React.ReactElement | null {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  if (!canShare) return null;

  async function handleShare(): Promise<void> {
    try {
      await navigator.share({
        title: 'Dotty.',
        text: SHARE_TEXT[locale],
        url: 'https://dotty.no',
      });
    } catch {
      // User cancelled or share failed
    }
  }

  return (
    <motion.button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-primary transition-colors"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.8 }}
    >
      <Share2 className="w-4 h-4" />
      {locale === 'no' ? 'Del med venner' : 'Share with friends'}
    </motion.button>
  );
}

function OrderDetailsCard({
  orderInfo,
  isLoading,
  t,
}: {
  orderInfo: OrderInfo | null;
  isLoading: boolean;
  t: SuccessText;
}): React.ReactElement {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

  const orderNumber = orderInfo?.order_number ?? 'Behandles...';

  return (
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

      {orderInfo?.items && orderInfo.items.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground mb-3">{t.yourOrder}</p>
          <div className="space-y-3">
            {orderInfo.items.map((item) => (
              <div key={item.product_id} className="flex items-center gap-3 text-left">
                <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
                  <Image src={item.image_url} alt={item.title} fill className="object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
                </div>
              </div>
            ))}
          </div>
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
  );
}

async function fetchOrderWithRetry(
  url: string,
  onOrderUpdate: (order: OrderInfo) => void,
  onComplete: () => void,
  maxRetries = 5,
  initialDelay = 1000
): Promise<void> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const res = await fetch(url);
      const data = await res.json();

      if (data.order) {
        onOrderUpdate(data.order);
        if (data.order.order_number) {
          onComplete();
          return;
        }
      }
    } catch {
      // Fetch failed, will retry
    }

    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, initialDelay * Math.pow(1.5, attempt)));
    }
  }
  onComplete();
}

function SuccessContent({ locale, t }: { locale: Locale; t: SuccessText }): React.ReactElement {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const reference = searchParams.get('reference');
  const provider = searchParams.get('provider');

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clearCart();

    const onComplete = (): void => setIsLoading(false);

    if (sessionId) {
      fetchOrderWithRetry(`/api/checkout/session?session_id=${sessionId}`, setOrderInfo, onComplete);
      return;
    }

    if (reference && provider === 'vipps') {
      fetchOrderWithRetry(
        `/api/orders/by-reference?reference=${encodeURIComponent(reference)}`,
        setOrderInfo,
        onComplete
      );
      return;
    }

    setIsLoading(false);
  }, [clearCart, sessionId, reference, provider]);

  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-lg mx-auto px-4 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
          className="w-24 h-24 mx-auto mb-8 rounded-full bg-success/10 flex items-center justify-center"
        >
          <CheckCircle className="w-12 h-12 text-success" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-3xl sm:text-4xl font-bold mb-4"
        >
          <span className="gradient-text">{t.title}</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-lg text-muted-foreground mb-8"
        >
          {t.message}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-muted rounded-lg p-6 mb-8"
        >
          <OrderDetailsCard orderInfo={orderInfo} isLoading={isLoading} t={t} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="space-y-4"
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

          <div className="flex justify-center">
            <ShareButton locale={locale} />
          </div>
        </motion.div>

        <motion.div
          className="mt-12 flex justify-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          {[0, 1, 2, 3, 4].map((i) => (
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

export default function SuccessPage({ params }: SuccessPageProps): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = getSuccessText(locale);

  return (
    <Suspense
      fallback={
        <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-muted-foreground">{t.loading}</span>
          </div>
        </div>
      }
    >
      <SuccessContent locale={locale} t={t} />
    </Suspense>
  );
}
