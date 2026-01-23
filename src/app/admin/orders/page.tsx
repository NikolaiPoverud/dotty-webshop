'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Suspense, useCallback, useEffect, useState } from 'react';
import {
  CheckCircle,
  Clock,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Search,
  Truck,
  XCircle,
} from 'lucide-react';

import { SHIPPING_CARRIERS } from '@/emails/utils';
import { adminFetch } from '@/lib/admin-fetch';
import { formatPrice } from '@/lib/utils';
import type { OrderItem, OrderStatus, OrderWithItems } from '@/types';

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

type FilterStatus = 'all' | OrderStatus;

const FILTER_STATUSES: FilterStatus[] = ['all', 'pending', 'paid', 'shipped', 'delivered'];

interface TrackingInput {
  carrier: string;
  number: string;
}

const INITIAL_TRACKING: TrackingInput = { carrier: '', number: '' };

function formatRelativeDate(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.round(diffMs / (60 * 1000));
  const hours = Math.round(diffMs / (60 * 60 * 1000));
  const days = Math.round(diffMs / (24 * 60 * 60 * 1000));

  if (minutes < 60) return `${minutes} min siden`;
  if (hours < 24) return `${hours} timer siden`;
  return `${days} dager siden`;
}

function getPaymentBadgeStyle(provider: string): string {
  if (provider === 'vipps') {
    return 'bg-[#ff5b24]/10 text-[#ff5b24]';
  }
  return 'bg-[#635bff]/10 text-[#635bff]';
}

function getPaymentLabel(provider: string): string {
  return provider === 'vipps' ? 'Vipps' : 'Kort';
}

function getFilterLabel(status: FilterStatus): string {
  if (status === 'all') return 'Alle';
  return STATUS_CONFIG[status].label;
}

function LoadingSpinner(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );
}

export default function AdminOrdersPage(): React.ReactElement {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AdminOrdersContent />
    </Suspense>
  );
}

function AdminOrdersContent(): React.ReactElement {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<TrackingInput>(INITIAL_TRACKING);
  const searchParams = useSearchParams();
  const highlightId = searchParams.get('highlight');

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

  useEffect(() => {
    if (!highlightId || isLoading) return;

    const timer = setTimeout(() => {
      document.getElementById(`order-${highlightId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 100);

    return () => clearTimeout(timer);
  }, [highlightId, isLoading]);

  const filteredOrders = orders.filter((order) => {
    if (filter !== 'all' && order.status !== filter) return false;
    if (!search) return true;

    const searchLower = search.toLowerCase();
    const matchesName = order.customer_name.toLowerCase().includes(searchLower);
    const matchesEmail = order.customer_email.toLowerCase().includes(searchLower);
    const matchesOrderNumber = order.order_number.toLowerCase().includes(searchLower);

    return matchesName || matchesEmail || matchesOrderNumber;
  });

  function updateOrderStatus(orderId: string, updates: Partial<OrderWithItems>): void {
    setOrders((prev) =>
      prev.map((order) => (order.id === orderId ? { ...order, ...updates } : order))
    );
  }

  async function handleShip(orderId: string): Promise<void> {
    if (!trackingInput.carrier || !trackingInput.number) {
      alert('Vennligst fyll inn transportør og sporingsnummer');
      return;
    }

    const response = await adminFetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'shipped',
        tracking_carrier: trackingInput.carrier,
        tracking_number: trackingInput.number,
      }),
    });

    if (!response.ok) {
      setError('Failed to update order');
      return;
    }

    updateOrderStatus(orderId, {
      status: 'shipped',
      tracking_carrier: trackingInput.carrier,
      tracking_number: trackingInput.number,
    });
    setSelectedOrderId(null);
    setTrackingInput(INITIAL_TRACKING);
  }

  async function handleDelivered(orderId: string): Promise<void> {
    const response = await adminFetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'delivered' }),
    });

    if (!response.ok) {
      setError('Failed to update order');
      return;
    }

    updateOrderStatus(orderId, { status: 'delivered' });
  }

  async function handleCancel(orderId: string): Promise<void> {
    const confirmed = confirm(
      'Er du sikker på at du vil kansellere denne ordren? Betalingen vil automatisk bli refundert.'
    );
    if (!confirmed) return;

    const response = await adminFetch(`/api/admin/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'cancelled' }),
    });

    const result = await response.json();

    if (!response.ok) {
      setError(result.error || 'Failed to cancel order');
      return;
    }

    updateOrderStatus(orderId, { status: 'cancelled' });

    if (result.refund?.success) {
      alert('Ordren er kansellert og betalingen er refundert.');
    } else if (result.refund) {
      alert(
        `Ordren er kansellert, men refundering feilet: ${result.refund.error}\n\nDu må refundere manuelt.`
      );
    }
  }

  if (isLoading) return <LoadingSpinner />;

  const emptyMessage = orders.length === 0 ? 'Ingen ordrer ennå.' : 'Ingen ordrer matcher søket.';

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
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">{error}</div>
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
          {FILTER_STATUSES.map((status) => {
            const isActive = filter === status;
            const buttonClass = isActive
              ? 'bg-primary text-background'
              : 'bg-muted hover:bg-muted-foreground/10';

            return (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg text-sm transition-colors ${buttonClass}`}
              >
                {getFilterLabel(status)}
              </button>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">{emptyMessage}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              isHighlighted={order.id === highlightId}
              isTrackingOpen={selectedOrderId === order.id}
              trackingInput={trackingInput}
              onTrackingInputChange={setTrackingInput}
              onMarkShipped={() => setSelectedOrderId(order.id)}
              onConfirmShipped={() => handleShip(order.id)}
              onCancelTracking={() => setSelectedOrderId(null)}
              onMarkDelivered={() => handleDelivered(order.id)}
              onCancel={() => handleCancel(order.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface OrderCardProps {
  order: OrderWithItems;
  isHighlighted: boolean;
  isTrackingOpen: boolean;
  trackingInput: TrackingInput;
  onTrackingInputChange: (input: TrackingInput) => void;
  onMarkShipped: () => void;
  onConfirmShipped: () => void;
  onCancelTracking: () => void;
  onMarkDelivered: () => void;
  onCancel: () => void;
}

function OrderCard({
  order,
  isHighlighted,
  isTrackingOpen,
  trackingInput,
  onTrackingInputChange,
  onMarkShipped,
  onConfirmShipped,
  onCancelTracking,
  onMarkDelivered,
  onCancel,
}: OrderCardProps): React.ReactElement {
  const status = order.status;
  const statusInfo = STATUS_CONFIG[status];
  const StatusIcon = statusInfo.icon;
  const canCancel = status === 'pending' || status === 'paid';

  const highlightClass = isHighlighted
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-[0_0_30px_rgba(254,32,106,0.3)]'
    : '';

  return (
    <div id={`order-${order.id}`} className={`bg-muted rounded-lg p-6 ${highlightClass}`}>
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
                <span className={`px-2 py-0.5 text-xs rounded ${getPaymentBadgeStyle(order.payment_provider)}`}>
                  {getPaymentLabel(order.payment_provider)}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {order.customer_name} · {formatRelativeDate(order.created_at)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <p className="text-xl font-bold">{formatPrice(order.total)}</p>

          {status === 'paid' && (
            <button
              onClick={onMarkShipped}
              className="px-4 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors"
            >
              Merk som sendt
            </button>
          )}
          {status === 'shipped' && (
            <button
              onClick={onMarkDelivered}
              className="px-4 py-2 bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
            >
              Merk som levert
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-error/10 text-error font-medium rounded-lg hover:bg-error/20 transition-colors"
            >
              Kanseller
            </button>
          )}
        </div>
      </div>

      <OrderItemsList items={order.items} />

      {order.tracking_number && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Sporing:</span>{' '}
            {order.tracking_carrier} - {order.tracking_number}
          </p>
        </div>
      )}

      {isTrackingOpen && (
        <TrackingForm
          trackingInput={trackingInput}
          onInputChange={onTrackingInputChange}
          onConfirm={onConfirmShipped}
          onCancel={onCancelTracking}
        />
      )}

      <OrderContactInfo order={order} />
    </div>
  );
}

interface OrderItemsListProps {
  items: OrderItem[];
}

function OrderItemsList({ items }: OrderItemsListProps): React.ReactElement | null {
  if (!items || items.length === 0) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <p className="text-sm text-muted-foreground mb-3">Produkter</p>
      <div className="flex flex-wrap gap-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3 bg-background/50 rounded-lg p-2 pr-4">
            {item.image_url && (
              <div className="relative w-12 h-12 rounded overflow-hidden flex-shrink-0">
                <Image src={item.image_url} alt={item.title} fill className="object-cover" />
              </div>
            )}
            <div>
              <p className="text-sm font-medium">{item.title}</p>
              <p className="text-xs text-muted-foreground">
                {item.quantity > 1 ? `${item.quantity}x ` : ''}
                {formatPrice(item.price)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface TrackingFormProps {
  trackingInput: TrackingInput;
  onInputChange: (input: TrackingInput) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

function TrackingForm({
  trackingInput,
  onInputChange,
  onConfirm,
  onCancel,
}: TrackingFormProps): React.ReactElement {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      className="mt-4 pt-4 border-t border-border"
    >
      <p className="text-sm font-medium mb-3">Legg til sporingsinformasjon</p>
      <div className="flex flex-col sm:flex-row gap-3">
        <select
          value={trackingInput.carrier}
          onChange={(e) => onInputChange({ ...trackingInput, carrier: e.target.value })}
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
          onChange={(e) => onInputChange({ ...trackingInput, number: e.target.value })}
          placeholder="Sporingsnummer"
          className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={onConfirm}
          className="px-6 py-2 bg-success text-white font-medium rounded-lg hover:bg-success/90 transition-colors"
        >
          Bekreft sending
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-muted-foreground/10 rounded-lg hover:bg-muted-foreground/20 transition-colors"
        >
          Avbryt
        </button>
      </div>
    </motion.div>
  );
}

interface OrderContactInfoProps {
  order: OrderWithItems;
}

function OrderContactInfo({ order }: OrderContactInfoProps): React.ReactElement {
  const address = order.shipping_address;

  return (
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
        {address ? (
          <p>
            {address.line1}
            {address.line2 && `, ${address.line2}`}, {address.postal_code} {address.city}
          </p>
        ) : (
          <p className="text-muted-foreground/50">Ikke oppgitt</p>
        )}
      </div>
    </div>
  );
}
