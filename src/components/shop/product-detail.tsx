'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Check, ArrowLeft, Mail, Send, Loader2 } from 'lucide-react';
import type { Locale, Product, GalleryImage, ProductSize } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { ProductGallery } from './product-gallery';

const text = {
  no: {
    backToShop: 'Tilbake til butikk',
    dimensions: 'Størrelse',
    year: 'År',
    availability: 'Tilgjengelighet',
    available: 'Tilgjengelig',
    soldOut: 'Utsolgt',
    addToCart: 'Legg i Handlekurv',
    addedToCart: 'Lagt i handlekurv',
    viewCart: 'Se handlekurv',
    original: 'Maleri',
    print: 'Prints',
    inquiryOnly: 'Forespørsel påkrevd',
    inquiryDescription: 'Dette verket selges ikke direkte. Legg igjen din e-post, så tar vi kontakt.',
    emailPlaceholder: 'Din e-postadresse',
    sendInquiry: 'Send forespørsel',
    inquirySent: 'Takk! Vi tar kontakt snart.',
    inquiryError: 'Noe gikk galt. Prøv igjen.',
    soldOutInterest: 'Interessert?',
    soldOutDescription: 'Dette verket er solgt, men jeg kan lage lignende. Legg igjen din e-post!',
    contactArtist: 'Kontakt kunstner',
  },
  en: {
    backToShop: 'Back to shop',
    dimensions: 'Size',
    year: 'Year',
    availability: 'Availability',
    available: 'Available',
    soldOut: 'Sold out',
    addToCart: 'Add to Cart',
    addedToCart: 'Added to cart',
    viewCart: 'View cart',
    original: 'Painting',
    print: 'Print',
    inquiryOnly: 'Inquiry required',
    inquiryDescription: 'This artwork is not sold directly. Leave your email and we will contact you.',
    emailPlaceholder: 'Your email address',
    sendInquiry: 'Send inquiry',
    inquirySent: 'Thank you! We will be in touch soon.',
    inquiryError: 'Something went wrong. Please try again.',
    soldOutInterest: 'Interested?',
    soldOutDescription: 'This artwork is sold, but I can create something similar. Leave your email!',
    contactArtist: 'Contact artist',
  },
};

type InquiryStatus = 'idle' | 'sending' | 'sent' | 'error';

function parseJsonField<T>(value: T | string | undefined | null, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'string') return JSON.parse(value) as T;
  return value;
}

interface InquiryFormProps {
  title: string;
  description: string;
  buttonText: string;
  email: string;
  setEmail: (email: string) => void;
  status: InquiryStatus;
  onSubmit: (e: React.FormEvent) => void;
  successMessage: string;
  errorMessage: string;
  emailPlaceholder: string;
}

function InquiryForm({
  title,
  description,
  buttonText,
  email,
  setEmail,
  status,
  onSubmit,
  successMessage,
  errorMessage,
  emailPlaceholder,
}: InquiryFormProps): React.ReactElement {
  if (status === 'sent') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full py-4 bg-success border-[3px] border-success text-background font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_0_theme(colors.success)]"
      >
        <Check className="w-5 h-5" />
        {successMessage}
      </motion.div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 bg-muted/50 rounded-lg border border-border">
        <div className="flex items-center gap-2 mb-1">
          <Mail className="w-4 h-4 text-primary" />
          <span className="font-semibold text-sm">{title}</span>
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <form onSubmit={onSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={emailPlaceholder}
          required
          className="w-full px-5 py-3 bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
        <motion.button
          type="submit"
          disabled={status === 'sending' || !email}
          className="w-full py-4 bg-background border-[3px] border-primary text-primary font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-primary hover:text-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-primary flex items-center justify-center gap-2 shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_6px_0_0_theme(colors.primary)] hover:-translate-y-0.5"
          whileTap={{ scale: 0.98, y: 2 }}
        >
          {status === 'sending' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          {status === 'error' ? errorMessage : buttonText}
        </motion.button>
      </form>
    </div>
  );
}

interface ProductDetailProps {
  product: Product;
  collectionName: string | null;
  collectionSlug?: string | null;
  lang: Locale;
}

export function ProductDetail({ product, collectionName, collectionSlug, lang }: ProductDetailProps): React.ReactElement {
  const t = text[lang];
  const { addItem, cart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<InquiryStatus>('idle');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const isInCart = cart.items.some((item) => item.product.id === product.id);
  const isSold = !product.is_available || product.stock_quantity === 0;
  const year = product.year ?? new Date(product.created_at).getFullYear();
  const sizes = parseJsonField<ProductSize[]>(product.sizes, []);
  const dimensionsText = sizes.length > 0 ? sizes[0].label : '-';
  const galleryImages = parseJsonField<GalleryImage[]>(product.gallery_images, []);

  function handleAddToCart(): void {
    if (isSold) return;
    addItem(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  }

  async function submitInquiry(type: 'product_inquiry' | 'sold_out_inquiry'): Promise<void> {
    const message = type === 'product_inquiry'
      ? `Inquiry about artwork: ${product.title} (${product.id})`
      : `Interest in sold artwork: ${product.title} (${product.id}) - Customer wants similar work`;

    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inquiryEmail,
        name: '',
        message,
        type,
        product_id: product.id,
        product_title: product.title,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send inquiry');
    }
  }

  function handleInquiry(type: 'product_inquiry' | 'sold_out_inquiry') {
    return async (e: React.FormEvent): Promise<void> => {
      e.preventDefault();
      if (!inquiryEmail || inquiryStatus === 'sending') return;

      setInquiryStatus('sending');
      try {
        await submitInquiry(type);
        setInquiryStatus('sent');
      } catch {
        setInquiryStatus('error');
        setTimeout(() => setInquiryStatus('idle'), 3000);
      }
    };
  }

  function renderPurchaseSection(): React.ReactElement {
    if (product.requires_inquiry) {
      return (
        <InquiryForm
          title={t.inquiryOnly}
          description={t.inquiryDescription}
          buttonText={t.sendInquiry}
          email={inquiryEmail}
          setEmail={setInquiryEmail}
          status={inquiryStatus}
          onSubmit={handleInquiry('product_inquiry')}
          successMessage={t.inquirySent}
          errorMessage={t.inquiryError}
          emailPlaceholder={t.emailPlaceholder}
        />
      );
    }

    if (isAdded || isInCart) {
      return (
        <div className="space-y-3">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full py-4 bg-success border-[3px] border-success text-background font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_0_0_theme(colors.success)]"
          >
            <Check className="w-5 h-5" />
            {t.addedToCart}
          </motion.div>
          <Link href={getLocalizedPath(lang, 'cart')}>
            <motion.button
              className="w-full py-3 bg-background border-[3px] border-muted-foreground/30 text-foreground font-semibold uppercase tracking-wider transition-all duration-200 hover:border-primary hover:text-primary shadow-[0_3px_0_0_theme(colors.border)] hover:shadow-[0_4px_0_0_theme(colors.primary)]"
              whileTap={{ scale: 0.98, y: 2 }}
            >
              {t.viewCart}
            </motion.button>
          </Link>
        </div>
      );
    }

    if (isSold) {
      return (
        <InquiryForm
          title={t.soldOutInterest}
          description={t.soldOutDescription}
          buttonText={t.contactArtist}
          email={inquiryEmail}
          setEmail={setInquiryEmail}
          status={inquiryStatus}
          onSubmit={handleInquiry('sold_out_inquiry')}
          successMessage={t.inquirySent}
          errorMessage={t.inquiryError}
          emailPlaceholder={t.emailPlaceholder}
        />
      );
    }

    return (
      <motion.button
        onClick={handleAddToCart}
        className="group w-full py-4 bg-background border-[3px] border-primary text-primary font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-primary hover:text-background shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_6px_0_0_theme(colors.primary)] hover:-translate-y-0.5"
        whileTap={{ scale: 0.98, y: 2 }}
      >
        {t.addToCart}
      </motion.button>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Shop Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-4"
        >
          <Link
            href={getLocalizedPath(lang, 'shop')}
            className="group inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            <motion.span
              className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-primary/20 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-4 h-4 group-hover:text-primary transition-colors duration-300" />
            </motion.span>
            <span className="text-xs font-medium uppercase tracking-wider group-hover:text-primary transition-colors duration-300">
              {t.backToShop}
            </span>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image Gallery Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <ProductGallery
              mainImage={product.image_url}
              galleryImages={galleryImages}
              title={product.title}
              isSold={isSold}
            />
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex flex-col"
          >
            {/* Collection Name */}
            {collectionName && (
              collectionSlug ? (
                <Link
                  href={`/${lang}/shop/${collectionSlug}`}
                  className="text-primary font-medium mb-2 hover:underline inline-block"
                >
                  {collectionName}
                </Link>
              ) : (
                <p className="text-primary font-medium mb-2">
                  {collectionName}
                </p>
              )
            )}

            {/* Product Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
              {product.title}
            </h1>

            {/* Price */}
            <p className="text-2xl sm:text-3xl font-bold mb-6">
              {formatPrice(product.price)}
            </p>

            {/* Specifications */}
            <div className="space-y-3 mb-6">
              {/* Dimensions */}
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground text-sm">{t.dimensions}</span>
                <span className="font-medium text-sm">{dimensionsText}</span>
              </div>

              {/* Year */}
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground text-sm">{t.year}</span>
                <span className="font-medium text-sm">{year}</span>
              </div>

              {/* Availability */}
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground text-sm">{t.availability}</span>
                <span className={`font-medium text-sm ${isSold ? 'text-error' : ''}`}>
                  {isSold ? t.soldOut : t.available}
                </span>
              </div>

            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed whitespace-pre-wrap text-sm">
                {product.description}
              </p>
            )}

            {/* Purchase / Inquiry Section */}
            {renderPurchaseSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
