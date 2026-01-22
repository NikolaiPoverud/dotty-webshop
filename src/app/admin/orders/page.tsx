'use client';

import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, Search, Loader2, RefreshCw, Plus, XCircle } from 'lucide-react';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Order } from '@/types';
import { formatPrice } from '@/lib/utils';
import { adminFetch } from '@/lib/admin-fetch';
import { SHIPPING_CARRIERS } from '@/emails/utils';

type OrderStatus = NonNullable<Order['status']>;

interface StatusInfo {
  label: string;
  color: string;
  icon: typeof Clock;
}

const STATUS_CONFIG: Record<OrderStatus, StatusInfo> = {
  pending: { label: 'Venter', color: 'bg-warning/10 text-warning', icon: Clock },
  paid: { label: 'Betalt', color: 'bg-success/10 text-success', icon: CheckCircle },
  shipped: { label: 'Sendt', color: 'bg-accent/10 text-accent', icon: Truck },
  delivered: { label: 'Levert', color: 'bg-muted-foreground/10 text-muted-foreground', icon: Package },
  cancelled: { label: 'Kansellert', color: 'bg-error/10 text-error', icon: XCircle },
};

const FILTER_STATUSES: Array<'all' | OrderStatus> = ['all', 'pending', 'paid', 'shipped', 'delivered'];

function formatRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.round(diffMs / (60 * 60 * 1000));
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (minutes < 60) {
    return `${minutes} min siden`;
  }
  if (hours < 24) {
    return `${hours} timer siden`;
  }
  return `${days} dager siden`;
}

export default function AdminOrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | OrderStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState({ carrier: '', number: '' });
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

  useEffect(() => {
    if (highlightId && !isLoading) {
      const timer = setTimeout(() => {
        document.getElementById(`order-${highlightId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [highlightId, isLoading]);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/admin/orders');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setOrders(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filteredOrders = orders.filter((order) => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (!search) return true;

    const searchLower = search.toLowerCase();
    return (
      order.customer_name?.toLowerCase().includes(searchLower) ||
      order.customer_email?.toLowerCase().includes(searchLower) ||
      order.order_number?.toLowerCase().includes(searchLower)
    );
  });

  async function handleShip(orderId: string): Promise<void> {
    if (!trackingInput.carrier || !trackingInput.number) {
      alert('Vennligst fyll inn transportør og sporingsnummer');
      return;
    }

    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'shipped',
          tracking_carrier: trackingInput.carrier,
          tracking_number: trackingInput.number,
        }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      setOrders((prev) =>
        prev.map((o) =>
          o.id === orderId
            ? { ...o, status: 'shipped' as const, tracking_carrier: trackingInput.carrier, tracking_number: trackingInput.number }
            : o
        )
      );
      setSelectedOrder(null);
      setTrackingInput({ carrier: '', number: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleDelivered(orderId: string): Promise<void> {
    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'delivered' }),
      });

      if (!response.ok) throw new Error('Failed to update order');

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'delivered' as const } : o))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  }

  async function handleCancel(orderId: string): Promise<void> {
    if (!confirm('Er du sikker på at du vil kansellere denne ordren?')) return;

    try {
      const response = await adminFetch(`/api/admin/orders/${orderId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'cancelled' }),
      });

      if (!response.ok) throw new Error('Failed to cancel order');

      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: 'cancelled' as const } : o))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel');
    }
  }

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
          <h1 className="text-3xl font-bold">Ordre</h1>
          <p className="text-muted-foreground mt-1">Administrer kundeordrer</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin/orders/new">
            <button className="flex items-center gap-2 px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors">
              <Plus className="w-5 h-5" />
              Ny ordre
            </button>
          </Link>
          <button onClick={fetchOrders} className="p-2 hover:bg-muted rounded-lg">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Søk etter ordre, kunde..."
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          {FILTER_STATUSES.map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === status ? 'bg-primary text-background' : 'bg-muted hover:bg-muted-foreground/10'
              }`}
            >
              {status === 'all' ? 'Alle' : STATUS_CONFIG[status].label}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {orders.length === 0 ? 'Ingen ordrer ennå.' : 'Ingen ordrer matcher søket.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const status = order.status!;
            const statusInfo = STATUS_CONFIG[status];
            const StatusIcon = statusInfo.icon;
            const isHighlighted = order.id === highlightId;

            return (
              <div
                key={order.id}
                id={`order-${order.id}`}
                className={`bg-muted rounded-lg p-6 ${
                  isHighlighted ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(254,32,106,0.3)]' : ''
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.color}`}>
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold font-mono text-primary">{order.order_number}</p>
                        <span className={`px-2 py-0.5 text-xs rounded ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                        {order.payment_provider && (
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            order.payment_provider === 'vipps'
                              ? 'bg-[#ff5b24]/10 text-[#ff5b24]'
                              : 'bg-[#635bff]/10 text-[#635bff]'
                          }`}>
                            {order.payment_provider === 'vipps' ? 'Vipps' : 'Kort'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name} · {formatRelativeDate(order.created_at!)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold">{formatPrice(order.total!)}</p>

                    {status === 'paid' && (
                      <button
                        onClick={() => setSelectedOrder(order.id!)}
                        className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
                      >
                        Merk som sendt
                      </button>
                    )}
                    {status === 'shipped' && (
                      <button
                        onClick={() => handleDelivered(order.id!)}
                        className="px-4 py-2 bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
                      >
                        Merk som levert
                      </button>
                    )}
                    {(status === 'pending' || status === 'paid') && (
                      <button
                        onClick={() => handleCancel(order.id!)}
                        className="px-4 py-2 bg-error/10 text-error font-medium rounded-lg hover:bg-error/20 transition-colors"
                      >
                        Kanseller
                      </button>
                    )}
                  </div>
                </div>

                {order.tracking_number && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Sporing:</span>{' '}
                      {order.tracking_carrier} - {order.tracking_number}
                    </p>
                  </div>
                )}

                {selectedOrder === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <p className="text-sm font-medium mb-3">Legg til sporingsinformasjon</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <select
                        value={trackingInput.carrier}
                        onChange={(e) =>
                          setTrackingInput((prev) => ({ ...prev, carrier: e.target.value }))
                        }
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="">Velg transportør</option>
                        {SHIPPING_CARRIERS.map((carrier) => (
                          <option key={carrier.id} value={carrier.label}>
                            {carrier.label}
                          </option>
                        ))}
                      </select>
                      <input
                        type="text"
                        value={trackingInput.number}
                        onChange={(e) =>
                          setTrackingInput((prev) => ({ ...prev, number: e.target.value }))
                        }
                        placeholder="Sporingsnummer"
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                      <button
                        onClick={() => handleShip(order.id!)}
                        className="px-6 py-2 bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
                      >
                        Bekreft sending
                      </button>
                      <button
                        onClick={() => setSelectedOrder(null)}
                        className="px-4 py-2 bg-muted-foreground/10 rounded-lg hover:bg-muted-foreground/20 transition-colors"
                      >
                        Avbryt
                      </button>
                    </div>
                  </motion.div>
                )}

                <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">E-post</p>
                    <p>{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefon</p>
                    <p>{order.customer_phone}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="text-muted-foreground">Leveringsadresse</p>
                    {order.shipping_address ? (
                      <p>
                        {order.shipping_address.line1}
                        {order.shipping_address.line2 && `, ${order.shipping_address.line2}`}
                        , {order.shipping_address.postal_code} {order.shipping_address.city}
                      </p>
                    ) : (
                      <p className="text-muted-foreground/50">Ikke oppgitt</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
