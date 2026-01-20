'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle,
  Clock,
  CreditCard,
  ExternalLink,
  Loader2,
  Package,
  Plus,
  RefreshCw,
  Send,
  ShoppingCart,
  Tag,
  TrendingUp,
  Truck,
  Users,
} from 'lucide-react';
import { adminFetch } from '@/lib/admin-fetch';
import { formatPrice } from '@/lib/utils';
import type { Order } from '@/types';

interface DashboardStats {
  salesThisMonth: number;
  orderCountThisMonth: number;
  totalProducts: number;
  availableProducts: number;
  totalSubscribers: number;
  subscribersThisMonth: number;
  recentOrders: Order[];
  pendingOrdersCount: number;
  unreadMessagesCount: number;
  ordersByStatus: {
    pending: number;
    paid: number;
    shipped: number;
    delivered: number;
  };
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  paid: 'bg-success/10 text-success',
  shipped: 'bg-accent/10 text-accent',
  delivered: 'bg-muted-foreground/10 text-muted-foreground',
};

const statusLabels: Record<string, string> = {
  pending: 'Venter',
  paid: 'Betalt',
  shipped: 'Sendt',
  delivered: 'Levert',
};

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function formatRelativeDate(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();

  if (diff < HOUR) {
    return `${Math.round(diff / MINUTE)} min siden`;
  }
  if (diff < DAY) {
    return `${Math.round(diff / HOUR)} timer siden`;
  }
  return `${Math.round(diff / DAY)} dager siden`;
}

export default function AdminDashboardPage(): React.ReactElement {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await adminFetch('/api/admin/stats');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setStats(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  const statCards = stats ? [
    {
      label: 'Salg denne måneden',
      value: stats.salesThisMonth,
      format: 'currency' as const,
      icon: TrendingUp,
      change: `${stats.orderCountThisMonth} ordrer`,
    },
    {
      label: 'Ordrer denne måneden',
      value: stats.orderCountThisMonth,
      format: 'number' as const,
      icon: ShoppingCart,
      change: '',
    },
    {
      label: 'Produkter',
      value: stats.totalProducts,
      format: 'number' as const,
      icon: Package,
      change: `${stats.availableProducts} tilgjengelig`,
    },
    {
      label: 'Nyhetsbrev-abonnenter',
      value: stats.totalSubscribers,
      format: 'number' as const,
      icon: Users,
      change: stats.subscribersThisMonth > 0 ? `+${stats.subscribersThisMonth} denne måneden` : '',
    },
  ] : [];

  // Quick actions for common tasks
  const quickActions = [
    { label: 'Nytt produkt', icon: Plus, href: '/admin/products/new', color: 'bg-primary hover:bg-primary-light text-background' },
    { label: 'Se shoppen', icon: ExternalLink, href: '/no', external: true, color: 'bg-muted hover:bg-muted-foreground/20' },
    { label: 'Test e-post', icon: Send, href: '/admin/email-test', color: 'bg-muted hover:bg-muted-foreground/20' },
    { label: 'Rabattkode', icon: Tag, href: '/admin/discounts', color: 'bg-muted hover:bg-muted-foreground/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Velkommen tilbake!</h1>
          <p className="text-muted-foreground mt-1">Her er en oversikt over shoppen din</p>
        </div>
        <button
          onClick={fetchStats}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
          title="Oppdater"
        >
          <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          const className = `flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${action.color}`;

          if (action.external) {
            return (
              <a
                key={action.label}
                href={action.href}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                <Icon className="w-4 h-4" />
                {action.label}
              </a>
            );
          }

          return (
            <Link key={action.label} href={action.href} className={className}>
              <Icon className="w-4 h-4" />
              {action.label}
            </Link>
          );
        })}
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      {/* Order Status Overview */}
      {stats?.ordersByStatus && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            href="/admin/orders?status=pending"
            className="bg-warning/10 border border-warning/20 rounded-lg p-4 hover:bg-warning/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-warning" />
              <div>
                <p className="text-2xl font-bold text-warning">{stats.ordersByStatus.pending}</p>
                <p className="text-sm text-warning/80">Venter betaling</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/orders?status=paid"
            className="bg-success/10 border border-success/20 rounded-lg p-4 hover:bg-success/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5 text-success" />
              <div>
                <p className="text-2xl font-bold text-success">{stats.ordersByStatus.paid}</p>
                <p className="text-sm text-success/80">Klar til sending</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/orders?status=shipped"
            className="bg-accent/10 border border-accent/20 rounded-lg p-4 hover:bg-accent/20 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Truck className="w-5 h-5 text-accent" />
              <div>
                <p className="text-2xl font-bold text-accent">{stats.ordersByStatus.shipped}</p>
                <p className="text-sm text-accent/80">Sendt</p>
              </div>
            </div>
          </Link>
          <Link
            href="/admin/orders?status=delivered"
            className="bg-muted border border-border rounded-lg p-4 hover:bg-muted-foreground/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{stats.ordersByStatus.delivered}</p>
                <p className="text-sm text-muted-foreground">Levert</p>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-muted rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                {stat.change && (
                  <span className="text-xs text-muted-foreground">{stat.change}</span>
                )}
              </div>
              <p className="text-2xl font-bold">
                {stat.format === 'currency'
                  ? formatPrice(stat.value)
                  : stat.value}
              </p>
              <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-muted rounded-lg p-6"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Nylige ordrer</h2>
          <Link
            href="/admin/orders"
            className="text-sm text-primary hover:underline"
          >
            Se alle →
          </Link>
        </div>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="space-y-2">
            {stats.recentOrders.map((order) => (
              <Link
                key={order.id}
                href={`/admin/orders?highlight=${order.id}`}
                className="flex items-center justify-between py-3 px-3 -mx-3 rounded-lg hover:bg-background/50 transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium">
                    <span className="text-primary font-mono">{order.order_number}</span>
                    <span className="text-muted-foreground mx-2">·</span>
                    {order.customer_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatRelativeDate(order.created_at!)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatPrice(order.total!)}</p>
                  <span
                    className={`inline-block px-2 py-0.5 text-xs rounded ${statusColors[order.status!] || ''}`}
                  >
                    {statusLabels[order.status!] || order.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Ingen ordrer ennå.</p>
        )}
      </motion.div>
    </div>
  );
}
