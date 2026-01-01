'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Plus, Pencil, Trash2, Star, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import type { Product } from '@/types';
import { formatPrice } from '@/lib/utils';

// Placeholder products - replace with Supabase fetch
const initialProducts: Product[] = [
  {
    id: '1',
    title: 'Neon Dreams',
    description: 'En eksplosjon av neonfarger',
    slug: 'neon-dreams',
    price: 350000,
    image_url: '',
    image_path: '',
    product_type: 'original',
    stock_quantity: null,
    collection_id: null,
    is_available: true,
    is_featured: true,
    display_order: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    title: 'Pink Explosion',
    description: 'Kraftfulle rosa toner',
    slug: 'pink-explosion',
    price: 150000,
    image_url: '',
    image_path: '',
    product_type: 'print',
    stock_quantity: 10,
    collection_id: null,
    is_available: true,
    is_featured: false,
    display_order: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    title: 'Urban Pop',
    description: 'Gatekunst møter pop-art',
    slug: 'urban-pop',
    price: 450000,
    image_url: '',
    image_path: '',
    product_type: 'original',
    stock_quantity: null,
    collection_id: null,
    is_available: false,
    is_featured: false,
    display_order: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

const gradients = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
];

export default function AdminProductsPage() {
  const [products, setProducts] = useState(initialProducts);

  const toggleFeatured = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_featured: !p.is_featured } : p))
    );
  };

  const toggleAvailable = (id: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_available: !p.is_available } : p))
    );
  };

  const deleteProduct = (id: string) => {
    if (confirm('Er du sikker på at du vil slette dette produktet?')) {
      setProducts((prev) => prev.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Produkter</h1>
          <p className="text-muted-foreground mt-1">
            Administrer kunstverk og trykk
          </p>
        </div>
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

      {/* Products Table */}
      <div className="bg-muted rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted-foreground/10">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium">Bilde</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Tittel</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Pris</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Lager</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Status</th>
              <th className="text-right px-6 py-3 text-sm font-medium">Handlinger</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((product, index) => (
              <motion.tr
                key={product.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-muted-foreground/5"
              >
                <td className="px-6 py-4">
                  <div
                    className={`w-12 h-12 rounded bg-gradient-to-br ${gradients[index % gradients.length]}`}
                  />
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
                    {product.product_type === 'original' ? 'Original' : 'Trykk'}
                  </span>
                </td>
                <td className="px-6 py-4 font-medium">
                  {formatPrice(product.price)}
                </td>
                <td className="px-6 py-4">
                  {product.product_type === 'original' ? (
                    <span className="text-muted-foreground">—</span>
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
                    <button
                      onClick={() => toggleFeatured(product.id)}
                      className={`p-2 rounded-lg transition-colors ${
                        product.is_featured
                          ? 'bg-accent-3/10 text-accent-3'
                          : 'hover:bg-muted-foreground/10 text-muted-foreground'
                      }`}
                      title={product.is_featured ? 'Fjern fra fremhevet' : 'Fremhev'}
                    >
                      <Star className={`w-4 h-4 ${product.is_featured ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => toggleAvailable(product.id)}
                      className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                      title={product.is_available ? 'Merk som solgt' : 'Merk som tilgjengelig'}
                    >
                      {product.is_available ? (
                        <Eye className="w-4 h-4" />
                      ) : (
                        <EyeOff className="w-4 h-4" />
                      )}
                    </button>
                    <Link
                      href={`/admin/products/${product.id}`}
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
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
