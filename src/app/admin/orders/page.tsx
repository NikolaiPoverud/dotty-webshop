'use client';

import { motion } from 'framer-motion';
import { Package, Truck, CheckCircle, Clock, Search } from 'lucide-react';
import { useState } from 'react';
import type { Order } from '@/types';
import { formatPrice } from '@/lib/utils';

// Placeholder orders - replace with Supabase fetch
const initialOrders: Partial<Order>[] = [
  {
    id: 'DOT-ABC123',
    customer_name: 'Kari Nordmann',
    customer_email: 'kari@example.com',
    customer_phone: '+47 123 45 678',
    total: 350000,
    status: 'paid',
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'DOT-DEF456',
    customer_name: 'Ola Hansen',
    customer_email: 'ola@example.com',
    customer_phone: '+47 987 65 432',
    total: 150000,
    status: 'shipped',
    tracking_carrier: 'Posten',
    tracking_number: 'NO123456789',
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'DOT-GHI789',
    customer_name: 'Lisa Berg',
    customer_email: 'lisa@example.com',
    customer_phone: '+47 555 55 555',
    total: 450000,
    status: 'delivered',
    tracking_carrier: 'Posten',
    tracking_number: 'NO987654321',
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'DOT-JKL012',
    customer_name: 'Per Olsen',
    customer_email: 'per@example.com',
    customer_phone: '+47 444 44 444',
    total: 200000,
    status: 'pending',
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
];

const statusConfig: Record<string, { label: string; color: string; icon: typeof Clock }> = {
  pending: { label: 'Venter', color: 'bg-warning/10 text-warning', icon: Clock },
  paid: { label: 'Betalt', color: 'bg-success/10 text-success', icon: CheckCircle },
  shipped: { label: 'Sendt', color: 'bg-accent/10 text-accent', icon: Truck },
  delivered: { label: 'Levert', color: 'bg-muted-foreground/10 text-muted-foreground', icon: Package },
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState({ carrier: '', number: '' });

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

  const handleShip = (orderId: string) => {
    if (!trackingInput.carrier || !trackingInput.number) {
      alert('Vennligst fyll inn transportør og sporingsnummer');
      return;
    }

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Ordrer</h1>
        <p className="text-muted-foreground mt-1">Administrer kundeordrer</p>
      </div>

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
    </div>
  );
}
