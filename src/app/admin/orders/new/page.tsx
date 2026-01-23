'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import type { Product, OrderItem, OrderStatus, PaymentProvider, ShippingAddress } from '@/types';
import { formatPrice } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-fetch';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

const INPUT_CLASS =
  'w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

const SELECT_CLASS =
  'w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary';

export default function NewOrderPage(): React.JSX.Element {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [customer, setCustomer] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
  });

  const [address, setAddress] = useState<ShippingAddress>({
    line1: '',
    line2: '',
    city: '',
    postal_code: '',
    country: 'Norge',
  });

  const [items, setItems] = useState<OrderItem[]>([]);
  const [status, setStatus] = useState<OrderStatus>('pending');
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);

  useEffect(() => {
    async function fetchProducts(): Promise<void> {
      const response = await adminFetch('/api/admin/products');
      if (response.ok) {
        const result = await response.json();
        setProducts(result.data || []);
      }
    }
    fetchProducts();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [items]
  );

  const total = useMemo(() => subtotal - discountAmount, [subtotal, discountAmount]);

  function updateCustomer<K extends keyof CustomerInfo>(field: K, value: CustomerInfo[K]): void {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  }

  function updateAddress<K extends keyof ShippingAddress>(field: K, value: ShippingAddress[K]): void {
    setAddress((prev) => ({ ...prev, [field]: value }));
  }

  function addItem(): void {
    if (products.length === 0) return;

    const firstProduct = products[0];
    setItems([
      ...items,
      {
        product_id: firstProduct.id,
        title: firstProduct.title,
        price: firstProduct.price,
        quantity: 1,
        image_url: firstProduct.image_url,
      },
    ]);
  }

  function removeItem(index: number): void {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, field: keyof OrderItem, value: string | number): void {
    const newItems = [...items];

    if (field === 'product_id') {
      const product = products.find((p) => p.id === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          product_id: product.id,
          title: product.title,
          price: product.price,
          image_url: product.image_url,
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }

    setItems(newItems);
  }

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();

    if (items.length === 0) {
      setError('Legg til minst ett produkt');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await adminFetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          shipping_address: {
            line1: address.line1,
            line2: address.line2 || undefined,
            city: address.city,
            postal_code: address.postal_code,
            country: address.country,
          },
          items,
          discount_amount: discountAmount,
          payment_provider: paymentProvider,
          status,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create order');
      }

      router.push('/admin/orders');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setIsLoading(false);
    }
  }

  function handlePaymentProviderChange(value: string): void {
    setPaymentProvider(value ? (value as PaymentProvider) : null);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/orders" className="p-2 hover:bg-muted rounded-lg transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Ny ordre</h1>
          <p className="text-muted-foreground mt-1">Opprett en manuell ordre</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Kundeinformasjon</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Navn *</label>
              <input
                type="text"
                value={customer.name}
                onChange={(e) => updateCustomer('name', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">E-post *</label>
              <input
                type="email"
                value={customer.email}
                onChange={(e) => updateCustomer('email', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Telefon *</label>
            <input
              type="tel"
              value={customer.phone}
              onChange={(e) => updateCustomer('phone', e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Leveringsadresse</h2>

          <div>
            <label className="block text-sm font-medium mb-2">Adresse 1 *</label>
            <input
              type="text"
              value={address.line1}
              onChange={(e) => updateAddress('line1', e.target.value)}
              className={INPUT_CLASS}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Adresse 2</label>
            <input
              type="text"
              value={address.line2}
              onChange={(e) => updateAddress('line2', e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">By *</label>
              <input
                type="text"
                value={address.city}
                onChange={(e) => updateAddress('city', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Postnummer *</label>
              <input
                type="text"
                value={address.postal_code}
                onChange={(e) => updateAddress('postal_code', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Land *</label>
              <input
                type="text"
                value={address.country}
                onChange={(e) => updateAddress('country', e.target.value)}
                className={INPUT_CLASS}
                required
              />
            </div>
          </div>
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Produkter</h2>
            <button
              type="button"
              onClick={addItem}
              disabled={products.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
              Legg til produkt
            </button>
          </div>

          {items.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Ingen produkter lagt til ennå</p>
          ) : (
            <div className="space-y-3">
              {items.map((item, index) => (
                <div key={index} className="flex items-center gap-3 bg-background p-4 rounded-lg">
                  <select
                    value={item.product_id}
                    onChange={(e) => updateItem(index, 'product_id', e.target.value)}
                    className="flex-1 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.title} - {formatPrice(product.price)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value))}
                    className="w-20 px-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />

                  <span className="w-32 text-right font-medium">
                    {formatPrice(item.price * item.quantity)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="p-2 text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold">Betaling og status</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Status *</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as OrderStatus)}
                className={SELECT_CLASS}
              >
                <option value="pending">Venter</option>
                <option value="paid">Betalt</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Betalingsmetode</label>
              <select
                value={paymentProvider || ''}
                onChange={(e) => handlePaymentProviderChange(e.target.value)}
                className={SELECT_CLASS}
              >
                <option value="">Ingen</option>
                <option value="stripe">Stripe</option>
                <option value="vipps">Vipps</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Rabatt (øre)</label>
            <input
              type="number"
              min="0"
              value={discountAmount}
              onChange={(e) => setDiscountAmount(parseInt(e.target.value) || 0)}
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <div className="bg-muted rounded-lg p-6 space-y-3">
          <h2 className="text-xl font-semibold mb-4">Sammendrag</h2>

          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Delsum</span>
            <span>{formatPrice(subtotal)}</span>
          </div>

          {discountAmount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Rabatt</span>
              <span className="text-error">-{formatPrice(discountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold pt-3 border-t border-border">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="button"
            disabled={isLoading || items.length === 0}
            onClick={handleSubmit}
            className="flex-1 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Oppretter...
              </>
            ) : (
              'Opprett ordre'
            )}
          </button>

          <Link
            href="/admin/orders"
            className="flex-none px-8 py-3 bg-muted hover:bg-muted-foreground/10 rounded-lg transition-colors"
          >
            Avbryt
          </Link>
        </div>
      </form>
    </div>
  );
}
