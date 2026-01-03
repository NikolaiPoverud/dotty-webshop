'use client';

import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, RefreshCw, Truck } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { Collection } from '@/types';
import { formatPrice } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-fetch';

// Shipping cost options in øre
const SHIPPING_OPTIONS = [
  { value: 0, label: 'Gratis frakt' },
  { value: 9900, label: '99 kr - Små verk' },
  { value: 14900, label: '149 kr - Mellomstore verk' },
  { value: 19900, label: '199 kr - Store verk' },
  { value: 29900, label: '299 kr - Ekstra store verk' },
];

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '', shipping_cost: 0 });

  const fetchCollections = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/admin/collections');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setCollections(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCollections();
  }, [fetchCollections]);

  const openNewModal = () => {
    setEditingCollection(null);
    setFormData({ name: '', slug: '', description: '', shipping_cost: 0 });
    setIsModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
      shipping_cost: collection.shipping_cost || 0,
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.slug) return;
    setIsSaving(true);

    try {
      const url = editingCollection
        ? `/api/admin/collections/${editingCollection.id}`
        : '/api/admin/collections';

      const response = await adminFetch(url, {
        method: editingCollection ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description || null,
          shipping_cost: formData.shipping_cost,
          display_order: editingCollection?.display_order || collections.length + 1,
        }),
      });

      if (!response.ok) throw new Error('Failed to save');

      setIsModalOpen(false);
      fetchCollections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCollection = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne samlingen?')) return;

    try {
      const response = await adminFetch(`/api/admin/collections/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      setCollections((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[æ]/g, 'ae')
      .replace(/[ø]/g, 'o')
      .replace(/[å]/g, 'a')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  };

  const moveCollection = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= collections.length) return;

    // Swap in local state first for instant feedback
    const newCollections = [...collections];
    [newCollections[index], newCollections[newIndex]] = [newCollections[newIndex], newCollections[index]];
    setCollections(newCollections);

    // Update display_order for both collections
    try {
      const updates = [
        { id: newCollections[index].id, display_order: index + 1 },
        { id: newCollections[newIndex].id, display_order: newIndex + 1 },
      ];

      await Promise.all(
        updates.map((update) =>
          adminFetch(`/api/admin/collections/${update.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ display_order: update.display_order }),
          })
        )
      );
    } catch (err) {
      // Revert on error
      setError('Kunne ikke endre rekkefølge');
      fetchCollections();
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
          <h1 className="text-3xl font-bold">Samlinger</h1>
          <p className="text-muted-foreground mt-1">Organiser kunstverk i samlinger</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchCollections} className="p-2 hover:bg-muted rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          <motion.button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Ny samling
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      {collections.length === 0 && !error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ingen samlinger ennå.</p>
          <motion.button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <Plus className="w-5 h-5" />
            Opprett din første samling
          </motion.button>
        </div>
      ) : (
        <div className="bg-muted rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted-foreground/10">
              <tr>
                <th className="w-16 px-4 py-3 text-left text-sm font-medium">Rekkef.</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Navn</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Slug</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Frakt</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Beskrivelse</th>
                <th className="text-right px-6 py-3 text-sm font-medium">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {collections.map((collection, index) => (
                <motion.tr
                  key={collection.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted-foreground/5"
                >
                  <td className="px-4 py-4">
                    <div className="flex flex-col gap-0.5">
                      <button
                        onClick={() => moveCollection(index, 'up')}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-muted-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Flytt opp"
                      >
                        <ChevronUp className="w-4 h-4 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => moveCollection(index, 'down')}
                        disabled={index === collections.length - 1}
                        className="p-1 rounded hover:bg-muted-foreground/10 disabled:opacity-30 disabled:cursor-not-allowed"
                        title="Flytt ned"
                      >
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{collection.name}</td>
                  <td className="px-6 py-4">
                    <code className="px-2 py-1 bg-background text-sm rounded">
                      {collection.slug}
                    </code>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span className={collection.shipping_cost === 0 ? 'text-green-500' : ''}>
                        {collection.shipping_cost === 0 ? 'Gratis' : formatPrice(collection.shipping_cost)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">
                    {collection.description || '—'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(collection)}
                        className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteCollection(collection.id)}
                        className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error"
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
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-muted border border-border rounded-xl p-6 w-full max-w-md"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingCollection ? 'Rediger samling' : 'Ny samling'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Navn</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    setFormData({
                      ...formData,
                      name,
                      slug: editingCollection ? formData.slug : generateSlug(name),
                    });
                  }}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Neon Series"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="neon-series"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Beskrivelse</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                  placeholder="Lysfylte verk som fanger byens energi"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Fraktkostnad</label>
                <select
                  value={formData.shipping_cost}
                  onChange={(e) => setFormData({ ...formData, shipping_cost: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {SHIPPING_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground mt-1">
                  Fraktkostnaden vises på produktsidene for denne samlingen
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted-foreground/10"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-lg disabled:opacity-50"
              >
                {isSaving ? 'Lagrer...' : editingCollection ? 'Lagre' : 'Opprett'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
