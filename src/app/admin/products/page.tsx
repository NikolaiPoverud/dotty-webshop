'use client';

import { motion, Reorder, useDragControls } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { CheckSquare, Edit3, Eye, EyeOff, GripVertical, Loader2, Pencil, Plus, RefreshCw, Square, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

import { MassEditModal } from '@/components/admin/mass-edit-modal';
import { adminFetch } from '@/lib/admin-fetch';
import { formatPrice } from '@/lib/utils';
import type { Collection, Product } from '@/types';

const PLACEHOLDER_GRADIENTS = [
  'from-primary to-accent',
  'from-accent to-accent-2',
  'from-accent-2 to-accent-3',
];

const GRID_COLUMNS = 'grid-cols-[auto_auto_60px_1fr_100px_100px_80px_60px_100px_100px]';

function getProductTypeLabel(type: Product['product_type']): string {
  return type === 'original' ? 'Maleri' : 'Prints';
}

function isProductAvailable(product: Product): boolean {
  const hasStock = product.stock_quantity === null || product.stock_quantity > 0;
  return product.is_available && hasStock;
}

interface DraggableProductRowProps {
  product: Product;
  gradientIndex: number;
  onDelete: (id: string) => void;
  onToggleVisibility: (id: string, isPublic: boolean) => void;
  isSelected: boolean;
  onToggleSelect: (id: string) => void;
  selectionMode: boolean;
}

function DraggableProductRow({ product, gradientIndex, onDelete, onToggleVisibility, isSelected, onToggleSelect, selectionMode }: DraggableProductRowProps) {
  const dragControls = useDragControls();
  const gradient = PLACEHOLDER_GRADIENTS[gradientIndex % PLACEHOLDER_GRADIENTS.length];

  return (
    <Reorder.Item
      value={product}
      dragListener={false}
      dragControls={dragControls}
      className={`grid ${GRID_COLUMNS} gap-4 items-center px-6 py-4 hover:bg-muted-foreground/5 border-b border-border cursor-default transition-colors ${
        isSelected ? 'bg-primary/10' : 'bg-muted'
      } ${!product.is_public ? 'opacity-60' : ''}`}
      whileDrag={{
        scale: 1.02,
        backgroundColor: 'rgba(236, 72, 153, 0.1)',
        boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
        zIndex: 10,
      }}
    >
      <button
        onClick={() => onToggleSelect(product.id)}
        className={`p-1 -m-1 transition-colors ${
          isSelected ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        {isSelected ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
      </button>

      <div
        onPointerDown={(e) => !selectionMode && dragControls.start(e)}
        className={`p-1 -m-1 text-muted-foreground transition-colors ${
          selectionMode ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing touch-none hover:text-foreground'
        }`}
        title={selectionMode ? 'Deaktiver valg for å dra' : 'Dra for å endre rekkefølge'}
      >
        <GripVertical className="w-5 h-5" />
      </div>

      <div>
        {product.image_url ? (
          <div className="relative w-12 h-12 rounded overflow-hidden">
            <Image
              src={product.image_url}
              alt={product.title}
              fill
              className="object-cover pointer-events-none"
            />
          </div>
        ) : (
          <div className={`w-12 h-12 rounded bg-gradient-to-br ${gradient}`} />
        )}
      </div>

      <div className="min-w-0">
        <p className="font-medium truncate">{product.title}</p>
        <p className="text-sm text-muted-foreground truncate">{product.description}</p>
      </div>

      <div>
        <span className="px-2 py-1 bg-background text-xs uppercase rounded">
          {getProductTypeLabel(product.product_type)}
        </span>
      </div>

      <div className="font-medium">{formatPrice(product.price)}</div>

      <div>
        <span className={product.product_type === 'original' ? 'text-muted-foreground' : ''}>
          {product.product_type === 'original' ? '-' : product.stock_quantity}
        </span>
      </div>

      <div>
        <button
          onClick={() => onToggleVisibility(product.id, !product.is_public)}
          className={`p-1.5 rounded-lg transition-colors ${
            product.is_public
              ? 'text-success hover:bg-success/10'
              : 'text-muted-foreground hover:bg-muted-foreground/10'
          }`}
          title={product.is_public ? 'Synlig - klikk for å skjule' : 'Skjult - klikk for å vise'}
        >
          {product.is_public ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
        </button>
      </div>

      <div>
        {isProductAvailable(product) ? (
          <span className="px-2 py-1 text-xs rounded bg-success/10 text-success">
            Tilgjengelig
          </span>
        ) : (
          <span className="px-2 py-1 text-xs rounded bg-error/10 text-error">
            Solgt
          </span>
        )}
      </div>

      <div className="flex items-center justify-end gap-2">
        <Link
          href={`/admin/products/${product.id}/edit`}
          className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
          title="Rediger"
        >
          <Pencil className="w-4 h-4" />
        </Link>
        <button
          onClick={() => onDelete(product.id)}
          className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error transition-colors"
          title="Slett"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </Reorder.Item>
  );
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const originalOrderRef = useRef<string[]>([]);
  const pendingOperationsRef = useRef<Set<string>>(new Set());

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMassEditOpen, setIsMassEditOpen] = useState(false);

  const selectionMode = selectedIds.size > 0;
  const selectedProducts = products.filter(p => selectedIds.has(p.id));

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [productsRes, collectionsRes] = await Promise.all([
        adminFetch('/api/admin/products'),
        adminFetch('/api/admin/collections'),
      ]);

      const productsResult = await productsRes.json();
      const collectionsResult = await collectionsRes.json();

      if (!productsRes.ok) {
        throw new Error(productsResult.error || 'Failed to fetch products');
      }

      // Handle both paginated and non-paginated responses
      const productsData = Array.isArray(productsResult) ? productsResult : (productsResult.data || []);
      setProducts(productsData);
      setCollections(collectionsResult.data || []);
      originalOrderRef.current = productsData.map((p: Product) => p.id);
      setHasUnsavedChanges(false);
      setSelectedIds(new Set());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-clear errors after 5 seconds
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === products.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(products.map(p => p.id)));
    }
  };

  const clearSelection = () => {
    setSelectedIds(new Set());
  };

  const handleReorder = (newOrder: Product[]) => {
    setProducts(newOrder);
    // Check if order actually changed
    const newOrderIds = newOrder.map((p) => p.id);
    const hasChanged = newOrderIds.some((id, i) => id !== originalOrderRef.current[i]);
    setHasUnsavedChanges(hasChanged);
  };

  const saveOrder = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const updates = products.map((product, index) => ({
        id: product.id,
        display_order: index + 1,
      }));

      const response = await adminFetch('/api/admin/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ products: updates }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to save order');
      }

      // Update original order reference
      originalOrderRef.current = products.map((p) => p.id);
      setHasUnsavedChanges(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setIsSaving(false);
    }
  };

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

  const toggleVisibility = async (id: string, isPublic: boolean) => {
    // Prevent rapid clicks on the same item
    if (pendingOperationsRef.current.has(id)) return;
    pendingOperationsRef.current.add(id);

    // Optimistic update
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, is_public: isPublic } : p))
    );

    try {
      const response = await adminFetch(`/api/admin/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_public: isPublic }),
      });

      if (!response.ok) {
        // Revert on error
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_public: !isPublic } : p))
        );
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      // Revert on error
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_public: !isPublic } : p))
      );
    } finally {
      pendingOperationsRef.current.delete(id);
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
          {selectionMode && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3"
            >
              <span className="text-sm text-muted-foreground">
                {selectedIds.size} valgt
              </span>
              <motion.button
                onClick={() => setIsMassEditOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-accent text-background font-medium rounded-lg hover:bg-accent/90 transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Edit3 className="w-4 h-4" />
                Masseredigering
              </motion.button>
              <button
                onClick={clearSelection}
                className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Avbryt
              </button>
            </motion.div>
          )}
          {hasUnsavedChanges && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              onClick={saveOrder}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-success text-background font-medium rounded-lg hover:bg-success/90 transition-colors disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              Lagre rekkefølge
            </motion.button>
          )}
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
        <div className="bg-muted rounded-lg overflow-hidden">
          <div className={`grid ${GRID_COLUMNS} gap-4 items-center px-6 py-3 bg-muted-foreground/10 text-sm font-medium`}>
            <button
              onClick={selectAll}
              className="p-1 -m-1 text-muted-foreground hover:text-foreground transition-colors"
              title={selectedIds.size === products.length ? 'Fjern alle valg' : 'Velg alle'}
            >
              {selectedIds.size === products.length && products.length > 0 ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </button>
            <div className="w-5" />
            <div>Bilde</div>
            <div>Tittel</div>
            <div>Type</div>
            <div>Pris</div>
            <div>Lager</div>
            <div>Synlig</div>
            <div>Status</div>
            <div className="text-right">Handlinger</div>
          </div>

          <Reorder.Group
            axis="y"
            values={products}
            onReorder={handleReorder}
            className="divide-y divide-border"
          >
            {products.map((product, index) => (
              <DraggableProductRow
                key={product.id}
                product={product}
                gradientIndex={index}
                onDelete={deleteProduct}
                onToggleVisibility={toggleVisibility}
                isSelected={selectedIds.has(product.id)}
                onToggleSelect={toggleSelect}
                selectionMode={selectionMode}
              />
            ))}
          </Reorder.Group>

          <div className="px-6 py-3 bg-muted-foreground/5 text-xs text-muted-foreground">
            {selectionMode
              ? `${selectedIds.size} produkt${selectedIds.size === 1 ? '' : 'er'} valgt - klikk "Masseredigering" for å endre`
              : 'Dra produktene for å endre rekkefølge i butikken'}
          </div>
        </div>
      )}

      <MassEditModal
        isOpen={isMassEditOpen}
        onClose={() => setIsMassEditOpen(false)}
        selectedProducts={selectedProducts}
        collections={collections}
        onSuccess={fetchProducts}
      />
    </div>
  );
}
