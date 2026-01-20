'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { CheckCircle, Package, Loader2, Share2 } from 'lucide-react';
import { Suspense, use, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Locale, OrderItem } from '@/types';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { formatPrice } from '@/lib/utils';
import { getSuccessText, type SuccessText } from '@/lib/i18n/cart-checkout-text';

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

function LoadingFallback({ t }: { t: SuccessText }): React.ReactElement {
  return (
    <div className="min-h-screen pt-24 pb-16 flex items-center justify-center">
      <div className="flex items-center gap-2">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
        <span className="text-muted-foreground">{t.loading}</span>
      </div>
    </div>
  );
}

function OrderItemDisplay({ item }: { item: OrderItem }): React.ReactElement {
  return (
    <div className="flex items-center gap-3 text-left">
      <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
        <Image
          src={item.image_url}
          alt={item.title}
          fill
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{item.title}</p>
        <p className="text-sm text-muted-foreground">{formatPrice(item.price)}</p>
      </div>
    </div>
  );
}

function DecorativeDots(): React.ReactElement {
  return (
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
  );
}

interface ShareButtonsProps {
  locale: Locale;
}

function ShareButtons({ locale }: ShareButtonsProps): React.ReactElement {
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setCanShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  const shareText = locale === 'no'
    ? 'Jeg kjøpte nettopp kunst fra Dotty. 🎨'
    : 'I just bought art from Dotty. 🎨';

  const shareUrl = typeof window !== 'undefined' ? 'https://dotty.no' : '';

  async function handleShare(): Promise<void> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Dotty.',
          text: shareText,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    }
  }

  if (!canShare) return <></>;

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

interface OrderDetailsCardProps {
  orderInfo: OrderInfo | null;
  isLoading: boolean;
  t: SuccessText;
}

function OrderDetailsCard({ orderInfo, isLoading, t }: OrderDetailsCardProps): React.ReactElement {
  const orderNumber = orderInfo?.order_number || 'Behandles...';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center gap-2 py-4">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-muted-foreground">{t.loading}</span>
      </div>
    );
  }

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
            {orderInfo.items.map((item, index) => (
              <OrderItemDisplay key={index} item={item} />
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

function SuccessContent({ locale, t }: { locale: Locale; t: SuccessText }): React.ReactElement {
  const { clearCart } = useCart();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');

  const [orderInfo, setOrderInfo] = useState<OrderInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    clearCart();

    if (!sessionId) {
      // Use a microtask to avoid the synchronous setState warning
      Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    fetch('/api/checkout/session?session_id=' + sessionId)
      .then(res => res.json())
      .then(data => {
        if (data.order) {
          setOrderInfo(data.order);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [clearCart, sessionId]);

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
            <ShareButtons locale={locale} />
          </div>
        </motion.div>

        <DecorativeDots />
      </motion.div>
    </div>
  );
}

export default function SuccessPage({ params }: SuccessPageProps): React.ReactElement {
  const { lang } = use(params);
  const locale = lang as Locale;
  const t = getSuccessText(locale);

  return (
    <Suspense fallback={<LoadingFallback t={t} />}>
      <SuccessContent locale={locale} t={t} />
    </Suspense>
  );
}
