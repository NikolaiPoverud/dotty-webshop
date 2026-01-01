'use client';

import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, Search, Loader2, RefreshCw, Plus } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import type { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Venter', color: 'bg-warning/10 text-warning', icon: Clock },
  paid: { label: 'Betalt', color: 'bg-success/10 text-success', icon: CheckCircle },
  shipped: { label: 'Sendt', color: 'bg-accent/10 text-accent', icon: Truck },
  delivered: { label: 'Levert', color: 'bg-muted-foreground/10 text-muted-foreground', icon: Package },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState({ carrier: '', number: '' });

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/orders');
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
    if (search) {
      const searchLower = search.toLowerCase();
      return (
        order.customer_name?.toLowerCase().includes(searchLower) ||
        order.customer_email?.toLowerCase().includes(searchLower) ||
        order.id?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const handleShip = async (orderId: string) => {
    if (!trackingInput.carrier || !trackingInput.number) {
      alert('Vennligst fyll inn transportør og sporingsnummer');
      return;
    }

    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
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
            ? {
                ...o,
                status: 'shipped' as const,
                tracking_carrier: trackingInput.carrier,
                tracking_number: trackingInput.number,
              }
            : o
        )
      );
      setSelectedOrder(null);
      setTrackingInput({ carrier: '', number: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60 * 60 * 1000) {
      return `${Math.round(diff / (60 * 1000))} min siden`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      return `${Math.round(diff / (60 * 60 * 1000))} timer siden`;
    } else {
      return `${Math.round(diff / (24 * 60 * 60 * 1000))} dager siden`;
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
          <h1 className="text-3xl font-bold">Ordrer</h1>
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

      {/* Filters */}
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
          {['all', 'pending', 'paid', 'shipped', 'delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === status
                  ? 'bg-primary text-background'
                  : 'bg-muted hover:bg-muted-foreground/10'
              }`}
            >
              {status === 'all' ? 'Alle' : statusConfig[status]?.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {orders.length === 0 ? 'Ingen ordrer ennå.' : 'Ingen ordrer matcher søket.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order, index) => {
            const StatusIcon = statusConfig[order.status!]?.icon || Clock;

            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-muted rounded-lg p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusConfig[order.status!]?.color}`}
                    >
                      <StatusIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold font-mono">{order.id}</p>
                        <span
                          className={`px-2 py-0.5 text-xs rounded ${statusConfig[order.status!]?.color}`}
                        >
                          {statusConfig[order.status!]?.label}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {order.customer_name} · {formatDate(order.created_at!)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <p className="text-xl font-bold">{formatPrice(order.total!)}</p>

                    {order.status === 'paid' && (
                      <button
                        onClick={() => setSelectedOrder(order.id!)}
                        className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
                      >
                        Merk som sendt
                      </button>
                    )}
                  </div>
                </div>

                {/* Tracking info for shipped/delivered */}
                {order.tracking_number && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      <span className="font-medium text-foreground">Sporing:</span>{' '}
                      {order.tracking_carrier} - {order.tracking_number}
                    </p>
                  </div>
                )}

                {/* Shipping form */}
                {selectedOrder === order.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 pt-4 border-t border-border"
                  >
                    <p className="text-sm font-medium mb-3">Legg til sporingsinformasjon</p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        value={trackingInput.carrier}
                        onChange={(e) =>
                          setTrackingInput((prev) => ({ ...prev, carrier: e.target.value }))
                        }
                        placeholder="Transportør (f.eks. Posten)"
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      />
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
                        className="px-6 py-2 bg-success text-background font-medium rounded-lg hover:bg-success/90 transition-colors"
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

                {/* Customer details */}
                <div className="mt-4 pt-4 border-t border-border grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">E-post</p>
                    <p>{order.customer_email}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Telefon</p>
                    <p>{order.customer_phone}</p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
