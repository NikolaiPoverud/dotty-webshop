'use client';

import { motion } from 'framer-motion';
import {
  Eye,
  EyeOff,
  Facebook,
  GripVertical,
  Loader2,
  MessageCircle,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { SiInstagram, SiTiktok } from '@icons-pack/react-simple-icons';
import type { ReactNode } from 'react';
import { useCallback, useEffect, useState } from 'react';

import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import type { Testimonial } from '@/types';

const SOURCE_OPTIONS = ['Instagram', 'TikTok', 'Facebook', 'Google', 'Email', 'Other'] as const;

const SOURCE_ICONS: Record<string, ReactNode> = {
  Instagram: <SiInstagram className="w-4 h-4" />,
  TikTok: <SiTiktok className="w-4 h-4" />,
  Facebook: <Facebook className="w-4 h-4" />,
};

const INPUT_CLASS =
  'w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

function getSourceIcon(source: string): ReactNode {
  return SOURCE_ICONS[source] ?? <MessageCircle className="w-4 h-4" />;
}

function getSaveButtonText(isSaving: boolean, isEditing: boolean): string {
  if (isSaving) return 'Lagrer...';
  if (isEditing) return 'Lagre';
  return 'Opprett';
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<Testimonial | null>(null);
  const [formData, setFormData] = useState({
    feedback: '',
    name: '',
    source: 'Instagram',
    is_active: true,
  });

  const fetchTestimonials = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await adminFetchJson<Testimonial[]>('/api/admin/testimonials');
    if (result.error) {
      setError(result.error);
    } else {
      setTestimonials(result.data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  function openNewModal(): void {
    setEditingTestimonial(null);
    setFormData({ feedback: '', name: '', source: 'Instagram', is_active: true });
    setIsModalOpen(true);
  }

  function openEditModal(testimonial: Testimonial): void {
    setEditingTestimonial(testimonial);
    setFormData({
      feedback: testimonial.feedback,
      name: testimonial.name,
      source: testimonial.source,
      is_active: testimonial.is_active,
    });
    setIsModalOpen(true);
  }

  async function handleSave(): Promise<void> {
    if (!formData.feedback || !formData.name) return;
    setIsSaving(true);

    const url = editingTestimonial
      ? `/api/admin/testimonials/${editingTestimonial.id}`
      : '/api/admin/testimonials';

    const response = await adminFetch(url, {
      method: editingTestimonial ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    setIsSaving(false);
    if (!response.ok) {
      setError('Failed to save');
      return;
    }

    setIsModalOpen(false);
    fetchTestimonials();
  }

  async function deleteTestimonial(id: string): Promise<void> {
    if (!confirm('Er du sikker på at du vil slette denne tilbakemeldingen?')) return;

    const response = await adminFetch(`/api/admin/testimonials/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Failed to delete');
      return;
    }
    setTestimonials((prev) => prev.filter((t) => t.id !== id));
  }

  async function toggleActive(testimonial: Testimonial): Promise<void> {
    const response = await adminFetch(`/api/admin/testimonials/${testimonial.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !testimonial.is_active }),
    });
    if (!response.ok) {
      setError('Failed to update');
      return;
    }
    setTestimonials((prev) =>
      prev.map((t) => (t.id === testimonial.id ? { ...t, is_active: !t.is_active } : t))
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasTestimonials = testimonials.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tilbakemeldinger</h1>
          <p className="text-muted-foreground mt-1">Vis kundetilbakemeldinger på forsiden</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchTestimonials} className="p-2 hover:bg-muted rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          <motion.button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Ny tilbakemelding
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">{error}</div>
      )}

      {!hasTestimonials && !error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ingen tilbakemeldinger ennå.</p>
          <motion.button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <Plus className="w-5 h-5" />
            Legg til din første tilbakemelding
          </motion.button>
        </div>
      ) : (
        <div className="grid gap-4">
          {testimonials.map((testimonial) => {
            const isActive = testimonial.is_active;
            return (
              <div
                key={testimonial.id}
                className={`bg-muted rounded-lg p-4 ${isActive ? '' : 'opacity-50'}`}
              >
                <div className="flex items-start gap-4">
                  <div className="cursor-grab">
                    <GripVertical className="w-5 h-5 text-muted-foreground" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-foreground mb-2 line-clamp-2">
                      &ldquo;{testimonial.feedback}&rdquo;
                    </p>

                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-medium">{testimonial.name}</span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        {getSourceIcon(testimonial.source)}
                        {testimonial.source}
                      </span>
                      {!isActive && (
                        <span className="px-2 py-0.5 bg-warning/20 text-warning text-xs rounded">
                          Skjult
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleActive(testimonial)}
                      className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
                      title={isActive ? 'Skjul' : 'Vis'}
                    >
                      {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => openEditModal(testimonial)}
                      className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteTestimonial(testimonial.id)}
                      className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-muted border border-border rounded-xl p-6 w-full max-w-lg"
          >
            <h2 className="text-xl font-bold mb-4">
              {editingTestimonial ? 'Rediger tilbakemelding' : 'Ny tilbakemelding'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tilbakemelding *</label>
                <textarea
                  value={formData.feedback}
                  onChange={(e) => setFormData({ ...formData, feedback: e.target.value })}
                  className={`${INPUT_CLASS} resize-none`}
                  rows={4}
                  placeholder="Helt nydelig bilde, tusen takk!"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Navn *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={INPUT_CLASS}
                    placeholder="Tuva"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Kilde</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className={INPUT_CLASS}
                  >
                    {SOURCE_OPTIONS.map((source) => (
                      <option key={source} value={source}>
                        {source}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm">
                  Vis på forsiden
                </label>
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
                disabled={isSaving || !formData.feedback || !formData.name}
                className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-lg disabled:opacity-50"
              >
                {getSaveButtonText(isSaving, !!editingTestimonial)}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
