'use client';

import { motion } from 'framer-motion';
import { TrendingUp, ShoppingCart, Package, Users, Loader2, RefreshCw, Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
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

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Test email state
  const [testEmail, setTestEmail] = useState('');
  const [emailSending, setEmailSending] = useState(false);
  const [emailResult, setEmailResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/stats');
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

  const sendTestEmail = async () => {
    if (!testEmail) return;

    setEmailSending(true);
    setEmailResult(null);

    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send email');
      }

      setEmailResult({ success: true, message: 'E-post sendt!' });
      setTestEmail('');
    } catch (err) {
      setEmailResult({
        success: false,
        message: err instanceof Error ? err.message : 'Kunne ikke sende e-post'
      });
    } finally {
      setEmailSending(false);
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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Oversikt over butikken din</p>
        </div>
        <button onClick={fetchStats} className="p-2 hover:bg-muted rounded-lg">
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg text-error">
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
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
            </motion.div>
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
        <h2 className="text-xl font-bold mb-4">Nylige ordrer</h2>
        {stats?.recentOrders && stats.recentOrders.length > 0 ? (
          <div className="space-y-4">
            {stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div>
                  <p className="font-medium">{order.customer_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.id} · {formatDate(order.created_at!)}
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
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">Ingen ordrer ennå.</p>
        )}
      </motion.div>

      {/* Test Email Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-muted rounded-lg p-6"
      >
        <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" />
          Test E-post
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Send en test e-post for å verifisere at e-postsystemet fungerer.
        </p>

        <div className="flex gap-3">
          <input
            type="email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="din@epost.no"
            className="flex-1 px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={sendTestEmail}
            disabled={emailSending || !testEmail}
            className="px-6 py-2 bg-primary text-background font-medium rounded-lg hover:bg-primary-light transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {emailSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Send
          </button>
        </div>

        {emailResult && (
          <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
            emailResult.success
              ? 'bg-success/10 text-success'
              : 'bg-destructive/10 text-destructive'
          }`}>
            {emailResult.success ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertCircle className="w-4 h-4" />
            )}
            {emailResult.message}
          </div>
        )}
      </motion.div>
    </div>
  );
}
