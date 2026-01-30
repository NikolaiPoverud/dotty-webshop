'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { Check, ArrowLeft, Mail, Send, Loader2, Truck, RotateCcw } from 'lucide-react';
import type { Dictionary, Locale, Product, GalleryImage, ProductSize } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useCart } from '@/components/cart/cart-provider';
import { getLocalizedPath } from '@/lib/i18n/get-dictionary';
import { ProductGallery } from './product-gallery';

type InquiryStatus = 'idle' | 'sending' | 'sent' | 'error';

function parseJsonField<T>(value: T | string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  if (typeof value === 'string') {
    return JSON.parse(value) as T;
  }
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
          className="w-full px-5 py-4 sm:py-3 bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-base"
        />
        <motion.button
          type="submit"
          disabled={status === 'sending' || !email}
          className="w-full py-4 bg-background border-[3px] border-primary text-primary font-semibold uppercase tracking-wider transition-all duration-200 hover:bg-primary hover:text-background active:bg-primary active:text-background disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background disabled:hover:text-primary disabled:active:bg-background disabled:active:text-primary flex items-center justify-center gap-2 shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_6px_0_0_theme(colors.primary)] hover:-translate-y-0.5 touch-manipulation"
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
  dictionary: Dictionary;
}

export function ProductDetail({ product, collectionName, collectionSlug, lang, dictionary }: ProductDetailProps): React.ReactElement {
  const t = dictionary.productDetail;
  const { addItem, cart } = useCart();
  const [isAdded, setIsAdded] = useState(false);
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<InquiryStatus>('idle');
  const [selectedSizeIndex, setSelectedSizeIndex] = useState<number | null>(null);
  const [isSizeDropdownOpen, setIsSizeDropdownOpen] = useState(false);
  const sizeDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isSizeDropdownOpen) return;

    function handleClickOutside(event: MouseEvent): void {
      if (sizeDropdownRef.current && !sizeDropdownRef.current.contains(event.target as Node)) {
        setIsSizeDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSizeDropdownOpen]);

  const isInCart = cart.items.some((item) => item.product.id === product.id);
  const isSold = !product.is_available || product.stock_quantity === 0;
  const year = product.year ?? new Date(product.created_at).getFullYear();
  const sizes = parseJsonField<ProductSize[]>(product.sizes, []);
  const galleryImages = parseJsonField<GalleryImage[]>(product.gallery_images, []);
  const isPrint = product.product_type === 'print';
  const hasMultipleSizes = sizes.length > 1;
  const needsSizeSelection = isPrint && hasMultipleSizes;
  const selectedSize = selectedSizeIndex !== null ? sizes[selectedSizeIndex] : null;

  // Use size-specific price if selected, otherwise show product base price
  const displayPrice = selectedSize?.price ?? product.price;

  // Get lowest price for "from" display when no size selected
  const lowestPrice = sizes.length > 0
    ? Math.min(...sizes.map(s => s.price ?? product.price))
    : product.price;

  function handleAddToCart(): void {
    if (isSold || (needsSizeSelection && selectedSizeIndex === null)) return;

    const sizeToAdd = isPrint && selectedSize ? selectedSize : sizes[0];
    addItem(product, 1, undefined, undefined, sizeToAdd);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 3000);
  }

  async function handleInquirySubmit(type: 'product_inquiry' | 'sold_out_inquiry', e: React.FormEvent): Promise<void> {
    e.preventDefault();
    if (!inquiryEmail || inquiryStatus === 'sending') return;

    setInquiryStatus('sending');

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

    if (response.ok) {
      setInquiryStatus('sent');
    } else {
      setInquiryStatus('error');
      setTimeout(() => setInquiryStatus('idle'), 3000);
    }
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
          onSubmit={(e) => handleInquirySubmit('product_inquiry', e)}
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
              className="w-full py-4 sm:py-3 bg-background border-[3px] border-muted-foreground/30 text-foreground font-semibold uppercase tracking-wider transition-all duration-200 hover:border-primary hover:text-primary active:border-primary active:text-primary shadow-[0_3px_0_0_theme(colors.border)] hover:shadow-[0_4px_0_0_theme(colors.primary)] touch-manipulation"
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
          onSubmit={(e) => handleInquirySubmit('sold_out_inquiry', e)}
          successMessage={t.inquirySent}
          errorMessage={t.inquiryError}
          emailPlaceholder={t.emailPlaceholder}
        />
      );
    }

    const sizeNotSelected = needsSizeSelection && selectedSizeIndex === null;

    return (
      <div className="space-y-2">
        {sizeNotSelected && (
          <p className="text-warning text-sm font-medium text-center">
            {lang === 'no' ? 'Velg størrelse for å legge i handlekurv' : 'Select a size to add to cart'}
          </p>
        )}
        <motion.button
          onClick={handleAddToCart}
          disabled={sizeNotSelected}
          className={`group w-full py-4 font-semibold uppercase tracking-wider transition-all duration-200 touch-manipulation ${
            sizeNotSelected
              ? 'bg-muted border-[3px] border-muted-foreground/30 text-muted-foreground cursor-not-allowed shadow-[0_4px_0_0_theme(colors.border)]'
              : 'bg-background border-[3px] border-primary text-primary hover:bg-primary hover:text-background active:bg-primary active:text-background shadow-[0_4px_0_0_theme(colors.primary)] hover:shadow-[0_6px_0_0_theme(colors.primary)] hover:-translate-y-0.5'
          }`}
          whileTap={sizeNotSelected ? {} : { scale: 0.98, y: 2 }}
        >
          {sizeNotSelected ? (lang === 'no' ? 'Velg størrelse' : 'Select size') : t.addToCart}
        </motion.button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-24 pb-8">
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
            className="group inline-flex items-center gap-2 sm:gap-3"
          >
            <motion.span
              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-background border sm:border-2 border-muted-foreground/30 group-hover:border-primary group-hover:text-primary transition-all duration-200 shadow-[1px_1px_0_0_theme(colors.border)] sm:shadow-[2px_2px_0_0_theme(colors.border)] group-hover:shadow-[2px_2px_0_0_theme(colors.primary)] sm:group-hover:shadow-[3px_3px_0_0_theme(colors.primary)]"
              whileTap={{ scale: 0.95, x: 1, y: 1 }}
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </motion.span>
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-muted-foreground group-hover:text-primary transition-colors">
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
              {needsSizeSelection && selectedSizeIndex === null ? (
                <>
                  <span className="text-muted-foreground/60 text-lg font-normal">{lang === 'no' ? 'fra ' : 'from '}</span>
                  {formatPrice(lowestPrice)}
                </>
              ) : (
                formatPrice(displayPrice)
              )}
            </p>

            {/* Size Selector for Prints with Multiple Sizes */}
            {isPrint && hasMultipleSizes && (
              <div className="mb-6">
                <label className="block text-sm font-bold uppercase tracking-wider mb-2">
                  {t.dimensions}
                </label>
                <div className="relative" ref={sizeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsSizeDropdownOpen(!isSizeDropdownOpen)}
                    className={`w-full px-4 py-4 sm:py-3 bg-background border-[3px] text-left font-semibold flex items-center justify-between transition-all touch-manipulation ${
                      selectedSizeIndex === null
                        ? 'border-warning shadow-[3px_3px_0_0_theme(colors.warning)] hover:shadow-[4px_4px_0_0_theme(colors.warning)] active:shadow-[4px_4px_0_0_theme(colors.warning)]'
                        : 'border-primary shadow-[3px_3px_0_0_theme(colors.primary)] hover:shadow-[4px_4px_0_0_theme(colors.primary)] active:shadow-[4px_4px_0_0_theme(colors.primary)]'
                    } hover:-translate-x-[1px] hover:-translate-y-[1px]`}
                  >
                    <span className="uppercase tracking-wider text-sm">
                      {selectedSize?.label || (lang === 'no' ? 'Velg størrelse' : 'Select size')}
                    </span>
                    {selectedSize && (
                      <span className="text-primary font-bold">
                        {formatPrice(displayPrice)}
                      </span>
                    )}
                    <motion.span
                      animate={{ rotate: isSizeDropdownOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <svg
                        className="w-5 h-5 text-primary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                      </svg>
                    </motion.span>
                  </button>

                  {isSizeDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-20 w-full mt-1 bg-background border-[3px] border-primary shadow-[4px_4px_0_0_theme(colors.primary)]"
                    >
                      {sizes.map((size, index) => {
                        const sizePrice = size.price ?? product.price;
                        const isSelected = selectedSizeIndex === index;
                        return (
                          <button
                            key={`${size.width}x${size.height}`}
                            type="button"
                            onClick={() => {
                              setSelectedSizeIndex(index);
                              setIsSizeDropdownOpen(false);
                            }}
                            className={`w-full px-4 py-4 sm:py-3 text-left uppercase tracking-wider text-sm font-semibold transition-colors flex justify-between items-center touch-manipulation ${
                              isSelected
                                ? 'bg-primary text-background'
                                : 'hover:bg-primary/10 active:bg-primary/10'
                            }`}
                          >
                            <span>{size.label}</span>
                            <span className={isSelected ? 'text-background font-bold' : 'text-primary font-bold'}>
                              {formatPrice(sizePrice)}
                            </span>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              </div>
            )}

            {/* Specifications */}
            <div className="space-y-3 mb-6">
              {/* Type */}
              <div className="flex justify-between items-center pb-3 border-b border-border">
                <span className="text-muted-foreground text-sm">{t.type}</span>
                <span className="font-medium text-sm">
                  {product.product_type === 'original' ? t.original : t.print}
                </span>
              </div>

              {/* Dimensions - only show for originals or prints with single size */}
              {sizes.length > 0 && (!isPrint || !hasMultipleSizes) && (
                <div className="flex justify-between items-center pb-3 border-b border-border">
                  <span className="text-muted-foreground text-sm">{t.dimensions}</span>
                  <span className="font-medium text-sm">{sizes[0].label}</span>
                </div>
              )}

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

            {/* Trust Badges - Shipping & Returns */}
            <div className="flex flex-wrap gap-4 mb-6 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Truck className="w-4 h-4 text-primary" />
                <span>{t.shippingEstimate}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <RotateCcw className="w-4 h-4 text-primary" />
                <span>{t.returnPolicy}</span>
              </div>
            </div>

            {/* Purchase / Inquiry Section */}
            {renderPurchaseSection()}

            {/* Artist Bio Section */}
            <div className="mt-8 pt-6 border-t border-border">
              <Link
                href={`/${lang}/about`}
                className="group flex items-center gap-4 p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0 border-2 border-primary/20 group-hover:border-primary transition-colors">
                  <Image
                    src="/artist.jpg"
                    alt="Dotty"
                    width={64}
                    height={64}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0 flex items-center justify-between">
                  <h3 className="font-bold text-lg group-hover:text-primary transition-colors">
                    {t.aboutArtist || (lang === 'no' ? 'Om kunstneren' : 'About the artist')}
                  </h3>
                  <ArrowLeft className="w-5 h-5 rotate-180 text-primary" />
                </div>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
