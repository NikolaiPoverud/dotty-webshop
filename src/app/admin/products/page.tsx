'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, Trash2, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-fetch';

const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/admin/products');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch products');
      }

      // Handle both paginated and non-paginated responses
      const productsData = Array.isArray(result) ? result : (result.data || []);
      setProducts(productsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const deleteProduct = async (id: string) => {
    if (!confirm('Er du sikker pa at du vil slette dette produktet?')) return;

    try {
      const response = await adminFetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete product:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produkter</h1>
          <p className="text-muted-foreground mt-1">
            Administrer kunstverk og trykk
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchProducts}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
            title="Oppdater"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <Link href="/admin/products/new">
            <motion.button
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Nytt produkt
            </motion.button>
          </Link>
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

      {products.length === 0 && !error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ingen produkter enna.</p>
          <Link href="/admin/products/new">
            <motion.button
              className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Plus className="w-5 h-5" />
              Legg til ditt forste produkt
            </motion.button>
          </Link>
        </div>
      ) : (
        <div className="bg-muted rounded-lg overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-muted-foreground/10">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium">Bilde</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Tittel</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Type</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Pris</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Lager</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium w-32">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product, index) => (
                <tr
                  key={product.id}
                  className="hover:bg-muted-foreground/5"
                >
                  <td className="px-6 py-4">
                    {product.image_url ? (
                      <div className="relative w-12 h-12 rounded overflow-hidden">
                        <Image
                          src={product.image_url}
                          alt={product.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div
                        className={`w-12 h-12 rounded bg-gradient-to-br ${gradients[index % gradients.length]}`}
                      />
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="font-medium">{product.title}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-xs">
                        {product.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-background text-xs uppercase rounded">
                      {product.product_type === 'original' ? 'Maleri' : 'Prints'}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">
                    {formatPrice(product.price)}
                  </td>
                  <td className="px-6 py-4">
                    {product.product_type === 'original' ? (
                      <span className="text-muted-foreground">-</span>
                    ) : (
                      <span>{product.stock_quantity}</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        product.is_available
                          ? 'bg-success/10 text-success'
                          : 'bg-error/10 text-error'
                      }`}
                    >
                      {product.is_available ? 'Tilgjengelig' : 'Solgt'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/products/${product.id}/edit`}
                        className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                        title="Rediger"
                      >
                        <Pencil className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteProduct(product.id)}
                        className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
                        title="Slett"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
