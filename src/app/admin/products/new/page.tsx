'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';

import { ImageUpload } from '@/components/admin/image-upload';
import { SizeInput } from '@/components/admin/size-input';
import { GalleryUpload } from '@/components/admin/gallery-upload';
import { useToast } from '@/components/admin/toast';
import { adminFetch } from '@/lib/admin-fetch';
import type { ProductSize, Collection, GalleryImage, ShippingSize } from '@/types';
import { SHIPPING_SIZE_INFO } from '@/types';

const SHIPPING_SIZE_OPTIONS = Object.keys(SHIPPING_SIZE_INFO) as ShippingSize[];

const INPUT_CLASS = 'w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50';
const INPUT_WITH_SUFFIX_CLASS = `${INPUT_CLASS} pr-16`;

interface FormState {
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
  sizes: ProductSize[];
  galleryImages: GalleryImage[];
  shippingCost: string;
  shippingSize: ShippingSize | '';
  requiresInquiry: boolean;
  year: string;
}

const initialFormState: FormState = {
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
  sizes: [],
  galleryImages: [],
  shippingCost: '',
  shippingSize: '',
  requiresInquiry: false,
  year: '',
};

function buildSaveData(form: FormState): Record<string, unknown> {
  const priceInOre = Math.round(parseFloat(form.price) * 100);
  const shippingCostInOre = form.shippingCost ? Math.round(parseFloat(form.shippingCost) * 100) : null;

  return {
    title: form.title,
    description: form.description,
    price: priceInOre,
    image_url: form.imageUrl,
    image_path: form.imagePath,
    product_type: form.productType,
    stock_quantity: parseInt(form.stockQuantity, 10) || 1,
    collection_id: form.collectionId || null,
    is_available: form.isAvailable,
    is_featured: form.isFeatured,
    sizes: form.sizes,
    gallery_images: form.galleryImages,
    shipping_cost: shippingCostInOre,
    shipping_size: form.shippingSize || null,
    requires_inquiry: form.requiresInquiry,
    year: form.year ? parseInt(form.year, 10) : null,
  };
}

export default function NewProductPage(): React.ReactNode {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [form, setForm] = useState<FormState>(initialFormState);

  function updateForm<K extends keyof FormState>(field: K, value: FormState[K]): void {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  useEffect(() => {
    adminFetch('/api/admin/collections').then(async (response) => {
      if (response.ok) {
        const result = await response.json();
        setCollections(result.data || []);
      }
    });
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await adminFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildSaveData(form)),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product');
      }

      toast.success('Produkt opprettet');
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nytt produkt</h1>
          <p className="text-muted-foreground mt-1">Legg til et nytt kunstverk eller trykk</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
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
                  <span>Krever foresporsel</span>
                  <p className="text-xs text-muted-foreground">
                    Kunden kan ikke kjope direkte - ma sende foresporsel
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
                Lagre produkt
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
