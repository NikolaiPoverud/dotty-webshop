'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/admin/image-upload';
import { SizeInput } from '@/components/admin/size-input';
import { GalleryUpload } from '@/components/admin/gallery-upload';
import { useToast } from '@/components/admin/toast';
import { adminFetch } from '@/lib/admin-fetch';
import type { Product, ProductSize, Collection, GalleryImage, ShippingSize } from '@/types';
import { SHIPPING_SIZE_INFO } from '@/types';

const SHIPPING_SIZE_OPTIONS = Object.keys(SHIPPING_SIZE_INFO) as ShippingSize[];
const AUTO_SAVE_DELAY = 2000; // 2 seconds after blur before saving

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

function parseGalleryImages(value: unknown): GalleryImage[] {
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return (value as GalleryImage[]) || [];
}

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false); // Track if initial data has been loaded
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [productType, setProductType] = useState<'original' | 'print'>('original');
  const [stockQuantity, setStockQuantity] = useState('');
  const [collectionId, setCollectionId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [isPublic, setIsPublic] = useState(true);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingSize, setShippingSize] = useState<ShippingSize | ''>('');
  const [requiresInquiry, setRequiresInquiry] = useState(false);
  const [year, setYear] = useState('');

  useEffect(() => {
    async function fetchData(): Promise<void> {
      try {
        const [collectionsRes, productRes] = await Promise.all([
          adminFetch('/api/admin/collections'),
          adminFetch(`/api/admin/products/${productId}`),
        ]);

        if (collectionsRes.ok) {
          const collectionsResult = await collectionsRes.json();
          setCollections(collectionsResult.data || []);
        }

        const productResult = await productRes.json();
        if (!productRes.ok) {
          throw new Error(productResult.error || 'Failed to fetch product');
        }

        const product: Product = productResult.data;
        setTitle(product.title);
        setDescription(product.description || '');
        setPrice(String(product.price / 100));
        setImageUrl(product.image_url || '');
        setImagePath(product.image_path || '');
        setProductType(product.product_type);
        setStockQuantity(product.stock_quantity?.toString() || '1');
        setCollectionId(product.collection_id || '');
        setIsAvailable(product.is_available);
        setIsFeatured(product.is_featured);
        setIsPublic(product.is_public ?? true);
        setSizes(product.sizes || []);
        setGalleryImages(parseGalleryImages(product.gallery_images));
        setShippingCost(product.shipping_cost ? String(product.shipping_cost / 100) : '');
        setShippingSize(product.shipping_size || '');
        setRequiresInquiry(product.requires_inquiry || false);
        setYear(product.year ? String(product.year) : '');
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Kunne ikke laste produkt');
      } finally {
        setIsLoading(false);
        // Mark data as loaded after a short delay to let React finish state updates
        // This prevents auto-save from triggering on the initial load
        setTimeout(() => {
          setDataLoaded(true);
        }, 300);
      }
    }

    fetchData();
  }, [productId, toast]);

  // Build the data object for saving
  const buildSaveData = useCallback(() => {
    const priceInOre = price ? Math.round(parseFloat(price) * 100) : 0;
    const shippingCostInOre = shippingCost ? Math.round(parseFloat(shippingCost) * 100) : null;
    // Parse stock - allow 0 as valid value, default to 1 only if empty/NaN
    const parsedStock = parseInt(stockQuantity, 10);
    const stockValue = Number.isNaN(parsedStock) ? 1 : parsedStock;

    return {
      title,
      description,
      price: priceInOre,
      image_url: imageUrl,
      image_path: imagePath,
      product_type: productType,
      stock_quantity: stockValue,
      collection_id: collectionId || null,
      is_available: isAvailable,
      is_featured: isFeatured,
      is_public: isPublic,
      sizes,
      gallery_images: galleryImages,
      shipping_cost: shippingCostInOre,
      shipping_size: shippingSize || null,
      requires_inquiry: requiresInquiry,
      year: year ? parseInt(year, 10) : null,
    };
  }, [title, description, price, imageUrl, imagePath, productType, stockQuantity, collectionId, isAvailable, isFeatured, isPublic, sizes, galleryImages, shippingCost, shippingSize, requiresInquiry, year]);

  // Auto-save function
  const performAutoSave = useCallback(async () => {
    if (!title || !price) return; // Don't save if required fields are missing

    setAutoSaveStatus('saving');
    try {
      const response = await adminFetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveData()),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save');
      }

      setAutoSaveStatus('saved');
      setLastSaved(new Date());
      // Don't show toast on success - the header indicator is enough
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (err) {
      setAutoSaveStatus('error');
      toast.error('Kunne ikke auto-lagre');
      console.error('Auto-save error:', err);
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [productId, buildSaveData, title, price, toast]);

  // Trigger auto-save when user clicks away from an input (blur)
  const handleAutoSaveBlur = useCallback((e: React.FocusEvent) => {
    // Only trigger from actual input elements
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select') {
      return;
    }

    // Don't auto-save until data is loaded
    if (!dataLoaded || isLoading) return;

    // Clear existing timeout (in case user clicks between fields quickly)
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set timeout for auto-save (gives user time to click another field)
    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [dataLoaded, isLoading, performAutoSave]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  // Manual save (navigates back to products list)
  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    // Cancel any pending auto-save
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    setIsSubmitting(true);

    try {
      const response = await adminFetch(`/api/admin/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveData()),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update product');
      }

      toast.success('Produkt oppdatert');
      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Noe gikk galt');
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleImageChange(url: string, path: string): void {
    setImageUrl(url);
    setImagePath(path);
  }

  function handleImageRemove(): void {
    setImageUrl('');
    setImagePath('');
  }

  function formatLastSaved(date: Date): string {
    return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/products"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Rediger produkt</h1>
            <p className="text-muted-foreground mt-1">Oppdater produktinformasjon</p>
          </div>
        </div>

        {/* Auto-save status indicator */}
        <AnimatePresence mode="wait">
          {autoSaveStatus === 'saving' && (
            <motion.div
              key="saving"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Lagrer...</span>
            </motion.div>
          )}
          {autoSaveStatus === 'saved' && (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: -10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm"
            >
              <Check className="w-4 h-4" />
              <span>Lagret {lastSaved && formatLastSaved(lastSaved)}</span>
            </motion.div>
          )}
          {autoSaveStatus === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex items-center gap-2 px-3 py-1.5 bg-error/10 text-error rounded-full text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              <span>Kunne ikke lagre</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} onBlur={handleAutoSaveBlur} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Produktbilde</label>
            <ImageUpload
              value={imageUrl}
              path={imagePath}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">Tittel *</label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="Navn pa kunstverket"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">Beskrivelse</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Beskriv kunstverket..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="price" className="block text-sm font-medium">Pris (NOK inkl. MVA) *</label>
                <div className="relative">
                  <input
                    id="price"
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 pr-16"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="year" className="block text-sm font-medium">År</label>
                <input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder={new Date().getFullYear().toString()}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Type *</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    value="original"
                    checked={productType === 'original'}
                    onChange={() => setProductType('original')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Maleri</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    value="print"
                    checked={productType === 'print'}
                    onChange={() => setProductType('print')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Prints</span>
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="collection" className="block text-sm font-medium">Samling</label>
              <select
                id="collection"
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Ingen samling</option>
                {collections.map((collection) => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="shippingSize" className="block text-sm font-medium">Fraktstørrelse</label>
              <select
                id="shippingSize"
                value={shippingSize}
                onChange={(e) => setShippingSize(e.target.value as ShippingSize | '')}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Velg størrelse...</option>
                {SHIPPING_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {SHIPPING_SIZE_INFO[size].label} - {SHIPPING_SIZE_INFO[size].description}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="shippingCost" className="block text-sm font-medium">Fraktkostnad (NOK)</label>
              <div className="relative">
                <input
                  id="shippingCost"
                  type="number"
                  min="0"
                  step="1"
                  value={shippingCost}
                  onChange={(e) => setShippingCost(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 pr-16"
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
              </div>
              <p className="text-xs text-muted-foreground">
                La stå tom for å bruke samlingens fraktpris. Sett til 0 for gratis frakt.
              </p>
            </div>

            <div className="space-y-2">
              <label htmlFor="stock" className="block text-sm font-medium">
                Antall pa lager {productType === 'original' && <span className="text-muted-foreground">(vanligvis 1)</span>}
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                step="1"
                value={stockQuantity}
                onChange={(e) => {
                  const val = e.target.value;
                  setStockQuantity(val);
                  if (parseInt(val, 10) === 0) {
                    setIsAvailable(false);
                  }
                }}
                onWheel={(e) => e.currentTarget.blur()}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                placeholder="1"
              />
              <p className="text-xs text-muted-foreground">Sett til 0 for å markere som solgt</p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Størrelser</label>
              <SizeInput value={sizes} onChange={setSizes} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Galleri (flere bilder)</label>
              <GalleryUpload value={galleryImages} onChange={setGalleryImages} />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <div>
                  <span>Synlig i butikken</span>
                  <p className="text-xs text-muted-foreground">
                    Skru av for å skjule fra shop og forsiden
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAvailable}
                  onChange={(e) => setIsAvailable(e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <span>Tilgjengelig for salg</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isFeatured}
                  onChange={(e) => setIsFeatured(e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <span>Fremhevet pa forsiden</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={requiresInquiry}
                  onChange={(e) => setRequiresInquiry(e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <div>
                  <span>Krever forespørsel</span>
                  <p className="text-xs text-muted-foreground">
                    Kunden kan ikke kjøpe direkte - må sende forespørsel
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4 pt-6 border-t border-border">
          <Link
            href="/admin/products"
            className="px-6 py-3 text-muted-foreground hover:text-foreground transition-colors"
          >
            Avbryt
          </Link>
          <motion.button
            type="submit"
            disabled={isSubmitting || !title || !price}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Lagrer...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Lagre endringer
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
