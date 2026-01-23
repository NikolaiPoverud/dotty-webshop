'use client';

import { motion } from 'framer-motion';
import { Check, Copy, Loader2, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { adminFetch, adminFetchJson } from '@/lib/admin-fetch';
import type { DiscountCode } from '@/types';

interface FormData {
  code: string;
  discountType: 'percent' | 'amount';
  discountValue: string;
  usesRemaining: string;
  expiresAt: string;
}

const INITIAL_FORM_DATA: FormData = {
  code: '',
  discountType: 'percent',
  discountValue: '',
  usesRemaining: '',
  expiresAt: '',
};

function getDiscountValueFromDiscount(discount: DiscountCode): string {
  if (discount.discount_percent) {
    return discount.discount_percent.toString();
  }
  if (discount.discount_amount) {
    return (discount.discount_amount / 100).toString();
  }
  return '';
}

function formatDiscount(discount: DiscountCode): string {
  if (discount.discount_percent) {
    return `${discount.discount_percent}%`;
  }
  if (discount.discount_amount) {
    return `${(discount.discount_amount / 100).toLocaleString('no-NO')} kr`;
  }
  return '—';
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Ingen';
  return new Date(dateString).toLocaleDateString('no-NO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export default function AdminDiscountsPage(): React.ReactElement {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM_DATA);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const result = await adminFetchJson<DiscountCode[]>('/api/admin/discounts');
    if (result.error) {
      setError(result.error);
    } else {
      setDiscounts(result.data || []);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    fetchDiscounts();
  }, [fetchDiscounts]);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error]);

  function updateFormField<K extends keyof FormData>(field: K, value: FormData[K]): void {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function openNewModal(): void {
    setEditingDiscount(null);
    setFormData(INITIAL_FORM_DATA);
    setIsModalOpen(true);
  }

  function openEditModal(discount: DiscountCode): void {
    setEditingDiscount(discount);
    setFormData({
      code: discount.code,
      discountType: discount.discount_percent ? 'percent' : 'amount',
      discountValue: getDiscountValueFromDiscount(discount),
      usesRemaining: discount.uses_remaining?.toString() || '',
      expiresAt: discount.expires_at ? discount.expires_at.split('T')[0] : '',
    });
    setIsModalOpen(true);
  }

  async function handleSave(): Promise<void> {
    if (!formData.code || !formData.discountValue) return;
    setIsSaving(true);

    const isPercent = formData.discountType === 'percent';
    const discountData = {
      code: formData.code.toUpperCase(),
      discount_percent: isPercent ? parseInt(formData.discountValue) : null,
      discount_amount: isPercent ? null : parseInt(formData.discountValue) * 100,
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

    setIsSaving(false);
    if (!response.ok) {
      setError('Failed to save');
      return;
    }

    setIsModalOpen(false);
    fetchDiscounts();
  }

  async function toggleActive(id: string, currentValue: boolean): Promise<void> {
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
  }

  async function deleteDiscount(id: string): Promise<void> {
    if (!confirm('Er du sikker på at du vil slette denne rabattkoden?')) return;

    const response = await adminFetch(`/api/admin/discounts/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Failed to delete');
      return;
    }
    setDiscounts((prev) => prev.filter((d) => d.id !== id));
  }

  function copyCode(id: string, code: string): void {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const hasDiscounts = discounts.length > 0;

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

      {!hasDiscounts && !error ? (
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
              {discounts.map((discount) => (
                <DiscountRow
                  key={discount.id}
                  discount={discount}
                  copiedId={copiedId}
                  onCopy={copyCode}
                  onEdit={openEditModal}
                  onDelete={deleteDiscount}
                  onToggleActive={toggleActive}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <DiscountModal
          editingDiscount={editingDiscount}
          formData={formData}
          isSaving={isSaving}
          onUpdateField={updateFormField}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}

interface DiscountRowProps {
  discount: DiscountCode;
  copiedId: string | null;
  onCopy: (id: string, code: string) => void;
  onEdit: (discount: DiscountCode) => void;
  onDelete: (id: string) => Promise<void>;
  onToggleActive: (id: string, currentValue: boolean) => Promise<void>;
}

function DiscountRow({
  discount,
  copiedId,
  onCopy,
  onEdit,
  onDelete,
  onToggleActive,
}: DiscountRowProps): React.ReactElement {
  const statusClasses = discount.is_active
    ? 'bg-success/10 text-success hover:bg-success/20'
    : 'bg-muted-foreground/10 text-muted-foreground hover:bg-muted-foreground/20';

  return (
    <tr className="hover:bg-muted-foreground/5">
      <td className="px-6 py-4">
        <div className="flex items-center gap-2">
          <code className="px-2 py-1 bg-background font-mono text-sm rounded">
            {discount.code}
          </code>
          <button
            onClick={() => onCopy(discount.id, discount.code)}
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
          onClick={() => onToggleActive(discount.id, discount.is_active)}
          className={`px-2 py-1 text-xs rounded cursor-pointer transition-colors ${statusClasses}`}
        >
          {discount.is_active ? 'Aktiv' : 'Inaktiv'}
        </button>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => onEdit(discount)}
            className="p-2 rounded-lg hover:bg-muted-foreground/10 text-muted-foreground"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(discount.id)}
            className="p-2 rounded-lg hover:bg-error/10 text-muted-foreground hover:text-error"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
}

interface DiscountModalProps {
  editingDiscount: DiscountCode | null;
  formData: FormData;
  isSaving: boolean;
  onUpdateField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  onSave: () => Promise<void>;
  onClose: () => void;
}

function DiscountModal({
  editingDiscount,
  formData,
  isSaving,
  onUpdateField,
  onSave,
  onClose,
}: DiscountModalProps): React.ReactElement {
  const isEditing = editingDiscount !== null;
  const isPercent = formData.discountType === 'percent';

  function getTypeButtonClasses(isSelected: boolean): string {
    if (isSelected) {
      return 'bg-primary text-background border-primary';
    }
    return 'border-border hover:bg-muted-foreground/10';
  }

  function getSaveButtonLabel(): string {
    if (isSaving) return 'Lagrer...';
    if (isEditing) return 'Lagre';
    return 'Opprett';
  }

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-muted border border-border rounded-xl p-6 w-full max-w-md"
      >
        <h2 className="text-xl font-bold mb-4">
          {isEditing ? 'Rediger rabattkode' : 'Ny rabattkode'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Kode</label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => onUpdateField('code', e.target.value.toUpperCase())}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg font-mono"
              placeholder="SOMMER2026"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Rabatttype</label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onUpdateField('discountType', 'percent')}
                className={`flex-1 px-3 py-2 rounded-lg border ${getTypeButtonClasses(isPercent)}`}
              >
                Prosent (%)
              </button>
              <button
                type="button"
                onClick={() => onUpdateField('discountType', 'amount')}
                className={`flex-1 px-3 py-2 rounded-lg border ${getTypeButtonClasses(!isPercent)}`}
              >
                Fast beløp (kr)
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {isPercent ? 'Prosent rabatt' : 'Beløp (kr)'}
            </label>
            <input
              type="number"
              value={formData.discountValue}
              onChange={(e) => onUpdateField('discountValue', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
              placeholder={isPercent ? '15' : '500'}
              min="1"
              max={isPercent ? '100' : undefined}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Antall bruk (valgfritt)</label>
            <input
              type="number"
              value={formData.usesRemaining}
              onChange={(e) => onUpdateField('usesRemaining', e.target.value)}
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
              onChange={(e) => onUpdateField('expiresAt', e.target.value)}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-border rounded-lg hover:bg-muted-foreground/10"
          >
            Avbryt
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-primary text-background font-medium rounded-lg disabled:opacity-50"
          >
            {getSaveButtonLabel()}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
