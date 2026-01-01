'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ImageUpload } from '@/components/admin/image-upload';
import { SizeInput } from '@/components/admin/size-input';
import { GalleryUpload } from '@/components/admin/gallery-upload';
import type { ProductSize, Collection, GalleryImage } from '@/types';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collections, setCollections] = useState<Collection[]>([]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePath, setImagePath] = useState('');
  const [productType, setProductType] = useState<'original' | 'print'>('original');
  const [stockQuantity, setStockQuantity] = useState('');
  const [collectionId, setCollectionId] = useState<string>('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [sizes, setSizes] = useState<ProductSize[]>([]);
  const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const response = await fetch('/api/admin/collections');
        const result = await response.json();
        if (response.ok) {
          setCollections(result.data || []);
        }
      } catch (err) {
        console.error('Failed to fetch collections:', err);
      }
    };
    fetchCollections();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      // Convert price from NOK to ore (multiply by 100)
      const priceInOre = Math.round(parseFloat(price) * 100);

      const response = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          price: priceInOre,
          image_url: imageUrl,
          image_path: imagePath,
          product_type: productType,
          stock_quantity: productType === 'print' ? parseInt(stockQuantity, 10) || 0 : null,
          collection_id: collectionId || null,
          is_available: isAvailable,
          is_featured: isFeatured,
          sizes,
          gallery_images: galleryImages,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create product');
      }

      router.push('/admin/products');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (url: string, path: string) => {
    setImageUrl(url);
    setImagePath(path);
  };

  const handleImageRemove = () => {
    setImageUrl('');
    setImagePath('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Nytt produkt</h1>
          <p className="text-muted-foreground mt-1">
            Legg til et nytt kunstverk eller trykk
          </p>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-error/10 border border-error/20 rounded-lg text-error"
        >
          {error}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Image */}
          <div className="space-y-4">
            <label className="block text-sm font-medium">Produktbilde</label>
            <ImageUpload
              value={imageUrl}
              path={imagePath}
              onChange={handleImageChange}
              onRemove={handleImageRemove}
            />
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <label htmlFor="title" className="block text-sm font-medium">
                Tittel *
              </label>
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

            {/* Description */}
            <div className="space-y-2">
              <label htmlFor="description" className="block text-sm font-medium">
                Beskrivelse
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                placeholder="Beskriv kunstverket..."
              />
            </div>

            {/* Price */}
            <div className="space-y-2">
              <label htmlFor="price" className="block text-sm font-medium">
                Pris (NOK inkl. MVA) *
              </label>
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

            {/* Product Type */}
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
                  <span>Original</span>
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
                  <span>Trykk</span>
                </label>
              </div>
            </div>

            {/* Collection */}
            <div className="space-y-2">
              <label htmlFor="collection" className="block text-sm font-medium">
                Samling
              </label>
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

            {/* Stock Quantity (only for prints) */}
            {productType === 'print' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2"
              >
                <label htmlFor="stock" className="block text-sm font-medium">
                  Antall pa lager
                </label>
                <input
                  id="stock"
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="0"
                />
              </motion.div>
            )}

            {/* Sizes */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Størrelser</label>
              <SizeInput value={sizes} onChange={setSizes} />
            </div>

            {/* Gallery Images */}
            <div className="space-y-2">
              <label className="block text-sm font-medium">Galleri (flere bilder)</label>
              <GalleryUpload value={galleryImages} onChange={setGalleryImages} />
            </div>

            {/* Toggles */}
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
            </div>
          </div>
        </div>

        {/* Submit Button */}
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
