'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Save, Loader2, Check, AlertCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/admin/image-upload';
import { SizeInput } from '@/components/admin/size-input';
import { GalleryUpload } from '@/components/admin/gallery-upload';
import { useToast } from '@/components/admin/toast';
import { adminFetch } from '@/lib/admin-fetch';
import type { Product, ProductSize, Collection, GalleryImage, ShippingSize } from '@/types';
import { SHIPPING_SIZE_INFO } from '@/types';

const SHIPPING_SIZE_OPTIONS = Object.keys(SHIPPING_SIZE_INFO) as ShippingSize[];
const AUTO_SAVE_DELAY = 2000;

const INPUT_CLASS = 'w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50';
const INPUT_WITH_SUFFIX_CLASS = `${INPUT_CLASS} pr-16`;

type AutoSaveStatus = 'idle' | 'pending' | 'saving' | 'saved' | 'error';

interface FormState {
  slug: string;
  title: string;
  description: string;
  price: string;
  imageUrl: string;
  imagePath: string;
  productType: 'original' | 'print';
  stockQuantity: string;
  collectionId: string;
  isAvailable: boolean;
  isFeatured: boolean;
  isPublic: boolean;
  sizes: ProductSize[];
  galleryImages: GalleryImage[];
  shippingCost: string;
  shippingSize: ShippingSize | '';
  requiresInquiry: boolean;
  year: string;
}

const initialFormState: FormState = {
  slug: '',
  title: '',
  description: '',
  price: '',
  imageUrl: '',
  imagePath: '',
  productType: 'original',
  stockQuantity: '1',
  collectionId: '',
  isAvailable: true,
  isFeatured: false,
  isPublic: true,
  sizes: [],
  galleryImages: [],
  shippingCost: '',
  shippingSize: '',
  requiresInquiry: false,
  year: '',
};

function parseGalleryImages(value: unknown): GalleryImage[] {
  if (!value) return [];
  if (typeof value === 'string') {
    return JSON.parse(value);
  }
  return value as GalleryImage[];
}

function formatLastSaved(date: Date): string {
  return date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
}

interface AutoSaveIndicatorProps {
  status: AutoSaveStatus;
  lastSaved: Date | null;
}

function AutoSaveIndicator({ status, lastSaved }: AutoSaveIndicatorProps): React.ReactNode {
  if (status === 'idle') return null;

  const variants = {
    initial: { opacity: 0, y: -10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 10 },
  };

  if (status === 'saving') {
    return (
      <motion.div
        key="saving"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-full text-sm text-muted-foreground"
      >
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Lagrer...</span>
      </motion.div>
    );
  }

  if (status === 'saved') {
    return (
      <motion.div
        key="saved"
        variants={variants}
        initial={{ ...variants.initial, scale: 0.9 }}
        animate={{ ...variants.animate, scale: 1 }}
        exit="exit"
        className="flex items-center gap-2 px-3 py-1.5 bg-success/10 text-success rounded-full text-sm"
      >
        <Check className="w-4 h-4" />
        <span>Lagret {lastSaved && formatLastSaved(lastSaved)}</span>
      </motion.div>
    );
  }

  if (status === 'error') {
    return (
      <motion.div
        key="error"
        variants={variants}
        initial="initial"
        animate="animate"
        exit="exit"
        className="flex items-center gap-2 px-3 py-1.5 bg-error/10 text-error rounded-full text-sm"
      >
        <AlertCircle className="w-4 h-4" />
        <span>Kunne ikke lagre</span>
      </motion.div>
    );
  }

  return null;
}

export default function EditProductPage(): React.ReactNode {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const toast = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [dataLoaded, setDataLoaded] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const [form, setForm] = useState<FormState>(initialFormState);

  function updateForm<K extends keyof FormState>(field: K, value: FormState[K]): void {
    setForm(prev => ({ ...prev, [field]: value }));
  }

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
        setForm({
          slug: product.slug,
          title: product.title,
          description: product.description || '',
          price: String(product.price / 100),
          imageUrl: product.image_url || '',
          imagePath: product.image_path || '',
          productType: product.product_type,
          stockQuantity: product.stock_quantity?.toString() || '1',
          collectionId: product.collection_id || '',
          isAvailable: product.is_available,
          isFeatured: product.is_featured,
          isPublic: product.is_public ?? true,
          sizes: product.sizes || [],
          galleryImages: parseGalleryImages(product.gallery_images),
          shippingCost: product.shipping_cost ? String(product.shipping_cost / 100) : '',
          shippingSize: product.shipping_size || '',
          requiresInquiry: product.requires_inquiry || false,
          year: product.year ? String(product.year) : '',
        });
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Kunne ikke laste produkt');
      } finally {
        setIsLoading(false);
        setTimeout(() => setDataLoaded(true), 300);
      }
    }

    fetchData();
  }, [productId, toast]);

  const buildSaveData = useCallback(() => {
    const priceInOre = form.price ? Math.round(parseFloat(form.price) * 100) : 0;
    const shippingCostInOre = form.shippingCost ? Math.round(parseFloat(form.shippingCost) * 100) : null;
    const parsedStock = parseInt(form.stockQuantity, 10);
    const stockValue = Number.isNaN(parsedStock) ? 1 : parsedStock;

    return {
      title: form.title,
      description: form.description,
      price: priceInOre,
      image_url: form.imageUrl,
      image_path: form.imagePath,
      product_type: form.productType,
      stock_quantity: stockValue,
      collection_id: form.collectionId || null,
      is_available: form.isAvailable,
      is_featured: form.isFeatured,
      is_public: form.isPublic,
      sizes: form.sizes,
      gallery_images: form.galleryImages,
      shipping_cost: shippingCostInOre,
      shipping_size: form.shippingSize || null,
      requires_inquiry: form.requiresInquiry,
      year: form.year ? parseInt(form.year, 10) : null,
    };
  }, [form]);

  const performAutoSave = useCallback(async () => {
    if (!form.title || !form.price) return;

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
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch {
      setAutoSaveStatus('error');
      toast.error('Kunne ikke auto-lagre');
      setTimeout(() => setAutoSaveStatus('idle'), 3000);
    }
  }, [productId, buildSaveData, form.title, form.price, toast]);

  const handleAutoSaveBlur = useCallback((e: React.FocusEvent) => {
    const target = e.target as HTMLElement;
    const tagName = target.tagName.toLowerCase();
    if (tagName !== 'input' && tagName !== 'textarea' && tagName !== 'select') {
      return;
    }

    if (!dataLoaded || isLoading) return;

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      performAutoSave();
    }, AUTO_SAVE_DELAY);
  }, [dataLoaded, isLoading, performAutoSave]);

  useEffect(() => {
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

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
    setForm(prev => ({ ...prev, imageUrl: url, imagePath: path }));
  }

  function handleImageRemove(): void {
    setForm(prev => ({ ...prev, imageUrl: '', imagePath: '' }));
  }

  function handleProductTypeChange(type: 'original' | 'print'): void {
    if (type === 'original') {
      setForm(prev => ({ ...prev, productType: type, stockQuantity: '1' }));
    } else {
      updateForm('productType', type);
    }
  }

  function handleStockChange(value: string): void {
    setForm(prev => {
      const newState = { ...prev, stockQuantity: value };
      if (parseInt(value, 10) === 0) {
        newState.isAvailable = false;
      }
      return newState;
    });
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
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Rediger produkt</h1>
              {form.slug && (
                <a
                  href={`/no/shop/${form.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1 text-sm text-primary hover:text-primary-light border border-primary/30 hover:border-primary rounded-full transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Se produkt
                </a>
              )}
            </div>
            <p className="text-muted-foreground mt-1">Oppdater produktinformasjon</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <AutoSaveIndicator status={autoSaveStatus} lastSaved={lastSaved} />
        </AnimatePresence>
      </div>

      <form onSubmit={handleSubmit} onBlur={handleAutoSaveBlur} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-4">
            <label className="block text-sm font-medium">Produktbilde</label>
            <ImageUpload
              value={form.imageUrl}
              path={form.imagePath}
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
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                className={INPUT_CLASS}
                placeholder="Navn pa kunstverket"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">Beskrivelse</label>
              <textarea
                id="description"
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                rows={3}
                className={`${INPUT_CLASS} resize-none`}
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
                    value={form.price}
                    onChange={(e) => updateForm('price', e.target.value)}
                    className={INPUT_WITH_SUFFIX_CLASS}
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="year" className="block text-sm font-medium">Ar</label>
                <input
                  id="year"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={form.year}
                  onChange={(e) => updateForm('year', e.target.value)}
                  className={INPUT_CLASS}
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
                    checked={form.productType === 'original'}
                    onChange={() => handleProductTypeChange('original')}
                    className="w-4 h-4 text-primary"
                  />
                  <span>Maleri</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="productType"
                    value="print"
                    checked={form.productType === 'print'}
                    onChange={() => handleProductTypeChange('print')}
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
                value={form.collectionId}
                onChange={(e) => updateForm('collectionId', e.target.value)}
                className={INPUT_CLASS}
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
              <label htmlFor="shippingSize" className="block text-sm font-medium">Fraktstorrelse</label>
              <select
                id="shippingSize"
                value={form.shippingSize}
                onChange={(e) => updateForm('shippingSize', e.target.value as ShippingSize | '')}
                className={INPUT_CLASS}
              >
                <option value="">Velg storrelse...</option>
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
                  value={form.shippingCost}
                  onChange={(e) => updateForm('shippingCost', e.target.value)}
                  className={INPUT_WITH_SUFFIX_CLASS}
                  placeholder="0"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">kr</span>
              </div>
              <p className="text-xs text-muted-foreground">
                La sta tom for a bruke samlingens fraktpris. Sett til 0 for gratis frakt.
              </p>
            </div>

            {form.productType === 'print' && (
              <div className="space-y-2">
                <label htmlFor="stock" className="block text-sm font-medium">
                  Antall pa lager
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  step="1"
                  value={form.stockQuantity}
                  onChange={(e) => handleStockChange(e.target.value)}
                  onWheel={(e) => e.currentTarget.blur()}
                  className={INPUT_CLASS}
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">Sett til 0 for a markere som utsolgt</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium">Storrelser</label>
              <SizeInput value={form.sizes} onChange={(sizes) => updateForm('sizes', sizes)} />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium">Galleri (flere bilder)</label>
              <GalleryUpload value={form.galleryImages} onChange={(images) => updateForm('galleryImages', images)} />
            </div>

            <div className="space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isPublic}
                  onChange={(e) => updateForm('isPublic', e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <div>
                  <span>Synlig i butikken</span>
                  <p className="text-xs text-muted-foreground">
                    Skru av for a skjule fra shop og forsiden
                  </p>
                </div>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isAvailable}
                  onChange={(e) => updateForm('isAvailable', e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <span>Tilgjengelig for salg</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={(e) => updateForm('isFeatured', e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <span>Fremhevet pa forsiden</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresInquiry}
                  onChange={(e) => updateForm('requiresInquiry', e.target.checked)}
                  className="w-5 h-5 rounded text-primary"
                />
                <div>
                  <span>Krever forespørsel</span>
                  <p className="text-xs text-muted-foreground">
                    Kunden kan ikke kjope direkte - ma sende forespørsel
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
            disabled={isSubmitting || !form.title || !form.price}
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
