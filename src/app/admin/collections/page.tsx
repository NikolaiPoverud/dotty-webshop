'use client';

import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
import { useState } from 'react';
import type { Collection } from '@/types';

const initialCollections: Collection[] = [
  {
    id: '1',
    name: 'Neon Series',
    slug: 'neon-series',
    description: 'Lysfylte verk som fanger byens energi',
    display_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Portraits',
    slug: 'portraits',
    description: 'Pop-art portretter med personlighet',
    display_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Abstract',
    slug: 'abstract',
    description: 'Abstrakte uttrykk i sterke farger',
    display_order: 3,
    created_at: new Date().toISOString(),
  },
];

export default function AdminCollectionsPage() {
  const [collections, setCollections] = useState(initialCollections);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);
  const [formData, setFormData] = useState({ name: '', slug: '', description: '' });

  const openNewModal = () => {
    setEditingCollection(null);
    setFormData({ name: '', slug: '', description: '' });
    setIsModalOpen(true);
  };

  const openEditModal = (collection: Collection) => {
    setEditingCollection(collection);
    setFormData({
      name: collection.name,
      slug: collection.slug,
      description: collection.description || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || !formData.slug) return;

    if (editingCollection) {
      setCollections((prev) =>
        prev.map((c) =>
          c.id === editingCollection.id
            ? { ...c, ...formData }
            : c
        )
      );
    } else {
      const newCollection: Collection = {
        id: Date.now().toString(),
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        display_order: collections.length + 1,
        created_at: new Date().toISOString(),
      };
      setCollections((prev) => [...prev, newCollection]);
    }
    setIsModalOpen(false);
  };

  const deleteCollection = (id: string) => {
    if (confirm('Er du sikker på at du vil slette denne samlingen?')) {
      setCollections((prev) => prev.filter((c) => c.id !== id));
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Samlinger</h1>
          <p className="text-muted-foreground mt-1">
            Organiser kunstverk i samlinger
          </p>
        </div>
        <motion.button
          onClick={openNewModal}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Plus className="w-5 h-5" />
          Ny samling
        </motion.button>
      </div>

      {/* Collections List */}
      <div className="bg-muted rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-muted-foreground/10">
            <tr>
              <th className="w-12 px-4 py-3"></th>
              <th className="text-left px-6 py-3 text-sm font-medium">Navn</th>
              <th className="text-left px-6 py-3 text-sm font-medium">Slug</th>
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
                  <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
                </td>
                <td className="px-6 py-4 font-medium">{collection.name}</td>
                <td className="px-6 py-4">
                  <code className="px-2 py-1 bg-background text-sm rounded">
                    {collection.slug}
                  </code>
                </td>
                <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">
                  {collection.description || '—'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => openEditModal(collection)}
                      className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground transition-colors"
                      title="Rediger"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.id)}
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

      {/* Modal */}
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
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setIsModalOpen(false)}
                className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted-foreground/10 transition-colors"
              >
                Avbryt
              </button>
              <button
                onClick={handleSave}
                className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
              >
                {editingCollection ? 'Lagre' : 'Opprett'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
