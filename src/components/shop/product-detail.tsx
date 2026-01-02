'use client';

import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ArrowLeft, Mail, Send, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Locale, Product, GalleryImage } from '@/types';
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
    original: 'Original',
    print: 'Trykk',
    shipping: 'Frakt',
    freeShipping: 'Gratis',
    // Inquiry-only product
    inquiryOnly: 'Forespørsel påkrevd',
    inquiryDescription: 'Dette verket selges ikke direkte. Legg igjen din e-post, så tar vi kontakt.',
    emailPlaceholder: 'Din e-postadresse',
    sendInquiry: 'Send forespørsel',
    inquirySent: 'Takk! Vi tar kontakt snart.',
    inquiryError: 'Noe gikk galt. Prøv igjen.',
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
    original: 'Original',
    print: 'Print',
    shipping: 'Shipping',
    freeShipping: 'Free',
    // Inquiry-only product
    inquiryOnly: 'Inquiry required',
    inquiryDescription: 'This artwork is not sold directly. Leave your email and we will contact you.',
    emailPlaceholder: 'Your email address',
    sendInquiry: 'Send inquiry',
    inquirySent: 'Thank you! We will be in touch soon.',
    inquiryError: 'Something went wrong. Please try again.',
  },
};

interface ProductDetailProps {
  product: Product;
  collectionName: string | null;
  shippingCost: number;
  lang: Locale;
}

export function ProductDetail({ product, collectionName, shippingCost, lang }: ProductDetailProps) {
  const t = text[lang];
  const router = useRouter();
  const { addItem, cart } = useCart();
  const [isAdded, setIsAdded] = useState(false);

  // Inquiry form state
  const [inquiryEmail, setInquiryEmail] = useState('');
  const [inquiryStatus, setInquiryStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Check if item is already in cart
  const isInCart = cart.items.some((item) => item.product.id === product.id);

  // Item is sold if not available OR stock is 0
  const isSold = !product.is_available || product.stock_quantity === 0;

  // Extract year from created_at
  const year = new Date(product.created_at).getFullYear();

  // Format dimensions - handle both array and string from JSONB
  const sizesArray = typeof product.sizes === 'string'
    ? JSON.parse(product.sizes)
    : product.sizes;
  const dimensionsText = sizesArray && sizesArray.length > 0
    ? sizesArray[0].label
    : '-';

  // Parse gallery images - handle both array and string from JSONB
  const galleryImages: GalleryImage[] = typeof product.gallery_images === 'string'
    ? JSON.parse(product.gallery_images)
    : (product.gallery_images || []);

  const handleAddToCart = () => {
    if (isSold) return;

    addItem(product, 1);
    setIsAdded(true);

    // Reset after 3 seconds
    setTimeout(() => setIsAdded(false), 3000);
  };

  const handleViewCart = () => {
    router.push(getLocalizedPath(lang, 'cart'));
  };

  const handleInquirySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inquiryEmail || inquiryStatus === 'sending') return;

    setInquiryStatus('sending');
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inquiryEmail,
          name: '',
          message: `Inquiry about artwork: ${product.title} (${product.id})`,
          type: 'product_inquiry',
          product_id: product.id,
          product_title: product.title,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send inquiry');
      }

      setInquiryStatus('sent');
    } catch {
      setInquiryStatus('error');
      // Reset error after 3 seconds to allow retry
      setTimeout(() => setInquiryStatus('idle'), 3000);
    }
  };

  return (
    <div className="min-h-screen pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back to Shop Navigation */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
          className="mb-8"
        >
          <Link
            href={getLocalizedPath(lang, 'shop')}
            className="group inline-flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors duration-300"
          >
            <motion.span
              className="flex items-center justify-center w-10 h-10 rounded-full bg-muted group-hover:bg-primary/20 transition-colors duration-300"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <motion.span
                initial={{ x: 0 }}
                whileHover={{ x: -3 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <ArrowLeft className="w-5 h-5 group-hover:text-primary transition-colors duration-300" />
              </motion.span>
            </motion.span>
            <span className="text-sm font-medium uppercase tracking-wider group-hover:text-primary transition-colors duration-300">
              {t.backToShop}
            </span>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
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
              <p className="text-primary font-medium mb-4">
                {collectionName}
              </p>
            )}

            {/* Product Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              {product.title}
            </h1>

            {/* Price */}
            <p className="text-3xl sm:text-4xl font-bold mb-12">
              {formatPrice(product.price)}
            </p>

            {/* Specifications */}
            <div className="space-y-6 mb-12">
              {/* Dimensions */}
              <div className="flex justify-between items-center pb-6 border-b border-border">
                <span className="text-muted-foreground">{t.dimensions}</span>
                <span className="font-medium">{dimensionsText}</span>
              </div>

              {/* Year */}
              <div className="flex justify-between items-center pb-6 border-b border-border">
                <span className="text-muted-foreground">{t.year}</span>
                <span className="font-medium">{year}</span>
              </div>

              {/* Availability */}
              <div className="flex justify-between items-center pb-6 border-b border-border">
                <span className="text-muted-foreground">{t.availability}</span>
                <span className={`font-medium ${isSold ? 'text-error' : ''}`}>
                  {isSold ? t.soldOut : t.available}
                </span>
              </div>

            </div>

            {/* Description */}
            {product.description && (
              <p className="text-muted-foreground mb-12 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Purchase / Inquiry Section */}
            {product.requires_inquiry ? (
              // Inquiry-only product - show email form
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="font-semibold">{t.inquiryOnly}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t.inquiryDescription}
                  </p>
                </div>

                {inquiryStatus === 'sent' ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full py-6 bg-success text-background font-semibold text-lg uppercase tracking-wider rounded-full flex items-center justify-center gap-2"
                  >
                    <Check className="w-6 h-6" />
                    {t.inquirySent}
                  </motion.div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3">
                    <input
                      type="email"
                      value={inquiryEmail}
                      onChange={(e) => setInquiryEmail(e.target.value)}
                      placeholder={t.emailPlaceholder}
                      required
                      className="w-full px-6 py-4 bg-muted border border-border rounded-full focus:outline-none focus:ring-2 focus:ring-primary/50 text-lg"
                    />
                    <motion.button
                      type="submit"
                      disabled={inquiryStatus === 'sending' || !inquiryEmail}
                      className="w-full py-6 bg-primary text-background font-semibold text-lg uppercase tracking-wider rounded-full transition-all duration-300 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {inquiryStatus === 'sending' ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {inquiryStatus === 'error' ? t.inquiryError : t.sendInquiry}
                    </motion.button>
                  </form>
                )}
              </div>
            ) : isAdded || isInCart ? (
              // Item added to cart
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full py-6 bg-success text-background font-semibold text-lg uppercase tracking-wider rounded-full flex items-center justify-center gap-2"
                >
                  <Check className="w-6 h-6" />
                  {t.addedToCart}
                </motion.div>
                <motion.button
                  onClick={handleViewCart}
                  className="w-full py-4 bg-muted text-foreground font-semibold text-lg uppercase tracking-wider rounded-full transition-all duration-300 hover:bg-muted/80"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t.viewCart}
                </motion.button>
              </div>
            ) : (
              // Normal add to cart button
              <motion.button
                onClick={handleAddToCart}
                className="w-full py-6 bg-primary text-background font-semibold text-lg uppercase tracking-wider rounded-full transition-all duration-300 hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
                whileHover={{ scale: isSold ? 1 : 1.02 }}
                whileTap={{ scale: isSold ? 1 : 0.98 }}
                disabled={isSold}
              >
                {isSold ? t.soldOut : t.addToCart}
              </motion.button>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
