'use client';

import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import type { DiscountCode } from '@/types';
import { adminFetch } from '@/lib/admin-fetch';

export default function AdminDiscountsPage() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'percent' as 'percent' | 'amount',
    discountValue: '',
    usesRemaining: '',
    expiresAt: '',
  });

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/admin/discounts');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDiscounts(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  const openNewModal = () => {
    setEditingDiscount(null);
    setFormData({
      code: '',
      discountType: 'percent',
      discountValue: '',
      usesRemaining: '',
      expiresAt: '',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (discount: DiscountCode) => {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      discountType: discount.discount_percent ? 'percent' : 'amount',
      discountValue: discount.discount_percent?.toString() || (discount.discount_amount ? (discount.discount_amount / 100).toString() : ''),
      usesRemaining: discount.uses_remaining?.toString() || '',
      expiresAt: discount.expires_at ? discount.expires_at.split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.code || !formData.discountValue) return;
    setIsSaving(true);

    try {
      const discountData = {
        code: formData.code.toUpperCase(),
        discount_percent: formData.discountType === 'percent' ? parseInt(formData.discountValue) : null,
        discount_amount: formData.discountType === 'amount' ? parseInt(formData.discountValue) * 100 : null,
        is_active: editingDiscount?.is_active ?? true,
        uses_remaining: formData.usesRemaining ? parseInt(formData.usesRemaining) : null,
        expires_at: formData.expiresAt ? `${formData.expiresAt}T23:59:59Z` : null,
      };

      const url = editingDiscount
        ? `/api/admin/discounts/${editingDiscount.id}`
        : '/api/admin/discounts';

      const response = await adminFetch(url, {
        method: editingDiscount ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(discountData),
      });

      if (!response.ok) throw new Error('Failed to save');

      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleActive = async (id: string, currentValue: boolean) => {
    try {
      const response = await adminFetch(`/api/admin/discounts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !currentValue }),
      });
      if (response.ok) {
        setDiscounts((prev) =>
          prev.map((d) => (d.id === id ? { ...d, is_active: !currentValue } : d))
        );
      }
    } catch (err) {
      console.error('Failed to toggle active:', err);
    }
  };

  const deleteDiscount = async (id: string) => {
    if (!confirm('Er du sikker på at du vil slette denne rabattkoden?')) return;

    try {
      const response = await adminFetch(`/api/admin/discounts/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete');
      setDiscounts((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete');
    }
  };

  const copyCode = (id: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatDiscount = (discount: DiscountCode) => {
    if (discount.discount_percent) return `${discount.discount_percent}%`;
    if (discount.discount_amount) return `${(discount.discount_amount / 100).toLocaleString('no-NO')} kr`;
    return '—';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Ingen';
    return new Date(dateString).toLocaleDateString('no-NO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
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
          <h1 className="text-3xl font-bold">Rabattkoder</h1>
          <p className="text-muted-foreground mt-1">Opprett og administrer rabattkoder</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={fetchDiscounts} className="p-2 hover:bg-muted rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
          <motion.button
            onClick={openNewModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5" />
            Ny rabattkode
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      {discounts.length === 0 && !error ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Ingen rabattkoder ennå.</p>
          <motion.button
            onClick={openNewModal}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-background font-medium rounded-lg"
            whileHover={{ scale: 1.02 }}
          >
            <Plus className="w-5 h-5" />
            Opprett din første rabattkode
          </motion.button>
        </div>
      ) : (
        <div className="bg-muted rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-muted-foreground/10">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-medium">Kode</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Rabatt</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Bruk igjen</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Utløper</th>
                <th className="text-left px-6 py-3 text-sm font-medium">Status</th>
                <th className="text-right px-6 py-3 text-sm font-medium">Handlinger</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {discounts.map((discount, index) => (
                <motion.tr
                  key={discount.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className="hover:bg-muted-foreground/5"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-background font-mono text-sm rounded">
                        {discount.code}
                      </code>
                      <button
                        onClick={() => copyCode(discount.id, discount.code)}
                        className="p-1 rounded hover:bg-muted-foreground/10 text-muted-foreground"
                      >
                        {copiedId === discount.id ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium">{formatDiscount(discount)}</td>
                  <td className="px-6 py-4">
                    {discount.uses_remaining === null ? (
                      <span className="text-muted-foreground">Ubegrenset</span>
                    ) : (
                      <span>{discount.uses_remaining}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{formatDate(discount.expires_at)}</td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => toggleActive(discount.id, discount.is_active)}
                      className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${
                        discount.is_active
                          ? 'bg-success/10 text-success hover:bg-success/20'
                          : 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20'
                      }`}
                    >
                      {discount.is_active ? 'Aktiv' : 'Inaktiv'}
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(discount)}
                        className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteDiscount(discount.id)}
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
              {editingDiscount ? 'Rediger rabattkode' : 'Ny rabattkode'}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kode</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg font-mono"
                  placeholder="SOMMER2026"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Rabatttype</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'percent' })}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      formData.discountType === 'percent'
                        ? 'bg-primary text-background border-primary'
                        : 'border-border hover:bg-muted-foreground/10'
                    }`}
                  >
                    Prosent (%)
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, discountType: 'amount' })}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      formData.discountType === 'amount'
                        ? 'bg-primary text-background border-primary'
                        : 'border-border hover:bg-muted-foreground/10'
                    }`}
                  >
                    Fast beløp (kr)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  {formData.discountType === 'percent' ? 'Prosent rabatt' : 'Beløp (kr)'}
                </label>
                <input
                  type="number"
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  placeholder={formData.discountType === 'percent' ? '15' : '500'}
                  min="1"
                  max={formData.discountType === 'percent' ? '100' : undefined}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Antall bruk (valgfritt)</label>
                <input
                  type="number"
                  value={formData.usesRemaining}
                  onChange={(e) => setFormData({ ...formData, usesRemaining: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                  placeholder="Ubegrenset"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Utløpsdato (valgfritt)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg"
                />
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
                {isSaving ? 'Lagrer...' : editingDiscount ? 'Lagre' : 'Opprett'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
