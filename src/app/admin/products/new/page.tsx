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

export default function NewProductPage() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collections, setCollections] = useState<Collection[]>([]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [productType, setProductType] = useState<'original' | 'print'>('original');
  const [stockQuantity, setStockQuantity] = useState('1');
  const [collectionId, setCollectionId] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);
  const [shippingCost, setShippingCost] = useState('');
  const [shippingSize, setShippingSize] = useState<ShippingSize | ''>('');
  const [requiresInquiry, setRequiresInquiry] = useState(false);
  const [year, setYear] = useState('');

  useEffect(() => {
    async function fetchCollections(): Promise<void> {
      const response = await adminFetch('/api/admin/collections');
      if (response.ok) {
        const result = await response.json();
        setCollections(result.data || []);
      }
    }
    fetchCollections();
  }, []);

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const priceInOre = Math.round(parseFloat(price) * 100);
      const shippingCostInOre = shippingCost ? Math.round(parseFloat(shippingCost) * 100) : null;

      const response = await adminFetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: priceInOre,
          image_url: imageUrl,
          image_path: imagePath,
          product_type: productType,
          stock_quantity: parseInt(stockQuantity, 10) || 1,
          collection_id: collectionId || null,
          is_available: isAvailable,
          is_featured: isFeatured,
          sizes,
          gallery_images: galleryImages,
          shipping_cost: shippingCostInOre,
          shipping_size: shippingSize || null,
          requires_inquiry: requiresInquiry,
          year: year ? parseInt(year, 10) : null,
        }),
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
    setImageUrl(url);
    setImagePath(path);
  }

  function handleImageRemove(): void {
    setImageUrl('');
    setImagePath('');
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
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                    kr
                  </span>
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
                    onChange={() => {
                      setProductType('original');
                      setStockQuantity('1');
                    }}
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
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  kr
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                La stå tom for å bruke samlingens fraktpris. Sett til 0 for gratis frakt.
              </p>
            </div>

            {productType === 'print' && (
              <div className="space-y-2">
                <label htmlFor="stock" className="block text-sm font-medium">
                  Antall på lager
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
                    // Auto-set unavailable when stock is 0
                    if (parseInt(val, 10) === 0) {
                      setIsAvailable(false);
                    }
                  }}
                  onWheel={(e) => e.currentTarget.blur()}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="1"
                />
                <p className="text-xs text-muted-foreground">Sett til 0 for å markere som utsolgt</p>
              </div>
            )}

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
                Lagre produkt
              </>
            )}
          </motion.button>
        </div>
      </form>
    </div>
  );
}
